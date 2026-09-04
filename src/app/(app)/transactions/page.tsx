"use client";

import * as React from "react";
import { TransactionType, Account, Bookmark } from "@prisma/client";
import {
  DailyGroup,
  MonthlyTotals,
  CalendarDayTotal,
  MonthSummaryRow,
  TransactionWithDetails,
} from "@/lib/services/aggregation";
import { CategoryWithSubs } from "@/components/transaction/category-selector";
import { TransactionFormDialog, EditableTransaction } from "@/components/transaction/transaction-form-dialog";
import { SearchOverlay } from "@/components/transaction/search-overlay";
import { BookmarksPanel } from "@/components/transaction/bookmarks-panel";
import { FilterDialog, FilterState } from "@/components/transaction/filter-dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Star,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Calendar as CalendarIcon,
  FileSpreadsheet,
  Receipt,
  FileText,
  Loader2,
  Repeat,
  Clock,
  CalendarDays,
  ArrowRight,
} from "lucide-react";
import { UpcomingRecurringOccurrence, UpcomingRecurringSummary } from "@/lib/services/recurring-engine";
import { cn } from "@/lib/utils";

type FeedView = "daily" | "calendar" | "monthly" | "total" | "note";

export default function TransactionsPage() {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1-12

  const [activeView, setActiveView] = React.useState<FeedView>("daily");
  const [filters, setFilters] = React.useState<FilterState>({
    type: "ALL",
    accountId: "ALL",
    categoryId: "ALL",
  });

  // Data States
  const [summary, setSummary] = React.useState<MonthlyTotals>({ income: 0, expenses: 0, net: 0 });
  const [upcomingSummary, setUpcomingSummary] = React.useState<UpcomingRecurringSummary>({
    count: 0,
    projectedIncome: 0,
    projectedExpenses: 0,
    projectedNet: 0,
  });
  const [upcomingOccurrences, setUpcomingOccurrences] = React.useState<UpcomingRecurringOccurrence[]>([]);
  const [dailyGroups, setDailyGroups] = React.useState<DailyGroup[]>([]);
  const [calendarTotals, setCalendarTotals] = React.useState<Record<number, CalendarDayTotal>>({});
  const [annualBreakdown, setAnnualBreakdown] = React.useState<MonthSummaryRow[]>([]);
  const [noteTransactions, setNoteTransactions] = React.useState<TransactionWithDetails[]>([]);

  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [categories, setCategories] = React.useState<CategoryWithSubs[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Dialog States
  const [formOpen, setFormOpen] = React.useState(false);
  const [editTx, setEditTx] = React.useState<EditableTransaction | null>(null);
  const [formInitialDate, setFormInitialDate] = React.useState<string | null>(null);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [bookmarksOpen, setBookmarksOpen] = React.useState(false);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [recurringScheduleOpen, setRecurringScheduleOpen] = React.useState(false);
  const [postingRuleId, setPostingRuleId] = React.useState<string | null>(null);

  // Calendar Day Inspection Dialog
  const [inspectDay, setInspectDay] = React.useState<number | null>(null);

  // Load Accounts & Categories once
  const loadPrerequisites = React.useCallback(async () => {
    try {
      const [accRes, catRes] = await Promise.all([
        fetch("/api/accounts"),
        fetch("/api/categories"),
      ]);

      if (accRes.ok) {
        const accData = await accRes.json();
        // Flatten grouped accounts
        const allAccs: Account[] = Object.values(accData.accountsByGroup || {}).flat() as Account[];
        setAccounts(allAccs);
      }

      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.all || []);
      }
    } catch (err) {
      console.error("Prerequisites load failed:", err);
    }
  }, []);

  React.useEffect(() => {
    loadPrerequisites();
  }, [loadPrerequisites]);

  // Load Feed Data
  const fetchFeedData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        year: year.toString(),
        month: month.toString(),
        view: activeView,
      });

      if (filters.type !== "ALL") params.append("type", filters.type);
      if (filters.accountId !== "ALL") params.append("accountId", filters.accountId);
      if (filters.categoryId !== "ALL") params.append("categoryId", filters.categoryId);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary || { income: 0, expenses: 0, net: 0 });
        setUpcomingSummary(
          data.upcomingSummary || { count: 0, projectedIncome: 0, projectedExpenses: 0, projectedNet: 0 }
        );
        setUpcomingOccurrences(data.upcomingOccurrences || []);
        if (data.dailyGroups) setDailyGroups(data.dailyGroups);
        if (data.calendarTotals) setCalendarTotals(data.calendarTotals);
        if (data.annualBreakdown) setAnnualBreakdown(data.annualBreakdown);
        if (data.noteTransactions) setNoteTransactions(data.noteTransactions);
      }
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    } finally {
      setIsLoading(false);
    }
  }, [year, month, activeView, filters]);

  React.useEffect(() => {
    fetchFeedData();
  }, [fetchFeedData]);

  // Date Navigation
  function handlePrevMonth() {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function handleNextMonth() {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  const monthLabel = currentDate.toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });

  const formatCurrency = (val: number) => {
    const isNegative = val < 0;
    const formatted = Math.abs(val).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${isNegative ? "-" : ""}₹${formatted}`;
  };

  // Post an upcoming recurring occurrence ahead of time
  async function handlePostNow(occ: UpcomingRecurringOccurrence, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    try {
      setPostingRuleId(occ.id);
      const res = await fetch(`/api/recurring-rules/${occ.ruleId}/post-now`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetDate: occ.date }),
      });
      if (res.ok) {
        await fetchFeedData();
      }
    } catch (err) {
      console.error("Failed to post recurring transaction:", err);
    } finally {
      setPostingRuleId(null);
    }
  }

  // Bookmark Quick-Apply
  function handleSelectBookmark(bm: Bookmark) {
    setEditTx({
      id: "",
      type: bm.type,
      amount: bm.amount ? bm.amount.toString() : "0",
      date: new Date().toISOString(),
      accountId: bm.accountId || accounts[0]?.id || "",
      toAccountId: bm.toAccountId,
      categoryId: bm.categoryId,
      subcategoryId: bm.subcategoryId,
      fee: bm.fee ? bm.fee.toString() : null,
      note: bm.note,
      description: bm.description,
    });
    setFormOpen(true);
  }

  // Export CSV
  function handleExportCSV() {
    const allTxs = dailyGroups.flatMap((g) => g.transactions);
    if (allTxs.length === 0) {
      alert("No transactions to export for this period.");
      return;
    }

    const headers = ["Date", "Type", "Category", "Subcategory", "Account", "To Account", "Amount", "Fee", "Note", "Description"];
    const rows = allTxs.map((t) => [
      new Date(t.date).toISOString().slice(0, 10),
      t.type,
      t.category?.name || "",
      t.subcategory?.name || "",
      t.account.name,
      t.toAccount?.name || "",
      t.amount,
      t.fee || "",
      `"${(t.note || "").replace(/"/g, '""')}"`,
      `"${(t.description || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `transactions_${year}_${month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="flex flex-col gap-5 pb-16 md:pb-6">
      {/* Top Header & Period Navigator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          {/* Period Navigator Chevrons */}
          <div className="flex items-center bg-card border border-border rounded-lg shadow-2xs">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handlePrevMonth}
              className="size-8"
              title="Previous Month"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="px-3 text-xs font-semibold select-none min-w-[85px] text-center">
              {monthLabel}
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleNextMonth}
              className="size-8"
              title="Next Month"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setSearchOpen(true)}
            className="size-8.5"
            title="Search transactions"
          >
            <Search className="size-4" />
          </Button>

          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setBookmarksOpen(true)}
            className="size-8.5"
            title="Bookmark templates"
          >
            <Star className="size-4 text-amber-500" />
          </Button>

          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setFilterOpen(true)}
            className={cn(
              "size-8.5",
              (filters.type !== "ALL" || filters.accountId !== "ALL" || filters.categoryId !== "ALL") &&
                "border-primary text-primary"
            )}
            title="Filter feed"
          >
            <Filter className="size-4" />
          </Button>

          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setRecurringScheduleOpen(true)}
            className={cn(
              "size-8.5 relative",
              upcomingSummary.count > 0 &&
                "text-amber-600 dark:text-amber-400 border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/15"
            )}
            title="View upcoming recurring schedule"
          >
            <Repeat className="size-4" />
            {upcomingSummary.count > 0 && (
              <span className="absolute -top-1 -right-1 size-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center shadow-2xs">
                {upcomingSummary.count > 9 ? "9+" : upcomingSummary.count}
              </span>
            )}
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setEditTx(null);
              setFormInitialDate(null);
              setFormOpen(true);
            }}
            className="h-8.5 text-xs font-semibold gap-1.5"
          >
            <Plus className="size-4" />
            Record
          </Button>
        </div>
      </div>

      {/* Monthly Summary Strip (§5.1) */}
      <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-card border border-border">
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Income
          </span>
          <span className="text-base sm:text-lg font-bold text-income tabular-nums">
            {formatCurrency(summary.income)}
          </span>
        </div>

        <div className="flex flex-col border-x border-border/80 px-3">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Expenses
          </span>
          <span className="text-base sm:text-lg font-bold text-expense tabular-nums">
            {formatCurrency(summary.expenses)}
          </span>
        </div>

        <div className="flex flex-col text-right">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Net
          </span>
          <span
            className={cn(
              "text-base sm:text-lg font-bold tabular-nums",
              summary.net >= 0 ? "text-foreground" : "text-expense"
            )}
          >
            {formatCurrency(summary.net)}
          </span>
        </div>
      </div>

      {/* Monthly Projected Recurring Forecast Strip */}
      {upcomingSummary.count > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-7 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Repeat className="size-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground truncate">
                  {upcomingSummary.count} Upcoming Recurring Scheduled
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-4.5 bg-background/80 border-amber-500/30 text-amber-700 dark:text-amber-300 font-medium"
                >
                  {monthLabel}
                </Badge>
              </div>
              <span className="text-[11px] text-muted-foreground truncate">
                Est. Expenses: {formatCurrency(upcomingSummary.projectedExpenses)}
                {upcomingSummary.projectedIncome > 0 &&
                  ` • Est. Income: ${formatCurrency(upcomingSummary.projectedIncome)}`}
                {` • Projected Net: ${formatCurrency(summary.net + upcomingSummary.projectedNet)}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <Button
              variant="outline"
              size="xs"
              onClick={() => setRecurringScheduleOpen(true)}
              className="h-7 text-xs border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/15"
            >
              View Schedule
            </Button>
            <Link href="/more/recurring">
              <Button
                variant="ghost"
                size="xs"
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
              >
                Manage Rules →
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* View Switcher Tabs (Daily · Calendar · Monthly · Total · Note) */}
      <div className="grid grid-cols-5 p-1 rounded-xl bg-muted/40 border border-border text-center select-none gap-1">
        {(["daily", "calendar", "monthly", "total", "note"] as const).map((tab) => (
          <Button
            key={tab}
            type="button"
            variant={activeView === tab ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveView(tab)}
            className={cn(
              "h-8 text-xs font-semibold capitalize",
              activeView !== tab && "text-muted-foreground"
            )}
          >
            {tab}
          </Button>
        ))}
      </div>

      {/* Main View Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <Loader2 className="size-7 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Loading {activeView} view...</p>
        </div>
      ) : (
        <>
          {/* 1. DAILY VIEW */}
          {activeView === "daily" && (
            <div className="flex flex-col gap-4">
              {summary.income === 0 && summary.expenses === 0 && upcomingSummary.count > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-card border border-border text-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-amber-500 shrink-0" />
                    <span className="text-muted-foreground">
                      No posted transactions yet in <strong className="text-foreground">{monthLabel}</strong>.
                      Showing projected recurring records scheduled to execute below.
                    </span>
                  </div>
                  <Button
                    size="xs"
                    onClick={() => {
                      setEditTx(null);
                      setFormInitialDate(null);
                      setFormOpen(true);
                    }}
                    className="h-7 text-xs font-semibold gap-1 shrink-0 self-start sm:self-auto"
                  >
                    <Plus className="size-3" />
                    Record Transaction
                  </Button>
                </div>
              )}

              {dailyGroups.length === 0 ? (
                <Card className="border-dashed p-10 text-center">
                  <div className="flex flex-col items-center gap-2.5">
                    <Receipt className="size-9 stroke-1 text-muted-foreground" />
                    <h3 className="font-semibold text-sm text-foreground">No transactions recorded</h3>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      Tap the Record button to log your first transaction for this period.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-2 mt-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditTx(null);
                          setFormOpen(true);
                        }}
                        className="text-xs"
                      >
                        <Plus className="size-3.5 mr-1" data-icon="inline-start" />
                        Record Transaction
                      </Button>
                      <Link href="/more/recurring">
                        <Button variant="outline" size="sm" className="text-xs gap-1.5">
                          <Repeat className="size-3.5" />
                          Set Up Recurring Rules
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ) : (
                dailyGroups.map((group) => (
                  <div
                    key={group.dateStr}
                    className="border border-border rounded-xl bg-card overflow-hidden"
                  >
                    {/* Day Group Header */}
                    <div
                      onClick={() => {
                        setEditTx(null);
                        setFormInitialDate(group.dateStr);
                        setFormOpen(true);
                      }}
                      className="flex items-center justify-between px-3.5 py-2.5 bg-muted/30 border-b border-border text-xs cursor-pointer hover:bg-muted/60 transition-colors"
                      title="Click to add transaction for this date"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{group.dayNumber}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                          {group.dayOfWeek}
                        </Badge>
                        <span className="text-muted-foreground text-[11px]">
                          {group.dateFormatted}
                        </span>
                        {group.upcomingRecurring && group.upcomingRecurring.length > 0 && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-4 border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10 font-medium gap-1"
                          >
                            <Repeat className="size-2.5" />
                            {group.upcomingRecurring.length} scheduled
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3 tabular-nums font-semibold">
                        {group.incomeSum > 0 && (
                          <span className="text-income text-[11px]">
                            +{formatCurrency(group.incomeSum)}
                          </span>
                        )}
                        {group.expenseSum > 0 && (
                          <span className="text-expense text-[11px]">
                            -{formatCurrency(group.expenseSum)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Transaction Items */}
                    <div className="divide-y divide-border/60">
                      {/* 1. Posted Transactions */}
                      {group.transactions.map((tx) => {
                        const isIncome = tx.type === "INCOME";
                        const isTransfer = tx.type === "TRANSFER";

                        return (
                          <div
                            key={tx.id}
                            onClick={() => {
                              setEditTx(tx);
                              setFormOpen(true);
                            }}
                            className="flex items-center justify-between p-3.5 hover:bg-muted/30 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-3 min-w-0 pr-2">
                              <div
                                className={cn(
                                  "size-8 rounded-full flex items-center justify-center text-sm shrink-0",
                                  isIncome && "bg-income/10 text-income",
                                  tx.type === "EXPENSE" && "bg-expense/10 text-expense",
                                  isTransfer && "bg-muted text-foreground"
                                )}
                              >
                                {isIncome && <ArrowDownLeft className="size-4" />}
                                {tx.type === "EXPENSE" && <ArrowUpRight className="size-4" />}
                                {isTransfer && <ArrowLeftRight className="size-4" />}
                              </div>

                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="text-xs font-semibold text-foreground truncate">
                                    {tx.note ||
                                      (tx.subcategory
                                        ? tx.subcategory.name
                                        : tx.category?.name || "Transaction")}
                                  </span>
                                </div>
                                <span className="text-[11px] text-muted-foreground truncate">
                                  {tx.account?.name || "Account"}
                                  {tx.toAccount && ` → ${tx.toAccount.name}`}
                                  {tx.category && ` • ${tx.category.emoji} ${tx.category.name}`}
                                  {tx.subcategory && ` › ${tx.subcategory.name}`}
                                </span>
                              </div>
                            </div>

                            <span
                              className={cn(
                                "text-xs font-bold tabular-nums shrink-0",
                                isIncome && "text-income",
                                tx.type === "EXPENSE" && "text-expense",
                                isTransfer && "text-foreground"
                              )}
                            >
                              {isIncome ? "+" : tx.type === "EXPENSE" ? "-" : ""}
                              {formatCurrency(Number(tx.amount))}
                            </span>
                          </div>
                        );
                      })}

                      {/* 2. Upcoming Scheduled Recurring Items */}
                      {group.upcomingRecurring &&
                        group.upcomingRecurring.map((occ) => {
                          const isIncome = occ.type === "INCOME";
                          const isTransfer = occ.type === "TRANSFER";

                          return (
                            <div
                              key={occ.id}
                              onClick={() => {
                                setEditTx({
                                  id: "",
                                  type: occ.type,
                                  amount: occ.amount,
                                  date: occ.date,
                                  accountId: occ.accountId,
                                  toAccountId: occ.toAccountId || undefined,
                                  categoryId: occ.categoryId || undefined,
                                  subcategoryId: occ.subcategoryId || undefined,
                                  fee: occ.fee || undefined,
                                  note: occ.note || undefined,
                                  description: occ.description || undefined,
                                });
                                setFormInitialDate(occ.dateStr);
                                setFormOpen(true);
                              }}
                              className="flex items-center justify-between p-3.5 bg-amber-500/[0.04] dark:bg-amber-500/[0.07] border-l-2 border-l-amber-500 hover:bg-amber-500/[0.09] transition-colors cursor-pointer"
                              title="Scheduled recurring transaction • Click to edit or record early"
                            >
                              <div className="flex items-center gap-3 min-w-0 pr-2">
                                <div className="size-8 rounded-full flex items-center justify-center text-sm shrink-0 bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                  <Repeat className="size-4" />
                                </div>

                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className="text-xs font-semibold text-foreground truncate">
                                      {occ.note ||
                                        (occ.subcategory
                                          ? occ.subcategory.name
                                          : occ.category?.name || "Recurring Record")}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] px-1 py-0 h-4 border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10 font-medium"
                                    >
                                      Upcoming
                                    </Badge>
                                  </div>

                                  <span className="text-[11px] text-muted-foreground truncate">
                                    {occ.account.name}
                                    {occ.toAccount && ` → ${occ.toAccount.name}`}
                                    {occ.category && ` • ${occ.category.emoji} ${occ.category.name}`}
                                    {occ.subcategory && ` › ${occ.subcategory.name}`}
                                    <span className="ml-1.5 text-amber-700 dark:text-amber-300 font-medium">
                                      • {occ.frequencyLabel}
                                    </span>
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2.5 shrink-0">
                                <span
                                  className={cn(
                                    "text-xs font-bold tabular-nums",
                                    isIncome && "text-income",
                                    occ.type === "EXPENSE" && "text-expense",
                                    isTransfer && "text-foreground"
                                  )}
                                >
                                  {isIncome ? "+" : occ.type === "EXPENSE" ? "-" : ""}
                                  {formatCurrency(occ.amount)}
                                </span>

                                <Button
                                  size="xs"
                                  variant="outline"
                                  disabled={postingRuleId === occ.id}
                                  onClick={(e) => handlePostNow(occ, e)}
                                  className="h-6.5 text-[10px] px-2 text-amber-700 dark:text-amber-300 border-amber-500/35 hover:bg-amber-500/15"
                                  title="Post this scheduled transaction to the ledger now"
                                >
                                  {postingRuleId === occ.id ? (
                                    <Loader2 className="size-3 animate-spin" />
                                  ) : (
                                    "Post Now"
                                  )}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 2. CALENDAR VIEW */}
          {activeView === "calendar" && (
            <Card className="border-border">
              <CardContent className="p-3">
                {/* 7 Column Headers */}
                <div className="grid grid-cols-7 text-center pb-2 border-b border-border text-[11px] font-semibold text-muted-foreground">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>

                {/* Calendar Days */}
                {(() => {
                  const daysInMonth = new Date(year, month, 0).getDate();
                  const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0 = Sun
                  const cells = [];

                  // Empty prefix cells
                  for (let i = 0; i < firstDayOfWeek; i++) {
                    cells.push(
                      <div key={`empty-${i}`} className="min-h-[64px] p-1 border-b border-border/40" />
                    );
                  }

                  // Day cells
                  for (let day = 1; day <= daysInMonth; day++) {
                    const dayData = calendarTotals[day];
                    const isToday =
                      new Date().getDate() === day &&
                      new Date().getMonth() + 1 === month &&
                      new Date().getFullYear() === year;

                    cells.push(
                      <button
                        key={`day-${day}`}
                        type="button"
                        onClick={() => setInspectDay(day)}
                        className={cn(
                          "min-h-[64px] p-1.5 border-b border-r border-border/40 text-left hover:bg-muted/40 transition-colors flex flex-col justify-between",
                          isToday && "bg-primary/5 font-semibold"
                        )}
                      >
                        <span
                          className={cn(
                            "text-xs font-medium size-5 flex items-center justify-center rounded-full",
                            isToday && "bg-primary text-primary-foreground font-bold"
                          )}
                        >
                          {day}
                        </span>

                        {dayData && (
                          <div className="flex flex-col gap-0.5 text-[9px] tabular-nums font-medium text-right leading-tight">
                            {dayData.income > 0 && (
                              <span className="text-income">+{Math.round(dayData.income)}</span>
                            )}
                            {dayData.expense > 0 && (
                              <span className="text-expense">-{Math.round(dayData.expense)}</span>
                            )}
                            {dayData.projectedExpense && dayData.projectedExpense > 0 && (
                              <span className="text-amber-600 dark:text-amber-400 flex items-center justify-end gap-0.5 font-semibold">
                                <Repeat className="size-2" />
                                -{Math.round(dayData.projectedExpense)}
                              </span>
                            )}
                            {dayData.projectedIncome && dayData.projectedIncome > 0 && (
                              <span className="text-amber-600 dark:text-amber-400 flex items-center justify-end gap-0.5 font-semibold">
                                <Repeat className="size-2" />
                                +{Math.round(dayData.projectedIncome)}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  }

                  return <div className="grid grid-cols-7 border-l border-border/40">{cells}</div>;
                })()}
              </CardContent>
            </Card>
          )}

          {/* 3. MONTHLY VIEW */}
          {activeView === "monthly" && (
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Annual Statement ({year})</CardTitle>
                <CardDescription className="text-xs">
                  Full 12-month income, expenditure, and net savings breakdown
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/20 text-muted-foreground font-semibold">
                        <th className="p-3 text-left">Month</th>
                        <th className="p-3 text-right">Income</th>
                        <th className="p-3 text-right">Expense</th>
                        <th className="p-3 text-right">Net Savings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {annualBreakdown.map((row) => (
                        <tr
                          key={row.monthIndex}
                          onClick={() => {
                            setCurrentDate(new Date(year, row.monthIndex, 1));
                            setActiveView("daily");
                          }}
                          className="hover:bg-muted/30 cursor-pointer transition-colors"
                        >
                          <td className="p-3 font-semibold text-foreground">{row.monthName}</td>
                          <td className="p-3 text-right text-income tabular-nums">
                            {formatCurrency(row.income)}
                          </td>
                          <td className="p-3 text-right text-expense tabular-nums">
                            {formatCurrency(row.expense)}
                          </td>
                          <td
                            className={cn(
                              "p-3 text-right font-bold tabular-nums",
                              row.net >= 0 ? "text-foreground" : "text-expense"
                            )}
                          >
                            {formatCurrency(row.net)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 4. TOTAL VIEW */}
          {activeView === "total" && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Spending by Method</CardTitle>
                    <CardDescription className="text-xs">
                      Liquid checking/cash vs credit facilities
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Cash & Liquid Accounts:</span>
                      <span className="font-semibold tabular-nums text-foreground">
                        {formatCurrency(
                          dailyGroups
                            .flatMap((g) => g.transactions)
                            .filter((t) => t.type === "EXPENSE" && t.account.group !== "CREDIT_CARD")
                            .reduce((sum, t) => sum + Number(t.amount), 0)
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Credit Cards & Debt:</span>
                      <span className="font-semibold tabular-nums text-liability">
                        {formatCurrency(
                          dailyGroups
                            .flatMap((g) => g.transactions)
                            .filter((t) => t.type === "EXPENSE" && t.account.group === "CREDIT_CARD")
                            .reduce((sum, t) => sum + Number(t.amount), 0)
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Export Transactions</CardTitle>
                    <CardDescription className="text-xs">
                      Download current period data for spreadsheet audits
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportCSV}
                      className="w-full text-xs"
                    >
                      <FileSpreadsheet className="size-4 mr-2 text-primary" />
                      Export CSV (.csv)
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* 5. NOTE VIEW */}
          {activeView === "note" && (
            <div className="flex flex-col gap-3">
              {noteTransactions.length === 0 ? (
                <Card className="border-dashed p-10 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="size-8 stroke-1 text-muted-foreground" />
                    <h3 className="font-semibold text-sm">No notes found</h3>
                    <p className="text-xs text-muted-foreground">
                      Transactions with attached memos or notes will appear in this journal feed.
                    </p>
                  </div>
                </Card>
              ) : (
                noteTransactions.map((tx) => (
                  <Card
                    key={tx.id}
                    onClick={() => {
                      setEditTx(tx);
                      setFormOpen(true);
                    }}
                    className="border-border hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <CardContent className="p-3.5 flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground">
                            {tx.note}
                          </span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {tx.category?.emoji} {tx.category?.name || tx.type}
                          </Badge>
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(tx.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          • {tx.account.name}
                        </span>
                      </div>

                      <span
                        className={cn(
                          "text-xs font-bold tabular-nums",
                          tx.type === "INCOME" ? "text-income" : "text-expense"
                        )}
                      >
                        {tx.type === "INCOME" ? "+" : "-"}₹{Number(tx.amount).toFixed(2)}
                      </span>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Transaction Add/Edit Dialog */}
      <TransactionFormDialog
        open={formOpen}
        onOpenChange={(isOpen) => {
          setFormOpen(isOpen);
          if (!isOpen) {
            setEditTx(null);
            setFormInitialDate(null);
          }
        }}
        accounts={accounts}
        categories={categories}
        onSuccess={fetchFeedData}
        editTransaction={editTx}
        initialDate={formInitialDate}
      />

      {/* Search Overlay */}
      <SearchOverlay
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSelectTransaction={(tx) => {
          setEditTx(tx);
          setFormOpen(true);
        }}
      />

      {/* Bookmarks Panel */}
      <BookmarksPanel
        open={bookmarksOpen}
        onOpenChange={setBookmarksOpen}
        onSelectBookmark={handleSelectBookmark}
      />

      {/* Filter Dialog */}
      <FilterDialog
        open={filterOpen}
        onOpenChange={setFilterOpen}
        accounts={accounts}
        categories={categories}
        filters={filters}
        onApply={(newFilters) => setFilters(newFilters)}
      />

      {/* Calendar Day Inspection Dialog */}
      {inspectDay !== null && (
        <Dialog open={true} onOpenChange={() => setInspectDay(null)}>
          <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">
                Day {inspectDay} Details — {monthLabel}
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-2 py-2">
              {dailyGroups
                .filter((g) => g.dayNumber === inspectDay)
                .flatMap((g) => g.transactions)
                .map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => {
                      setInspectDay(null);
                      setEditTx(tx);
                      setFormOpen(true);
                    }}
                    className="flex items-center justify-between p-3 rounded-xl border border-border bg-background hover:bg-muted/40 cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-foreground">
                        {tx.category ? `${tx.category.emoji} ${tx.category.name}` : tx.type}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{tx.note || tx.account.name}</span>
                    </div>

                    <span
                      className={cn(
                        "text-xs font-bold tabular-nums",
                        tx.type === "INCOME" ? "text-income" : "text-expense"
                      )}
                    >
                      {tx.type === "INCOME" ? "+" : "-"}₹{Number(tx.amount).toFixed(2)}
                    </span>
                  </div>
                ))}

              {/* Day Upcoming Recurring Occurrences */}
              {upcomingOccurrences
                .filter((occ) => occ.dayNumber === inspectDay)
                .map((occ) => (
                  <div
                    key={occ.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.04] text-xs"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground">
                          {occ.note || occ.category?.name || "Recurring Record"}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1 py-0 h-4 border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10 font-medium"
                        >
                          Upcoming ({occ.frequencyLabel})
                        </Badge>
                      </div>
                      <span className="text-[11px] text-muted-foreground">{occ.account.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold tabular-nums text-expense">
                        -₹{occ.amount.toFixed(2)}
                      </span>
                      <Button
                        size="xs"
                        variant="outline"
                        disabled={postingRuleId === occ.id}
                        onClick={(e) => handlePostNow(occ, e)}
                        className="h-6.5 text-[10px] px-2 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/15"
                      >
                        {postingRuleId === occ.id ? <Loader2 className="size-3 animate-spin" /> : "Post Now"}
                      </Button>
                    </div>
                  </div>
                ))}

              {dailyGroups.filter((g) => g.dayNumber === inspectDay).length === 0 &&
                upcomingOccurrences.filter((occ) => occ.dayNumber === inspectDay).length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    No transactions recorded on day {inspectDay}.
                  </p>
                )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Upcoming Recurring Schedule Dialog */}
      <Dialog open={recurringScheduleOpen} onOpenChange={setRecurringScheduleOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Repeat className="size-4 text-amber-600 dark:text-amber-400" />
              Upcoming Recurring Schedule — {monthLabel}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2">
            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-muted/40 border border-border text-center text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground block">Scheduled</span>
                <span className="font-bold tabular-nums text-foreground">{upcomingSummary.count}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Est. Expenses</span>
                <span className="font-bold tabular-nums text-expense">
                  {formatCurrency(upcomingSummary.projectedExpenses)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Est. Income</span>
                <span className="font-bold tabular-nums text-income">
                  {formatCurrency(upcomingSummary.projectedIncome)}
                </span>
              </div>
            </div>

            {upcomingOccurrences.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                No active recurring schedules for this period.
              </p>
            ) : (
              <div className="divide-y divide-border/60 border border-border rounded-lg overflow-hidden bg-background">
                {upcomingOccurrences.map((occ) => (
                  <div
                    key={occ.id}
                    className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="size-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-amber-500/15 text-amber-600 dark:text-amber-400">
                        {occ.dayNumber}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-xs font-semibold text-foreground truncate">
                            {occ.note || occ.category?.name || "Recurring Record"}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1 py-0 h-4 border-amber-500/30 text-amber-600 dark:text-amber-400"
                          >
                            {occ.frequencyLabel}
                          </Badge>
                        </div>
                        <span className="text-[11px] text-muted-foreground truncate">
                          {occ.dateFormatted} • {occ.account.name}
                          {occ.category && ` • ${occ.category.emoji} ${occ.category.name}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold tabular-nums text-expense">
                        -₹{occ.amount.toFixed(2)}
                      </span>
                      <Button
                        size="xs"
                        variant="outline"
                        disabled={postingRuleId === occ.id}
                        onClick={(e) => handlePostNow(occ, e)}
                        className="h-6.5 text-[10px] px-2 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/15"
                      >
                        {postingRuleId === occ.id ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          "Post Now"
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-1">
              <Link href="/more/recurring">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  Open Recurring Rules Hub →
                </Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
