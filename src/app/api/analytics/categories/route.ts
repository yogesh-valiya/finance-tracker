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
    const year = parseInt(searchParams.get("year") || now.getFullYear().toString(), 10);
    const month = parseInt(searchParams.get("month") || (now.getMonth() + 1).toString(), 10);

    const startMonthParam = searchParams.get("startMonth");
    const endMonthParam = searchParams.get("endMonth");
    const startMonth = startMonthParam ? parseInt(startMonthParam, 10) : null;
    const endMonth = endMonthParam ? parseInt(endMonthParam, 10) : null;

    const categoryId = searchParams.get("categoryId") || null;
    const subcategoryId = searchParams.get("subcategoryId") || null;
    const subcategoryName = searchParams.get("subcategoryName") || null;
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
      // 4. Weekly (current week Sun/Mon to Sat/Sun)
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

    // Query all transactions in period for category breakdown
    const allPeriodTransactions = await prisma.transaction.findMany({
      where: transactionsWhere,
      include: {
        category: true,
        subcategory: true,
      },
    });

    // Query prior period total for % comparison
    const priorSum = await prisma.transaction.aggregate({
      where: {
        userId: user.id,
        type,
        date: { gte: priorStartDate, lte: priorEndDate },
      },
      _sum: { amount: true },
    });
    const priorTotal = new Decimal(priorSum._sum.amount?.toString() || 0).toNumber();

    // Aggregate by category and subcategories
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

    for (const tx of allPeriodTransactions) {
      if (!tx.category) continue;
      const catId = tx.category.id;
      const amt = new Decimal(tx.amount.toString());
      grandTotal = grandTotal.plus(amt);

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
    const currentTotal = grandTotal.toNumber();

    let percentageChange = 0;
    if (priorTotal > 0) {
      percentageChange = Math.round(((currentTotal - priorTotal) / priorTotal) * 100);
    }

    // -------------------------------------------------------------
    // Granularity-Aware Trend Points (with Subcategories breakdown)
    // - Annually: 12 months (Jan - Dec)
    // - Monthly: Days of the month (1 - 31)
    // - Weekly: Days of the week (Mon - Sun)
    // - Custom range: Days if <= 45 days, otherwise months
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

    let activeTrendGranularity: "annually" | "monthly" | "weekly" | "custom" = "monthly";

    if (customStartParam && customEndParam) {
      activeTrendGranularity = "custom";
      const totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      if (totalDays <= 45) {
        // Daily buckets
        for (let d = 0; d < totalDays; d++) {
          const bStart = new Date(startDate.getTime() + d * 86400000);
          const bEnd = new Date(startDate.getTime() + (d + 1) * 86400000 - 1);
          const dateStr = bStart.toISOString().split("T")[0];
          const dNum = bStart.getDate();
          const mNum = bStart.getMonth();
          buckets.push({
            label: `${dNum} ${monthNames[mNum]}`,
            index: d + 1,
            date: dateStr,
            startDate: bStart,
            endDate: bEnd,
          });
        }
      } else {
        // Monthly buckets across custom range
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
              label: `${monthNames[m]} ${y !== year ? `'${y % 100}` : ""}`.trim(),
              index: idx++,
              startDate: bStart,
              endDate: bEnd,
            });
          }
        }
      }
    } else if (granularity === "annually" || (startMonth && endMonth && Math.abs(endMonth - startMonth) > 1)) {
      activeTrendGranularity = "annually";
      for (let m = 0; m < 12; m++) {
        const bStart = new Date(Date.UTC(year, m, 1, 0, 0, 0, 0) + tzOffsetMs);
        const bEnd = new Date(Date.UTC(year, m + 1, 0, 23, 59, 59, 999) + tzOffsetMs);
        buckets.push({
          label: monthNames[m],
          index: m + 1,
          startDate: bStart,
          endDate: bEnd,
        });
      }
    } else if (granularity === "weekly") {
      activeTrendGranularity = "weekly";
      for (let d = 0; d < 7; d++) {
        const bStart = new Date(startDate.getTime() + d * 86400000);
        const bEnd = new Date(startDate.getTime() + (d + 1) * 86400000 - 1);
        const dayName = dayNames[new Date(bStart.getTime() - tzOffsetMs).getUTCDay()];
        const dayOfMonth = new Date(bStart.getTime() - tzOffsetMs).getUTCDate();
        buckets.push({
          label: `${dayName} ${dayOfMonth}`,
          index: d + 1,
          date: bStart.toISOString().split("T")[0],
          startDate: bStart,
          endDate: bEnd,
        });
      }
    } else {
      // Monthly: Days of the month (1 to 28/30/31)
      activeTrendGranularity = "monthly";
      const daysInMonth = new Date(year, month, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const bStart = new Date(Date.UTC(year, month - 1, d, 0, 0, 0, 0) + tzOffsetMs);
        const bEnd = new Date(Date.UTC(year, month - 1, d, 23, 59, 59, 999) + tzOffsetMs);
        buckets.push({
          label: d.toString(),
          index: d,
          date: `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
          startDate: bStart,
          endDate: bEnd,
        });
      }
    }

    // Query all transactions in the entire trend interval in ONE query
    const trendSpanStart = buckets[0]?.startDate || startDate;
    const trendSpanEnd = buckets[buckets.length - 1]?.endDate || endDate;

    const trendWhere: Prisma.TransactionWhereInput = {
      userId: user.id,
      type,
      date: { gte: trendSpanStart, lte: trendSpanEnd },
    };

    if (categoryId) {
      trendWhere.categoryId = categoryId;
    }
    if (subcategoryId) {
      trendWhere.subcategoryId = subcategoryId;
    } else if (subcategoryName) {
      trendWhere.subcategory = { name: subcategoryName };
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

    if (categoryId) {
      itemizedWhere.categoryId = categoryId;
    }
    if (subcategoryId) {
      itemizedWhere.subcategoryId = subcategoryId;
    } else if (subcategoryName) {
      itemizedWhere.subcategory = { name: subcategoryName };
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

    // Optional category details if categoryId is active
    let selectedCategory = null;
    if (categoryId) {
      selectedCategory = await prisma.category.findFirst({
        where: { id: categoryId, userId: user.id },
        include: { subcategories: true },
      });
    }

    return NextResponse.json({
      type,
      granularity,
      period: {
        year,
        month,
        startMonth,
        endMonth,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      currentTotal,
      priorTotal,
      percentageChange,
      categories: items,
      trend: {
        granularity: activeTrendGranularity,
        points: trendPoints,
        subSeries,
      },
      annualTrend: trendPoints,
      transactions: itemizedTransactions,
      selectedCategory,
    });
  } catch (error) {
    console.error("Failed to get category breakdown:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
