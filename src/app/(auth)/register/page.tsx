"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUpWithEmail, signInWithEmail, signInWithGoogle } from "@/lib/firebase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);

  async function establishSession(idToken: string) {
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to establish user account");
    }

    router.push("/transactions");
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setError("");
      setIsLoading(true);

      let userCredential;
      try {
        userCredential = await signUpWithEmail(email, password);
      } catch (signUpErr: unknown) {
        const errObj = signUpErr as { code?: string; message?: string };
        const isEmailInUse =
          errObj?.code === "auth/email-already-in-use" ||
          errObj?.message?.includes("email-already-in-use");

        if (isEmailInUse) {
          // If the email is already registered in Firebase, attempt to sign in with the provided credentials.
          // The session establishment will automatically provision the user in PostgreSQL if missing.
          try {
            userCredential = await signInWithEmail(email, password);
          } catch {
            throw new Error(
              "An account with this email already exists in Firebase. The password entered does not match. Please log in with your existing password or use Forgot Password."
            );
          }
        } else {
          throw signUpErr;
        }
      }

      const idToken = await userCredential.user.getIdToken();
      await establishSession(idToken);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setError(message.replace("Firebase: ", ""));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    try {
      setError("");
      setIsGoogleLoading(true);
      const userCredential = await signInWithGoogle();
      const idToken = await userCredential.user.getIdToken();
      await establishSession(idToken);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Google sign in failed";
      setError(message.replace("Firebase: ", ""));
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border-border shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Create an Account</CardTitle>
          <CardDescription>
            Join Finance Tracker and start managing your wealth
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="size-4 shrink-0" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            variant="outline"
            type="button"
            className="w-full flex items-center justify-center gap-2"
            disabled={isGoogleLoading || isLoading}
            onClick={handleGoogleSignIn}
          >
            {isGoogleLoading ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : (
              <svg className="size-4" viewBox="0 0 24 24" data-icon="inline-start">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            Sign up with Google
          </Button>

          <div className="relative flex items-center justify-center my-1">
            <Separator className="w-full" />
            <span className="absolute bg-card px-2 text-xs text-muted-foreground uppercase">
              Or register with email
            </span>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={isLoading || isGoogleLoading}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                disabled={isLoading || isGoogleLoading}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                disabled={isLoading || isGoogleLoading}
                required
              />
            </div>

            <Button type="submit" className="w-full mt-2" disabled={isLoading || isGoogleLoading}>
              {isLoading && <Loader2 className="animate-spin" data-icon="inline-start" />}
              Create Account
              <ArrowRight data-icon="inline-end" />
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-foreground underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
