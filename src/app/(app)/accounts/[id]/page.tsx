"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Account } from "@prisma/client";
import { ACCOUNT_GROUPS_META } from "@/components/accounts/account-group-meta";
import { AccountPerformanceChart } from "@/components/accounts/account-performance-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Settings2,
  Receipt,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  List,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LedgerTransaction {
  id: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: string;
  date: string;
  note: string | null;
  delta: number;
  isCredit: boolean;
  runningBalance: number;
  category?: { name: string; emoji: string } | null;
  subcategory?: { name: string } | null;
  account: { name: string };
  toAccount?: { name: string } | null;
}

interface StatementSummary {
  startingBalance: number;
  deposits: number;
  withdrawals: number;
  total: number;
  closingBalance: number;
}

export default function AccountLedgerPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [currentDate, setCurrentDate] = React.useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const [subTab, setSubTab] = React.useState<"daily" | "monthly" | "annually">("daily");
  const [viewMode, setViewMode] = React.useState<"statement" | "performance">("statement");

  const [account, setAccount] = React.useState<Account | null>(null);
  const [summary, setSummary] = React.useState<StatementSummary | null>(null);
  const [transactions, setTransactions] = React.useState<LedgerTransaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const fetchLedger = React.useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError("");
      const params = new URLSearchParams({
        period: subTab,
        year: year.toString(),
        month: month.toString(),
      });
      const res = await fetch(`/api/accounts/${id}/transactions?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Account not found");
      }
      const data = await res.json();
      setAccount(data.account);
      setSummary(data.summary);
      setTransactions(data.transactions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load account ledger");
    } finally {
      setIsLoading(false);
    }
  }, [id, subTab, year, month]);

  React.useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  function handlePrev() {
    setCurrentDate((prev) => {
      if (subTab === "annually") return new Date(prev.getFullYear() - 1, 0, 1);
      return new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
    });
  }

  function handleNext() {
    setCurrentDate((prev) => {
      if (subTab === "annually") return new Date(prev.getFullYear() + 1, 0, 1);
      return new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
    });
  }

  const periodLabel =
    subTab === "annually"
      ? year.toString()
      : currentDate.toLocaleDateString("en-IN", { month: "short", year: "numeric" });

  const formatCurrency = (val: number) => {
    const isNegative = val < 0;
    const formatted = Math.abs(val).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${isNegative ? "-" : ""}₹${formatted}`;
  };

  if (isLoading && !account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading account ledger...</p>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-center">
        <h2 className="text-lg font-semibold">Account not found</h2>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={() => router.push("/accounts")}>
          Back to Accounts
        </Button>
      </div>
    );
  }

  const meta = ACCOUNT_GROUPS_META[account.group];
  const Icon = meta.icon;

  return (
    <div className="flex flex-col gap-5 pb-16 md:pb-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon-sm"
            render={<Link href="/accounts" />}
            className="size-8"
          >
            <ArrowLeft className="size-4" />
          </Button>

          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Icon className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-foreground">
                  {account.name}
                </h1>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {meta.label}
                </Badge>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Statement & Performance Ledger (§8.2)
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls & Sub-tabs */}
        <div className="flex items-center gap-2">
          {/* Sub-tabs: Daily · Monthly · Annually */}
          <div className="flex p-0.5 rounded-lg bg-muted/60 border border-border text-xs gap-0.5">
            {(["daily", "monthly", "annually"] as const).map((tab) => (
              <Button
                key={tab}
                type="button"
                variant={subTab === tab ? "default" : "ghost"}
                size="xs"
                onClick={() => setSubTab(tab)}
                className={cn(
                  "capitalize font-medium text-xs h-7 px-2.5",
                  subTab !== tab && "text-muted-foreground"
                )}
              >
                {tab}
              </Button>
            ))}
          </div>

          {/* Period Navigator */}
          <div className="flex items-center bg-card border border-border rounded-lg shadow-2xs">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handlePrev}
              className="size-8"
              title="Previous period"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="px-2.5 text-xs font-semibold select-none min-w-[70px] text-center">
              {periodLabel}
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleNext}
              className="size-8"
              title="Next period"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          {/* Toggle View: Statement vs Performance */}
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setViewMode((v) => (v === "statement" ? "performance" : "statement"))}
            className="size-8"
            title={viewMode === "statement" ? "View performance charts" : "View statement feed"}
          >
            {viewMode === "statement" ? <BarChart3 className="size-4" /> : <List className="size-4" />}
          </Button>

          <Button
            variant="outline"
            size="icon-sm"
            render={<Link href={`/accounts/${id}/info`} />}
            className="size-8"
            title="Account settings"
          >
            <Settings2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* 4-Metric Statement Summary Card (§8.2) */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-card border border-border">
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Deposits
            </span>
            <span className="text-base font-bold text-income tabular-nums">
              +{formatCurrency(summary.deposits)}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Withdrawals
            </span>
            <span className="text-base font-bold text-expense tabular-nums">
              -{formatCurrency(summary.withdrawals)}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Total Flow
            </span>
            <span
              className={cn(
                "text-base font-bold tabular-nums",
                summary.total >= 0 ? "text-income" : "text-expense"
              )}
            >
              {formatCurrency(summary.total)}
            </span>
          </div>

          <div className="flex flex-col sm:text-right">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Closing Balance
            </span>
            <span
              className={cn(
                "text-base font-bold tabular-nums",
                summary.closingBalance >= 0 ? "text-primary font-extrabold" : "text-destructive font-extrabold"
              )}
            >
              {formatCurrency(summary.closingBalance)}
            </span>
          </div>
        </div>
      )}

      {/* Main Content: Statement vs Performance */}
      {viewMode === "performance" ? (
        <AccountPerformanceChart accountId={account.id} accountName={account.name} />
      ) : (
        <Card className="border-border">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Account Ledger</CardTitle>
                <CardDescription className="text-xs">
                  Itemized chronological statement with live running balance
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs">
                {transactions.length} Transactions
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0 divide-y divide-border/60">
            {transactions.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <Receipt className="size-8 stroke-1 text-muted-foreground/60" />
                <p className="font-semibold text-foreground">No transactions in this period</p>
                <p className="text-[11px]">
                  Starting balance: {formatCurrency(summary?.startingBalance || 0)}
                </p>
              </div>
            ) : (
              transactions.map((tx) => {
                const isIncome = tx.type === "INCOME";
                const isTransfer = tx.type === "TRANSFER";

                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3.5 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div
                        className={cn(
                          "size-8 rounded-full flex items-center justify-center text-sm shrink-0",
                          tx.isCredit ? "bg-income/10 text-income" : "bg-expense/10 text-expense"
                        )}
                      >
                        {isIncome && <ArrowDownLeft className="size-4" />}
                        {tx.type === "EXPENSE" && <ArrowUpRight className="size-4" />}
                        {isTransfer && <ArrowLeftRight className="size-4" />}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-xs font-semibold text-foreground truncate">
                            {tx.category ? `${tx.category.emoji} ${tx.category.name}` : "Transfer"}
                          </span>
                          {tx.subcategory && (
                            <span className="text-[10px] text-muted-foreground truncate">
                              › {tx.subcategory.name}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground truncate">
                          {tx.note ||
                            new Date(tx.date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                          {isTransfer && tx.toAccount && ` → ${tx.toAccount.name}`}
                        </span>
                      </div>
                    </div>

                    {/* Amount & Running Balance Tag */}
                    <div className="flex flex-col items-end gap-0.5 shrink-0 pl-2">
                      <span
                        className={cn(
                          "text-xs font-bold tabular-nums",
                          tx.isCredit ? "text-income" : "text-expense"
                        )}
                      >
                        {tx.isCredit ? "+" : "-"}₹{Math.abs(tx.delta).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.5 rounded">
                        Bal: {formatCurrency(tx.runningBalance)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
