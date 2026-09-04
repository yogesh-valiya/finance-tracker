"use client";

import * as React from "react";
import { Lock, AlertCircle, Loader2, Delete } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LockScreen() {
  const [passcodeEnabled, setPasscodeEnabled] = React.useState<boolean>(false);
  const [isLocked, setIsLocked] = React.useState<boolean>(false);
  const [enteredPin, setEnteredPin] = React.useState<string>("");
  const [error, setError] = React.useState<string>("");
  const [isVerifying, setIsVerifying] = React.useState<boolean>(false);

  // Hidden timestamp tracker
  const hiddenTimeRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    // Check initial passcode setting
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings?.passcodeEnabled) {
          setPasscodeEnabled(true);
        }
      })
      .catch(() => {});

    // Listen to visibilitychange per Rule 004
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        hiddenTimeRef.current = Date.now();
      } else if (document.visibilityState === "visible") {
        if (hiddenTimeRef.current && passcodeEnabled) {
          const elapsedSeconds = (Date.now() - hiddenTimeRef.current) / 1000;
          // If backgrounded for more than 5 seconds, trigger lock
          if (elapsedSeconds >= 5) {
            setIsLocked(true);
            setEnteredPin("");
            setError("");
          }
        }
        hiddenTimeRef.current = null;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [passcodeEnabled]);

  const handleDigitClick = (digit: string) => {
    if (isVerifying || enteredPin.length >= 4) return;
    setError("");

    const next = enteredPin + digit;
    setEnteredPin(next);

    if (next.length === 4) {
      verifyPin(next);
    }
  };

  const handleBackspace = () => {
    if (isVerifying) return;
    setError("");
    setEnteredPin((prev) => prev.slice(0, -1));
  };

  const verifyPin = async (pin: string) => {
    try {
      setIsVerifying(true);
      const res = await fetch("/api/settings/passcode", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (data.valid) {
        setIsLocked(false);
        setEnteredPin("");
        setError("");
      } else {
        setError("Incorrect PIN. Please try again.");
        setEnteredPin("");
      }
    } catch {
      setError("Failed to verify passcode");
      setEnteredPin("");
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isLocked) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xs flex flex-col items-center text-center space-y-6">
        <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
          <Lock className="size-8" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Application Locked</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Enter your 4-digit PIN to resume your session
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium">
            <AlertCircle className="size-3.5" />
            <span>{error}</span>
          </div>
        )}

        {/* PIN Indicators */}
        <div className="flex items-center justify-center gap-4 py-2">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={cn(
                "size-4 rounded-full border-2 transition-all duration-150",
                index < enteredPin.length
                  ? "border-primary bg-primary scale-110"
                  : "border-muted-foreground/40 bg-background"
              )}
            />
          ))}
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[240px]">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <Button
              key={num}
              type="button"
              variant="outline"
              disabled={isVerifying}
              onClick={() => handleDigitClick(num)}
              className="h-14 rounded-2xl border-border bg-card font-bold text-xl text-foreground active:scale-95 shadow-xs"
            >
              {num}
            </Button>
          ))}
          <div />
          <Button
            type="button"
            variant="outline"
            disabled={isVerifying}
            onClick={() => handleDigitClick("0")}
            className="h-14 rounded-2xl border-border bg-card font-bold text-xl text-foreground active:scale-95 shadow-xs"
          >
            0
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isVerifying}
            onClick={handleBackspace}
            className="h-14 rounded-2xl border-border bg-card flex items-center justify-center text-muted-foreground active:scale-95 shadow-xs"
          >
            <Delete className="size-6" />
          </Button>
        </div>

        {isVerifying && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span>Verifying...</span>
          </div>
        )}
      </div>
    </div>
  );
}
