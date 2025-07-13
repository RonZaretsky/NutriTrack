import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('מאמת את החשבון שלך...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the access_token and refresh_token from URL params
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          console.error('Auth callback error:', error, errorDescription);
          setStatus('error');
          setMessage(errorDescription || 'שגיאה באימות החשבון');
          return;
        }

        if (!accessToken) {
          // Check if user is already authenticated
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            setStatus('success');
            setMessage('החשבון אומת בהצלחה! מעביר אותך לדשבורד...');
            setTimeout(() => {
              navigate('/Dashboard');
            }, 2000);
            return;
          }
          // If not authenticated, show error
          console.error('No access token in callback and no user session');
          setStatus('error');
          setMessage('לא נמצא אסימון גישה');
          return;
        }

        // Set the session with the tokens
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (sessionError) {
          console.error('Session error:', sessionError);
          setStatus('error');
          setMessage('שגיאה בהגדרת הסשן');
          return;
        }

        if (data.session) {
          console.log('Auth callback successful:', data.session.user.email);
          setStatus('success');
          setMessage('החשבון אומת בהצלחה! מעביר אותך לדשבורד...');
          
          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            navigate('/Dashboard');
          }, 2000);
        } else {
          setStatus('error');
          setMessage('לא ניתן לאמת את החשבון');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage('שגיאה לא צפויה באימות החשבון');
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate]);

  const handleRetry = () => {
    navigate('/auth/login');
  };

  const handleGoHome = () => {
    navigate('/Dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md glass-effect shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold text-slate-900">
            אימות חשבון
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {status === 'loading' && (
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
              <p className="text-slate-600">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <CheckCircle className="w-12 h-12 mx-auto text-green-600" />
              <Alert>
                <AlertDescription className="text-green-800">
                  {message}
                </AlertDescription>
              </Alert>
              <Button onClick={handleGoHome} className="w-full">
                עבור לדשבורד
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <XCircle className="w-12 h-12 mx-auto text-red-600" />
              <Alert variant="destructive">
                <AlertDescription>
                  {message}
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Button onClick={handleRetry} className="w-full">
                  נסה שוב
                </Button>
                <Button onClick={handleGoHome} variant="outline" className="w-full">
                  עבור לדשבורד
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 