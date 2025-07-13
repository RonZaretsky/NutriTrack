import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/api/authApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Mail, Lock, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { logEvent } from '@/components/utils/logger';

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isMagicLinkMode, setIsMagicLinkMode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Email/password form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Magic link form
  const [magicLinkEmail, setMagicLinkEmail] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    console.log('Login page - Auth state changed:', { isAuthenticated, loading, user: !!user });
    if (isAuthenticated && !loading) {
      console.log('User is authenticated, redirecting to Dashboard');
      navigate('/Dashboard');
    } else if (loading) {
      console.log('Still loading, waiting...');
    } else if (!isAuthenticated) {
      console.log('Not authenticated, staying on login page');
    }
  }, [isAuthenticated, loading, navigate, user]);

  const handleEmailPasswordLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('נא למלא את כל השדות');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Attempting login with:', { email });
      const result = await authApi.signIn(email, password);
      console.log('Sign in result:', result);
      logEvent('Auth', 'LOGIN_SUCCESS', { method: 'email_password' });
      // Don't navigate here - let the useEffect handle it
      console.log('Login successful, waiting for auth state change');
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'שגיאה בהתחברות');
      logEvent('Auth', 'LOGIN_ERROR', { error: error.message }, 'ERROR');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLinkLogin = async (e) => {
    e.preventDefault();
    if (!magicLinkEmail) {
      setError('נא להזין כתובת אימייל');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await authApi.signInWithMagicLink(magicLinkEmail);
      setSuccess('קישור קסם נשלח לאימייל שלך! בדוק את תיבת הדואר שלך.');
      logEvent('Auth', 'MAGIC_LINK_SENT', { email: magicLinkEmail });
    } catch (error) {
      console.error('Magic link error:', error);
      setError(error.message || 'שגיאה בשליחת קישור הקסם');
      logEvent('Auth', 'MAGIC_LINK_ERROR', { error: error.message }, 'ERROR');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate('/auth/forgot-password');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md glass-effect shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-slate-900">
            התחברות למערכת
          </CardTitle>
          <p className="text-slate-600">
            {isMagicLinkMode ? 'התחבר באמצעות קישור קסם' : 'התחבר עם אימייל וסיסמה'}
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
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {!isMagicLinkMode ? (
            // Email/Password Form
            <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
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
              
              <div className="space-y-2">
                <Label htmlFor="password">סיסמה</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="הזן סיסמה"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                  <ArrowRight className="w-4 h-4 ml-2" />
                )}
                התחבר
              </Button>
            </form>
          ) : (
            // Magic Link Form
            <form onSubmit={handleMagicLinkLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="magic-email">אימייל</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="magic-email"
                    type="email"
                    placeholder="your@email.com"
                    value={magicLinkEmail}
                    onChange={(e) => setMagicLinkEmail(e.target.value)}
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
                  <Sparkles className="w-4 h-4 ml-2" />
                )}
                שלח קישור קסם
              </Button>
            </form>
          )}

          <Separator />

          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setIsMagicLinkMode(!isMagicLinkMode)}
            >
              {isMagicLinkMode ? 'התחבר עם סיסמה' : 'התחבר עם קישור קסם'}
            </Button>

            {!isMagicLinkMode && (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleForgotPassword}
              >
                שכחתי סיסמה
              </Button>
            )}
          </div>

          <div className="text-center text-sm text-slate-600">
            אין לך חשבון?{' '}
            <Link to="/auth/register" className="text-blue-600 hover:underline">
              הירשם עכשיו
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 