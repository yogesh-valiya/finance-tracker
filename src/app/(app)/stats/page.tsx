"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CategoryBreakdownItem } from "@/app/api/analytics/categories/route";
import { DonutChart, CATEGORY_COLORS } from "@/components/analytics/donut-chart";
import { TrendChart, TrendPoint } from "@/components/analytics/trend-chart";
import { TransactionFormDialog, EditableTransaction } from "@/components/transaction/transaction-form-dialog";
import { CategoryWithSubs } from "@/components/transaction/category-selector";
import { Account } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  PieChart as PieIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  ArrowUpDown,
  Filter,
  X,
  Loader2,
  Receipt,
  Layers,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const SORT_LABELS: Record<string, string> = {
  date_desc: "Newest First",
  date_asc: "Oldest First",
  amount_desc: "Price: High to Low",
  amount_asc: "Price: Low to High",
};

interface TransactionItem {
  id: string;
  type: "EXPENSE" | "INCOME" | "TRANSFER";
  amount: string;
  date: string;
  note?: string | null;
  description?: string | null;
  fee?: string | null;
  accountId: string;
  toAccountId?: string | null;
  categoryId?: string | null;
  subcategoryId?: string | null;
  account: { id: string; name: string; group: string };
  category?: { id: string; name: string; emoji: string; type: string } | null;
  subcategory?: { id: string; name: string } | null;
}

function StatsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read URL Params or Defaults
  const urlType = searchParams.get("type") === "INCOME" ? "INCOME" : "EXPENSE";
  const urlGranularity = (searchParams.get("granularity") as "monthly" | "annually" | "weekly" | "custom") || "monthly";
  const urlYear = parseInt(searchParams.get("year") || new Date().getFullYear().toString(), 10);
  const urlMonth = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString(), 10);
  const urlStartMonth = searchParams.get("startMonth") ? parseInt(searchParams.get("startMonth")!, 10) : null;
  const urlEndMonth = searchParams.get("endMonth") ? parseInt(searchParams.get("endMonth")!, 10) : null;
  const urlStartDate = searchParams.get("startDate") || null;
  const urlEndDate = searchParams.get("endDate") || null;
  const urlCategory = searchParams.get("category") || null;
  const urlSubcategory = searchParams.get("subcategory") || null;
  const urlSort = searchParams.get("sort") || "date_desc";

  // State
  const [type, setType] = React.useState<"EXPENSE" | "INCOME">(urlType);
  const [granularity, setGranularity] = React.useState<"monthly" | "annually" | "weekly" | "custom">(urlGranularity);
  const [year, setYear] = React.useState<number>(urlYear);
  const [month, setMonth] = React.useState<number>(urlMonth);
  const [startMonth, setStartMonth] = React.useState<number | null>(urlStartMonth);
  const [endMonth, setEndMonth] = React.useState<number | null>(urlEndMonth);
  const [startDate, setStartDate] = React.useState<string | null>(urlStartDate);
  const [endDate, setEndDate] = React.useState<string | null>(urlEndDate);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(urlCategory);
  const [selectedSubcategoryName, setSelectedSubcategoryName] = React.useState<string | null>(urlSubcategory);
  const [sort, setSort] = React.useState<string>(urlSort);

  // Multi-line and Trend data states
  const [showMultiLine, setShowMultiLine] = React.useState(false);
  const [trendPoints, setTrendPoints] = React.useState<TrendPoint[]>([]);
  const [subSeries, setSubSeries] = React.useState<string[]>([]);

  // Custom date picker popover states
  const [customDateOpen, setCustomDateOpen] = React.useState(false);
  const [tempStartDate, setTempStartDate] = React.useState(urlStartDate || "");
  const [tempEndDate, setTempEndDate] = React.useState(urlEndDate || "");

  // Accordion expanded categories
  const [expandedCats, setExpandedCats] = React.useState<Record<string, boolean>>(() => {
    if (urlCategory) return { [urlCategory]: true };
    return {};
  });

  // Data States
  const [categories, setCategories] = React.useState<CategoryBreakdownItem[]>([]);
  const [transactions, setTransactions] = React.useState<TransactionItem[]>([]);
  const [selectedCategoryMeta, setSelectedCategoryMeta] = React.useState<{ id: string; name: string; emoji: string } | null>(null);
  const [currentTotal, setCurrentTotal] = React.useState(0);
  const [priorTotal, setPriorTotal] = React.useState(0);
  const [percentageChange, setPercentageChange] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);

  // Prerequisites for TransactionFormDialog
  const [allAccounts, setAllAccounts] = React.useState<Account[]>([]);
  const [allCategories, setAllCategories] = React.useState<CategoryWithSubs[]>([]);
  const [editTx, setEditTx] = React.useState<EditableTransaction | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);

  // Load Accounts & Categories once for dialog editing
  React.useEffect(() => {
    async function loadPrerequisites() {
      try {
        const [accRes, catRes] = await Promise.all([fetch("/api/accounts"), fetch("/api/categories")]);
        if (accRes.ok) {
          const accData = await accRes.json();
          const flatAccs: Account[] = Object.values(accData.accountsByGroup || {}).flat() as Account[];
          setAllAccounts(flatAccs);
        }
        if (catRes.ok) {
          const catData = await catRes.json();
          setAllCategories(catData.all || []);
        }
      } catch (e) {
        console.error("Prerequisites error:", e);
      }
    }
    loadPrerequisites();
  }, []);

  // Synchronize state with URL parameters
  const updateUrl = React.useCallback(
    (newParams: {
      type?: "EXPENSE" | "INCOME";
      granularity?: "monthly" | "annually" | "weekly" | "custom";
      year?: number;
      month?: number;
      startMonth?: number | null;
      endMonth?: number | null;
      startDate?: string | null;
      endDate?: string | null;
      category?: string | null;
      subcategory?: string | null;
      sort?: string;
    }) => {
      const p = new URLSearchParams();
      const nextType = newParams.type ?? type;
      const nextGran = newParams.granularity ?? granularity;
      const nextYear = newParams.year ?? year;
      const nextMonth = newParams.month ?? month;
      const nextStartMonth = newParams.startMonth !== undefined ? newParams.startMonth : startMonth;
      const nextEndMonth = newParams.endMonth !== undefined ? newParams.endMonth : endMonth;
      const nextStartDate = newParams.startDate !== undefined ? newParams.startDate : startDate;
      const nextEndDate = newParams.endDate !== undefined ? newParams.endDate : endDate;
      const nextCat = newParams.category !== undefined ? newParams.category : selectedCategoryId;
      const nextSub = newParams.subcategory !== undefined ? newParams.subcategory : selectedSubcategoryName;
      const nextSort = newParams.sort ?? sort;

      p.set("type", nextType);
      p.set("granularity", nextGran);
      p.set("year", nextYear.toString());
      p.set("month", nextMonth.toString());

      if (nextStartDate && nextEndDate) {
        p.set("startDate", nextStartDate);
        p.set("endDate", nextEndDate);
      } else if (nextStartMonth && nextEndMonth) {
        p.set("startMonth", nextStartMonth.toString());
        p.set("endMonth", nextEndMonth.toString());
      }

      if (nextCat) p.set("category", nextCat);
      if (nextSub) p.set("subcategory", nextSub);
      if (nextSort && nextSort !== "date_desc") p.set("sort", nextSort);

      const newUrl = `/stats?${p.toString()}`;
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", newUrl);
      }
      router.replace(newUrl, { scroll: false });
    },
    [router, type, granularity, year, month, startMonth, endMonth, startDate, endDate, selectedCategoryId, selectedSubcategoryName, sort]
  );

  // Fetch Analytics Data
  const fetchData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const tzOffset = new Date().getTimezoneOffset();
      const p = new URLSearchParams({
        type,
        granularity,
        year: year.toString(),
        month: month.toString(),
        tzOffset: tzOffset.toString(),
        sort,
      });

      if (startDate && endDate) {
        p.set("startDate", startDate);
        p.set("endDate", endDate);
      } else if (startMonth && endMonth) {
        p.set("startMonth", startMonth.toString());
        p.set("endMonth", endMonth.toString());
      }

      if (selectedCategoryId) {
        p.set("categoryId", selectedCategoryId);
      }
      if (selectedSubcategoryName) {
        p.set("subcategoryName", selectedSubcategoryName);
      }

      const res = await fetch(`/api/analytics/categories?${p.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
        setTrendPoints(data.trend?.points || data.annualTrend || []);
        setSubSeries(data.trend?.subSeries || []);
        setTransactions(data.transactions || []);
        setCurrentTotal(data.currentTotal || 0);
        setPriorTotal(data.priorTotal || 0);
        setPercentageChange(data.percentageChange || 0);
        setSelectedCategoryMeta(data.selectedCategory || null);
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setIsLoading(false);
    }
  }, [type, granularity, year, month, startMonth, endMonth, startDate, endDate, selectedCategoryId, selectedSubcategoryName, sort]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Period Navigation
  function handlePrevPeriod() {
    if (granularity === "annually") {
      const nextY = year - 1;
      setYear(nextY);
      updateUrl({ year: nextY });
    } else {
      let nextM = month - 1;
      let nextY = year;
      if (nextM < 1) {
        nextM = 12;
        nextY -= 1;
      }
      setYear(nextY);
      setMonth(nextM);
      setStartMonth(null);
      setEndMonth(null);
      updateUrl({ year: nextY, month: nextM, startMonth: null, endMonth: null });
    }
  }

  function handleNextPeriod() {
    if (granularity === "annually") {
      const nextY = year + 1;
      setYear(nextY);
      updateUrl({ year: nextY });
    } else {
      let nextM = month + 1;
      let nextY = year;
      if (nextM > 12) {
        nextM = 1;
        nextY += 1;
      }
      setYear(nextY);
      setMonth(nextM);
      setStartMonth(null);
      setEndMonth(null);
      updateUrl({ year: nextY, month: nextM, startMonth: null, endMonth: null });
    }
  }

  // Range Selection Callback from TrendChart (drag or 2-click)
  function handleSelectRange(sMonth: number, eMonth: number) {
    const s = Math.min(sMonth, eMonth);
    const e = Math.max(sMonth, eMonth);
    setStartMonth(s);
    setEndMonth(e);
    updateUrl({ startMonth: s, endMonth: e });
  }

  // Month Click on TrendChart: Click 1 = start, Click 2 = complete range filter
  function handleSelectMonth(mIdx: number) {
    if (!startMonth || (startMonth && endMonth && startMonth !== endMonth)) {
      // First click: start new range at mIdx
      setStartMonth(mIdx);
      setEndMonth(mIdx);
      setMonth(mIdx);
      updateUrl({ month: mIdx, startMonth: mIdx, endMonth: mIdx });
    } else {
      // Second click: complete range from startMonth to mIdx
      const s = Math.min(startMonth, mIdx);
      const e = Math.max(startMonth, mIdx);
      setStartMonth(s);
      setEndMonth(e);
      updateUrl({ startMonth: s, endMonth: e });
    }
  }

  // Category Double-Click in Pie Chart adds category to filter
  function handleDoubleClickCategory(catId: string) {
    if (selectedCategoryId === catId) {
      // Double clicking already filtered category clears it
      setSelectedCategoryId(null);
      setSelectedSubcategoryName(null);
      updateUrl({ category: null, subcategory: null });
    } else {
      // Double clicking category locks/adds it into filter
      setSelectedCategoryId(catId);
      setSelectedSubcategoryName(null);
      setExpandedCats((prev) => ({ ...prev, [catId]: true }));
      updateUrl({ category: catId, subcategory: null });
    }
  }

  // Category Selection in Ranked List
  function handleSelectCategory(catId: string | null) {
    if (selectedCategoryId === catId) {
      // Toggle off
      setSelectedCategoryId(null);
      setSelectedSubcategoryName(null);
      updateUrl({ category: null, subcategory: null });
    } else {
      setSelectedCategoryId(catId);
      setSelectedSubcategoryName(null);
      if (catId) {
        setExpandedCats((prev) => ({ ...prev, [catId]: true }));
      }
      updateUrl({ category: catId, subcategory: null });
    }
  }

  // Accordion Toggle without clearing category
  function toggleCategoryAccordion(catId: string, e: React.MouseEvent) {
    e.stopPropagation();
    setExpandedCats((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  }

  // Subcategory Selection
  function handleSelectSubcategory(catId: string, subName: string | null, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    setSelectedCategoryId(catId);
    setSelectedSubcategoryName(subName);
    updateUrl({ category: catId, subcategory: subName });
  }

  // Reset all filters
  function handleResetFilters() {
    setSelectedCategoryId(null);
    setSelectedSubcategoryName(null);
    setStartMonth(null);
    setEndMonth(null);
    setStartDate(null);
    setEndDate(null);
    setTempStartDate("");
    setTempEndDate("");
    setGranularity("monthly");
    setSort("date_desc");
    updateUrl({
      category: null,
      subcategory: null,
      startMonth: null,
      endMonth: null,
      startDate: null,
      endDate: null,
      granularity: "monthly",
      sort: "date_desc",
    });
  }

  // Format currency helper
  const formatCurrency = (val: number) => {
    return `₹${val.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const periodLabel =
    startDate && endDate
      ? `${startDate} – ${endDate}`
      : startMonth && endMonth
      ? startMonth === endMonth
        ? `${MONTH_NAMES[startMonth - 1]} ${year}`
        : `${MONTH_NAMES[Math.min(startMonth, endMonth) - 1]} – ${MONTH_NAMES[Math.max(startMonth, endMonth) - 1]} ${year}`
      : granularity === "annually"
      ? year.toString()
      : granularity === "weekly"
      ? `Week of ${MONTH_NAMES[month - 1]} ${year}`
      : `${MONTH_NAMES[month - 1]} ${year}`;

  const hasActiveFilters = Boolean(
    selectedCategoryId || selectedSubcategoryName || (startMonth && endMonth) || (startDate && endDate) || sort !== "date_desc"
  );

  const activeCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <div className="flex flex-col gap-5 pb-16 md:pb-6">
      {/* 1. Header & Period Navigator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <PieIcon className="size-5 text-primary" />
            Spending & Income Analytics
          </h1>
          <p className="text-xs text-muted-foreground">
            Categorical distribution, proportional weights, and historical trends
          </p>
        </div>

        {/* Period Navigator */}
        <div className="flex items-center gap-2">
          {/* Granularity Picker */}
          <div className="flex p-0.5 rounded-lg bg-muted/60 border border-border text-xs gap-0.5">
            {(["monthly", "annually", "weekly"] as const).map((g) => (
              <Button
                key={g}
                type="button"
                variant={granularity === g && !startDate ? "default" : "ghost"}
                size="xs"
                onClick={() => {
                  setGranularity(g);
                  setStartMonth(null);
                  setEndMonth(null);
                  setStartDate(null);
                  setEndDate(null);
                  updateUrl({ granularity: g, startMonth: null, endMonth: null, startDate: null, endDate: null });
                }}
                className={cn(
                  "capitalize font-medium text-xs h-7 px-2.5",
                  (granularity !== g || Boolean(startDate)) && "text-muted-foreground"
                )}
              >
                {g}
              </Button>
            ))}
          </div>

          <div className="flex items-center bg-card border border-border rounded-lg shadow-2xs">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handlePrevPeriod}
              disabled={Boolean(startDate && endDate)}
              className="size-8"
              title="Previous period"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="px-3 text-xs font-semibold select-none min-w-[85px] text-center">
              {periodLabel}
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleNextPeriod}
              disabled={Boolean(startDate && endDate)}
              className="size-8"
              title="Next period"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          {/* Custom Date Range Popover */}
          <Popover open={customDateOpen} onOpenChange={setCustomDateOpen}>
            <PopoverTrigger
              type="button"
              className={cn(
                "h-8 gap-1.5 px-2.5 text-xs inline-flex items-center justify-center rounded-md border transition-colors shadow-2xs font-medium cursor-pointer",
                startDate && endDate
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 border-primary"
                  : "border-border bg-card text-foreground hover:bg-muted"
              )}
              title="Select Custom Date Range"
            >
              <Calendar className="size-3.5" />
              <span className="hidden sm:inline">Custom</span>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3 space-y-3" align="end">
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-foreground">Custom Date Range</h4>
                <p className="text-[11px] text-muted-foreground">Select start and end dates to filter all analytics.</p>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={tempStartDate}
                    onChange={(e) => setTempStartDate(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={tempEndDate}
                    onChange={(e) => setTempEndDate(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setTempStartDate("");
                    setTempEndDate("");
                    setStartDate(null);
                    setEndDate(null);
                    setGranularity("monthly");
                    setCustomDateOpen(false);
                    updateUrl({ startDate: null, endDate: null, granularity: "monthly" });
                  }}
                  className="text-xs h-7 text-muted-foreground hover:text-foreground"
                >
                  Clear
                </Button>
                <Button
                  variant="default"
                  size="xs"
                  disabled={!tempStartDate || !tempEndDate || tempStartDate > tempEndDate}
                  onClick={() => {
                    setStartDate(tempStartDate);
                    setEndDate(tempEndDate);
                    setGranularity("custom");
                    setStartMonth(null);
                    setEndMonth(null);
                    setCustomDateOpen(false);
                    updateUrl({
                      granularity: "custom",
                      startDate: tempStartDate,
                      endDate: tempEndDate,
                      startMonth: null,
                      endMonth: null,
                    });
                  }}
                  className="text-xs h-7 px-3"
                >
                  Apply Range
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* 2. Top Controls: Expense vs Income Toggle & Active Filter Tags */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Expenses vs Income Switcher */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-muted/40 border border-border max-w-xs select-none gap-1">
          <Button
            type="button"
            variant={type === "EXPENSE" ? "destructive" : "ghost"}
            size="sm"
            onClick={() => {
              setType("EXPENSE");
              setSelectedCategoryId(null);
              setSelectedSubcategoryName(null);
              updateUrl({ type: "EXPENSE", category: null, subcategory: null });
            }}
            className={cn(
              "h-8 text-xs font-semibold",
              type === "EXPENSE" ? "bg-expense text-white shadow-xs hover:bg-expense/90" : "text-muted-foreground"
            )}
          >
            Expenses
          </Button>
          <Button
            type="button"
            variant={type === "INCOME" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setType("INCOME");
              setSelectedCategoryId(null);
              setSelectedSubcategoryName(null);
              updateUrl({ type: "INCOME", category: null, subcategory: null });
            }}
            className={cn(
              "h-8 text-xs font-semibold",
              type === "INCOME" ? "bg-income text-white shadow-xs hover:bg-income/90" : "text-muted-foreground"
            )}
          >
            Income
          </Button>
        </div>

        {/* Active Filter Badges with Reset Option */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedCategoryId && activeCategory && (
            <Badge variant="secondary" className="text-xs gap-1.5 pl-2 pr-1 py-1">
              <span>{activeCategory.emoji}</span>
              <span>{activeCategory.name}</span>
              <button
                type="button"
                onClick={() => handleSelectCategory(null)}
                className="hover:bg-muted p-0.5 rounded-full"
                title="Remove category filter"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}

          {selectedSubcategoryName && (
            <Badge variant="secondary" className="text-xs gap-1.5 pl-2 pr-1 py-1">
              <span>›</span>
              <span>{selectedSubcategoryName}</span>
              <button
                type="button"
                onClick={() => handleSelectSubcategory(selectedCategoryId!, null)}
                className="hover:bg-muted p-0.5 rounded-full"
                title="Remove subcategory filter"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}

          {startDate && endDate && (
            <Badge variant="secondary" className="text-xs gap-1.5 pl-2 pr-1 py-1">
              <Calendar className="size-3" />
              <span>
                {startDate} – {endDate}
              </span>
              <button
                type="button"
                onClick={() => {
                  setStartDate(null);
                  setEndDate(null);
                  setTempStartDate("");
                  setTempEndDate("");
                  setGranularity("monthly");
                  updateUrl({ startDate: null, endDate: null, granularity: "monthly" });
                }}
                className="hover:bg-muted p-0.5 rounded-full"
                title="Remove custom date filter"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}

          {startMonth && endMonth && !startDate && (
            <Badge variant="secondary" className="text-xs gap-1.5 pl-2 pr-1 py-1">
              <span>📅</span>
              <span>
                {startMonth === endMonth
                  ? `${MONTH_NAMES[startMonth - 1]} ${year}`
                  : `${MONTH_NAMES[Math.min(startMonth, endMonth) - 1]} – ${MONTH_NAMES[Math.max(startMonth, endMonth) - 1]} ${year}`}
              </span>
              <button
                type="button"
                onClick={() => {
                  setStartMonth(null);
                  setEndMonth(null);
                  updateUrl({ startMonth: null, endMonth: null });
                }}
                className="hover:bg-muted p-0.5 rounded-full"
                title="Remove range filter"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}

          {sort !== "date_desc" && (
            <Badge variant="outline" className="text-xs gap-1.5 pl-2 pr-1 py-1">
              <ArrowUpDown className="size-3 text-muted-foreground" />
              <span>
                {sort === "amount_desc"
                  ? "Price: High to Low"
                  : sort === "amount_asc"
                  ? "Price: Low to High"
                  : "Oldest First"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSort("date_desc");
                  updateUrl({ sort: "date_desc" });
                }}
                className="hover:bg-muted p-0.5 rounded-full"
                title="Reset sort"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="xs"
              onClick={handleResetFilters}
              className="text-xs gap-1 text-muted-foreground hover:text-foreground h-7"
            >
              <RotateCcw className="size-3" />
              Reset filters
            </Button>
          )}
        </div>
      </div>

      {/* 3. Main Dashboard Grid (Charts & Accordion) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (5 cols): Distribution Breakdown & Trend Chart */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Distribution Breakdown & Donut Chart */}
          <Card className="border-border">
            <CardHeader className="pb-0 text-center">
              <CardDescription className="text-xs uppercase font-semibold tracking-wider">
                Distribution Breakdown
              </CardDescription>
              <CardTitle className="text-2xl font-bold tabular-nums">
                {formatCurrency(currentTotal)}
              </CardTitle>
              {priorTotal > 0 && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-1">
                  {percentageChange >= 0 ? (
                    <span className="flex items-center gap-0.5 text-expense font-semibold">
                      <TrendingUp className="size-3.5" />
                      +{percentageChange}%
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-income font-semibold">
                      <TrendingDown className="size-3.5" />
                      {percentageChange}%
                    </span>
                  )}
                  <span>vs prior period ({formatCurrency(priorTotal)})</span>
                </div>
              )}
            </CardHeader>
            <CardContent className="pt-2">
              <DonutChart
                data={categories}
                total={currentTotal}
                type={type}
                selectedCategoryId={selectedCategoryId}
                onDoubleClickCategory={handleDoubleClickCategory}
              />
            </CardContent>
          </Card>

          {/* Granularity-Aware Trend Graph (with subcategory multi-line toggle) */}
          <Card className="border-border">
            <CardHeader className="pb-1">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">
                    {granularity === "annually"
                      ? `12-Month Trend (${year})`
                      : granularity === "weekly"
                      ? `Weekly Trend (${periodLabel})`
                      : granularity === "custom"
                      ? `Trend (${startDate} – ${endDate})`
                      : `Monthly Daily Trend (${MONTH_NAMES[month - 1]} ${year})`}
                  </CardTitle>
                  <CardDescription className="text-xs font-medium text-foreground">
                    {activeCategory
                      ? `${activeCategory.emoji} ${activeCategory.name}${
                          selectedSubcategoryName ? ` › ${selectedSubcategoryName}` : ""
                        }`
                      : `All ${type === "EXPENSE" ? "Expenses" : "Income"}`}
                  </CardDescription>
                </div>

                <div className="flex items-center gap-1.5">
                  {selectedCategoryId && subSeries.length > 0 && (
                    <div className="flex p-0.5 rounded-lg bg-muted/60 border border-border text-[10px] gap-0.5">
                      <Button
                        type="button"
                        variant={!showMultiLine ? "default" : "ghost"}
                        size="xs"
                        onClick={() => setShowMultiLine(false)}
                        className="h-5 px-1.5 text-[10px] font-medium"
                      >
                        Total
                      </Button>
                      <Button
                        type="button"
                        variant={showMultiLine ? "default" : "ghost"}
                        size="xs"
                        onClick={() => setShowMultiLine(true)}
                        className="h-5 px-1.5 text-[10px] font-medium"
                      >
                        By Subcategory
                      </Button>
                    </div>
                  )}

                  <Badge
                    variant={type === "INCOME" ? "default" : "destructive"}
                    className={cn("text-[10px] px-1.5 py-0", type === "INCOME" && "bg-income text-white")}
                  >
                    {type}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <TrendChart
                data={trendPoints}
                granularity={granularity}
                color={type === "INCOME" ? "var(--income)" : "var(--expense)"}
                activeMonth={month}
                startMonth={startMonth}
                endMonth={endMonth}
                subSeries={subSeries}
                showMultiLine={showMultiLine}
                onSelectMonth={handleSelectMonth}
                onSelectRange={handleSelectRange}
                onClearRange={() => {
                  setStartMonth(null);
                  setEndMonth(null);
                  updateUrl({ startMonth: null, endMonth: null });
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column (7 cols): Ranked Categories Accordion */}
        <Card className="lg:col-span-7 border-border">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Ranked Categories</CardTitle>
                <CardDescription className="text-xs">
                  Click category to filter • Expand for subcategories
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs">
                {categories.length} Categories
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0 divide-y divide-border/60 max-h-[600px] overflow-y-auto">
            {categories.length === 0 ? (
              <div className="p-10 text-center text-xs text-muted-foreground">
                No {type.toLowerCase()} transactions found for this period.
              </div>
            ) : (
              categories.map((cat, index) => {
                const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
                const isSelected = selectedCategoryId === cat.id;
                const isExpanded = expandedCats[cat.id] ?? false;

                return (
                  <div key={cat.id} className="flex flex-col">
                    {/* Category Row */}
                    <div
                      onClick={() => handleSelectCategory(cat.id)}
                      className={cn(
                        "flex items-center justify-between p-3.5 transition-colors cursor-pointer select-none",
                        isSelected ? "bg-primary/10 font-semibold" : "hover:bg-muted/30"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-3">
                        <div
                          className="size-3 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-base shrink-0">{cat.emoji}</span>
                        <div className="flex flex-col min-w-0">
                          <span
                            className={cn(
                              "text-xs truncate transition-colors",
                              isSelected ? "font-bold text-primary" : "font-medium text-foreground"
                            )}
                          >
                            {cat.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {cat.count} {cat.count === 1 ? "transaction" : "transactions"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Progress Bar & % */}
                        <div className="hidden sm:flex flex-col items-end gap-1 w-20">
                          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${cat.percentage}%`,
                                backgroundColor: color,
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {cat.percentage}%
                          </span>
                        </div>

                        <span className="text-xs font-bold tabular-nums text-foreground">
                          {formatCurrency(cat.amount)}
                        </span>

                        {/* Accordion Expand Button */}
                        {cat.subcategories.length > 0 && (
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={(e) => toggleCategoryAccordion(cat.id, e)}
                            className={cn(
                              "h-7 px-2 text-[11px] gap-1 font-medium transition-all shrink-0",
                              isExpanded
                                ? "bg-muted text-foreground border-border"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                            )}
                            title={isExpanded ? "Collapse subcategories" : "Expand subcategories"}
                          >
                            <span className="hidden sm:inline">{cat.subcategories.length} subs</span>
                            <ChevronDown
                              className={cn(
                                "size-3.5 transition-transform duration-200",
                                isExpanded && "rotate-180"
                              )}
                            />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Subcategories Accordion Content (Theme-Aligned Tree Layout) */}
                    {isExpanded && (
                      <div className="ml-7 mr-3.5 my-1.5 pl-3.5 border-l-2 border-primary/25 flex flex-col gap-1">
                        {/* "All" Option for this category */}
                        <div
                          onClick={(e) => handleSelectSubcategory(cat.id, null, e)}
                          className={cn(
                            "flex items-center justify-between py-1.5 px-2.5 rounded-md text-xs cursor-pointer transition-colors",
                            isSelected && selectedSubcategoryName === null
                              ? "bg-primary/15 text-primary font-semibold"
                              : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <span className="truncate font-medium">All {cat.name}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="tabular-nums font-semibold text-foreground">
                              {formatCurrency(cat.amount)}
                            </span>
                            <span className="text-[10px] bg-muted/80 text-muted-foreground px-1.5 py-0.5 rounded font-medium">
                              100%
                            </span>
                          </div>
                        </div>

                        {/* Individual Subcategories */}
                        {cat.subcategories.map((sub) => {
                          const isSubSelected =
                            isSelected && selectedSubcategoryName === sub.name;

                          return (
                            <div
                              key={sub.id}
                              onClick={(e) => handleSelectSubcategory(cat.id, sub.name, e)}
                              className={cn(
                                "flex items-center justify-between py-1.5 px-2.5 rounded-md text-xs cursor-pointer transition-colors",
                                isSubSelected
                                  ? "bg-primary/15 text-primary font-semibold"
                                  : "hover:bg-muted/50 text-foreground/85"
                              )}
                            >
                              <div className="flex items-center gap-2 min-w-0 pr-2">
                                <span className="truncate">{sub.name}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  ({sub.count})
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="tabular-nums font-medium text-foreground">
                                  {formatCurrency(sub.amount)}
                                </span>
                                <span className="text-[10px] bg-muted/80 px-1.5 py-0.5 rounded text-muted-foreground font-medium">
                                  {sub.percentage}%
                                </span>
                              </div>
                            </div>
                          );
                        })}

                        {cat.subcategories.length === 0 && (
                          <div className="py-2 text-[11px] text-muted-foreground italic text-center">
                            No subcategories
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4. Itemized Transaction Records List (Screenshot 1 & 2) */}
      <Card className="border-border">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Receipt className="size-4 text-primary" />
                Transactions ({transactions.length})
              </CardTitle>
              <CardDescription className="text-xs">
                {selectedCategoryMeta
                  ? `Filtered by ${selectedCategoryMeta.emoji} ${selectedCategoryMeta.name}${
                      selectedSubcategoryName ? ` › ${selectedSubcategoryName}` : ""
                    }`
                  : `All ${type.toLowerCase()} transactions for ${periodLabel}`}
              </CardDescription>
            </div>

            {/* Sort Controls: shadcn Select dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">Sort by:</span>
              <Select
                value={sort}
                onValueChange={(val) => {
                  if (val) {
                    setSort(val);
                    updateUrl({ sort: val });
                  }
                }}
              >
                <SelectTrigger className="w-[165px] h-8 text-xs bg-background cursor-pointer">
                  <ArrowUpDown className="size-3.5 mr-1 text-muted-foreground shrink-0" />
                  <span className="flex-1 text-left truncate">
                    {SORT_LABELS[sort] || "Newest First"}
                  </span>
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="date_desc" className="text-xs">
                    Newest First
                  </SelectItem>
                  <SelectItem value="date_asc" className="text-xs">
                    Oldest First
                  </SelectItem>
                  <SelectItem value="amount_desc" className="text-xs">
                    Price: High to Low
                  </SelectItem>
                  <SelectItem value="amount_asc" className="text-xs">
                    Price: Low to High
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 divide-y divide-border/60 max-h-[500px] overflow-y-auto">
          {transactions.length === 0 ? (
            <div className="p-10 text-center text-xs text-muted-foreground">
              No transactions matching the active filters in this period.
            </div>
          ) : (
            transactions.map((tx) => {
              const isInc = tx.type === "INCOME";

              return (
                <div
                  key={tx.id}
                  onClick={() => {
                    setEditTx({
                      id: tx.id,
                      type: tx.type,
                      amount: Number(tx.amount),
                      date: tx.date,
                      accountId: tx.accountId,
                      toAccountId: tx.toAccountId || undefined,
                      categoryId: tx.categoryId || undefined,
                      subcategoryId: tx.subcategoryId || undefined,
                      fee: tx.fee ? Number(tx.fee) : undefined,
                      note: tx.note || undefined,
                      description: tx.description || undefined,
                    });
                    setFormOpen(true);
                  }}
                  className="flex items-center justify-between p-3.5 hover:bg-muted/30 transition-colors cursor-pointer group"
                  title="Click to edit transaction"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <div
                      className={cn(
                        "size-8 rounded-full flex items-center justify-center text-sm shrink-0",
                        isInc ? "bg-income/10 text-income" : "bg-expense/10 text-expense"
                      )}
                    >
                      {isInc ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {tx.note || (tx.subcategory ? tx.subcategory.name : tx.category?.name || "Transaction")}
                      </span>
                      <span className="text-[11px] text-muted-foreground truncate">
                        {new Date(tx.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        • {tx.account?.name || "Account"}
                        {tx.category && ` • ${tx.category.emoji} ${tx.category.name}`}
                        {tx.subcategory && ` › ${tx.subcategory.name}`}
                      </span>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "text-xs font-bold tabular-nums shrink-0",
                      isInc ? "text-income" : "text-expense"
                    )}
                  >
                    {isInc ? "+" : "-"}₹{Number(tx.amount).toFixed(2)}
                  </span>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* 5. Embedded TransactionFormDialog for Click-to-Edit */}
      <TransactionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        accounts={allAccounts}
        categories={allCategories}
        onSuccess={() => {
          fetchData();
        }}
        editTransaction={editTx}
      />
    </div>
  );
}

export default function StatsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Loading analytics...</p>
        </div>
      }
    >
      <StatsContent />
    </React.Suspense>
  );
}
