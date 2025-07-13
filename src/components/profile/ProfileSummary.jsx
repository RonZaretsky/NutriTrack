
import React, { useState, useEffect } from 'react';
import { userApi } from '@/api/userApi';
import { userProfileApi } from '@/api/userProfileApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { User as UserIcon, Edit, Save, Target, Activity, Flame, Ruler, Scale, Calendar, CheckCircle, TrendingUp, TrendingDown, Info, BrainCircuit, HeartHandshake, UserX } from 'lucide-react';
import { logEvent } from '@/components/utils/logger';

export default function ProfileSummary({ user, userProfile, onEditGoals, onProfileUpdate }) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isExplanationModalOpen, setIsExplanationModalOpen] = useState(false);
  const [coachDetails, setCoachDetails] = useState(null); // New state for coach details

  // Initialize display name from userProfile, falling back to user's full_name
  useEffect(() => {
    if (userProfile || user) {
        setDisplayName(userProfile?.display_name || user?.full_name || '');
    }
  }, [user, userProfile]);

  // Fetch coach details when userProfile changes
  useEffect(() => {
    const fetchCoachDetails = async () => {
      if (userProfile?.coach_email) {
        try {
          let coachName = userProfile.coach_name; // Fallback to stored name from userProfile
          let coachEmail = userProfile.coach_email;

          // Try to get coach details from UserProfile first (for display_name)
          const coachProfiles = await userProfileApi.filter({ created_by: userProfile.coach_email });
          
          if (coachProfiles.length > 0 && coachProfiles[0].display_name) {
            coachName = coachProfiles[0].display_name; // Use updated display name from their profile
          } else {
            // If no UserProfile display_name, try to get from User entity
            const coachUsers = await userApi.filter({ email: userProfile.coach_email });
            if (coachUsers.length > 0 && coachUsers[0].full_name) {
              coachName = coachUsers[0].full_name; // Use full_name from User entity
            }
          }
          
          setCoachDetails({
            email: coachEmail,
            name: coachName
          });
        } catch (error) {
          console.error("Error fetching coach details:", error);
          // Fallback to stored coach name and email on error
          setCoachDetails({
            email: userProfile.coach_email,
            name: userProfile.coach_name
          });
        }
      } else {
        setCoachDetails(null); // No coach email, so clear coach details
      }
    };

    fetchCoachDetails();
  }, [userProfile]); // Dependency on userProfile to re-fetch when it changes

  const handleNameSave = async () => {
    const newDisplayName = displayName.trim();
    // Prevent saving if the name hasn't changed or is empty
    if (newDisplayName === (userProfile?.display_name || user?.full_name) || !newDisplayName) {
      setIsEditingName(false);
      return;
    }
    
    logEvent('ProfileSummary', 'SAVE_NAME_ATTEMPT', { newName: newDisplayName });
    
    try {
      // Update the display_name in UserProfile
      // Ensure userProfile.id exists before attempting to update
      if (userProfile?.id) {
        await userProfileApi.update(userProfile.id, { display_name: newDisplayName });
        logEvent('ProfileSummary', 'SAVE_NAME_SUCCESS', { newName: newDisplayName });
        // Call onProfileUpdate to refresh data in the parent component
        onProfileUpdate(); 
        setIsEditingName(false);
      } else {
        throw new Error("UserProfile ID is missing, cannot save name.");
      }
    } catch (error) {
      logEvent('ProfileSummary', 'SAVE_NAME_ERROR', { error: error.message }, 'ERROR');
      console.error("Failed to update name", error);
      alert("שגיאה בשמירת השם. אנא נסה שוב.");
      // Optionally, revert the display name on error if it was changed optimistically
      // setDisplayName(userProfile?.display_name || user?.full_name || ''); 
    }
  };
  
  const handleDisconnectCoach = async () => {
    if (confirm("האם אתה בטוח שברצונך להתנתק מהמאמן?")) {
        logEvent('ProfileSummary', 'DISCONNECT_COACH_INITIATED');
        try {
                    // Assuming UserProfile is an entity with an update method
        if (userProfile?.id) {
          await userProfileApi.update(userProfile.id, {
              coach_email: null,
              coach_name: null
          });
          onProfileUpdate(); // Refresh profile data after update
          logEvent('ProfileSummary', 'DISCONNECT_COACH_SUCCESS');
        } else {
          throw new Error("UserProfile ID is missing, cannot disconnect coach.");
        }
        } catch (error) {
            logEvent('ProfileSummary', 'DISCONNECT_COACH_ERROR', { error: error.message }, 'ERROR');
            console.error("Failed to disconnect from coach", error);
            alert("שגיאה בהתנתקות מהמאמן. אנא נסה שוב.");
        }
    }
  };

  const getGoalText = (goal) => ({
    lose: "ירידה במשקל",
    gain: "עלייה במשקל",
    maintain: "שמירה על המשקל",
  }[goal] || "");

  const getGoalIcon = (goal) => {
    if (goal === 'lose') return <TrendingDown className="w-4 h-4 ml-2" />;
    if (goal === 'gain') return <TrendingUp className="w-4 h-4 ml-2" />;
    return <CheckCircle className="w-4 h-4 ml-2" />;
  };

  if (!userProfile) {
    return (
      <div className="p-8 text-center">
        <p>לא נמצאו נתוני פרופיל.</p>
        <Button onClick={onEditGoals} className="mt-4">הגדר פרופיל</Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          {isEditingName ? (
            <div className="flex items-center justify-center gap-2">
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="text-3xl font-bold text-center max-w-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleNameSave();
                  }
                }}
              />
              <Button size="icon" onClick={handleNameSave}>
                <Save className="w-5 h-5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
                {userProfile?.display_name || user?.full_name}
              </h1>
              <Button variant="ghost" size="icon" onClick={() => setIsEditingName(true)}>
                <Edit className="w-5 h-5 text-slate-500" />
              </Button>
            </div>
          )}
          <p className="text-slate-600 mt-2">{user?.email}</p>
        </div>

        {/* Coach Info */}
        {coachDetails && (
            <Card className="glass-effect shadow-lg bg-purple-50 border-purple-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-800"><HeartHandshake /> המאמן/ת שלך</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-between items-center">
                    <div>
                        <p className="font-semibold text-lg">{coachDetails.name}</p>
                        <p className="text-sm text-purple-700">{coachDetails.email}</p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={handleDisconnectCoach}>
                        <UserX className="w-4 h-4 ml-2" />
                        התנתק מהמאמן
                    </Button>
                </CardContent>
            </Card>
        )}

        <Card className="glass-effect shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserIcon />פרטים אישיים</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3"><Calendar className="w-5 h-5 text-blue-500" /><div><div className="text-sm text-slate-600">גיל</div><div className="font-semibold">{userProfile.age}</div></div></div>
            <div className="flex items-center gap-3"><UserIcon className="w-5 h-5 text-blue-500" /><div><div className="text-sm text-slate-600">מין</div><div className="font-semibold">{userProfile.gender === 'male' ? 'זכר' : 'נקבה'}</div></div></div>
            <div className="flex items-center gap-3"><Ruler className="w-5 h-5 text-blue-500" /><div><div className="text-sm text-slate-600">גובה</div><div className="font-semibold">{userProfile.height} ס"מ</div></div></div>
            <div className="flex items-center gap-3"><Scale className="w-5 h-5 text-blue-500" /><div><div className="text-sm text-slate-600">משקל</div><div className="font-semibold">{userProfile.weight} ק"ג</div></div></div>
            {userProfile.body_fat_percentage && (
              <div className="flex items-center gap-3 md:col-span-2"><Target className="w-5 h-5 text-green-500" /><div><div className="text-sm text-slate-600">אחוז שומן בגוף</div><div className="font-semibold">{userProfile.body_fat_percentage}%</div></div></div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-effect shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Target />מטרה ותכנית</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">{getGoalIcon(userProfile.goal)}<div><div className="text-sm text-slate-600">מטרה</div><div className="font-semibold">{getGoalText(userProfile.goal)}</div></div></div>
            <div className="flex items-center gap-3"><Activity className="w-5 h-5 text-green-500" /><div><div className="text-sm text-slate-600">אימונים בשבוע</div><div className="font-semibold">{userProfile.workout_frequency}</div></div></div>
            {userProfile.goal !== 'maintain' && <div className="flex items-center gap-3"><TrendingUp className="w-5 h-5 text-green-500" /><div><div className="text-sm text-slate-600">קצב רצוי</div><div className="font-semibold">{userProfile.target_rate} ק"ג לחודש</div></div></div>}
          </CardContent>
        </Card>
        
        <Card className="glass-effect shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Flame />יעד קלוריות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl">
                <h4 className="font-bold text-xl text-slate-900 mb-2">היעד הקלורי היומי שלך</h4>
                <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  {userProfile.daily_calories}
                </div>
                <p className="text-slate-600 mt-2">קלוריות ביום</p>
                <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
                  <div>
                    <p className="text-slate-600">BMR</p>
                    <p className="font-semibold text-lg">{userProfile.bmr}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">TDEE</p>
                    <p className="font-semibold text-lg">{userProfile.tdee}</p>
                  </div>
                </div>
                {userProfile.body_fat_percentage && (
                  <div className="text-xs text-green-700 mt-4 bg-green-100 p-2 rounded-lg flex items-center justify-center gap-2">
                    <span>✓ חושב עם נוסחת Katch-McArdle (מדויק יותר)</span>
                    <Dialog open={isExplanationModalOpen} onOpenChange={setIsExplanationModalOpen}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full hover:bg-green-200" onClick={() => setIsExplanationModalOpen(true)}>
                           <Info className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md" dir="rtl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2 text-slate-900">
                            <BrainCircuit className="w-6 h-6 text-blue-500" />
                            חישוב קלוריות מדויק
                          </DialogTitle>
                          <DialogDescription className="text-right pt-2">
                            הסבר על נוסחת החישוב המתקדמת
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4 text-slate-700">
                          <p>
                            מחשבון הקלוריות שלנו השתמש ב<strong>נוסחת Katch-McArdle</strong> כדי לחשב את היעד שלך.
                          </p>
                          <div className="p-3 bg-slate-50 rounded-lg">
                            <h4 className="font-semibold mb-2">למה זה מדויק יותר?</h4>
                            <ul className="list-disc list-inside space-y-2 text-sm">
                              <li>
                                נוסחה זו משתמשת בנתון שהזנת - <strong>אחוז השומן</strong> - כדי לחשב את <strong>"מסת הגוף הרזה"</strong> שלך (שרירים, עצמות, איברים), בניגוד לנוסחאות רגילות המבוססות על משקל כללי.
                              </li>
                              <li>
                                רקמת שריר שורפת יותר קלוריות משומן. לכן, התבססות על מסת הגוף הרזה נותנת הערכה קלורית אישית ומדויקת הרבה יותר.
                              </li>
                            </ul>
                          </div>
                          <p className="mt-2 font-semibold text-green-700">
                             בקיצור: היעד הקלורי שלך מותאם אישית להרכב הגוף הייחודי שלך!
                          </p>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button type="button" className="w-full">הבנתי, תודה!</Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>

        <div className="text-center pt-4">
          <Button 
            size="lg" 
            onClick={onEditGoals} 
            className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white shadow-lg"
          >
            הגדר מטרות מחדש
          </Button>
        </div>
      </div>
    </div>
  );
}
