import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  getMonthlyTotals,
  getDailyGroupedTransactions,
  getCalendarDayTotals,
  getAnnualMonthlyBreakdown,
  TransactionWithDetails,
} from "@/lib/services/aggregation";
import {
  getProjectedRecurringOccurrences,
  UpcomingRecurringOccurrence,
} from "@/lib/services/recurring-engine";
import { TransactionType } from "@prisma/client";
import Decimal from "decimal.js";

const VALID_TYPES = Object.values(TransactionType);

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const now = new Date();

    const year = parseInt(searchParams.get("year") || now.getFullYear().toString(), 10);
    const month = parseInt(searchParams.get("month") || (now.getMonth() + 1).toString(), 10);
    const view = searchParams.get("view") || "daily";

    const accountId = searchParams.get("accountId") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const typeParam = searchParams.get("type") as TransactionType | null;
    const type = typeParam && VALID_TYPES.includes(typeParam) ? typeParam : undefined;

    // Determine period boundaries
    let startDate: Date;
    let endDate: Date;

    const customStart = searchParams.get("startDate");
    const customEnd = searchParams.get("endDate");

    if (customStart && customEnd) {
      startDate = new Date(customStart);
      endDate = new Date(customEnd);
    } else {
      // Default to the 1st to last day of the selected month
      startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    }

    // Monthly summary
    const summary = await getMonthlyTotals(user.id, startDate, endDate);

    // Projected Upcoming Recurring Occurrences for this period
    const { occurrences: allProjectedOccurrences, summary: upcomingSummary } =
      await getProjectedRecurringOccurrences(user.id, startDate, endDate);

    let upcomingOccurrences = allProjectedOccurrences;
    if (type) {
      upcomingOccurrences = upcomingOccurrences.filter((occ) => occ.type === type);
    }
    if (categoryId) {
      upcomingOccurrences = upcomingOccurrences.filter((occ) => occ.categoryId === categoryId);
    }
    if (accountId) {
      upcomingOccurrences = upcomingOccurrences.filter(
        (occ) => occ.accountId === accountId || occ.toAccountId === accountId
      );
    }

    // View-specific data
    let dailyGroups = undefined;
    let calendarTotals = undefined;
    let annualBreakdown = undefined;
    let noteTransactions = undefined;

    if (view === "daily" || view === "total") {
      const postedGroups = await getDailyGroupedTransactions(user.id, startDate, endDate, {
        accountId,
        categoryId,
        type,
      });

      // Map day groups by dateStr (YYYY-MM-DD)
      const groupsMap = new Map<
        string,
        {
          dateStr: string;
          dayNumber: number;
          dayOfWeek: string;
          dateFormatted: string;
          incomeSum: number;
          expenseSum: number;
          transactions: TransactionWithDetails[];
          upcomingRecurring: UpcomingRecurringOccurrence[];
        }
      >();

      for (const g of postedGroups) {
        groupsMap.set(g.dateStr, {
          ...g,
          upcomingRecurring: [],
        });
      }

      // Add upcoming recurring occurrences to their corresponding day group
      for (const occ of upcomingOccurrences) {
        if (!groupsMap.has(occ.dateStr)) {
          groupsMap.set(occ.dateStr, {
            dateStr: occ.dateStr,
            dayNumber: occ.dayNumber,
            dayOfWeek: occ.dayOfWeek,
            dateFormatted: occ.dateFormatted,
            incomeSum: 0,
            expenseSum: 0,
            transactions: [],
            upcomingRecurring: [],
          });
        }
        groupsMap.get(occ.dateStr)!.upcomingRecurring.push(occ);
      }

      // Sort daily groups by dateStr descending
      dailyGroups = Array.from(groupsMap.values()).sort((a, b) =>
        b.dateStr.localeCompare(a.dateStr)
      );
    }

    if (view === "calendar") {
      calendarTotals = await getCalendarDayTotals(user.id, year, month);

      // Augment calendar totals with projected recurring amounts
      for (const occ of upcomingOccurrences) {
        const d = occ.dayNumber;
        if (!calendarTotals[d]) {
          calendarTotals[d] = {
            day: d,
            dateStr: occ.dateStr,
            income: 0,
            expense: 0,
            net: 0,
            count: 0,
            projectedIncome: 0,
            projectedExpense: 0,
            projectedCount: 0,
          } as any;
        }
        const cell = calendarTotals[d] as any;
        if (occ.type === "INCOME") {
          cell.projectedIncome = (cell.projectedIncome || 0) + occ.amount;
        } else if (occ.type === "EXPENSE") {
          cell.projectedExpense = (cell.projectedExpense || 0) + occ.amount + (occ.fee || 0);
        }
        cell.projectedCount = (cell.projectedCount || 0) + 1;
      }
    }

    if (view === "monthly") {
      annualBreakdown = await getAnnualMonthlyBreakdown(user.id, year);
    }

    if (view === "note") {
      noteTransactions = await prisma.transaction.findMany({
        where: {
          userId: user.id,
          note: { not: null },
          NOT: { note: "" },
        },
        orderBy: { date: "desc" },
        include: {
          category: true,
          subcategory: true,
          account: true,
          toAccount: true,
        },
      });
    }

    return NextResponse.json({
      period: {
        year,
        month,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      summary,
      upcomingSummary,
      upcomingOccurrences,
      dailyGroups,
      calendarTotals,
      annualBreakdown,
      noteTransactions,
    });
  } catch (error) {
    console.error("Failed to get transactions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      type,
      amount,
      date,
      accountId,
      toAccountId,
      categoryId,
      subcategoryId,
      fee,
      note,
      description,
    } = body;

    // Type validation
    if (!type || !VALID_TYPES.includes(type as TransactionType)) {
      return NextResponse.json(
        { error: `Invalid transaction type. Must be one of: ${VALID_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Amount validation
    let amountDec: Decimal;
    try {
      amountDec = new Decimal(amount);
      if (amountDec.isNegative() || amountDec.isZero()) {
        return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid amount format" }, { status: 400 });
    }

    // Fee validation (for transfers)
    let feeDec: Decimal | null = null;
    if (fee !== undefined && fee !== null && fee !== "") {
      try {
        feeDec = new Decimal(fee);
        if (feeDec.isNegative()) {
          return NextResponse.json({ error: "Fee cannot be negative" }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ error: "Invalid fee format" }, { status: 400 });
      }
    }

    // Account validation
    if (!accountId) {
      return NextResponse.json({ error: "Source account is required" }, { status: 400 });
    }

    const sourceAccount = await prisma.account.findFirst({
      where: { id: accountId, userId: user.id },
    });
    if (!sourceAccount) {
      return NextResponse.json({ error: "Source account not found" }, { status: 404 });
    }

    // Transfer specific validation per Rule 011 and §4.4
    if (type === "TRANSFER") {
      if (!toAccountId) {
        return NextResponse.json({ error: "Destination account is required for transfers" }, { status: 400 });
      }
      if (toAccountId === accountId) {
        return NextResponse.json(
          { error: "Source and destination accounts must be different for transfers" },
          { status: 400 }
        );
      }
      const destAccount = await prisma.account.findFirst({
        where: { id: toAccountId, userId: user.id },
      });
      if (!destAccount) {
        return NextResponse.json({ error: "Destination account not found" }, { status: 404 });
      }
    }

    // Income & Expense category validation
    if (type !== "TRANSFER" && !categoryId) {
      return NextResponse.json({ error: "Category is required for income and expense" }, { status: 400 });
    }

    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, userId: user.id },
      });
      if (!category) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
      }
    }

    const txDate = date ? new Date(date) : new Date();

    const created = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: type as TransactionType,
        amount: amountDec.toString(),
        date: txDate,
        accountId,
        toAccountId: type === "TRANSFER" ? toAccountId : null,
        categoryId: type !== "TRANSFER" ? categoryId : null,
        subcategoryId: type !== "TRANSFER" ? subcategoryId || null : null,
        fee: feeDec ? feeDec.toString() : null,
        note: note?.trim() || null,
        description: description?.trim() || null,
      },
      include: {
        category: true,
        subcategory: true,
        account: true,
        toAccount: true,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Failed to create transaction:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
