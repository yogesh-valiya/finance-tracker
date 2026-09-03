import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
import { Wallet, Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { requestPasswordReset, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (!email.trim()) {
      setFormError('Please enter your registered email address.');
      return;
    }

    try {
      await requestPasswordReset(email);
      setIsSuccess(true);
    } catch {
      // error handled in store
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
            Account recovery & password reset
          </p>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold">Reset Password</CardTitle>
            <CardDescription className="text-xs">
              Enter your email and we will send you a password reset link.
            </CardDescription>
          </CardHeader>

          {isSuccess ? (
            <CardContent className="flex flex-col gap-4 py-6 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <CheckCircle2 className="size-6" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-bold text-foreground">Reset Email Sent!</h3>
                <p className="text-xs text-muted-foreground">
                  If an account exists for <span className="font-semibold text-foreground">{email}</span>, you will receive password reset instructions shortly.
                </p>
              </div>
              <Button asChild className="w-full h-10 mt-2">
                <Link to="/login">
                  <ArrowLeft className="size-4 mr-2" />
                  Return to Sign In
                </Link>
              </Button>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="flex flex-col gap-4">
                {(formError || error) && (
                  <Alert variant="destructive" className="py-2.5 px-3 text-xs">
                    <AlertCircle className="size-4 shrink-0" />
                    <AlertDescription>{formError || error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold">
                    Registered Email Address
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

                <Button type="submit" className="w-full h-10 gap-2 mt-1" disabled={isLoading}>
                  <Mail className="size-4" />
                  {isLoading ? 'Sending Request...' : 'Send Reset Link'}
                </Button>
              </CardContent>

              <CardFooter className="pt-2 pb-5 flex justify-center border-t border-border/40">
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  <ArrowLeft className="size-3.5" />
                  Back to Sign In
                </Link>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};
