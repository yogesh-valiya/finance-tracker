"use client";

import * as React from "react";
import { evaluateExpression } from "@/lib/math/expression-parser";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Delete, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface NumpadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue?: string;
  type?: "INCOME" | "EXPENSE" | "TRANSFER";
  onDone: (finalAmount: string) => void;
}

export function Numpad({
  open,
  onOpenChange,
  initialValue = "0",
  type = "EXPENSE",
  onDone,
}: NumpadProps) {
  const [expression, setExpression] = React.useState(initialValue === "0" ? "" : initialValue);

  React.useEffect(() => {
    if (open) {
      setExpression(initialValue === "0" ? "" : initialValue);
    }
  }, [open, initialValue]);

  const parsed = React.useMemo(() => {
    return evaluateExpression(expression);
  }, [expression]);

  function handleKeyPress(key: string) {
    if (key === "C") {
      setExpression("");
    } else if (key === "BACKSPACE") {
      setExpression((prev) => prev.slice(0, -1));
    } else if (key === "DONE") {
      handleDone();
    } else {
      // Append key
      setExpression((prev) => {
        // Prevent double operators
        const lastChar = prev.slice(-1);
        if (["+", "-", "*", "/", "×", "÷"].includes(lastChar) && ["+", "-", "*", "/", "×", "÷"].includes(key)) {
          return prev.slice(0, -1) + key;
        }
        return prev + key;
      });
    }
  }

  function handleDone() {
    const val = parsed.formatted || "0";
    onDone(val);
    onOpenChange(false);
  }

  React.useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key;
      if (["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "."].includes(key)) {
        e.preventDefault();
        handleKeyPress(key);
      } else if (["+", "-", "*", "/"].includes(key)) {
        e.preventDefault();
        handleKeyPress(key);
      } else if (key === "x" || key === "X") {
        e.preventDefault();
        handleKeyPress("*");
      } else if (key === "Backspace") {
        e.preventDefault();
        handleKeyPress("BACKSPACE");
      } else if (key === "c" || key === "C") {
        e.preventDefault();
        handleKeyPress("C");
      } else if (key === "Enter") {
        e.preventDefault();
        handleDone();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, parsed]);

  const isIncome = type === "INCOME";
  const isTransfer = type === "TRANSFER";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs p-4 gap-3 bg-card border-border">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Enter Amount ({type})
          </DialogTitle>
        </DialogHeader>

        {/* Display Strip */}
        <div className="flex flex-col items-end justify-end p-3 rounded-xl bg-muted/40 border border-border min-h-[72px]">
          <div className="text-xs text-muted-foreground font-mono truncate max-w-full">
            {expression || "0"}
          </div>
          <div
            className={cn(
              "text-2xl font-bold tabular-nums tracking-tight",
              isIncome && "text-income",
              type === "EXPENSE" && "text-expense",
              isTransfer && "text-foreground"
            )}
          >
            ₹{parsed.formatted || "0.00"}
          </div>
        </div>

        {/* Numpad Keypad Grid */}
        <div className="grid grid-cols-4 gap-1.5 pt-1 select-none">
          {/* Row 1 */}
          <Button
            type="button"
            variant="outline"
            className="h-12 text-sm font-semibold text-destructive hover:bg-destructive/10"
            onClick={() => handleKeyPress("C")}
          >
            C
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 text-base font-semibold"
            onClick={() => handleKeyPress("/")}
          >
            ÷
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 text-base font-semibold"
            onClick={() => handleKeyPress("*")}
          >
            ×
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12"
            onClick={() => handleKeyPress("BACKSPACE")}
          >
            <Delete className="size-4" />
          </Button>

          {/* Row 2 */}
          <Button
            type="button"
            variant="outline"
            className="h-12 text-base font-semibold"
            onClick={() => handleKeyPress("7")}
          >
            7
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 text-base font-semibold"
            onClick={() => handleKeyPress("8")}
          >
            8
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 text-base font-semibold"
            onClick={() => handleKeyPress("9")}
          >
            9
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 text-base font-semibold"
            onClick={() => handleKeyPress("-")}
          >
            −
          </Button>

          {/* Row 3 */}
          <Button
            type="button"
            variant="outline"
            className="h-12 text-base font-semibold"
            onClick={() => handleKeyPress("4")}
          >
            4
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 text-base font-semibold"
            onClick={() => handleKeyPress("5")}
          >
            5
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 text-base font-semibold"
            onClick={() => handleKeyPress("6")}
          >
            6
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 text-base font-semibold"
            onClick={() => handleKeyPress("+")}
          >
            +
          </Button>

          {/* Row 4 & 5 */}
          <Button
            type="button"
            variant="outline"
            className="h-12 text-base font-semibold"
            onClick={() => handleKeyPress("1")}
          >
            1
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 text-base font-semibold"
            onClick={() => handleKeyPress("2")}
          >
            2
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 text-base font-semibold"
            onClick={() => handleKeyPress("3")}
          >
            3
          </Button>
          <Button
            type="button"
            className={cn(
              "row-span-2 h-auto text-sm font-semibold flex flex-col items-center justify-center gap-1",
              isIncome && "bg-income hover:bg-income/90 text-white",
              type === "EXPENSE" && "bg-expense hover:bg-expense/90 text-white"
            )}
            onClick={() => handleKeyPress("DONE")}
          >
            <Check className="size-5" />
            Done
          </Button>

          {/* Row 5 */}
          <Button
            type="button"
            variant="outline"
            className="h-12 text-base font-semibold"
            onClick={() => handleKeyPress("0")}
          >
            0
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 text-xs font-semibold"
            onClick={() => handleKeyPress("00")}
          >
            00
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 text-base font-semibold"
            onClick={() => handleKeyPress(".")}
          >
            .
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
