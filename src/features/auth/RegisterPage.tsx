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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Wallet, UserPlus, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (!name.trim()) {
      setFormError('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setFormError('Please enter your email address.');
      return;
    }
    if (!password || password.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== passwordConfirm) {
      setFormError('Passwords do not match.');
      return;
    }

    try {
      await register({
        name,
        email,
        password,
        passwordConfirm,
        mainCurrency: currency,
      });
      toast.success('Account created and default categories seeded!');
      navigate('/trans');
    } catch (err: any) {
      // error is handled in store
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
            Create your account to start managing your personal finances
          </p>
        </div>

        {/* Register Card */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold">Create Account</CardTitle>
            <CardDescription className="text-xs">
              Default income & expense categories will be initialized automatically.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="flex flex-col gap-3.5">
              {(formError || error) && (
                <Alert variant="destructive" className="py-2.5 px-3 text-xs">
                  <AlertCircle className="size-4 shrink-0" />
                  <AlertDescription>{formError || error}</AlertDescription>
                </Alert>
              )}

              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name" className="text-xs font-semibold">
                  Full Name
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 text-xs"
                  disabled={isLoading}
                />
              </div>

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

              {/* Base Currency */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="currency" className="text-xs font-semibold">
                  Base Currency
                </Label>
                <Select value={currency} onValueChange={setCurrency} disabled={isLoading}>
                  <SelectTrigger id="currency" className="h-10 text-xs">
                    <SelectValue placeholder="Select Base Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹) — Indian Rupee</SelectItem>
                    <SelectItem value="USD">USD ($) — US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR (€) — Euro</SelectItem>
                    <SelectItem value="GBP">GBP (£) — British Pound</SelectItem>
                    <SelectItem value="JPY">JPY (¥) — Japanese Yen</SelectItem>
                    <SelectItem value="AUD">AUD (A$) — Australian Dollar</SelectItem>
                    <SelectItem value="CAD">CAD (C$) — Canadian Dollar</SelectItem>
                    <SelectItem value="SGD">SGD (S$) — Singapore Dollar</SelectItem>
                    <SelectItem value="AED">AED (AED) — UAE Dirham</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password" className="text-xs font-semibold">
                  Password (min. 8 characters)
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 text-xs"
                  disabled={isLoading}
                />
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="passwordConfirm" className="text-xs font-semibold">
                  Confirm Password
                </Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="h-10 text-xs"
                  disabled={isLoading}
                />
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full h-10 gap-2 mt-2" disabled={isLoading}>
                <UserPlus className="size-4" />
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </CardContent>

            <CardFooter className="pt-2 pb-5 flex justify-center border-t border-border/40">
              <p className="text-xs text-muted-foreground">
                Already registered?{' '}
                <Link to="/login" className="font-semibold text-primary hover:underline">
                  Sign In
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};
