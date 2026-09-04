"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CategoryBreakdownItem, AccountBreakdownItem } from "@/app/api/analytics/categories/route";
import { DonutChart, CATEGORY_COLORS } from "@/components/analytics/donut-chart";
import { TrendChart, TrendPoint } from "@/components/analytics/trend-chart";
import { TransactionFormDialog, EditableTransaction } from "@/components/transaction/transaction-form-dialog";
import { CategoryWithSubs } from "@/components/transaction/category-selector";
import { Account } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  X,
  Loader2,
  Receipt,
  Calendar,
  Wallet,
  CreditCard,
  Landmark,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const SORT_LABELS: Record<string, string> = {
  date_desc: "Newest First",
  date_asc: "Oldest First",
  amount_desc: "Price: High to Low",
  amount_asc: "Price: Low to High",
};

type RangePreset = "monthly" | "annually" | "weekly" | "biweekly" | "last2months" | "last3months" | "custom";

const RANGE_PRESET_LABELS: Record<RangePreset, string> = {
  monthly: "Monthly",
  annually: "Annually",
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  last2months: "Last 2 Mo.",
  last3months: "Last 3 Mo.",
  custom: "Custom",
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

function formatDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getAccountGroupIcon(group: string) {
  switch (group?.toUpperCase()) {
    case "BANK":
      return <Landmark className="size-3.5 text-blue-500 shrink-0" />;
    case "CREDIT_CARD":
      return <CreditCard className="size-3.5 text-purple-500 shrink-0" />;
    case "CASH":
      return <Wallet className="size-3.5 text-emerald-500 shrink-0" />;
    case "INVESTMENT":
      return <TrendingUp className="size-3.5 text-amber-500 shrink-0" />;
    default:
      return <Receipt className="size-3.5 text-muted-foreground shrink-0" />;
  }
}

function StatsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read URL Params or Defaults
  const urlType = searchParams.get("type") === "INCOME" ? "INCOME" : "EXPENSE";
  const urlRange = (searchParams.get("range") as RangePreset) ||
    (searchParams.get("startDate") && searchParams.get("endDate")
      ? "custom"
      : searchParams.get("granularity") === "annually"
      ? "annually"
      : searchParams.get("granularity") === "weekly"
      ? "weekly"
      : "monthly");

  const urlTrendGranularity = (searchParams.get("trendGranularity") as "daily" | "weekly" | "monthly") || "daily";
  const urlYear = parseInt(searchParams.get("year") || new Date().getFullYear().toString(), 10);
  const urlMonth = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString(), 10);
  const urlStartDate = searchParams.get("startDate") || null;
  const urlEndDate = searchParams.get("endDate") || null;

  const urlCategoryParam = searchParams.get("categoryIds") || searchParams.get("category");
  const urlCategories = urlCategoryParam ? urlCategoryParam.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const urlAccountParam = searchParams.get("accountIds") || searchParams.get("account");
  const urlAccounts = urlAccountParam ? urlAccountParam.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const urlSubParam = searchParams.get("subcategoryNames") || searchParams.get("subcategory");
  const urlSubcategories = urlSubParam ? urlSubParam.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const urlSort = searchParams.get("sort") || "date_desc";

  // State
  const [type, setType] = React.useState<"EXPENSE" | "INCOME">(urlType);
  const [rangePreset, setRangePreset] = React.useState<RangePreset>(urlRange);
  const [trendGranularity, setTrendGranularity] = React.useState<"daily" | "weekly" | "monthly">(urlTrendGranularity);
  const [year, setYear] = React.useState<number>(urlYear);
  const [month, setMonth] = React.useState<number>(urlMonth);
  const [weekAnchor, setWeekAnchor] = React.useState<Date>(() => new Date());
  const [startDate, setStartDate] = React.useState<string | null>(urlStartDate);
  const [endDate, setEndDate] = React.useState<string | null>(urlEndDate);
  const [selectedCategoryIds, setSelectedCategoryIds] = React.useState<string[]>(urlCategories);
  const [selectedAccountIds, setSelectedAccountIds] = React.useState<string[]>(urlAccounts);
  const [selectedSubcategoryNames, setSelectedSubcategoryNames] = React.useState<string[]>(urlSubcategories);
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
    const init: Record<string, boolean> = {};
    urlCategories.forEach((id) => {
      init[id] = true;
    });
    return init;
  });

  // Data States
  const [categories, setCategories] = React.useState<CategoryBreakdownItem[]>([]);
  const [accounts, setAccounts] = React.useState<AccountBreakdownItem[]>([]);
  const [transactions, setTransactions] = React.useState<TransactionItem[]>([]);
  const [currentTotal, setCurrentTotal] = React.useState(0);
  const [filteredTotal, setFilteredTotal] = React.useState(0);
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

  // Compute Active Dates & Period Label dynamically
  const periodInfo = React.useMemo(() => {
    if (rangePreset === "monthly") {
      return {
        label: `${MONTH_NAMES[month - 1]} ${year}`,
        granularityParam: "monthly",
        yearParam: year,
        monthParam: month,
        startDateParam: null,
        endDateParam: null,
        startMonthParam: null,
        endMonthParam: null,
      };
    } else if (rangePreset === "annually") {
      return {
        label: `${year}`,
        granularityParam: "annually",
        yearParam: year,
        monthParam: 1,
        startDateParam: null,
        endDateParam: null,
        startMonthParam: null,
        endMonthParam: null,
      };
    } else if (rangePreset === "weekly") {
      const endD = new Date(weekAnchor);
      const startD = new Date(weekAnchor);
      startD.setDate(startD.getDate() - 6);
      const sDay = startD.getDate();
      const sM = MONTH_NAMES[startD.getMonth()];
      const eDay = endD.getDate();
      const eM = MONTH_NAMES[endD.getMonth()];
      const y = endD.getFullYear();
      const label = sM === eM ? `${sDay} – ${eDay} ${eM} ${y}` : `${sDay} ${sM} – ${eDay} ${eM} ${y}`;
      return {
        label,
        granularityParam: "custom",
        yearParam: y,
        monthParam: endD.getMonth() + 1,
        startDateParam: formatDateISO(startD),
        endDateParam: formatDateISO(endD),
        startMonthParam: null,
        endMonthParam: null,
      };
    } else if (rangePreset === "biweekly") {
      const endD = new Date(weekAnchor);
      const startD = new Date(weekAnchor);
      startD.setDate(startD.getDate() - 13);
      const sDay = startD.getDate();
      const sM = MONTH_NAMES[startD.getMonth()];
      const eDay = endD.getDate();
      const eM = MONTH_NAMES[endD.getMonth()];
      const y = endD.getFullYear();
      const label = sM === eM ? `${sDay} – ${eDay} ${eM} ${y}` : `${sDay} ${sM} – ${eDay} ${eM} ${y}`;
      return {
        label,
        granularityParam: "custom",
        yearParam: y,
        monthParam: endD.getMonth() + 1,
        startDateParam: formatDateISO(startD),
        endDateParam: formatDateISO(endD),
        startMonthParam: null,
        endMonthParam: null,
      };
    } else if (rangePreset === "last2months") {
      const sM = month === 1 ? 12 : month - 1;
      const sY = month === 1 ? year - 1 : year;
      const label = sY === year ? `${MONTH_NAMES[sM - 1]} – ${MONTH_NAMES[month - 1]} ${year}` : `${MONTH_NAMES[sM - 1]} '${sY % 100} – ${MONTH_NAMES[month - 1]} '${year % 100}`;
      return {
        label,
        granularityParam: "custom",
        yearParam: year,
        monthParam: month,
        startDateParam: null,
        endDateParam: null,
        startMonthParam: sM,
        endMonthParam: month,
      };
    } else if (rangePreset === "last3months") {
      let sM = month - 2;
      let sY = year;
      if (sM < 1) {
        sM += 12;
        sY -= 1;
      }
      const label = sY === year ? `${MONTH_NAMES[sM - 1]} – ${MONTH_NAMES[month - 1]} ${year}` : `${MONTH_NAMES[sM - 1]} '${sY % 100} – ${MONTH_NAMES[month - 1]} '${year % 100}`;
      return {
        label,
        granularityParam: "custom",
        yearParam: year,
        monthParam: month,
        startDateParam: null,
        endDateParam: null,
        startMonthParam: sM,
        endMonthParam: month,
      };
    } else {
      // Custom Range
      const label = startDate && endDate ? `${startDate} – ${endDate}` : "Pick Dates";
      return {
        label,
        granularityParam: "custom",
        yearParam: year,
        monthParam: month,
        startDateParam: startDate,
        endDateParam: endDate,
        startMonthParam: null,
        endMonthParam: null,
      };
    }
  }, [rangePreset, year, month, weekAnchor, startDate, endDate]);

  // Synchronize state with URL parameters
  const updateUrl = React.useCallback(
    (newParams: {
      type?: "EXPENSE" | "INCOME";
      range?: RangePreset;
      trendGranularity?: "daily" | "weekly" | "monthly";
      year?: number;
      month?: number;
      startDate?: string | null;
      endDate?: string | null;
      categoryIds?: string[];
      accountIds?: string[];
      subcategories?: string[];
      sort?: string;
    }) => {
      const p = new URLSearchParams();
      const nextType = newParams.type ?? type;
      const nextRange = newParams.range ?? rangePreset;
      const nextTrendGran = newParams.trendGranularity ?? trendGranularity;
      const nextYear = newParams.year ?? year;
      const nextMonth = newParams.month ?? month;
      const nextStartDate = newParams.startDate !== undefined ? newParams.startDate : startDate;
      const nextEndDate = newParams.endDate !== undefined ? newParams.endDate : endDate;
      const nextCats = newParams.categoryIds ?? selectedCategoryIds;
      const nextAccs = newParams.accountIds ?? selectedAccountIds;
      const nextSubs = newParams.subcategories !== undefined ? newParams.subcategories : selectedSubcategoryNames;
      const nextSort = newParams.sort ?? sort;

      p.set("type", nextType);
      p.set("range", nextRange);
      p.set("trendGranularity", nextTrendGran);
      p.set("year", nextYear.toString());
      p.set("month", nextMonth.toString());

      if (nextStartDate && nextEndDate) {
        p.set("startDate", nextStartDate);
        p.set("endDate", nextEndDate);
      }

      if (nextCats.length > 0) p.set("categoryIds", nextCats.join(","));
      if (nextAccs.length > 0) p.set("accountIds", nextAccs.join(","));
      if (nextSubs.length > 0) p.set("subcategoryNames", nextSubs.join(","));
      if (nextSort && nextSort !== "date_desc") p.set("sort", nextSort);

      const newUrl = `/stats?${p.toString()}`;
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", newUrl);
      }
      router.replace(newUrl, { scroll: false });
    },
    [router, type, rangePreset, trendGranularity, year, month, startDate, endDate, selectedCategoryIds, selectedAccountIds, selectedSubcategoryNames, sort]
  );

  // Fetch Analytics Data
  const fetchData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const tzOffset = new Date().getTimezoneOffset();
      const p = new URLSearchParams({
        type,
        granularity: periodInfo.granularityParam,
        trendGranularity,
        year: periodInfo.yearParam.toString(),
        month: periodInfo.monthParam.toString(),
        tzOffset: tzOffset.toString(),
        sort,
      });

      if (periodInfo.startDateParam && periodInfo.endDateParam) {
        p.set("startDate", periodInfo.startDateParam);
        p.set("endDate", periodInfo.endDateParam);
      } else if (periodInfo.startMonthParam && periodInfo.endMonthParam) {
        p.set("startMonth", periodInfo.startMonthParam.toString());
        p.set("endMonth", periodInfo.endMonthParam.toString());
      }

      if (selectedCategoryIds.length > 0) {
        p.set("categoryIds", selectedCategoryIds.join(","));
      }
      if (selectedAccountIds.length > 0) {
        p.set("accountIds", selectedAccountIds.join(","));
      }
      if (selectedSubcategoryNames.length > 0) {
        p.set("subcategoryNames", selectedSubcategoryNames.join(","));
      }

      const res = await fetch(`/api/analytics/categories?${p.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
        setAccounts(data.accounts || []);
        setTrendPoints(data.trend?.points || data.annualTrend || []);
        setSubSeries(data.trend?.subSeries || []);
        setTransactions(data.transactions || []);
        setCurrentTotal(data.currentTotal || 0);
        setFilteredTotal(data.filteredTotal || data.currentTotal || 0);
        setPriorTotal(data.priorTotal || 0);
        setPercentageChange(data.percentageChange || 0);
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setIsLoading(false);
    }
  }, [type, periodInfo, trendGranularity, selectedCategoryIds, selectedAccountIds, selectedSubcategoryNames, sort]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Smart Period Navigation Prev / Next
  function handlePrevPeriod() {
    if (rangePreset === "monthly") {
      let nextM = month - 1;
      let nextY = year;
      if (nextM < 1) {
        nextM = 12;
        nextY -= 1;
      }
      setYear(nextY);
      setMonth(nextM);
      updateUrl({ year: nextY, month: nextM });
    } else if (rangePreset === "annually") {
      const nextY = year - 1;
      setYear(nextY);
      updateUrl({ year: nextY });
    } else if (rangePreset === "weekly") {
      setWeekAnchor((prev) => {
        const next = new Date(prev);
        next.setDate(next.getDate() - 7);
        return next;
      });
    } else if (rangePreset === "biweekly") {
      setWeekAnchor((prev) => {
        const next = new Date(prev);
        next.setDate(next.getDate() - 14);
        return next;
      });
    } else if (rangePreset === "last2months") {
      let nextM = month - 2;
      let nextY = year;
      if (nextM < 1) {
        nextM += 12;
        nextY -= 1;
      }
      setYear(nextY);
      setMonth(nextM);
      updateUrl({ year: nextY, month: nextM });
    } else if (rangePreset === "last3months") {
      let nextM = month - 3;
      let nextY = year;
      if (nextM < 1) {
        nextM += 12;
        nextY -= 1;
      }
      setYear(nextY);
      setMonth(nextM);
      updateUrl({ year: nextY, month: nextM });
    } else if (rangePreset === "custom") {
      setCustomDateOpen(true);
    }
  }

  function handleNextPeriod() {
    if (rangePreset === "monthly") {
      let nextM = month + 1;
      let nextY = year;
      if (nextM > 12) {
        nextM = 1;
        nextY += 1;
      }
      setYear(nextY);
      setMonth(nextM);
      updateUrl({ year: nextY, month: nextM });
    } else if (rangePreset === "annually") {
      const nextY = year + 1;
      setYear(nextY);
      updateUrl({ year: nextY });
    } else if (rangePreset === "weekly") {
      setWeekAnchor((prev) => {
        const next = new Date(prev);
        next.setDate(next.getDate() + 7);
        return next;
      });
    } else if (rangePreset === "biweekly") {
      setWeekAnchor((prev) => {
        const next = new Date(prev);
        next.setDate(next.getDate() + 14);
        return next;
      });
    } else if (rangePreset === "last2months") {
      let nextM = month + 2;
      let nextY = year;
      if (nextM > 12) {
        nextM -= 12;
        nextY += 1;
      }
      setYear(nextY);
      setMonth(nextM);
      updateUrl({ year: nextY, month: nextM });
    } else if (rangePreset === "last3months") {
      let nextM = month + 3;
      let nextY = year;
      if (nextM > 12) {
        nextM -= 12;
        nextY += 1;
      }
      setYear(nextY);
      setMonth(nextM);
      updateUrl({ year: nextY, month: nextM });
    } else if (rangePreset === "custom") {
      setCustomDateOpen(true);
    }
  }

  // Range Preset Change Handler
  function handleRangePresetChange(newPreset: RangePreset) {
    setRangePreset(newPreset);
    if (newPreset === "custom") {
      setCustomDateOpen(true);
      return;
    }
    // Set smart trend resolution based on range
    if (newPreset === "annually" || newPreset === "last2months" || newPreset === "last3months") {
      setTrendGranularity("monthly");
      updateUrl({ range: newPreset, trendGranularity: "monthly", startDate: null, endDate: null });
    } else {
      setTrendGranularity("daily");
      updateUrl({ range: newPreset, trendGranularity: "daily", startDate: null, endDate: null });
    }
  }

  // Multi-Select Category Handler: toggles category without clearing others!
  function handleToggleCategory(catId: string) {
    setSelectedCategoryIds((prev) => {
      const exists = prev.includes(catId);
      const next = exists ? prev.filter((id) => id !== catId) : [...prev, catId];
      if (!exists) {
        setExpandedCats((exp) => ({ ...exp, [catId]: true }));
      }
      updateUrl({ categoryIds: next });
      return next;
    });
  }

  // Multi-Select Account Handler: toggles account without clearing others!
  function handleToggleAccount(accId: string) {
    setSelectedAccountIds((prev) => {
      const exists = prev.includes(accId);
      const next = exists ? prev.filter((id) => id !== accId) : [...prev, accId];
      updateUrl({ accountIds: next });
      return next;
    });
  }

  // Subcategory Selection inside Expanded Category: Multi-select supported!
  function handleSelectSubcategory(catId: string, subName: string | null, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    if (subName === null) {
      // Clear subcategories under this category
      const targetCat = categories.find((c) => c.id === catId);
      const subNamesToRemove = targetCat ? targetCat.subcategories.map((s) => s.name) : [];
      setSelectedSubcategoryNames((prev) => {
        const next = prev.filter((name) => !subNamesToRemove.includes(name));
        updateUrl({ subcategories: next });
        return next;
      });
      if (catId && !selectedCategoryIds.includes(catId)) {
        setSelectedCategoryIds((prev) => {
          const next = [...prev, catId];
          updateUrl({ categoryIds: next });
          return next;
        });
      }
    } else {
      if (catId && !selectedCategoryIds.includes(catId)) {
        setSelectedCategoryIds((prev) => {
          const next = [...prev, catId];
          updateUrl({ categoryIds: next });
          return next;
        });
      }
      setSelectedSubcategoryNames((prev) => {
        const exists = prev.includes(subName);
        const next = exists ? prev.filter((s) => s !== subName) : [...prev, subName];
        updateUrl({ subcategories: next });
        return next;
      });
    }
  }

  // Category Accordion Toggle (Expand / Collapse)
  function toggleCategoryAccordion(catId: string, e: React.MouseEvent) {
    e.stopPropagation();
    setExpandedCats((prev) => ({ ...prev, [catId]: !prev[catId] }));
  }

  // Reset all filters
  function handleResetFilters() {
    setSelectedCategoryIds([]);
    setSelectedAccountIds([]);
    setSelectedSubcategoryNames([]);
    setStartDate(null);
    setEndDate(null);
    setTempStartDate("");
    setTempEndDate("");
    setSort("date_desc");
    updateUrl({
      categoryIds: [],
      accountIds: [],
      subcategories: [],
      startDate: null,
      endDate: null,
      sort: "date_desc",
    });
  }

  const formatCurrency = (val: number) => {
    return `₹${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const hasActiveFilters =
    selectedCategoryIds.length > 0 ||
    selectedAccountIds.length > 0 ||
    selectedSubcategoryNames.length > 0 ||
    Boolean(startDate && endDate) ||
    sort !== "date_desc";

  return (
    <div className="flex flex-col gap-5 pb-16 md:pb-6">
      {/* 1. Header: Title + Unified Range Selector & Smart Period Navigator */}
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

        {/* Range & Smart Period Controls */}
        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
          {/* Unified Range Selector Dropdown */}
          <Select value={rangePreset} onValueChange={(val) => handleRangePresetChange(val as RangePreset)}>
            <SelectTrigger className="h-8 text-xs bg-card border-border font-medium w-[100px] sm:w-[135px] cursor-pointer shadow-2xs">
              <span className="hidden sm:inline text-muted-foreground mr-1 shrink-0">Range:</span>
              <span className="font-semibold truncate">{RANGE_PRESET_LABELS[rangePreset] || "Monthly"}</span>
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="monthly" className="text-xs">
                Monthly
              </SelectItem>
              <SelectItem value="annually" className="text-xs">
                Annually
              </SelectItem>
              <SelectItem value="weekly" className="text-xs">
                Weekly
              </SelectItem>
              <SelectItem value="biweekly" className="text-xs">
                Bi-weekly
              </SelectItem>
              <SelectItem value="last2months" className="text-xs">
                Last 2 Months
              </SelectItem>
              <SelectItem value="last3months" className="text-xs">
                Last 3 Months
              </SelectItem>
              <SelectItem value="custom" className="text-xs">
                Custom Range...
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Smart Period Navigator: adapts dynamically to the active range preset */}
          <div className="flex items-center bg-card border border-border rounded-lg shadow-2xs shrink-0">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handlePrevPeriod}
              className="size-8 cursor-pointer"
              title="Previous period"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="px-2 sm:px-3 text-xs font-semibold select-none min-w-[80px] sm:min-w-[95px] text-center tabular-nums truncate">
              {periodInfo.label}
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleNextPeriod}
              className="size-8 cursor-pointer"
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
                "size-8 sm:w-auto sm:px-2.5 sm:gap-1.5 text-xs inline-flex items-center justify-center rounded-md border transition-colors shadow-2xs font-medium cursor-pointer shrink-0",
                rangePreset === "custom"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 border-primary"
                  : "border-border bg-card text-foreground hover:bg-muted"
              )}
              title="Custom Date Range Picker"
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
                    setRangePreset("monthly");
                    setCustomDateOpen(false);
                    updateUrl({ startDate: null, endDate: null, range: "monthly" });
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
                    setRangePreset("custom");
                    setCustomDateOpen(false);
                    updateUrl({
                      range: "custom",
                      startDate: tempStartDate,
                      endDate: tempEndDate,
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

      {/* 2. Controls & Active Multi-Select Filter Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Expenses vs Income Switcher */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-muted/40 border border-border max-w-xs select-none gap-1">
          <Button
            type="button"
            variant={type === "EXPENSE" ? "destructive" : "ghost"}
            size="sm"
            onClick={() => {
              setType("EXPENSE");
              setSelectedCategoryIds([]);
              setSelectedSubcategoryNames([]);
              updateUrl({ type: "EXPENSE", categoryIds: [], subcategories: [] });
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
              setSelectedCategoryIds([]);
              setSelectedSubcategoryNames([]);
              updateUrl({ type: "INCOME", categoryIds: [], subcategories: [] });
            }}
            className={cn(
              "h-8 text-xs font-semibold",
              type === "INCOME" ? "bg-income text-white shadow-xs hover:bg-income/90" : "text-muted-foreground"
            )}
          >
            Income
          </Button>
        </div>

        {/* Active Multi-Select Filter Badges with Individual & Global Clear */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Selected Categories Badges */}
          {selectedCategoryIds.map((catId) => {
            const cat = categories.find((c) => c.id === catId);
            return (
              <Badge key={catId} variant="secondary" className="text-xs gap-1.5 pl-2 pr-1 py-1">
                <span>{cat?.emoji || "📁"}</span>
                <span>{cat?.name || "Category"}</span>
                <button
                  type="button"
                  onClick={() => handleToggleCategory(catId)}
                  className="hover:bg-muted p-0.5 rounded-full cursor-pointer"
                  title="Remove category filter"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            );
          })}

          {/* Selected Accounts Badges */}
          {selectedAccountIds.map((accId) => {
            const acc = accounts.find((a) => a.id === accId) || allAccounts.find((a) => a.id === accId);
            return (
              <Badge key={accId} variant="secondary" className="text-xs gap-1.5 pl-2 pr-1 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                {getAccountGroupIcon(acc?.group || "")}
                <span>{acc?.name || "Account"}</span>
                <button
                  type="button"
                  onClick={() => handleToggleAccount(accId)}
                  className="hover:bg-muted p-0.5 rounded-full cursor-pointer"
                  title="Remove account filter"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            );
          })}

          {selectedSubcategoryNames.map((subName) => (
            <Badge key={subName} variant="secondary" className="text-xs gap-1.5 pl-2 pr-1 py-1">
              <span>›</span>
              <span>{subName}</span>
              <button
                type="button"
                onClick={() => handleSelectSubcategory("", subName)}
                className="hover:bg-muted p-0.5 rounded-full cursor-pointer"
                title="Remove subcategory filter"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}

          {sort !== "date_desc" && (
            <Badge variant="outline" className="text-xs gap-1.5 pl-2 pr-1 py-1">
              <ArrowUpDown className="size-3 text-muted-foreground" />
              <span>{SORT_LABELS[sort] || "Sorted"}</span>
              <button
                type="button"
                onClick={() => {
                  setSort("date_desc");
                  updateUrl({ sort: "date_desc" });
                }}
                className="hover:bg-muted p-0.5 rounded-full cursor-pointer"
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
              className="text-xs gap-1 text-muted-foreground hover:text-foreground h-7 cursor-pointer"
            >
              <RotateCcw className="size-3" />
              Reset filters
            </Button>
          )}
        </div>
      </div>

      {/* 3. Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (5 cols): Donut Breakdown & Trend Graph */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Distribution Breakdown & Donut Chart */}
          <Card className="border-border">
            <CardHeader className="pb-0 text-center">
              <CardDescription className="text-xs uppercase font-semibold tracking-wider">
                Distribution Breakdown
              </CardDescription>
              <CardTitle className="text-2xl font-bold tabular-nums">
                {formatCurrency(selectedCategoryIds.length > 0 ? filteredTotal : currentTotal)}
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
                total={selectedCategoryIds.length > 0 ? filteredTotal : currentTotal}
                type={type}
                selectedCategoryIds={selectedCategoryIds}
                onDoubleClickCategory={handleToggleCategory}
                onSelectCategory={handleToggleCategory}
              />
            </CardContent>
          </Card>

          {/* Granularity-Aware Trend Graph (Controls Moved into Trend Card Header!) */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">
                      {rangePreset === "annually"
                        ? `Annual Trend (${periodInfo.label})`
                        : rangePreset === "weekly"
                        ? `Weekly Trend (${periodInfo.label})`
                        : rangePreset === "biweekly"
                        ? `Bi-weekly Trend (${periodInfo.label})`
                        : `Trend (${periodInfo.label})`}
                    </CardTitle>
                    <CardDescription className="text-xs font-medium text-foreground">
                      {selectedCategoryIds.length === 1
                        ? `${categories.find((c) => c.id === selectedCategoryIds[0])?.emoji || ""} ${
                            categories.find((c) => c.id === selectedCategoryIds[0])?.name || "Category"
                          }${selectedSubcategoryNames.length > 0 ? ` › ${selectedSubcategoryNames.join(", ")}` : ""}`
                        : selectedCategoryIds.length > 1
                        ? `${selectedCategoryIds.length} categories filtered`
                        : `All ${type === "EXPENSE" ? "Expenses" : "Income"}`}
                    </CardDescription>
                  </div>

                  <Badge
                    variant={type === "INCOME" ? "default" : "destructive"}
                    className={cn("text-[10px] px-1.5 py-0", type === "INCOME" && "bg-income text-white")}
                  >
                    {type}
                  </Badge>
                </div>

                {/* Trend Card Resolution & Subcategory Controls */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
                  {/* Trend Granularity Switcher Pills (Daily / Weekly / Monthly) */}
                  <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border text-[10px] gap-0.5">
                    {(["daily", "weekly", "monthly"] as const).map((g) => (
                      <Button
                        key={g}
                        type="button"
                        variant={trendGranularity === g ? "default" : "ghost"}
                        size="xs"
                        onClick={() => {
                          setTrendGranularity(g);
                          updateUrl({ trendGranularity: g });
                        }}
                        className={cn(
                          "h-5 px-2 text-[10px] font-medium capitalize cursor-pointer",
                          trendGranularity !== g && "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {g}
                      </Button>
                    ))}
                  </div>

                  {/* Subcategory Multi-Line Toggle (if 1 category selected) */}
                  {selectedCategoryIds.length === 1 && subSeries.length > 0 && (
                    <div className="flex p-0.5 rounded-lg bg-muted/60 border border-border text-[10px] gap-0.5">
                      <Button
                        type="button"
                        variant={!showMultiLine ? "default" : "ghost"}
                        size="xs"
                        onClick={() => setShowMultiLine(false)}
                        className="h-5 px-1.5 text-[10px] font-medium cursor-pointer"
                      >
                        Total
                      </Button>
                      <Button
                        type="button"
                        variant={showMultiLine ? "default" : "ghost"}
                        size="xs"
                        onClick={() => setShowMultiLine(true)}
                        className="h-5 px-1.5 text-[10px] font-medium cursor-pointer"
                      >
                        Subcategories
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <TrendChart
                data={trendPoints}
                granularity={periodInfo.granularityParam as any}
                color={type === "INCOME" ? "var(--income)" : "var(--expense)"}
                subSeries={subSeries}
                showMultiLine={showMultiLine}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column (7 cols): Ranked Categories & Accounts Breakdown */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Card 1: Ranked Categories Accordion */}
          <Card className="border-border">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">Ranked Categories</CardTitle>
                  <CardDescription className="text-xs">
                    Click to filter • Multi-select supported • Expand for subs
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1.5">
                  {selectedCategoryIds.length > 0 && (
                    <Badge variant="default" className="text-[11px] px-1.5 py-0 bg-primary">
                      {selectedCategoryIds.length} Selected
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {categories.length} Categories
                  </Badge>
                </div>
              </div>
            </CardHeader>

            {/* Scrollbar layout shift eliminated with scrollbar-gutter: stable & scrollbar-width: thin */}
            <CardContent className="p-0 divide-y divide-border/60 max-h-[340px] overflow-y-auto [scrollbar-gutter:stable] [scrollbar-width:thin]">
              {categories.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No {type.toLowerCase()} transactions found for this period.
                </div>
              ) : (
                categories.map((cat, index) => {
                  const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
                  const isSelected = selectedCategoryIds.includes(cat.id);
                  const isExpanded = expandedCats[cat.id] ?? false;

                  return (
                    <div key={cat.id} className="flex flex-col">
                      {/* Category Row */}
                      <div
                        onClick={() => handleToggleCategory(cat.id)}
                        className={cn(
                          "flex items-center justify-between p-3 transition-colors cursor-pointer select-none",
                          isSelected ? "bg-primary/10 font-semibold" : "hover:bg-muted/30"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div
                            className={cn(
                              "size-4 rounded flex items-center justify-center border transition-colors shrink-0",
                              isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border/80 bg-background"
                            )}
                          >
                            {isSelected && <Check className="size-3 stroke-[3]" />}
                          </div>
                          <div
                            className="size-2.5 rounded-full shrink-0"
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

                        <div className="flex items-center gap-2.5 shrink-0">
                          {/* Progress Bar & % */}
                          <div className="hidden sm:flex flex-col items-end gap-1 w-16">
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
                                "h-6 px-1.5 text-[10px] gap-1 font-medium transition-all shrink-0 cursor-pointer",
                                isExpanded
                                  ? "bg-muted text-foreground border-border"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                              )}
                              title={isExpanded ? "Collapse subcategories" : "Expand subcategories"}
                            >
                              <span className="hidden sm:inline">{cat.subcategories.length} subs</span>
                              <ChevronDown
                                className={cn(
                                  "size-3 transition-transform duration-200",
                                  isExpanded && "rotate-180"
                                )}
                              />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Subcategories Accordion Content (Tight, high-density tree layout with multi-select!) */}
                      {isExpanded && (
                        <div className="ml-5 mr-2 my-0.5 pl-2.5 border-l-2 border-primary/20 flex flex-col gap-0.5">
                          {/* All option */}
                          <div
                            onClick={(e) => handleSelectSubcategory(cat.id, null, e)}
                            className={cn(
                              "flex items-center justify-between py-1 px-2 rounded text-xs cursor-pointer transition-colors",
                              isSelected && !cat.subcategories.some((s) => selectedSubcategoryNames.includes(s.name))
                                ? "bg-primary/15 text-primary font-semibold"
                                : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <span className="truncate font-medium">All {cat.name}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="tabular-nums font-semibold text-foreground">
                                {formatCurrency(cat.amount)}
                              </span>
                              <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-medium text-muted-foreground">
                                100%
                              </span>
                            </div>
                          </div>

                          {/* Individual Subcategories */}
                          {cat.subcategories.map((sub) => {
                            const isSubSelected = selectedSubcategoryNames.includes(sub.name);

                            return (
                              <div
                                key={sub.id}
                                onClick={(e) => handleSelectSubcategory(cat.id, sub.name, e)}
                                className={cn(
                                  "flex items-center justify-between py-1 px-2 rounded text-xs cursor-pointer transition-colors",
                                  isSubSelected
                                    ? "bg-primary/15 text-primary font-semibold"
                                    : "hover:bg-muted/50 text-foreground/85"
                                )}
                              >
                                <div className="flex items-center gap-2 min-w-0 pr-2">
                                  <div
                                    className={cn(
                                      "size-3.5 rounded flex items-center justify-center border transition-colors shrink-0",
                                      isSubSelected
                                        ? "bg-primary border-primary text-primary-foreground"
                                        : "border-border/80 bg-background"
                                    )}
                                  >
                                    {isSubSelected && <Check className="size-2.5 stroke-[3]" />}
                                  </div>
                                  <span className="truncate">{sub.name}</span>
                                  <span className="text-[10px] text-muted-foreground">
                                    ({sub.count})
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="tabular-nums font-medium text-foreground">
                                    {formatCurrency(sub.amount)}
                                  </span>
                                  <span className="text-[9px] bg-muted/80 px-1 py-0.5 rounded text-muted-foreground font-medium">
                                    {sub.percentage}%
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Card 2: Accounts Breakdown Section */}
          <Card className="border-border">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                    <Landmark className="size-4 text-primary" />
                    Accounts Breakdown
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Click account to filter • Multi-select supported
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1.5">
                  {selectedAccountIds.length > 0 && (
                    <Badge variant="default" className="text-[11px] px-1.5 py-0 bg-blue-600 text-white">
                      {selectedAccountIds.length} Selected
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {accounts.length} Accounts
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0 divide-y divide-border/60 max-h-[300px] overflow-y-auto [scrollbar-gutter:stable] [scrollbar-width:thin]">
              {accounts.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No transactions recorded across accounts in this period.
                </div>
              ) : (
                accounts.map((acc) => {
                  const isSelected = selectedAccountIds.includes(acc.id);

                  return (
                    <div
                      key={acc.id}
                      onClick={() => handleToggleAccount(acc.id)}
                      className={cn(
                        "flex items-center justify-between p-3 transition-colors cursor-pointer select-none",
                        isSelected ? "bg-blue-500/10 font-semibold" : "hover:bg-muted/30"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div
                          className={cn(
                            "size-4 rounded flex items-center justify-center border transition-colors shrink-0",
                            isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-border/80 bg-background"
                          )}
                        >
                          {isSelected && <Check className="size-3 stroke-[3]" />}
                        </div>
                        {getAccountGroupIcon(acc.group)}
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                "text-xs truncate transition-colors",
                                isSelected ? "font-bold text-blue-600 dark:text-blue-400" : "font-medium text-foreground"
                              )}
                            >
                              {acc.name}
                            </span>
                            <Badge variant="outline" className="text-[9px] px-1 py-0 uppercase text-muted-foreground">
                              {acc.group?.replace("_", " ")}
                            </Badge>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {acc.count} {acc.count === 1 ? "transaction" : "transactions"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {/* Progress Bar & % */}
                        <div className="hidden sm:flex flex-col items-end gap-1 w-16">
                          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300 bg-blue-500"
                              style={{ width: `${acc.percentage}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {acc.percentage}%
                          </span>
                        </div>

                        <span className="text-xs font-bold tabular-nums text-foreground">
                          {formatCurrency(acc.amount)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 4. Itemized Transaction Records List */}
      <Card className="border-border">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Receipt className="size-4 text-primary" />
                Transactions ({transactions.length})
              </CardTitle>
              <CardDescription className="text-xs">
                {selectedCategoryIds.length > 0 || selectedAccountIds.length > 0
                  ? `Filtered by ${[
                      selectedCategoryIds.length > 0 ? `${selectedCategoryIds.length} categories` : "",
                      selectedAccountIds.length > 0 ? `${selectedAccountIds.length} accounts` : "",
                    ]
                      .filter(Boolean)
                      .join(" & ")}${selectedSubcategoryNames.length > 0 ? ` › ${selectedSubcategoryNames.join(", ")}` : ""}`
                  : `All ${type.toLowerCase()} transactions for ${periodInfo.label}`}
              </CardDescription>
            </div>

            {/* Sort Controls */}
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

        <CardContent className="p-0 divide-y divide-border/60 max-h-[500px] overflow-y-auto [scrollbar-gutter:stable] [scrollbar-width:thin]">
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
