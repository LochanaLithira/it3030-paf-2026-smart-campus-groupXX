import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookOpen, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
const REDIRECT_URI = import.meta.env.VITE_OAUTH_REDIRECT_URI as string ?? `${window.location.origin}/oauth/callback`;

function buildGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type LoginValues = z.infer<typeof loginSchema>;

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
type SignupValues = z.infer<typeof signupSchema>;

type Tab = 'login' | 'signup' | 'google';

function PasswordInput({ id, placeholder, register, error }: {
  id: string;
  placeholder?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  error?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <>
      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          placeholder={placeholder ?? '••••••••'}
          autoComplete={id === 'password' ? 'current-password' : 'new-password'}
          {...register}
          className={error ? 'border-destructive pr-10' : 'pr-10'}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          tabIndex={-1}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </>
  );
}

export function LoginPage() {
  const [activeTab, setActiveTab] = useState<Tab>('login');
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();

  const loginForm = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const signupForm = useForm<SignupValues>({ resolver: zodResolver(signupSchema) });

  const handleGoogleLogin = () => {
    if (!GOOGLE_CLIENT_ID) {
      toast.error('Google login is not configured on this deployment.');
      return;
    }
    window.location.href = buildGoogleAuthUrl();
  };

  const onLogin = async (values: LoginValues) => {
    try {
      const data = await authApi.loginWithCredentials(values);
      setUser(data.user);
      navigate({ to: '/dashboard' });
    } catch {
      toast.error('Invalid email or password');
    }
  };

  const onSignup = async (values: SignupValues) => {
    try {
      const data = await authApi.register({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
      });
      setUser(data.user);
      toast.success('Account created! Contact an admin to have a role assigned.');
      navigate({ to: '/dashboard' });
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? '';
      if (msg.includes('already exists') || msg.includes('409')) {
        toast.error('An account with this email already exists.');
      } else {
        toast.error('Registration failed. Please try again.');
      }
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'login', label: 'Sign In' },
    { id: 'signup', label: 'Sign Up' },
    { id: 'google', label: 'Google' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Brand */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary shadow-lg">
            <BookOpen className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Smart Campus</h1>
            <p className="text-muted-foreground mt-1">Resource Management Platform</p>
          </div>
        </div>

        {/* Login card */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">
              {activeTab === 'login' ? 'Welcome back' : activeTab === 'signup' ? 'Create an account' : 'Continue with Google'}
            </CardTitle>
            <CardDescription className="text-center">
              {activeTab === 'signup'
                ? 'You will need an admin to assign your role after signing up.'
                : 'Sign in to your account to continue'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Tab switcher */}
            <div className="flex rounded-lg bg-muted p-1 gap-1">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                    activeTab === t.id
                      ? 'bg-background shadow text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Sign In */}
            {activeTab === 'login' && (
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="admin@smartcampus.com"
                    autoComplete="email"
                    {...loginForm.register('email')}
                    className={loginForm.formState.errors.email ? 'border-destructive' : ''}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <PasswordInput
                    id="password"
                    register={loginForm.register('password')}
                    error={loginForm.formState.errors.password?.message}
                  />
                </div>
                <Button type="submit" className="w-full h-11" disabled={loginForm.formState.isSubmitting}>
                  {loginForm.formState.isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Sign In
                </Button>
              </form>
            )}

            {/* Sign Up */}
            {activeTab === 'signup' && (
              <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="John Doe"
                    autoComplete="name"
                    {...signupForm.register('fullName')}
                    className={signupForm.formState.errors.fullName ? 'border-destructive' : ''}
                  />
                  {signupForm.formState.errors.fullName && (
                    <p className="text-xs text-destructive">{signupForm.formState.errors.fullName.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    {...signupForm.register('email')}
                    className={signupForm.formState.errors.email ? 'border-destructive' : ''}
                  />
                  {signupForm.formState.errors.email && (
                    <p className="text-xs text-destructive">{signupForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password">Password</Label>
                  <PasswordInput
                    id="signup-password"
                    register={signupForm.register('password')}
                    error={signupForm.formState.errors.password?.message}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <PasswordInput
                    id="confirmPassword"
                    register={signupForm.register('confirmPassword')}
                    error={signupForm.formState.errors.confirmPassword?.message}
                  />
                </div>
                <Button type="submit" className="w-full h-11" disabled={signupForm.formState.isSubmitting}>
                  {signupForm.formState.isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Account
                </Button>
              </form>
            )}

            {/* Google */}
            {activeTab === 'google' && (
              <Button
                variant="outline"
                className="w-full h-11 gap-3 border-2"
                onClick={handleGoogleLogin}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </Button>
            )}

            <p className="text-xs text-center text-muted-foreground">
              By signing in, you agree to our terms of service and privacy policy.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
