"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ACCOUNT_GROUPS_META } from "@/components/accounts/account-group-meta";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Save, Trash2, AlertCircle, Loader2 } from "lucide-react";
import { AccountGroup } from "@prisma/client";

export default function AccountInfoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [deleteError, setDeleteError] = React.useState("");

  // Account State
  const [group, setGroup] = React.useState<AccountGroup>("BANK_ACCOUNT");
  const [name, setName] = React.useState("");
  const [initialBalance, setInitialBalance] = React.useState("0");
  const [description, setDescription] = React.useState("");
  const [includeInTotals, setIncludeInTotals] = React.useState(true);
  const [isHidden, setIsHidden] = React.useState(false);

  // Group-specific
  const [settlementDay, setSettlementDay] = React.useState("1");
  const [paymentDay, setPaymentDay] = React.useState("15");

  const fetchDetail = React.useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError("");
      const res = await fetch(`/api/accounts/${id}`);
      if (!res.ok) {
        throw new Error("Failed to load account");
      }
      const data = await res.json();
      setGroup(data.group);
      setName(data.name || "");
      setInitialBalance(Number(data.initialBalance).toString());
      setDescription(data.description || "");
      setIncludeInTotals(data.includeInTotals);
      setIsHidden(data.isHidden);

      if (data.metadata) {
        if (data.metadata.settlementDay) {
          setSettlementDay(data.metadata.settlementDay.toString());
        }
        if (data.metadata.paymentDay) {
          setPaymentDay(data.metadata.paymentDay.toString());
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load account");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Account name is required");
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      const payload: Record<string, unknown> = {
        name: name.trim(),
        initialBalance: parseFloat(initialBalance) || 0,
        description: description.trim() || undefined,
        includeInTotals,
        isHidden,
      };

      if (group === "CREDIT_CARD") {
        payload.metadata = {
          settlementDay: parseInt(settlementDay, 10) || 1,
          paymentDay: parseInt(paymentDay, 10) || 15,
        };
      }

      const res = await fetch(`/api/accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update account");
      }

      router.push("/accounts");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save account");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    try {
      setIsDeleting(true);
      setDeleteError("");

      const res = await fetch(`/api/accounts/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error || "Cannot delete account with existing transactions (§8.5)."
        );
      }

      router.push("/accounts");
      router.refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading account settings...</p>
      </div>
    );
  }

  const meta = ACCOUNT_GROUPS_META[group];
  const Icon = meta.icon;

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Button
            render={<Link href="/accounts" />}
            variant="ghost"
            size="icon-sm"
            className="size-8"
          >
            <ArrowLeft className="size-4" />
          </Button>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Account Configuration
            </h1>
            <p className="text-xs text-muted-foreground">
              Configure parameters, billing cycles, and visibility
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-md bg-destructive/10 text-destructive font-medium">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {deleteError && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-md bg-destructive/10 text-destructive font-medium">
          <AlertCircle className="size-4 shrink-0" />
          <span>{deleteError}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Classification Group Card */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Classification Group</CardTitle>
            <CardDescription className="text-xs">
              Account classification determines balance mechanics and asset/liability status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
              <div className="p-2 rounded-md bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">{meta.label}</span>
                <span className="text-xs text-muted-foreground">{meta.description}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* General Fields */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">General Details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-name">Account Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isSaving}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-balance">Initial Balance (₹)</Label>
              <Input
                id="edit-balance"
                type="number"
                step="0.01"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                disabled={isSaving}
                required
              />
              {group === "LOAN" && (
                <span className="text-[11px] text-muted-foreground">
                  Loans are treated as liabilities with negative balances reducing Net Worth.
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-desc">Description (Optional)</Label>
              <Input
                id="edit-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Notes or purpose"
                disabled={isSaving}
              />
            </div>
          </CardContent>
        </Card>

        {/* Group-specific fields: Credit Card */}
        {group === "CREDIT_CARD" && (
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Credit Card Billing Cycle</CardTitle>
              <CardDescription className="text-xs">
                Used to compute Statement Balance Payable vs Total Outstanding Balance
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-settlement">Settlement Date</Label>
                <Input
                  id="edit-settlement"
                  type="number"
                  min="1"
                  max="28"
                  value={settlementDay}
                  onChange={(e) => setSettlementDay(e.target.value)}
                />
                <span className="text-[10px] text-muted-foreground">Day of month (1–28)</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-payment">Payment Due Date</Label>
                <Input
                  id="edit-payment"
                  type="number"
                  min="1"
                  max="28"
                  value={paymentDay}
                  onChange={(e) => setPaymentDay(e.target.value)}
                />
                <span className="text-[10px] text-muted-foreground">Day of month (1–28)</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Visibility & Aggregation Controls */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
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
                disabled={isSaving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-foreground">
                  Hide Account
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Conceal this account from default transaction logging lists
                </span>
              </div>
              <Switch
                checked={isHidden}
                onCheckedChange={setIsHidden}
                disabled={isSaving}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isSaving || isDeleting}
                >
                  <Trash2 className="size-4 mr-1.5" data-icon="inline-start" />
                  Delete Account
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {name || "this account"}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the account. If this account contains any transactions,
                  the operation will be blocked until transactions are reassigned or deleted (§8.5).
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting && <Loader2 className="animate-spin mr-1.5" data-icon="inline-start" />}
                  Confirm Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button type="submit" size="sm" disabled={isSaving || isDeleting}>
            {isSaving && <Loader2 className="animate-spin mr-1.5" data-icon="inline-start" />}
            <Save className="size-4 mr-1.5" data-icon="inline-start" />
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
