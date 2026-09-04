"use client";

import * as React from "react";
import { AccountGroup } from "@prisma/client";
import { ACCOUNT_GROUPS_META, GroupMeta } from "./account-group-meta";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccountCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const GROUPS_LIST = Object.values(ACCOUNT_GROUPS_META);

export function AccountCreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: AccountCreateDialogProps) {
  const [step, setStep] = React.useState<1 | 2>(1);
  const [selectedGroup, setSelectedGroup] = React.useState<GroupMeta>(
    ACCOUNT_GROUPS_META.BANK_ACCOUNT
  );

  // Form Fields
  const [name, setName] = React.useState("");
  const [initialBalance, setInitialBalance] = React.useState("0");
  const [description, setDescription] = React.useState("");
  const [includeInTotals, setIncludeInTotals] = React.useState(true);

  // Credit Card Specific
  const [settlementDay, setSettlementDay] = React.useState("1");
  const [paymentDay, setPaymentDay] = React.useState("15");

  // Flow & State
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [showReconcilePrompt, setShowReconcilePrompt] = React.useState(false);

  // Reset dialog on open/close
  React.useEffect(() => {
    if (open) {
      setStep(1);
      setName("");
      setInitialBalance("0");
      setDescription("");
      setIncludeInTotals(true);
      setSettlementDay("1");
      setPaymentDay("15");
      setError("");
    }
  }, [open]);

  function handleSelectGroup(meta: GroupMeta) {
    setSelectedGroup(meta);
    setStep(2);
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please provide an account name.");
      return;
    }

    const num = parseFloat(initialBalance);
    if (isNaN(num)) {
      setError("Please enter a valid initial balance.");
      return;
    }

    // If initial balance > 0, prompt for reconciliation
    if (num > 0 && selectedGroup.group !== "LOAN") {
      setShowReconcilePrompt(true);
    } else {
      executeCreate(false);
    }
  }

  async function executeCreate(reconcile: boolean) {
    setShowReconcilePrompt(false);
    setIsLoading(true);
    setError("");

    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        group: selectedGroup.group,
        initialBalance: parseFloat(initialBalance) || 0,
        description: description.trim() || undefined,
        includeInTotals,
        reconcile,
      };

      if (selectedGroup.group === "CREDIT_CARD") {
        payload.metadata = {
          settlementDay: parseInt(settlementDay, 10) || 1,
          paymentDay: parseInt(paymentDay, 10) || 15,
        };
      }

      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create account");
      }

      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              {step === 2 && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setStep(1)}
                  className="size-7"
                >
                  <ArrowLeft className="size-4" />
                </Button>
              )}
              <DialogTitle>
                {step === 1 ? "Select Account Type" : `New ${selectedGroup.label}`}
              </DialogTitle>
            </div>
            <DialogDescription>
              {step === 1
                ? "Choose from 11 financial classification groups"
                : "Set initial balance, name, and classification properties"}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="p-3 text-xs rounded-md bg-destructive/10 text-destructive font-medium">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-2 gap-2 py-2">
              {GROUPS_LIST.map((meta) => {
                const Icon = meta.icon;
                return (
                  <button
                    key={meta.group}
                    type="button"
                    onClick={() => handleSelectGroup(meta)}
                    className="flex flex-col items-start gap-1 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/40 transition-all text-left"
                  >
                    <div className="p-2 rounded-md bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </div>
                    <span className="font-semibold text-xs text-foreground mt-1">
                      {meta.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground line-clamp-1">
                      {meta.description}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="acc-name">Account Name</Label>
                <Input
                  id="acc-name"
                  placeholder="e.g. HDFC Salary, SBI Savings, Amex Card"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="acc-balance">
                  {selectedGroup.group === "LOAN"
                    ? "Loan Amount (Owed / Negative Balance)"
                    : "Initial Balance (₹)"}
                </Label>
                <Input
                  id="acc-balance"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  disabled={isLoading}
                  required
                />
                {selectedGroup.group === "LOAN" && (
                  <p className="text-[11px] text-muted-foreground">
                    Loans represent debt liabilities and automatically reduce total Net Worth.
                  </p>
                )}
              </div>

              {selectedGroup.group === "CREDIT_CARD" && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-border bg-muted/20">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="settlement-day" className="text-xs">
                      Settlement Date
                    </Label>
                    <Input
                      id="settlement-day"
                      type="number"
                      min="1"
                      max="28"
                      value={settlementDay}
                      onChange={(e) => setSettlementDay(e.target.value)}
                      placeholder="1"
                    />
                    <span className="text-[10px] text-muted-foreground">Cycle end day (1–28)</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="payment-day" className="text-xs">
                      Payment Date
                    </Label>
                    <Input
                      id="payment-day"
                      type="number"
                      min="1"
                      max="28"
                      value={paymentDay}
                      onChange={(e) => setPaymentDay(e.target.value)}
                      placeholder="15"
                    />
                    <span className="text-[10px] text-muted-foreground">Due date (1–28)</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="acc-desc">Description (Optional)</Label>
                <Input
                  id="acc-desc"
                  placeholder="e.g. Primary salary account"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-foreground">
                    Include in Net Worth
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Include this account in total asset and liability calculations
                  </span>
                </div>
                <Switch
                  checked={includeInTotals}
                  onCheckedChange={setIncludeInTotals}
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="animate-spin" data-icon="inline-start" />}
                  Create Account
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Reconciliation Alert Prompt Dialog */}
      <AlertDialog open={showReconcilePrompt} onOpenChange={setShowReconcilePrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Record Initial Balance as Income?</AlertDialogTitle>
            <AlertDialogDescription>
              You entered an opening balance of{" "}
              <span className="font-semibold text-foreground">
                ₹{parseFloat(initialBalance || "0").toFixed(2)}
              </span>
              . Would you like to create an Income transaction for ledger reconciliation (§8.3)?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel
              onClick={() => executeCreate(false)}
              className="w-full sm:w-auto"
            >
              No, Just Initial Balance
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => executeCreate(true)}
              className="w-full sm:w-auto"
            >
              <Check className="size-4 mr-1.5" data-icon="inline-start" />
              Yes, Record as Income
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
