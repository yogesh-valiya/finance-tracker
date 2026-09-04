"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  Unlock,
  Check,
  AlertCircle,
  Loader2,
  Delete,
  Fingerprint,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function PasscodePage() {
  const [passcodeEnabled, setPasscodeEnabled] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSettingUp, setIsSettingUp] = React.useState(false);
  const [step, setStep] = React.useState<"enter_new" | "confirm_new" | "verify_disable">("enter_new");

  const [enteredPin, setEnteredPin] = React.useState("");
  const [confirmedPin, setConfirmedPin] = React.useState("");
  const [error, setError] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState("");

  const fetchStatus = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setPasscodeEnabled(data.settings?.passcodeEnabled ?? false);
      }
    } catch (err) {
      console.error("Failed to fetch passcode status:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleDigitClick = (digit: string) => {
    setError("");
    if (step === "enter_new") {
      if (enteredPin.length < 4) {
        const next = enteredPin + digit;
        setEnteredPin(next);
        if (next.length === 4) {
          setTimeout(() => setStep("confirm_new"), 200);
        }
      }
    } else if (step === "confirm_new") {
      if (confirmedPin.length < 4) {
        const next = confirmedPin + digit;
        setConfirmedPin(next);
        if (next.length === 4) {
          finalizeSetup(enteredPin, next);
        }
      }
    } else if (step === "verify_disable") {
      if (enteredPin.length < 4) {
        const next = enteredPin + digit;
        setEnteredPin(next);
        if (next.length === 4) {
          finalizeDisable(next);
        }
      }
    }
  };

  const handleBackspace = () => {
    setError("");
    if (step === "confirm_new") {
      setConfirmedPin((prev) => prev.slice(0, -1));
    } else {
      setEnteredPin((prev) => prev.slice(0, -1));
    }
  };

  const finalizeSetup = async (pin1: string, pin2: string) => {
    if (pin1 !== pin2) {
      setError("PINs do not match. Please try again.");
      setEnteredPin("");
      setConfirmedPin("");
      setStep("enter_new");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/settings/passcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pin1 }),
      });
      if (res.ok) {
        setPasscodeEnabled(true);
        setIsSettingUp(false);
        setEnteredPin("");
        setConfirmedPin("");
        setSuccessMsg("Passcode lock enabled successfully!");
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to set passcode");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const finalizeDisable = async (pin: string) => {
    try {
      setIsSubmitting(true);
      const verifyRes = await fetch("/api/settings/passcode", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.valid) {
        setError("Incorrect PIN. Cannot disable lock.");
        setEnteredPin("");
        return;
      }

      const delRes = await fetch("/api/settings/passcode", { method: "DELETE" });
      if (delRes.ok) {
        setPasscodeEnabled(false);
        setIsSettingUp(false);
        setEnteredPin("");
        setSuccessMsg("Passcode lock disabled.");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      setError("Failed to disable passcode");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startSetup = () => {
    setIsSettingUp(true);
    setStep("enter_new");
    setEnteredPin("");
    setConfirmedPin("");
    setError("");
  };

  const startDisable = () => {
    setIsSettingUp(true);
    setStep("verify_disable");
    setEnteredPin("");
    setError("");
  };

  const cancelSetup = () => {
    setIsSettingUp(false);
    setEnteredPin("");
    setConfirmedPin("");
    setError("");
  };

  const currentLength = step === "confirm_new" ? confirmedPin.length : enteredPin.length;

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <Link href="/more" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            Security & Passcode Lock
          </h1>
          <p className="text-xs text-muted-foreground">
            Secondary app protection when returning to the foreground
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
          <Check className="size-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="size-6 animate-spin mr-2" />
          <span>Loading security status...</span>
        </div>
      ) : !isSettingUp ? (
        <div className="space-y-4">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  {passcodeEnabled ? (
                    <Lock className="size-4 text-emerald-600" />
                  ) : (
                    <Unlock className="size-4 text-muted-foreground" />
                  )}
                  Passcode Protection
                </CardTitle>
                <Badge
                  variant={passcodeEnabled ? "default" : "outline"}
                  className={cn(
                    "text-[10px]",
                    passcodeEnabled && "bg-emerald-600 hover:bg-emerald-700"
                  )}
                >
                  {passcodeEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                When enabled, requires a 4-digit PIN whenever you resume or unlock the application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {passcodeEnabled ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 text-xs">
                    <span className="font-medium">Lock on Foreground Resume</span>
                    <Switch checked={true} disabled />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={startSetup}
                      className="text-xs flex-1 h-9"
                    >
                      Change PIN
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={startDisable}
                      className="text-xs flex-1 h-9"
                    >
                      Disable PIN
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={startSetup} size="sm" className="w-full text-xs h-9 gap-1.5">
                  <Lock className="size-3.5" />
                  Set Up 4-Digit Passcode
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-muted/10">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Fingerprint className="size-4" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-semibold">Biometrics & PWA App Lock</div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Complies with Rule 004. Once configured, locking activates automatically when returning to the tab or app after leaving the screen.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Interactive PIN Keypad Form */
        <Card className="border-border animate-in fade-in-50">
          <CardHeader className="text-center pb-2">
            <div className="size-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center mb-1">
              <Lock className="size-5" />
            </div>
            <CardTitle className="text-base font-semibold">
              {step === "enter_new" && "Enter New 4-Digit PIN"}
              {step === "confirm_new" && "Confirm Your 4-Digit PIN"}
              {step === "verify_disable" && "Enter Current PIN to Disable"}
            </CardTitle>
            <CardDescription className="text-xs">
              {step === "enter_new" && "Choose a secure 4-digit code"}
              {step === "confirm_new" && "Re-enter the same 4-digit code to verify"}
              {step === "verify_disable" && "Verify your identity before removing protection"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {error && (
              <div className="flex items-center gap-1.5 p-2 rounded-md bg-destructive/10 text-destructive text-xs justify-center animate-shake">
                <AlertCircle className="size-3.5" />
                <span>{error}</span>
              </div>
            )}

            {/* PIN Dots Display */}
            <div className="flex items-center justify-center gap-3 py-2">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={cn(
                    "size-4 rounded-full border-2 transition-all",
                    index < currentLength
                      ? "border-primary bg-primary scale-110"
                      : "border-muted-foreground/30 bg-background"
                  )}
                />
              ))}
            </div>

            {/* 10-key Numpad */}
            <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <Button
                  key={num}
                  type="button"
                  variant="outline"
                  onClick={() => handleDigitClick(num)}
                  className="h-12 rounded-xl border-border bg-card font-bold text-lg text-foreground active:scale-95 shadow-xs"
                >
                  {num}
                </Button>
              ))}
              <div />
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDigitClick("0")}
                className="h-12 rounded-xl border-border bg-card font-bold text-lg text-foreground active:scale-95 shadow-xs"
              >
                0
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleBackspace}
                className="h-12 rounded-xl border-border bg-card flex items-center justify-center text-muted-foreground active:scale-95 shadow-xs"
              >
                <Delete className="size-5" />
              </Button>
            </div>

            <div className="flex items-center justify-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelSetup}
                className="text-xs text-muted-foreground"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
