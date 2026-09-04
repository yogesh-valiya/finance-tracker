"use client";

import * as React from "react";
import Link from "next/link";
import { RecurringRule, RecurringFrequency, RecurringTiming, TransactionType } from "@prisma/client";
import { RECURRING_FREQUENCY_LABELS } from "@/lib/services/recurring-engine";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import {
  ArrowLeft,
  Repeat,
  Plus,
  Play,
  Trash2,
  Edit2,
  Calendar,
  ArrowRight,
  Clock,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RuleWithDetails extends RecurringRule {
  account: { id: string; name: string };
  toAccount?: { id: string; name: string } | null;
  category?: { id: string; name: string; emoji: string } | null;
  subcategory?: { id: string; name: string } | null;
}

export default function RecurringPage() {
  const [rules, setRules] = React.useState<RuleWithDetails[]>([]);
  const [accounts, setAccounts] = React.useState<any[]>([]);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isTriggering, setIsTriggering] = React.useState(false);
  const [triggerStatus, setTriggerStatus] = React.useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingRule, setEditingRule] = React.useState<RuleWithDetails | null>(null);
  const [deleteRuleId, setDeleteRuleId] = React.useState<string | null>(null);

  // Form state
  const [type, setType] = React.useState<TransactionType>("EXPENSE");
  const [frequency, setFrequency] = React.useState<RecurringFrequency>("MONTHLY");
  const [timing, setTiming] = React.useState<RecurringTiming>("ON_DATE");
  const [advanceDays, setAdvanceDays] = React.useState(1);
  const [startDate, setStartDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = React.useState("");
  const [accountId, setAccountId] = React.useState("");
  const [toAccountId, setToAccountId] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [subcategoryId, setSubcategoryId] = React.useState("");
  const [note, setNote] = React.useState("");
  const [formError, setFormError] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const fetchRules = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const [resRules, resAccounts, resCategories] = await Promise.all([
        fetch("/api/recurring-rules"),
        fetch("/api/accounts"),
        fetch("/api/categories"),
      ]);

      if (resRules.ok) {
        const data = await resRules.json();
        setRules(data.all || []);
      }
      if (resAccounts.ok) {
        const data = await resAccounts.json();
        const flat = (data.grouped || []).flatMap((g: any) => g.accounts || []);
        setAccounts(flat);
      }
      if (resCategories.ok) {
        const data = await resCategories.json();
        setCategories(data.all || []);
      }
    } catch (err) {
      console.error("Failed to load recurring data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const openCreateDialog = () => {
    setEditingRule(null);
    setType("EXPENSE");
    setFrequency("MONTHLY");
    setTiming("ON_DATE");
    setAdvanceDays(1);
    setStartDate(new Date().toISOString().slice(0, 10));
    setAmount("");
    setAccountId(accounts[0]?.id || "");
    setToAccountId(accounts[1]?.id || "");
    setCategoryId(categories.find((c) => c.type === "EXPENSE")?.id || "");
    setSubcategoryId("");
    setNote("");
    setFormError("");
    setDialogOpen(true);
  };

  const openEditDialog = (rule: RuleWithDetails) => {
    setEditingRule(rule);
    setType(rule.type);
    setFrequency(rule.frequency);
    setTiming(rule.timing);
    setAdvanceDays(rule.advanceDays || 1);
    setStartDate(new Date(rule.nextExecutionDate).toISOString().slice(0, 10));
    setAmount(Number(rule.amount).toString());
    setAccountId(rule.accountId);
    setToAccountId(rule.toAccountId || "");
    setCategoryId(rule.categoryId || "");
    setSubcategoryId(rule.subcategoryId || "");
    setNote(rule.note || "");
    setFormError("");
    setDialogOpen(true);
  };

  const handleToggleActive = async (ruleId: string, current: boolean) => {
    try {
      const res = await fetch(`/api/recurring-rules/${ruleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });
      if (res.ok) {
        setRules((prev) =>
          prev.map((r) => (r.id === ruleId ? { ...r, isActive: !current } : r))
        );
      }
    } catch (err) {
      console.error("Failed to toggle rule:", err);
    }
  };

  const handleDeleteRule = async () => {
    if (!deleteRuleId) return;
    try {
      const res = await fetch(`/api/recurring-rules/${deleteRuleId}?hard=true`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRules((prev) => prev.filter((r) => r.id !== deleteRuleId));
      }
    } catch (err) {
      console.error("Failed to delete rule:", err);
    } finally {
      setDeleteRuleId(null);
    }
  };

  const handleRunDueRules = async () => {
    try {
      setIsTriggering(true);
      setTriggerStatus(null);
      const res = await fetch("/api/cron/recurring", { method: "POST" });
      if (res.ok) {
        const result = await res.json();
        setTriggerStatus(
          `Processed ${result.processedCount} rule(s)${
            result.errors?.length ? ` (${result.errors.length} error(s))` : ""
          }`
        );
        fetchRules();
      }
    } catch (err) {
      setTriggerStatus("Failed to execute due rules");
    } finally {
      setIsTriggering(false);
    }
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setFormError("Please enter a valid amount greater than 0");
      return;
    }
    if (!accountId) {
      setFormError("Please select a source account");
      return;
    }
    if (type === "TRANSFER") {
      if (!toAccountId) {
        setFormError("Please select a destination account");
        return;
      }
      if (toAccountId === accountId) {
        setFormError("Source and destination accounts must be different");
        return;
      }
    } else if (!categoryId) {
      setFormError("Please select a category");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        type,
        frequency,
        timing,
        advanceDays: timing === "IN_ADVANCE" ? advanceDays : 0,
        startDate: new Date(startDate).toISOString(),
        accountId,
        toAccountId: type === "TRANSFER" ? toAccountId : undefined,
        categoryId: type !== "TRANSFER" ? categoryId : undefined,
        subcategoryId: type !== "TRANSFER" ? subcategoryId || undefined : undefined,
        amount: num,
        note: note.trim() || undefined,
      };

      const url = editingRule ? `/api/recurring-rules/${editingRule.id}` : "/api/recurring-rules";
      const method = editingRule ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save rule");
      }

      setDialogOpen(false);
      fetchRules();
    } catch (err: any) {
      setFormError(err.message || "Failed to save recurring rule");
    } finally {
      setIsSubmitting(false);
    }
  };

  const frequencies = Object.keys(RECURRING_FREQUENCY_LABELS) as RecurringFrequency[];
  const expenseRules = rules.filter((r) => r.type === "EXPENSE");
  const transferRules = rules.filter((r) => r.type === "TRANSFER");
  const incomeRules = rules.filter((r) => r.type === "INCOME");

  const calcSubtotal = (list: RuleWithDetails[]) =>
    list
      .filter((r) => r.isActive)
      .reduce((acc, r) => acc + Number(r.amount), 0)
      .toFixed(2);

  const selectedCategoryObj = categories.find((c) => c.id === categoryId);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link href="/more" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Repeat className="size-5 text-primary" />
              Recurring Rules Hub
            </h1>
            <p className="text-xs text-muted-foreground">
              Automated transactions with 14 frequencies and advance scheduling
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunDueRules}
            disabled={isTriggering}
            className="text-xs gap-1.5 h-9"
          >
            {isTriggering ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Play className="size-3.5 text-primary fill-primary" />
            )}
            Run Due Rules
          </Button>

          <Button size="sm" onClick={openCreateDialog} className="text-xs gap-1.5 h-9">
            <Plus className="size-4" />
            Add Rule
          </Button>
        </div>
      </div>

      {triggerStatus && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium animate-in fade-in">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{triggerStatus}</span>
        </div>
      )}

      {/* Rules Sections */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="size-6 animate-spin mr-2" />
          <span>Loading recurring schedules...</span>
        </div>
      ) : rules.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
              <Repeat className="size-6" />
            </div>
            <h3 className="font-semibold text-base">No recurring rules configured</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
              Set up recurring expenses, salary deposits, or automated transfers that execute on your schedule.
            </p>
            <Button size="sm" onClick={openCreateDialog} className="gap-1.5 text-xs">
              <Plus className="size-4" />
              Create First Rule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Expenses Group */}
          {expenseRules.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-foreground">Expenses</h2>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {expenseRules.length}
                  </Badge>
                </div>
                <div className="text-xs font-semibold tabular-nums text-expense">
                  Subtotal: ₹{calcSubtotal(expenseRules)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {expenseRules.map((rule) => (
                  <RuleCard
                    key={rule.id}
                    rule={rule}
                    onToggle={handleToggleActive}
                    onEdit={openEditDialog}
                    onDelete={(id) => setDeleteRuleId(id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Transfers Group */}
          {transferRules.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-foreground">Transfers</h2>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {transferRules.length}
                  </Badge>
                </div>
                <div className="text-xs font-semibold tabular-nums text-foreground">
                  Subtotal: ₹{calcSubtotal(transferRules)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {transferRules.map((rule) => (
                  <RuleCard
                    key={rule.id}
                    rule={rule}
                    onToggle={handleToggleActive}
                    onEdit={openEditDialog}
                    onDelete={(id) => setDeleteRuleId(id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Income Group */}
          {incomeRules.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-foreground">Income</h2>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {incomeRules.length}
                  </Badge>
                </div>
                <div className="text-xs font-semibold tabular-nums text-income">
                  Subtotal: ₹{calcSubtotal(incomeRules)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {incomeRules.map((rule) => (
                  <RuleCard
                    key={rule.id}
                    rule={rule}
                    onToggle={handleToggleActive}
                    onEdit={openEditDialog}
                    onDelete={(id) => setDeleteRuleId(id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Rule Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {editingRule ? "Edit Recurring Rule" : "New Recurring Schedule"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Automate repeated bookkeeping entries with deterministic scheduling.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveRule} className="space-y-4 pt-2">
            {formError && (
              <div className="p-2.5 rounded-md bg-destructive/10 text-destructive text-xs">
                {formError}
              </div>
            )}

            {/* Type selector */}
            {!editingRule && (
              <div className="grid grid-cols-3 gap-1.5 bg-muted/60 p-1 rounded-xl">
                {(["EXPENSE", "INCOME", "TRANSFER"] as const).map((t) => (
                  <Button
                    key={t}
                    type="button"
                    variant={type === t ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setType(t);
                      const filtered = categories.filter((c) => c.type === t);
                      if (filtered.length > 0) setCategoryId(filtered[0].id);
                    }}
                    className={cn(
                      "h-8 text-xs font-semibold",
                      type !== t && "text-muted-foreground"
                    )}
                  >
                    {t === "EXPENSE" ? "Expense" : t === "INCOME" ? "Income" : "Transfer"}
                  </Button>
                ))}
              </div>
            )}

            {/* Amount */}
            <div className="space-y-1.5">
              <Label className="text-xs">Amount (₹)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-10 text-sm font-semibold tabular-nums"
                required
              />
            </div>

            {/* Frequency & Timing */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Frequency</Label>
                <Select
                  value={frequency}
                  onValueChange={(val) => setFrequency(val as RecurringFrequency)}
                >
                  <SelectTrigger className="w-full h-9 text-xs">
                    <SelectValue placeholder="Select Frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {frequencies.map((f) => (
                      <SelectItem key={f} value={f}>
                        {RECURRING_FREQUENCY_LABELS[f]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Next Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>
            </div>

            {/* Timing */}
            <div className="space-y-1.5">
              <Label className="text-xs">Execution Timing</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={timing === "ON_DATE" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTiming("ON_DATE")}
                  className="h-8 text-xs font-medium"
                >
                  On the date
                </Button>
                <Button
                  type="button"
                  variant={timing === "IN_ADVANCE" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTiming("IN_ADVANCE")}
                  className="h-8 text-xs font-medium"
                >
                  In advance (1–3 days)
                </Button>
              </div>
            </div>

            {timing === "IN_ADVANCE" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Advance Days</Label>
                <Input
                  type="number"
                  min={1}
                  max={3}
                  value={advanceDays}
                  onChange={(e) =>
                    setAdvanceDays(Math.max(1, Math.min(3, parseInt(e.target.value || "1", 10))))
                  }
                  className="h-8 text-xs"
                />
              </div>
            )}

            {/* Source Account */}
            <div className="space-y-1.5">
              <Label className="text-xs">
                {type === "TRANSFER" ? "Source Account (From)" : "Account"}
              </Label>
              <Select value={accountId} onValueChange={(val) => val && setAccountId(val)}>
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue placeholder="Select Account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Destination Account (Transfers) */}
            {type === "TRANSFER" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Destination Account (To)</Label>
                <Select value={toAccountId} onValueChange={(val) => val && setToAccountId(val)}>
                  <SelectTrigger className="w-full h-9 text-xs">
                    <SelectValue placeholder="Select Destination Account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts
                      .filter((a) => a.id !== accountId)
                      .map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Category & Subcategory */}
            {type !== "TRANSFER" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Category</Label>
                  <Select
                    value={categoryId}
                    onValueChange={(val) => {
                      if (val) {
                        setCategoryId(val);
                        setSubcategoryId("");
                      }
                    }}
                  >
                    <SelectTrigger className="w-full h-9 text-xs">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        .filter((c) => c.type === type)
                        .map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.emoji} {cat.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Subcategory</Label>
                  <Select
                    value={subcategoryId || "none"}
                    onValueChange={(val) => setSubcategoryId(!val || val === "none" ? "" : val)}
                    disabled={!selectedCategoryObj?.subcategories?.length}
                  >
                    <SelectTrigger className="w-full h-9 text-xs">
                      <SelectValue placeholder="(None)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">(None)</SelectItem>
                      {selectedCategoryObj?.subcategories?.map((sub: any) => (
                        <SelectItem key={sub.id} value={sub.id}>
                          {sub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Note */}
            <div className="space-y-1.5">
              <Label className="text-xs">Note / Title</Label>
              <Input
                type="text"
                placeholder="e.g. Netflix, Rent, Monthly SIP"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="h-8 text-xs gap-1.5">
                {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
                {editingRule ? "Update Rule" : "Create Schedule"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Rule Confirmation */}
      <AlertDialog open={!!deleteRuleId} onOpenChange={(open) => !open && setDeleteRuleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Delete Recurring Schedule?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              This will remove future automated transactions for this rule. Past transactions created by this rule will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRule}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RuleCard({
  rule,
  onToggle,
  onEdit,
  onDelete,
}: {
  rule: RuleWithDetails;
  onToggle: (id: string, current: boolean) => void;
  onEdit: (rule: RuleWithDetails) => void;
  onDelete: (id: string) => void;
}) {
  const nextDateFormatted = new Date(rule.nextExecutionDate).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card className={cn("border-border transition-colors", !rule.isActive && "opacity-60 bg-muted/20")}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] font-medium">
            {RECURRING_FREQUENCY_LABELS[rule.frequency]}
          </Badge>
          {rule.timing === "IN_ADVANCE" && (
            <Badge variant="secondary" className="text-[10px] font-normal">
              {rule.advanceDays}d advance
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={rule.isActive}
            onCheckedChange={() => onToggle(rule.id, rule.isActive)}
            aria-label="Toggle active status"
          />
        </div>
      </CardHeader>

      <CardContent className="pt-1 pb-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {rule.category && <span className="text-base">{rule.category.emoji}</span>}
            <div>
              <div className="text-sm font-semibold text-foreground">
                {rule.note || rule.category?.name || "Recurring Transfer"}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {rule.type === "TRANSFER" ? (
                  <span className="flex items-center gap-1">
                    {rule.account.name} <ArrowRight className="size-3" /> {rule.toAccount?.name}
                  </span>
                ) : (
                  <span>
                    {rule.account.name}
                    {rule.subcategory ? ` • ${rule.subcategory.name}` : ""}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div
            className={cn(
              "text-base font-bold tabular-nums",
              rule.type === "EXPENSE" && "text-expense",
              rule.type === "INCOME" && "text-income",
              rule.type === "TRANSFER" && "text-foreground"
            )}
          >
            ₹{Number(rule.amount).toFixed(2)}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="size-3 text-muted-foreground" />
            <span>Next: {nextDateFormatted}</span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-foreground"
              onClick={() => onEdit(rule)}
            >
              <Edit2 className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-destructive hover:text-destructive"
              onClick={() => onDelete(rule.id)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
