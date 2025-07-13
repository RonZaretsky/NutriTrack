import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '@/api/authApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { logEvent } from '@/components/utils/logger';

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('נא להזין כתובת אימייל');
      return;
    }
    
    if (!email.includes('@')) {
      setError('נא להזין כתובת אימייל תקינה');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await authApi.resetPassword(email);
      setSuccess('הוראות לאיפוס הסיסמה נשלחו לאימייל שלך. בדוק את תיבת הדואר שלך.');
      logEvent('Auth', 'PASSWORD_RESET_REQUESTED', { email });
    } catch (error) {
      console.error('Password reset error:', error);
      setError(error.message || 'שגיאה בשליחת הוראות לאיפוס הסיסמה');
      logEvent('Auth', 'PASSWORD_RESET_ERROR', { error: error.message }, 'ERROR');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md glass-effect shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-slate-900">
            שכחתי סיסמה
          </CardTitle>
          <p className="text-slate-600">
            הזן את כתובת האימייל שלך ונשלח לך הוראות לאיפוס הסיסמה
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert>
              <CheckCircle className="w-4 h-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pr-10"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : (
                'שלח הוראות לאיפוס'
              )}
            </Button>
          </form>

          <div className="text-center space-y-2">
            <Link 
              to="/auth/login" 
              className="inline-flex items-center text-sm text-blue-600 hover:underline"
            >
              <ArrowLeft className="w-4 h-4 ml-1" />
              חזור להתחברות
            </Link>
            
            <div className="text-sm text-slate-600">
              אין לך חשבון?{' '}
              <Link to="/auth/register" className="text-blue-600 hover:underline">
                הירשם עכשיו
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 