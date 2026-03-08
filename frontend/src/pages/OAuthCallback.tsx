import { useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';

const REDIRECT_URI =
  (import.meta.env.VITE_OAUTH_REDIRECT_URI as string) ??
  `${window.location.origin}/oauth/callback`;

export function OAuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const called = useRef(false); // prevent double-call in React Strict Mode

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const oauthError = params.get('error');

    if (oauthError) {
      setError(`Google denied access: ${oauthError}`);
      return;
    }

    if (!code) {
      setError('No authorization code received from Google.');
      return;
    }

    authApi
      .loginWithGoogle({ code, redirectUri: REDIRECT_URI })
      .then((response) => {
        setUser(response.user);
        navigate({ to: '/dashboard', replace: true });
      })
      .catch((err) => {
        console.error('Login failed:', err);
        setError('Authentication failed. Please try again.');
      });
  }, [navigate, setUser]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <p className="text-center text-sm">
            <a href="/login" className="text-primary underline">
              Go back to login
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <div>
          <p className="text-lg font-semibold">Signing you in…</p>
          <p className="text-sm text-muted-foreground">Verifying your Google account</p>
        </div>
      </div>
    </div>
  );
}
