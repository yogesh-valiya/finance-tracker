"use client";

import * as React from "react";
import Link from "next/link";
import { sendPasswordReset } from "@/lib/firebase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setError("Please provide your email address.");
      return;
    }

    try {
      setError("");
      setIsLoading(true);
      await sendPasswordReset(email);
      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Password reset failed";
      setError(message.replace("Firebase: ", ""));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border-border shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Reset Password</CardTitle>
          <CardDescription>
            Enter your email to receive a secure password reset link
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="size-4 shrink-0" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success ? (
            <div className="flex flex-col items-center text-center gap-3 py-4">
              <CheckCircle2 className="size-10 text-primary" />
              <div className="flex flex-col gap-1">
                <h3 className="font-semibold text-foreground">Reset Email Sent</h3>
                <p className="text-sm text-muted-foreground">
                  We&apos;ve sent instructions to <span className="font-medium text-foreground">{email}</span>. Please check your inbox.
                </p>
              </div>
              <Button render={<Link href="/login" />} variant="outline" className="mt-2 w-full">
                Return to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={isLoading}
                  required
                />
              </div>

              <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                {isLoading && <Loader2 className="animate-spin" data-icon="inline-start" />}
                <Mail className="size-4 mr-2" data-icon="inline-start" />
                Send Reset Link
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="justify-center border-t border-border pt-4">
          <Link
            href="/login"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3" data-icon="inline-start" />
            Back to login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
