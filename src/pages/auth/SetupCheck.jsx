import React from 'react';
import { demoMode } from '@/utils/demoMode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, Mail, User, CheckCircle, XCircle, Info } from 'lucide-react';

export default function SetupCheck() {
  const [isDemoEnabled, setIsDemoEnabled] = React.useState(demoMode.isEnabled());
  const [supabaseUrl, setSupabaseUrl] = React.useState(import.meta.env.VITE_SUPABASE_URL || 'Not set');
  const [supabaseKey, setSupabaseKey] = React.useState(import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not set');

  const handleEnableDemo = () => {
    demoMode.enable();
    setIsDemoEnabled(true);
    window.location.reload();
  };

  const handleDisableDemo = () => {
    demoMode.disable();
    setIsDemoEnabled(false);
    window.location.reload();
  };

  const checkSetup = () => {
    const issues = [];
    const recommendations = [];

    // Check demo mode
    if (!isDemoEnabled) {
      issues.push('Demo mode is disabled - real authentication required');
      recommendations.push('Enable demo mode for testing without setup');
    }

    // Check Supabase credentials
    if (supabaseUrl === 'Not set') {
      issues.push('Supabase URL not configured');
      recommendations.push('Set VITE_SUPABASE_URL in .env file');
    }

    if (supabaseKey === 'Not set') {
      issues.push('Supabase API key not configured');
      recommendations.push('Set VITE_SUPABASE_ANON_KEY in .env file');
    }

    return { issues, recommendations };
  };

  const { issues, recommendations } = checkSetup();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-2xl glass-effect shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-slate-900">
            בדיקת הגדרות מערכת
          </CardTitle>
          <p className="text-slate-600">
            בדוק את הגדרות האימות והתצורה
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Current Status */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-slate-600" />
                <span className="font-medium">מצב דמו</span>
              </div>
              <Badge variant={isDemoEnabled ? "default" : "destructive"}>
                {isDemoEnabled ? 'מופעל' : 'כבוי'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-slate-600" />
                <span className="font-medium">Supabase URL</span>
              </div>
              <Badge variant={supabaseUrl !== 'Not set' ? "default" : "destructive"}>
                {supabaseUrl !== 'Not set' ? 'מוגדר' : 'לא מוגדר'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-slate-600" />
                <span className="font-medium">Supabase API Key</span>
              </div>
              <Badge variant={supabaseKey !== 'Not set' ? "default" : "destructive"}>
                {supabaseKey !== 'Not set' ? 'מוגדר' : 'לא מוגדר'}
              </Badge>
            </div>
          </div>

          {/* Issues */}
          {issues.length > 0 && (
            <Alert variant="destructive">
              <XCircle className="w-4 h-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">בעיות שזוהו:</div>
                <ul className="list-disc list-inside space-y-1">
                  {issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">המלצות:</div>
                <ul className="list-disc list-inside space-y-1">
                  {recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Success State */}
          {issues.length === 0 && (
            <Alert>
              <CheckCircle className="w-4 h-4" />
              <AlertDescription>
                הכל מוגדר נכון! המערכת מוכנה לשימוש.
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {isDemoEnabled ? (
              <Button 
                onClick={handleDisableDemo} 
                variant="outline" 
                className="w-full"
              >
                כבה מצב דמו (השתמש באימות אמיתי)
              </Button>
            ) : (
              <Button 
                onClick={handleEnableDemo} 
                variant="default" 
                className="w-full"
              >
                הפעל מצב דמו (לבדיקה ללא הגדרות)
              </Button>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.open('http://localhost:5174/auth/login', '_blank')}
              >
                בדוק התחברות
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.open('http://localhost:5174/Dashboard', '_blank')}
              >
                פתח דשבורד
              </Button>
            </div>
          </div>

          {/* Help Links */}
          <div className="text-center space-y-2 text-sm text-slate-600">
            <div>
              <strong>עזרה:</strong>
            </div>
            <div className="space-x-4 space-x-reverse">
              <a 
                href="https://supabase.com/docs/guides/auth" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                מדריך Supabase Auth
              </a>
              <a 
                href="http://localhost:5174/auth/demo-test" 
                className="text-blue-600 hover:underline"
              >
                בדיקת דמו
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 