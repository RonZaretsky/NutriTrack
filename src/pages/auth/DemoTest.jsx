import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { demoMode } from '@/utils/demoMode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Shield, Users, Settings, LogOut } from 'lucide-react';

export default function DemoTest() {
  const { user, isAuthenticated, isAdmin, isCoach, signOut } = useAuth();
  const [isDemoEnabled, setIsDemoEnabled] = React.useState(demoMode.isEnabled());

  const handleToggleDemo = () => {
    demoMode.toggle();
    setIsDemoEnabled(demoMode.isEnabled());
    window.location.reload();
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const switchToUser = () => {
    localStorage.removeItem('nutri-track-demo-role');
    demoMode.enable();
    window.location.reload();
  };

  const switchToCoach = () => {
    localStorage.setItem('nutri-track-demo-role', 'coach');
    demoMode.enable();
    window.location.reload();
  };

  const switchToAdmin = () => {
    localStorage.setItem('nutri-track-demo-role', 'admin');
    demoMode.enable();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-2xl glass-effect shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-slate-900">
            בדיקת מצב דמו
          </CardTitle>
          <p className="text-slate-600">
            בדוק את מערכת האימות במצב דמו
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Demo Mode Status */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-slate-600" />
              <span className="font-medium">מצב דמו</span>
            </div>
            <Badge variant={isDemoEnabled ? "default" : "secondary"}>
              {isDemoEnabled ? 'מופעל' : 'כבוי'}
            </Badge>
          </div>

          {/* Authentication Status */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-slate-600" />
              <span className="font-medium">סטטוס התחברות</span>
            </div>
            <Badge variant={isAuthenticated ? "default" : "destructive"}>
              {isAuthenticated ? 'מחובר' : 'לא מחובר'}
            </Badge>
          </div>

          {/* User Info */}
          {user && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">מידע משתמש:</h3>
              <div className="space-y-2 text-sm">
                <div><strong>שם:</strong> {user.full_name}</div>
                <div><strong>אימייל:</strong> {user.email}</div>
                <div><strong>תפקיד:</strong> {user.role}</div>
                <div><strong>מאמן:</strong> {user.is_coach ? 'כן' : 'לא'}</div>
              </div>
            </div>
          )}

          {/* Role Badges */}
          <div className="flex items-center gap-4 justify-center">
            <Badge 
              variant={isAdmin ? "destructive" : "secondary"}
              className={isAdmin ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-600"}
            >
              <Shield className="w-3 h-3 ml-1" />
              מנהל
            </Badge>
            <Badge 
              variant={isCoach ? "default" : "secondary"}
              className={isCoach ? "bg-purple-100 text-purple-800" : "bg-slate-100 text-slate-600"}
            >
              <Users className="w-3 h-3 ml-1" />
              מאמן
            </Badge>
            <Badge 
              variant={!isAdmin && !isCoach ? "default" : "secondary"}
              className={!isAdmin && !isCoach ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600"}
            >
              <User className="w-3 h-3 ml-1" />
              משתמש
            </Badge>
          </div>

          {/* Demo Mode Controls */}
          <div className="space-y-3">
            <Button 
              onClick={handleToggleDemo} 
              variant="outline" 
              className="w-full"
            >
              {isDemoEnabled ? 'כבה מצב דמו' : 'הפעל מצב דמו'}
            </Button>

            {isDemoEnabled && (
              <div className="space-y-2">
                <Button 
                  onClick={switchToUser} 
                  variant="outline" 
                  className="w-full"
                >
                  <User className="w-4 h-4 ml-2" />
                  החלף למשתמש רגיל
                </Button>
                <Button 
                  onClick={switchToCoach} 
                  variant="outline" 
                  className="w-full"
                >
                  <Users className="w-4 h-4 ml-2" />
                  החלף למאמן
                </Button>
                <Button 
                  onClick={switchToAdmin} 
                  variant="outline" 
                  className="w-full"
                >
                  <Shield className="w-4 h-4 ml-2" />
                  החלף למנהל
                </Button>
              </div>
            )}
          </div>

          {/* Sign Out */}
          {isAuthenticated && (
            <Button 
              onClick={handleSignOut} 
              variant="destructive" 
              className="w-full"
            >
              <LogOut className="w-4 h-4 ml-2" />
              התנתק
            </Button>
          )}

          {/* Navigation */}
          <div className="text-center">
            <a 
              href="/Dashboard" 
              className="text-blue-600 hover:underline"
            >
              חזור לדשבורד
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 