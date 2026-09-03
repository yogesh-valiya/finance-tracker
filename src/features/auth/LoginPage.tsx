import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from './authStore';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Wallet, Sparkles, LogIn, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, quickDemoLogin, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (!email.trim()) {
      setFormError('Please enter your email address.');
      return;
    }
    if (!password) {
      setFormError('Please enter your password.');
      return;
    }

    try {
      await login(email, password);
      toast.success('Signed in successfully!');
      navigate('/trans');
    } catch (err: any) {
      // error is captured in store
    }
  };

  const handleDemoLogin = async () => {
    try {
      await quickDemoLogin();
      toast.success('Welcome to the Demo Workspace!');
      navigate('/trans');
    } catch (err: any) {
      toast.error('Could not start demo session.');
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col justify-center items-center px-4 py-8 bg-muted/20">
      <div className="w-full max-w-sm flex flex-col gap-6">
        {/* Branding Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
            <Wallet className="size-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Money Manager
          </h1>
          <p className="text-xs text-muted-foreground">
            Double-entry personal bookkeeping & net worth tracker
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold">Sign In</CardTitle>
            <CardDescription className="text-xs">
              Enter your credentials to access your financial ledger.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="flex flex-col gap-4">
              {(formError || error) && (
                <Alert variant="destructive" className="py-2.5 px-3 text-xs">
                  <AlertCircle className="size-4 shrink-0" />
                  <AlertDescription>{formError || error}</AlertDescription>
                </Alert>
              )}

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email" className="text-xs font-semibold">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 text-xs"
                  disabled={isLoading}
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold">
                    Password
                  </Label>
                  <Link
                    to="/forgot-password"
                    className="text-[11px] text-primary hover:underline font-medium"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 text-xs"
                  disabled={isLoading}
                />
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full h-10 gap-2 mt-1" disabled={isLoading}>
                <LogIn className="size-4" />
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>

              <div className="flex items-center gap-3 my-1">
                <Separator className="flex-1" />
                <span className="text-[10.5px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Or Test Instantly
                </span>
                <Separator className="flex-1" />
              </div>

              {/* Quick Demo Login */}
              <Button
                type="button"
                variant="secondary"
                className="w-full h-10 gap-2 font-semibold text-xs border border-border/80"
                onClick={handleDemoLogin}
                disabled={isLoading}
              >
                <Sparkles className="size-4 text-amber-500" />
                Explore Demo with Sample Data
              </Button>
            </CardContent>

            <CardFooter className="pt-2 pb-5 flex justify-center border-t border-border/40">
              <p className="text-xs text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/register" className="font-semibold text-primary hover:underline">
                  Create Account
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};
