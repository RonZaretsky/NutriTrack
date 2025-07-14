
import React, { useState, useEffect, useMemo } from 'react';
import { userApi } from '@/api/userApi';
import { friendshipApi } from '@/api/friendshipApi';
import { weightEntryApi } from '@/api/weightEntryApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Users, Send, UserPlus, Clock, Check, X, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { format, startOfWeek, endOfWeek, subDays } from 'date-fns';
import { logEvent } from '@/components/utils/logger';

export default function Friends() {
  const [currentUser, setCurrentUser] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [friends, setFriends] = useState([]);
  const [pendingSent, setPendingSent] = useState([]);
  const [pendingReceived, setPendingReceived] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    logEvent('Friends', 'PAGE_LOAD');
    loadFriendships();
  }, []);

  const loadFriendships = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await userApi.me();
      setCurrentUser(user);

      // Fetch invitations sent BY and TO the current user in separate queries for reliability
      const sentByMe = await friendshipApi.filter({ user_email: user.email });
      const receivedByMe = await friendshipApi.filter({ friend_email: user.email });

      // Categorize the friendships
      const accepted = [];
      const pendingSent = [];
      sentByMe.forEach(f => {
        if (f.status === 'pending') pendingSent.push(f);
        else if (f.status === 'accepted') accepted.push(f);
      });

      const pendingReceived = [];
      receivedByMe.forEach(f => {
        if (f.status === 'pending') pendingReceived.push(f);
        else if (f.status === 'accepted') {
          // Only add if not already in accepted list (avoid duplicates)
          if (!accepted.find(af =>
            (af.inviter_email === f.inviter_email && af.invitee_email === f.invitee_email) ||
            (af.inviter_email === f.invitee_email && af.invitee_email === f.inviter_email)
          )) {
            accepted.push(f);
          }
        }
      });

      setPendingSent(pendingSent);
      setPendingReceived(pendingReceived);

      // Process the accepted friends to get their details and progress
      const friendData = await Promise.all(
        accepted.map(async (friendship) => {
          const isInviter = friendship.inviter_email === user.email;
          const friendEmail = isInviter ? friendship.invitee_email : friendship.inviter_email;
          const friendName = isInviter ? (friendship.invitee_name || friendEmail) : (friendship.inviter_name || friendEmail);

          const today = new Date();
          const weekStart = startOfWeek(today, { weekStartsOn: 0 });
          const weekStartStr = format(weekStart, 'yyyy-MM-dd');

          const recentEntries = await weightEntryApi.filter(
            { created_by: friendEmail, entry_date: { $gte: weekStartStr } }
          );

          let startWeight = null;
          let currentWeight = null;
          if (recentEntries.length > 0) {
            startWeight = recentEntries[0].weight;
            currentWeight = recentEntries[recentEntries.length - 1].weight;
          }

          let changeKg = currentWeight !== null ? currentWeight - startWeight : null;
          let changePercent = startWeight > 0 && currentWeight !== null ? ((currentWeight - startWeight) / startWeight) * 100 : null;

          return {
            email: friendEmail,
            full_name: friendName,
            changeKg,
            changePercent
          };
        })
      );
      setFriends(friendData);

    } catch (err) {
      setError("אירעה שגיאה בטעינת נתוני החברים.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail || !currentUser) return;
    setError(null);
    setSuccess(null);

    logEvent('Friends', 'SEND_INVITE_ATTEMPT', { inviteEmail });

    if (inviteEmail === currentUser.email) {
      setError("אינך יכול להזמין את עצמך.");
      return;
    }

    try {
      // Check if there's already a friendship (in any status) between these users
      const existingFriendships = await friendshipApi.checkFriendship(currentUser.email, inviteEmail);
      const existingArray = existingFriendships ? [existingFriendships] : [];

      if (existingArray.length > 0) {
        const existing = existingArray[0];
        if (existing.status === 'accepted') {
          setError("אתם כבר חברים!");
          return;
        } else if (existing.status === 'pending') {
          if (existing.inviter_email === currentUser.email) {
            setError("כבר שלחת הזמנה למשתמש זה.");
          } else {
            setError("המשתמש הזה כבר שלח לך הזמנה! בדוק בהזמנות הנכנסות.");
          }
          return;
        }
      }

      await friendshipApi.create({
        user_email: currentUser.email,
        friend_email: inviteEmail,
        status: 'pending'
      });
      logEvent('Friends', 'SEND_INVITE_SUCCESS', { inviteEmail });
      setSuccess(`הזמנה נשלחה בהצלחה ל-${inviteEmail}`);
      setInviteEmail('');
      loadFriendships();
    } catch (err) {
      logEvent('Friends', 'SEND_INVITE_ERROR', { inviteEmail, error: err.message }, 'ERROR');
      setError("שגיאה בשליחת ההזמנה.");
      console.error(err);
    }
  };

  const handleInvitation = async (friendshipId, newStatus) => {
    logEvent('Friends', 'RESPOND_TO_INVITE', { friendshipId, newStatus });
    try {
      if (newStatus === 'accepted') {
        await friendshipApi.update(friendshipId, {
          status: newStatus
        });
      } else {
        await friendshipApi.delete(friendshipId);
      }
      loadFriendships();
    } catch (err) {
      logEvent('Friends', 'RESPOND_TO_INVITE_ERROR', { friendshipId, newStatus, error: err.message }, 'ERROR');
      setError("שגיאה בעדכון ההזמנה.");
      console.error(err);
    }
  };

  const handleCancelInvitation = async (friendshipId) => {
    logEvent('Friends', 'CANCEL_INVITE_ATTEMPT', { friendshipId });
    if (confirm("האם אתה בטוח שברצונך לבטל את ההזמנה?")) {
      try {
        await friendshipApi.delete(friendshipId);
        logEvent('Friends', 'CANCEL_INVITE_SUCCESS', { friendshipId });
        loadFriendships();
      } catch (err) {
        logEvent('Friends', 'CANCEL_INVITE_ERROR', { friendshipId, error: err.message }, 'ERROR');
        setError("שגיאה בביטול ההזמנה.");
        console.error(err);
      }
    } else {
      logEvent('Friends', 'CANCEL_INVITE_ABORTED', { friendshipId });
    }
  };

  const renderProgress = (kg, percent) => {
    if (kg === null) return <TableCell className="text-center text-slate-500">-</TableCell>;
    const Icon = kg > 0 ? TrendingUp : kg < 0 ? TrendingDown : Minus;
    const color = kg > 0 ? "text-red-500" : kg < 0 ? "text-green-500" : "text-slate-500";

    return (
      <TableCell className={`text-center font-medium ${color}`}>
        <div className="flex items-center justify-center gap-2">
          <Icon className="w-4 h-4" />
          <span>{Number(kg).toFixed(1)} ק״ג ({Number(percent).toFixed(1)}%)</span>
        </div>
      </TableCell>
    );
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
            <Users className="w-8 h-8" />
            חברים
          </h1>
          <p className="text-slate-600 text-lg">הזמן חברים ועקוב אחר ההתקדמות המשותפת שלכם.</p>
        </div>

        {error && <Alert variant="destructive" className="mb-4"><AlertTitle>שגיאה</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
        {success && <Alert className="mb-4 border-green-500 text-green-700"><AlertTitle>הצלחה</AlertTitle><AlertDescription>{success}</AlertDescription></Alert>}

        <Card className="glass-effect shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserPlus />הזמן חבר חדש</CardTitle>
            <CardDescription>הזן את כתובת המייל של החבר כדי לשלוח בקשת חברות. כרגע לא ניתן לשלוח הזמנה דרך קישור.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              type="email"
              placeholder="friend@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <Button onClick={handleInvite} disabled={!inviteEmail}><Send className="w-4 h-4 ml-2" /> שלח הזמנה</Button>
          </CardContent>
        </Card>

        {/* הזמנות נכנסות */}
        {pendingReceived.length > 0 && (
          <div className="mb-8">
            {pendingReceived.map(invite => (
              <Card key={invite.id} className="glass-effect shadow-lg mb-4 border-r-4 border-r-blue-500">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                        <UserPlus className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-slate-900">
                          הזמנה חדשה לחברות!
                        </h3>
                        <p className="text-slate-600">
                          <span className="font-medium">{invite.inviter_name || invite.inviter_email}</span> הזמין אותך להיות חבר
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleInvitation(invite.id, 'rejected')}
                        className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                      >
                        <X className="w-4 h-4 mr-2" />
                        דחה
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleInvitation(invite.id, 'accepted')}
                        className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        אשר
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* הזמנות שנשלחו */}
        {pendingSent.length > 0 && (
          <Card className="glass-effect shadow-lg mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                הזמנות שנשלחו
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingSent.map(invite => (
                <div key={invite.id} className="flex justify-between items-center p-3 bg-slate-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span>הזמנה נשלחה ל-<b>{invite.invitee_email}</b></span>
                    <Badge variant="outline">ממתין</Badge>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleCancelInvitation(invite.id)}
                    className="text-red-500 hover:bg-red-100 hover:text-red-600 rounded-md"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="glass-effect shadow-lg">
          <CardHeader><CardTitle>רשימת חברים - התקדמות שבועית</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>שם החבר</TableHead>
                  <TableHead className="text-center">שינוי משקל שבועי</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={2} className="text-center">טוען נתונים...</TableCell></TableRow>
                ) : friends.length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-center">אין לך חברים עדיין. שלח הזמנה!</TableCell></TableRow>
                ) : (
                  friends.map(friend => (
                    <TableRow key={friend.email}>
                      <TableCell className="font-medium">{friend.full_name}</TableCell>
                      {renderProgress(friend.changeKg, friend.changePercent)}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
