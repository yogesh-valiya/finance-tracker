"use client";

import * as React from "react";
import { TransactionType, Account } from "@prisma/client";
import { CategoryWithSubs } from "./category-selector";
import { Numpad } from "@/components/numpad/numpad";
import { CategorySelector } from "./category-selector";
import { AccountSelector } from "./account-selector";
import { RecurrencePopover, RecurrenceSettings } from "./recurrence-popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Calendar as CalendarIcon,
  Star,
  Loader2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface EditableTransaction {
  id: string;
  type: TransactionType;
  amount: string | number | { toString(): string };
  date: string | Date;
  accountId: string;
  toAccountId?: string | null;
  categoryId?: string | null;
  subcategoryId?: string | null;
  fee?: string | number | { toString(): string } | null;
  note?: string | null;
  description?: string | null;
}

interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  categories: CategoryWithSubs[];
  onSuccess: () => void;
  editTransaction?: EditableTransaction | null;
  initialDate?: string | Date | null;
}

function toLocalDateTimeString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function TransactionFormDialog({
  open,
  onOpenChange,
  accounts,
  categories,
  onSuccess,
  editTransaction,
  initialDate,
}: TransactionFormDialogProps) {
  const [type, setType] = React.useState<TransactionType>("EXPENSE");
  const [amount, setAmount] = React.useState("0");
  const [dateStr, setDateStr] = React.useState(() => toLocalDateTimeString(new Date()));
  const dateInputRef = React.useRef<HTMLInputElement>(null);
  const noteInputRef = React.useRef<HTMLInputElement>(null);
  const descInputRef = React.useRef<HTMLInputElement>(null);
  const datePickerActiveRef = React.useRef(false);

  const [accountId, setAccountId] = React.useState<string>("");
  const [toAccountId, setToAccountId] = React.useState<string>("");
  const [categoryId, setCategoryId] = React.useState<string | null>(null);
  const [subcategoryId, setSubcategoryId] = React.useState<string | null>(null);

  const [fee, setFee] = React.useState<string>("");
  const [note, setNote] = React.useState("");
  const [description, setDescription] = React.useState("");

  // Sub-dialogs
  const [numpadOpen, setNumpadOpen] = React.useState(false);
  const [feeNumpadOpen, setFeeNumpadOpen] = React.useState(false);
  const [categoryOpen, setCategoryOpen] = React.useState(false);
  const [sourceAccountOpen, setSourceAccountOpen] = React.useState(false);
  const [destAccountOpen, setDestAccountOpen] = React.useState(false);

  // States
  const [recurrence, setRecurrence] = React.useState<RecurrenceSettings>({
    enabled: false,
    frequency: "MONTHLY",
    timing: "ON_DATE",
    advanceDays: 0,
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  // Initialize or reset form
  React.useEffect(() => {
    if (open) {
      if (editTransaction) {
        setType(editTransaction.type);
        setAmount(Number(editTransaction.amount).toString());
        setDateStr(toLocalDateTimeString(new Date(editTransaction.date)));
        setAccountId(editTransaction.accountId);
        setToAccountId(editTransaction.toAccountId || "");
        setCategoryId(editTransaction.categoryId || null);
        setSubcategoryId(editTransaction.subcategoryId || null);
        setFee(editTransaction.fee ? Number(editTransaction.fee).toString() : "");
        setNote(editTransaction.note || "");
        setDescription(editTransaction.description || "");
      } else {
        setType("EXPENSE");
        setAmount("0");
        if (initialDate) {
          const now = new Date();
          let target: Date;
          if (typeof initialDate === "string") {
            if (initialDate.includes("T")) {
              target = new Date(initialDate);
            } else {
              const [y, m, d] = initialDate.split("-").map(Number);
              target = new Date(y, m - 1, d, now.getHours(), now.getMinutes());
            }
          } else {
            target = new Date(initialDate);
          }
          setDateStr(toLocalDateTimeString(target));
        } else {
          setDateStr(toLocalDateTimeString(new Date()));
        }
        setAccountId(accounts[0]?.id || "");
        setToAccountId(accounts[1]?.id || "");
        setCategoryId(categories.filter((c) => c.type === "EXPENSE")[0]?.id || null);
        setSubcategoryId(null);
        setFee("");
        setNote("");
        setDescription("");
        setRecurrence({
          enabled: false,
          frequency: "MONTHLY",
          timing: "ON_DATE",
          advanceDays: 0,
        });
      }
      setError("");
    }
  }, [open, editTransaction?.id]);

  // Selected Category & Accounts details
  const selectedCategory = categories.find((c) => c.id === categoryId);
  const selectedSub = selectedCategory?.subcategories?.find((s) => s.id === subcategoryId);
  const selectedAccount = accounts.find((a) => a.id === accountId);
  const selectedToAccount = accounts.find((a) => a.id === toAccountId);

  function handleSwapTransferAccounts() {
    const temp = accountId;
    setAccountId(toAccountId);
    setToAccountId(temp);
  }

  async function handleSave(keepOpen: boolean) {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setError("Please enter an amount greater than 0");
      setNumpadOpen(true);
      return;
    }

    if (!accountId) {
      setError("Please select an account");
      return;
    }

    if (type === "TRANSFER") {
      if (!toAccountId) {
        setError("Please select a destination account for transfer");
        return;
      }
      if (toAccountId === accountId) {
        setError("Source and destination accounts must be different");
        return;
      }
    } else if (!categoryId) {
      setError("Please select a category");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const payload = {
        type,
        amount: num,
        date: new Date(dateStr).toISOString(),
        accountId,
        toAccountId: type === "TRANSFER" ? toAccountId : undefined,
        categoryId: type !== "TRANSFER" ? categoryId : undefined,
        subcategoryId: type !== "TRANSFER" ? subcategoryId || undefined : undefined,
        fee: type === "TRANSFER" && fee ? parseFloat(fee) : undefined,
        note: note.trim() || undefined,
        description: description.trim() || undefined,
      };

      const url = editTransaction ? `/api/transactions/${editTransaction.id}` : "/api/transactions";
      const method = editTransaction ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save transaction");
      }

      // If recurrence enabled on new transaction, create recurring rule
      if (recurrence.enabled && !editTransaction) {
        try {
          await fetch("/api/recurring-rules", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type,
              frequency: recurrence.frequency,
              timing: recurrence.timing,
              advanceDays: recurrence.advanceDays,
              startDate: new Date(dateStr).toISOString(),
              accountId,
              toAccountId: type === "TRANSFER" ? toAccountId : undefined,
              categoryId: type !== "TRANSFER" ? categoryId : undefined,
              subcategoryId: type !== "TRANSFER" ? subcategoryId || undefined : undefined,
              amount: num,
              fee: type === "TRANSFER" && fee ? parseFloat(fee) : undefined,
              note: note.trim() || undefined,
              description: description.trim() || undefined,
            }),
          });
        } catch (ruleErr) {
          console.error("Failed to register recurring rule:", ruleErr);
        }
      }

      onSuccess();

      if (keepOpen) {
        setAmount("0");
        setNote("");
        setDescription("");
      } else {
        onOpenChange(false);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save transaction");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    if (!editTransaction) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/transactions/${editTransaction.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete transaction");
      }
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete transaction");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveBookmark() {
    try {
      const templateName = note.trim() || selectedCategory?.name || "Quick Template";
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName,
          type,
          amount: parseFloat(amount) || null,
          accountId,
          toAccountId: type === "TRANSFER" ? toAccountId : null,
          categoryId: type !== "TRANSFER" ? categoryId : null,
          subcategoryId: type !== "TRANSFER" ? subcategoryId : null,
          note: note.trim() || null,
          description: description.trim() || null,
        }),
      });
      if (res.ok) {
        alert("Saved as bookmark template!");
      }
    } catch (err) {
      console.error("Failed to bookmark:", err);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base font-semibold">
              {editTransaction ? "Edit Transaction" : "Record Transaction"}
            </DialogTitle>
          </DialogHeader>

          {error && (
            <div className="p-2.5 text-xs rounded-md bg-destructive/10 text-destructive font-medium">
              {error}
            </div>
          )}

          {/* Type Switcher Pill */}
          <div className="grid grid-cols-3 p-1 rounded-xl bg-muted/60 border border-border gap-1">
            <Button
              type="button"
              variant={type === "EXPENSE" ? "destructive" : "ghost"}
              size="sm"
              onClick={() => {
                setType("EXPENSE");
                setCategoryId(categories.filter((c) => c.type === "EXPENSE")[0]?.id || null);
                setSubcategoryId(null);
              }}
              className={cn(
                "h-8 text-xs font-semibold gap-1.5",
                type === "EXPENSE" ? "bg-expense text-white shadow-xs hover:bg-expense/90" : "text-muted-foreground"
              )}
            >
              <ArrowUpRight className="size-3.5" />
              Expense
            </Button>

            <Button
              type="button"
              variant={type === "INCOME" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setType("INCOME");
                setCategoryId(categories.filter((c) => c.type === "INCOME")[0]?.id || null);
                setSubcategoryId(null);
              }}
              className={cn(
                "h-8 text-xs font-semibold gap-1.5",
                type === "INCOME" ? "bg-income text-white shadow-xs hover:bg-income/90" : "text-muted-foreground"
              )}
            >
              <ArrowDownLeft className="size-3.5" />
              Income
            </Button>

            <Button
              type="button"
              variant={type === "TRANSFER" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setType("TRANSFER");
                setCategoryId(null);
                setSubcategoryId(null);
                if (!toAccountId || toAccountId === accountId) {
                  const alt = accounts.find((a) => a.id !== accountId);
                  if (alt) setToAccountId(alt.id);
                }
              }}
              className={cn(
                "h-8 text-xs font-semibold gap-1.5",
                type !== "TRANSFER" && "text-muted-foreground"
              )}
            >
              <ArrowLeftRight className="size-3.5" />
              Transfer
            </Button>
          </div>

          <div className="flex flex-col gap-3 py-1">
            {/* 1. Date & Time Input with Recurrence */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Date & Time</Label>
                {!editTransaction && (
                  <RecurrencePopover value={recurrence} onChange={setRecurrence} />
                )}
              </div>
              <div
                className="relative cursor-pointer"
                onClick={() => {
                  try {
                    datePickerActiveRef.current = true;
                    dateInputRef.current?.showPicker?.();
                  } catch {}
                }}
              >
                <Input
                  ref={dateInputRef}
                  type="datetime-local"
                  value={dateStr}
                  onChange={(e) => {
                    setDateStr(e.target.value);
                    datePickerActiveRef.current = false;
                    setTimeout(() => {
                      setNumpadOpen(true);
                    }, 150);
                  }}
                  onClick={(e) => {
                    try {
                      datePickerActiveRef.current = true;
                      e.currentTarget.showPicker?.();
                    } catch {}
                  }}
                  onBlur={() => {
                    if (datePickerActiveRef.current) {
                      datePickerActiveRef.current = false;
                      setTimeout(() => {
                        setNumpadOpen(true);
                      }, 150);
                    }
                  }}
                  className="h-10 text-xs cursor-pointer"
                />
              </div>
            </div>

            {/* 2. Amount & Numpad Trigger */}
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Amount</Label>
              <button
                type="button"
                onClick={() => setNumpadOpen(true)}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-border bg-background hover:bg-muted/30 transition-colors text-left"
              >
                <span className="text-xs text-muted-foreground">Amount (tap to edit)</span>
                <span
                  className={cn(
                    "text-xl font-bold tabular-nums",
                    type === "EXPENSE" && "text-expense",
                    type === "INCOME" && "text-income",
                    type === "TRANSFER" && "text-foreground"
                  )}
                >
                  ₹{parseFloat(amount || "0").toFixed(2)}
                </span>
              </button>
            </div>

            {/* 3. Category Selector (for Income & Expense) */}
            {type !== "TRANSFER" && (
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Category</Label>
                <button
                  type="button"
                  onClick={() => setCategoryOpen(true)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-border bg-background hover:bg-muted/30 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{selectedCategory?.emoji || "📁"}</span>
                    <span className="text-xs font-medium text-foreground">
                      {selectedCategory?.name || "Select Category"}
                    </span>
                    {selectedSub && (
                      <span className="text-xs text-muted-foreground">
                        › {selectedSub.name}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground">Change</span>
                </button>
              </div>
            )}

            {/* 4. Account Selector (for Expense/Income, or Transfer Origin) */}
            <div className="flex flex-col gap-1">
              <Label className="text-xs">{type === "TRANSFER" ? "From Account" : "Account"}</Label>
              <button
                type="button"
                onClick={() => setSourceAccountOpen(true)}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-border bg-background hover:bg-muted/30 transition-colors text-left"
              >
                <span className="text-xs font-medium text-foreground">
                  {selectedAccount?.name || "Select Account"}
                </span>
                <span className="text-[11px] text-muted-foreground">Change</span>
              </button>
            </div>

            {/* Destination Account for Transfer */}
            {type === "TRANSFER" && (
              <>
                <div className="flex justify-center -my-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={handleSwapTransferAccounts}
                    className="size-7 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground"
                    title="Swap From and To accounts"
                  >
                    <ArrowLeftRight className="size-3.5 rotate-90" />
                  </Button>
                </div>

                <div className="flex flex-col gap-1">
                  <Label className="text-xs">To Account</Label>
                  <button
                    type="button"
                    onClick={() => setDestAccountOpen(true)}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-border bg-background hover:bg-muted/30 transition-colors text-left"
                  >
                    <span className="text-xs font-medium text-foreground">
                      {selectedToAccount?.name || "Select Destination Account"}
                    </span>
                    <span className="text-[11px] text-muted-foreground">Change</span>
                  </button>
                </div>

                {/* Transfer Fee */}
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Transfer Fee (Optional)</Label>
                  <button
                    type="button"
                    onClick={() => setFeeNumpadOpen(true)}
                    className="flex items-center justify-between px-3.5 py-2 rounded-xl border border-border bg-background hover:bg-muted/30 transition-colors text-left"
                  >
                    <span className="text-xs text-muted-foreground">Fee debited from origin</span>
                    <span className="text-xs font-semibold tabular-nums text-foreground">
                      {fee ? `₹${parseFloat(fee).toFixed(2)}` : "None (₹0.00)"}
                    </span>
                  </button>
                </div>
              </>
            )}

            {/* 5. Note Input */}
            <div className="flex flex-col gap-1">
              <Label htmlFor="tx-note" className="text-xs">
                Note / Payee
              </Label>
              <Input
                id="tx-note"
                ref={noteInputRef}
                placeholder="e.g. Swiggy lunch, Freelance retainer, Uber ride"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    descInputRef.current?.focus();
                  }
                }}
                className="h-10 text-xs"
              />
            </div>

            {/* 6. Description (Optional) */}
            <div className="flex flex-col gap-1">
              <Label htmlFor="tx-desc" className="text-xs">
                Description / Memo (Optional)
              </Label>
              <Input
                id="tx-desc"
                ref={descInputRef}
                placeholder="Additional memo or details"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSave(false);
                  }
                }}
                className="h-10 text-xs"
              />
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-border mt-1">
            <div className="flex items-center gap-1.5">
              {!editTransaction && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSaveBookmark}
                  title="Save as Bookmark template"
                  className="h-9 px-2.5"
                >
                  <Star className="size-4 text-amber-500" />
                </Button>
              )}

              {editTransaction && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="h-9 px-2.5"
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!editTransaction && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSave(true)}
                  disabled={isLoading}
                  className="h-9 text-xs"
                >
                  Save & Next
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                onClick={() => handleSave(false)}
                disabled={isLoading}
                className="h-9 text-xs"
              >
                {isLoading && <Loader2 className="animate-spin mr-1.5" data-icon="inline-start" />}
                {editTransaction ? "Update" : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Embedded Numpad Modal */}
      <Numpad
        open={numpadOpen}
        onOpenChange={setNumpadOpen}
        initialValue={amount}
        type={type}
        onDone={(val) => {
          setAmount(val);
          if (type !== "TRANSFER") {
            setTimeout(() => {
              setCategoryOpen(true);
            }, 100);
          }
        }}
      />

      {/* Fee Numpad Modal */}
      <Numpad
        open={feeNumpadOpen}
        onOpenChange={setFeeNumpadOpen}
        initialValue={fee || "0"}
        type="EXPENSE"
        onDone={(val) => setFee(val === "0.00" ? "" : val)}
      />

      {/* Embedded Category Selector Modal */}
      {type !== "TRANSFER" && (
        <CategorySelector
          open={categoryOpen}
          onOpenChange={setCategoryOpen}
          categories={categories}
          type={type as "INCOME" | "EXPENSE"}
          selectedCategoryId={categoryId}
          selectedSubcategoryId={subcategoryId}
          onSelect={(catId, subId) => {
            setCategoryId(catId);
            setSubcategoryId(subId);
            setTimeout(() => {
              setSourceAccountOpen(true);
            }, 120);
          }}
        />
      )}

      {/* Source Account Selector */}
      <AccountSelector
        open={sourceAccountOpen}
        onOpenChange={setSourceAccountOpen}
        accounts={accounts}
        selectedAccountId={accountId}
        disabledAccountId={type === "TRANSFER" ? toAccountId : undefined}
        title={type === "TRANSFER" ? "Select Source Account" : "Select Account"}
        onSelect={(acc) => {
          setAccountId(acc.id);
          if (type === "TRANSFER") {
            setTimeout(() => {
              setDestAccountOpen(true);
            }, 120);
          } else {
            setTimeout(() => {
              noteInputRef.current?.focus();
            }, 120);
          }
        }}
      />

      {/* Destination Account Selector for Transfers */}
      {type === "TRANSFER" && (
        <AccountSelector
          open={destAccountOpen}
          onOpenChange={setDestAccountOpen}
          accounts={accounts}
          selectedAccountId={toAccountId}
          disabledAccountId={accountId}
          title="Select Destination Account"
          onSelect={(acc) => {
            setToAccountId(acc.id);
            setTimeout(() => {
              noteInputRef.current?.focus();
            }, 120);
          }}
        />
      )}
    </>
  );
}
