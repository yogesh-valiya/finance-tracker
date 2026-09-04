import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { TransactionType, Prisma } from "@prisma/client";
import Decimal from "decimal.js";

export interface CategoryBreakdownItem {
  id: string;
  name: string;
  emoji: string;
  amount: number;
  percentage: number;
  count: number;
  subcategories: Array<{
    id: string;
    name: string;
    amount: number;
    percentage: number;
    count: number;
  }>;
}

export interface AccountBreakdownItem {
  id: string;
  name: string;
  group: string;
  amount: number;
  percentage: number;
  count: number;
}

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const now = new Date();

    const type = (searchParams.get("type") || "EXPENSE") as TransactionType;
    const granularity = searchParams.get("granularity") || "monthly";
    const trendGranularity = (searchParams.get("trendGranularity") || "auto") as "daily" | "weekly" | "monthly" | "auto";
    const year = parseInt(searchParams.get("year") || now.getFullYear().toString(), 10);
    const month = parseInt(searchParams.get("month") || (now.getMonth() + 1).toString(), 10);

    const startMonthParam = searchParams.get("startMonth");
    const endMonthParam = searchParams.get("endMonth");
    const startMonth = startMonthParam ? parseInt(startMonthParam, 10) : null;
    const endMonth = endMonthParam ? parseInt(endMonthParam, 10) : null;

    // Support single and multi-select categories
    const categoryIdsParam = searchParams.get("categoryIds") || searchParams.get("categoryId");
    const categoryIds = categoryIdsParam
      ? categoryIdsParam.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    const categoryId = categoryIds[0] || null;

    // Support single and multi-select accounts
    const accountIdsParam = searchParams.get("accountIds") || searchParams.get("accountId");
    const accountIds = accountIdsParam
      ? accountIdsParam.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    const accountId = accountIds[0] || null;

    // Support single and multi-select subcategories
    const subcategoryNamesParam = searchParams.get("subcategoryNames") || searchParams.get("subcategory") || searchParams.get("subcategoryName");
    const subcategoryNames = subcategoryNamesParam
      ? subcategoryNamesParam.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    const subcategoryId = searchParams.get("subcategoryId") || null;
    const sort = searchParams.get("sort") || "date_desc";

    // Client timezone offset in minutes (e.g., -330 for IST UTC+5:30)
    const tzOffsetMinutes = parseInt(searchParams.get("tzOffset") || "0", 10);
    const tzOffsetMs = tzOffsetMinutes * 60 * 1000;

    const customStartParam = searchParams.get("startDate");
    const customEndParam = searchParams.get("endDate");

    let startDate: Date;
    let endDate: Date;
    let priorStartDate: Date;
    let priorEndDate: Date;

    if (customStartParam && customEndParam) {
      // 1. Explicit Custom Date Range (e.g. 2026-06-15 to 2026-08-20)
      startDate = new Date(customStartParam.includes("T") ? customStartParam : `${customStartParam}T00:00:00.000Z`);
      endDate = new Date(customEndParam.includes("T") ? customEndParam : `${customEndParam}T23:59:59.999Z`);
      startDate = new Date(startDate.getTime() + tzOffsetMs);
      endDate = new Date(endDate.getTime() + tzOffsetMs);

      const spanMs = endDate.getTime() - startDate.getTime();
      priorEndDate = new Date(startDate.getTime() - 1);
      priorStartDate = new Date(priorEndDate.getTime() - spanMs);
    } else if (startMonth && endMonth) {
      // 2. Custom range across months (e.g. Mar - Jul)
      const sM = Math.min(startMonth, endMonth);
      const eM = Math.max(startMonth, endMonth);
      startDate = new Date(Date.UTC(year, sM - 1, 1, 0, 0, 0, 0) + tzOffsetMs);
      endDate = new Date(Date.UTC(year, eM, 0, 23, 59, 59, 999) + tzOffsetMs);

      const spanMonths = eM - sM + 1;
      priorStartDate = new Date(Date.UTC(year, sM - 1 - spanMonths, 1, 0, 0, 0, 0) + tzOffsetMs);
      priorEndDate = new Date(Date.UTC(year, sM - 1, 0, 23, 59, 59, 999) + tzOffsetMs);
    } else if (granularity === "annually") {
      // 3. Annually (full calendar year)
      startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0) + tzOffsetMs);
      endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999) + tzOffsetMs);
      priorStartDate = new Date(Date.UTC(year - 1, 0, 1, 0, 0, 0, 0) + tzOffsetMs);
      priorEndDate = new Date(Date.UTC(year - 1, 11, 31, 23, 59, 59, 999) + tzOffsetMs);
    } else if (granularity === "weekly") {
      // 4. Weekly (current week Sun/Mon to Sat/Sun or custom week span)
      const currentDay = now.getDay();
      const diff = now.getDate() - currentDay;
      const weekStart = new Date(now);
      weekStart.setDate(diff);
      weekStart.setHours(0, 0, 0, 0);

      startDate = new Date(weekStart.getTime());
      endDate = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);

      priorStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      priorEndDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      // 5. Monthly default (1st of month to end of month in local time)
      startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0) + tzOffsetMs);
      endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999) + tzOffsetMs);

      const priorMonth = month === 1 ? 12 : month - 1;
      const priorYear = month === 1 ? year - 1 : year;
      priorStartDate = new Date(Date.UTC(priorYear, priorMonth - 1, 1, 0, 0, 0, 0) + tzOffsetMs);
      priorEndDate = new Date(Date.UTC(priorYear, priorMonth, 0, 23, 59, 59, 999) + tzOffsetMs);
    }

    // Base query for transactions in current period
    const transactionsWhere: Prisma.TransactionWhereInput = {
      userId: user.id,
      type,
      date: { gte: startDate, lte: endDate },
    };

    // Filter by accounts if specified
    if (accountIds.length === 1) {
      transactionsWhere.accountId = accountIds[0];
    } else if (accountIds.length > 1) {
      transactionsWhere.accountId = { in: accountIds };
    }

    // Query all transactions in period for category & account breakdown
    const allPeriodTransactions = await prisma.transaction.findMany({
      where: transactionsWhere,
      include: {
        category: true,
        subcategory: true,
        account: { select: { id: true, name: true, group: true } },
      },
    });

    // Query prior period total for % comparison
    const priorWhere: Prisma.TransactionWhereInput = {
      userId: user.id,
      type,
      date: { gte: priorStartDate, lte: priorEndDate },
    };
    if (accountIds.length === 1) {
      priorWhere.accountId = accountIds[0];
    } else if (accountIds.length > 1) {
      priorWhere.accountId = { in: accountIds };
    }
    if (categoryIds.length === 1) {
      priorWhere.categoryId = categoryIds[0];
    } else if (categoryIds.length > 1) {
      priorWhere.categoryId = { in: categoryIds };
    }

    const priorSum = await prisma.transaction.aggregate({
      where: priorWhere,
      _sum: { amount: true },
    });
    const priorTotal = new Decimal(priorSum._sum.amount?.toString() || 0).toNumber();

    // Aggregate by category, subcategories, and accounts
    let grandTotal = new Decimal(0);
    const categoryMap = new Map<
      string,
      {
        id: string;
        name: string;
        emoji: string;
        total: Decimal;
        count: number;
        subMap: Map<string, { id: string; name: string; total: Decimal; count: number }>;
      }
    >();

    const accountMap = new Map<
      string,
      {
        id: string;
        name: string;
        group: string;
        total: Decimal;
        count: number;
      }
    >();

    for (const tx of allPeriodTransactions) {
      const amt = new Decimal(tx.amount.toString());
      grandTotal = grandTotal.plus(amt);

      // Account breakdown
      if (tx.account) {
        const accId = tx.account.id;
        if (!accountMap.has(accId)) {
          accountMap.set(accId, {
            id: accId,
            name: tx.account.name,
            group: tx.account.group,
            total: new Decimal(0),
            count: 0,
          });
        }
        const accEntry = accountMap.get(accId)!;
        accEntry.total = accEntry.total.plus(amt);
        accEntry.count++;
      }

      // Category breakdown
      if (tx.category) {
        const catId = tx.category.id;
        if (!categoryMap.has(catId)) {
          categoryMap.set(catId, {
            id: catId,
            name: tx.category.name,
            emoji: tx.category.emoji,
            total: new Decimal(0),
            count: 0,
            subMap: new Map(),
          });
        }

        const catEntry = categoryMap.get(catId)!;
        catEntry.total = catEntry.total.plus(amt);
        catEntry.count++;

        if (tx.subcategory) {
          const subId = tx.subcategory.id;
          if (!catEntry.subMap.has(subId)) {
            catEntry.subMap.set(subId, {
              id: subId,
              name: tx.subcategory.name,
              total: new Decimal(0),
              count: 0,
            });
          }
          const subEntry = catEntry.subMap.get(subId)!;
          subEntry.total = subEntry.total.plus(amt);
          subEntry.count++;
        }
      }
    }

    const items: CategoryBreakdownItem[] = [];

    categoryMap.forEach((entry) => {
      const catAmount = entry.total.toNumber();
      const pct = grandTotal.isZero() ? 0 : entry.total.dividedBy(grandTotal).times(100).toNumber();

      const subcategories = Array.from(entry.subMap.values())
        .map((s) => ({
          id: s.id,
          name: s.name,
          amount: s.total.toNumber(),
          percentage: entry.total.isZero() ? 0 : Math.round(s.total.dividedBy(entry.total).times(100).toNumber()),
          count: s.count,
        }))
        .sort((a, b) => b.amount - a.amount);

      items.push({
        id: entry.id,
        name: entry.name,
        emoji: entry.emoji,
        amount: catAmount,
        percentage: Math.round(pct * 10) / 10,
        count: entry.count,
        subcategories,
      });
    });

    items.sort((a, b) => b.amount - a.amount);

    const accountItems: AccountBreakdownItem[] = Array.from(accountMap.values())
      .map((acc) => ({
        id: acc.id,
        name: acc.name,
        group: acc.group,
        amount: acc.total.toNumber(),
        percentage: grandTotal.isZero() ? 0 : Math.round(acc.total.dividedBy(grandTotal).times(1000).toNumber()) / 10,
        count: acc.count,
      }))
      .sort((a, b) => b.amount - a.amount);

    const currentTotal = grandTotal.toNumber();

    // If categories are filtered, calculate total of selected categories
    let filteredTotal = currentTotal;
    if (categoryIds.length > 0) {
      filteredTotal = items
        .filter((cat) => categoryIds.includes(cat.id))
        .reduce((sum, cat) => sum + cat.amount, 0);
    }

    let percentageChange = 0;
    if (priorTotal > 0) {
      const compareTotal = categoryIds.length > 0 ? filteredTotal : currentTotal;
      percentageChange = Math.round(((compareTotal - priorTotal) / priorTotal) * 100);
    }

    // -------------------------------------------------------------
    // Granularity-Aware Trend Points (with Subcategories breakdown)
    // - trendGranularity can be 'daily', 'weekly', 'monthly', or 'auto'
    // -------------------------------------------------------------
    interface TrendBucket {
      label: string;
      index: number;
      date?: string;
      startDate: Date;
      endDate: Date;
    }

    const buckets: TrendBucket[] = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    let effectiveTrendGranularity = trendGranularity;
    if (effectiveTrendGranularity === "auto") {
      const totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86400000));
      if (granularity === "weekly") {
        effectiveTrendGranularity = "daily";
      } else if (granularity === "annually" || totalDays > 45) {
        effectiveTrendGranularity = "monthly";
      } else {
        effectiveTrendGranularity = "daily";
      }
    }

    if (effectiveTrendGranularity === "daily") {
      // Daily buckets from startDate to endDate
      const totalDays = Math.min(90, Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86400000)));
      for (let d = 0; d < totalDays; d++) {
        const bStart = new Date(startDate.getTime() + d * 86400000);
        const bEnd = new Date(startDate.getTime() + (d + 1) * 86400000 - 1);
        const dNum = bStart.getDate();
        const mNum = bStart.getMonth();
        buckets.push({
          label: totalDays <= 31 ? `${dNum}` : `${dNum} ${monthNames[mNum]}`,
          index: d + 1,
          date: bStart.toISOString().split("T")[0],
          startDate: bStart,
          endDate: bEnd,
        });
      }
    } else if (effectiveTrendGranularity === "weekly") {
      // Weekly buckets (7 days each) across the interval
      const totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86400000));
      const numWeeks = Math.ceil(totalDays / 7);
      for (let w = 0; w < numWeeks; w++) {
        const bStart = new Date(startDate.getTime() + w * 7 * 86400000);
        const bEnd = new Date(Math.min(endDate.getTime(), startDate.getTime() + (w + 1) * 7 * 86400000 - 1));
        const sDay = bStart.getDate();
        const sMonth = monthNames[bStart.getMonth()];
        const eDay = bEnd.getDate();
        const eMonth = monthNames[bEnd.getMonth()];
        const label = sMonth === eMonth ? `${sDay}–${eDay} ${sMonth}` : `${sDay} ${sMonth} – ${eDay} ${eMonth}`;
        buckets.push({
          label: `W${w + 1} (${label})`,
          index: w + 1,
          startDate: bStart,
          endDate: bEnd,
        });
      }
    } else {
      // Monthly buckets
      const startY = startDate.getFullYear();
      const startM = startDate.getMonth();
      const endY = endDate.getFullYear();
      const endM = endDate.getMonth();
      let idx = 0;
      for (let y = startY; y <= endY; y++) {
        const mFrom = y === startY ? startM : 0;
        const mTo = y === endY ? endM : 11;
        for (let m = mFrom; m <= mTo; m++) {
          const bStart = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0) + tzOffsetMs);
          const bEnd = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999) + tzOffsetMs);
          buckets.push({
            label: `${monthNames[m]}${y !== year ? ` '${y % 100}` : ""}`,
            index: ++idx,
            startDate: bStart,
            endDate: bEnd,
          });
        }
      }
    }

    // Query all transactions in the entire trend interval
    const trendSpanStart = buckets[0]?.startDate || startDate;
    const trendSpanEnd = buckets[buckets.length - 1]?.endDate || endDate;

    const trendWhere: Prisma.TransactionWhereInput = {
      userId: user.id,
      type,
      date: { gte: trendSpanStart, lte: trendSpanEnd },
    };

    if (categoryIds.length === 1) {
      trendWhere.categoryId = categoryIds[0];
    } else if (categoryIds.length > 1) {
      trendWhere.categoryId = { in: categoryIds };
    }

    if (accountIds.length === 1) {
      trendWhere.accountId = accountIds[0];
    } else if (accountIds.length > 1) {
      trendWhere.accountId = { in: accountIds };
    }

    if (subcategoryId) {
      trendWhere.subcategoryId = subcategoryId;
    } else if (subcategoryNames.length === 1) {
      trendWhere.subcategory = { name: subcategoryNames[0] };
    } else if (subcategoryNames.length > 1) {
      trendWhere.subcategory = { name: { in: subcategoryNames } };
    }

    const trendRawTxs = await prisma.transaction.findMany({
      where: trendWhere,
      select: {
        amount: true,
        date: true,
        subcategory: { select: { id: true, name: true } },
      },
    });

    // Subcategory series tracking
    const subcategoryTotals = new Map<string, Decimal>();

    const trendPoints = buckets.map((bucket) => {
      let bucketTotal = new Decimal(0);
      const subMap: Record<string, number> = {};

      for (const tx of trendRawTxs) {
        const txDate = new Date(tx.date);
        if (txDate >= bucket.startDate && txDate <= bucket.endDate) {
          const amt = new Decimal(tx.amount.toString());
          bucketTotal = bucketTotal.plus(amt);

          const subName = tx.subcategory?.name || "Uncategorized";
          subMap[subName] = (subMap[subName] || 0) + amt.toNumber();
          subcategoryTotals.set(subName, (subcategoryTotals.get(subName) || new Decimal(0)).plus(amt));
        }
      }

      return {
        month: bucket.label, // keep for backward compatibility
        label: bucket.label,
        monthIndex: bucket.index,
        index: bucket.index,
        date: bucket.date,
        amount: bucketTotal.toNumber(),
        subcategories: subMap,
      };
    });

    // Top subcategory series sorted by total amount
    const subSeries = Array.from(subcategoryTotals.entries())
      .sort((a, b) => b[1].minus(a[1]).toNumber())
      .map((entry) => entry[0]);

    // -------------------------------------------------------------
    // Itemized Transactions List (Filtered & Sorted)
    // -------------------------------------------------------------
    const itemizedWhere: Prisma.TransactionWhereInput = {
      userId: user.id,
      type,
      date: { gte: startDate, lte: endDate },
    };

    if (categoryIds.length === 1) {
      itemizedWhere.categoryId = categoryIds[0];
    } else if (categoryIds.length > 1) {
      itemizedWhere.categoryId = { in: categoryIds };
    }

    if (accountIds.length === 1) {
      itemizedWhere.accountId = accountIds[0];
    } else if (accountIds.length > 1) {
      itemizedWhere.accountId = { in: accountIds };
    }

    if (subcategoryId) {
      itemizedWhere.subcategoryId = subcategoryId;
    } else if (subcategoryNames.length === 1) {
      itemizedWhere.subcategory = { name: subcategoryNames[0] };
    } else if (subcategoryNames.length > 1) {
      itemizedWhere.subcategory = { name: { in: subcategoryNames } };
    }

    let orderBy: Prisma.TransactionOrderByWithRelationInput = { date: "desc" };
    if (sort === "date_asc") {
      orderBy = { date: "asc" };
    } else if (sort === "amount_desc") {
      orderBy = { amount: "desc" };
    } else if (sort === "amount_asc") {
      orderBy = { amount: "asc" };
    }

    const itemizedTransactions = await prisma.transaction.findMany({
      where: itemizedWhere,
      orderBy,
      take: 500,
      include: {
        account: { select: { id: true, name: true, group: true } },
        category: { select: { id: true, name: true, emoji: true, type: true } },
        subcategory: { select: { id: true, name: true } },
      },
    });

    // Optional category and account details for metadata
    const [selectedCategories, selectedAccounts] = await Promise.all([
      categoryIds.length > 0
        ? prisma.category.findMany({
            where: { id: { in: categoryIds }, userId: user.id },
            include: { subcategories: true },
          })
        : Promise.resolve([]),
      accountIds.length > 0
        ? prisma.account.findMany({
            where: { id: { in: accountIds }, userId: user.id },
            select: { id: true, name: true, group: true },
          })
        : Promise.resolve([]),
    ]);

    return NextResponse.json({
      type,
      granularity,
      trendGranularity: effectiveTrendGranularity,
      period: {
        year,
        month,
        startMonth,
        endMonth,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      currentTotal,
      filteredTotal,
      priorTotal,
      percentageChange,
      categories: items,
      accounts: accountItems,
      trend: {
        granularity: effectiveTrendGranularity,
        points: trendPoints,
        subSeries,
      },
      annualTrend: trendPoints,
      transactions: itemizedTransactions,
      selectedCategory: selectedCategories[0] || null,
      selectedCategories,
      selectedAccounts,
    });
  } catch (error) {
    console.error("Failed to get category breakdown:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
