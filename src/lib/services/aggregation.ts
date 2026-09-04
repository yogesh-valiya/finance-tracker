import { prisma } from "@/lib/prisma";
import Decimal from "decimal.js";
import { Transaction, TransactionType, Category, Subcategory, Account } from "@prisma/client";

import { UpcomingRecurringOccurrence } from "@/lib/services/recurring-engine";

export interface TransactionWithDetails extends Transaction {
  category: Category | null;
  subcategory: Subcategory | null;
  account: Account;
  toAccount: Account | null;
}

export interface DailyGroup {
  dateStr: string; // YYYY-MM-DD
  dayNumber: number;
  dayOfWeek: string;
  dateFormatted: string;
  incomeSum: number;
  expenseSum: number;
  transactions: TransactionWithDetails[];
  upcomingRecurring?: UpcomingRecurringOccurrence[];
}

export interface MonthlyTotals {
  income: number;
  expenses: number;
  net: number;
}

export interface CalendarDayTotal {
  day: number;
  dateStr: string;
  income: number;
  expense: number;
  net: number;
  count: number;
  projectedIncome?: number;
  projectedExpense?: number;
  projectedCount?: number;
}

export interface MonthSummaryRow {
  monthIndex: number;
  monthName: string;
  income: number;
  expense: number;
  net: number;
}

/**
 * Computes monthly totals for a given date range
 */
export async function getMonthlyTotals(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<MonthlyTotals> {
  const incomeSum = await prisma.transaction.aggregate({
    where: {
      userId,
      type: "INCOME",
      date: { gte: startDate, lte: endDate },
    },
    _sum: { amount: true },
  });

  const expenseSum = await prisma.transaction.aggregate({
    where: {
      userId,
      type: "EXPENSE",
      date: { gte: startDate, lte: endDate },
    },
    _sum: { amount: true },
  });

  // Transfer fees also count towards expenses
  const transferFeeSum = await prisma.transaction.aggregate({
    where: {
      userId,
      type: "TRANSFER",
      date: { gte: startDate, lte: endDate },
    },
    _sum: { fee: true },
  });

  const incomeDec = new Decimal(incomeSum._sum.amount?.toString() || 0);
  const expenseDec = new Decimal(expenseSum._sum.amount?.toString() || 0).plus(
    transferFeeSum._sum.fee?.toString() || 0
  );
  const netDec = incomeDec.minus(expenseDec);

  return {
    income: incomeDec.toNumber(),
    expenses: expenseDec.toNumber(),
    net: netDec.toNumber(),
  };
}

/**
 * Returns transactions grouped by date with day-level sums
 */
export async function getDailyGroupedTransactions(
  userId: string,
  startDate: Date,
  endDate: Date,
  filters?: {
    accountId?: string;
    categoryId?: string;
    type?: TransactionType;
  }
): Promise<DailyGroup[]> {
  const whereClause: Record<string, unknown> = {
    userId,
    date: { gte: startDate, lte: endDate },
  };

  if (filters?.type) {
    whereClause.type = filters.type;
  }

  if (filters?.accountId) {
    whereClause.OR = [
      { accountId: filters.accountId },
      { toAccountId: filters.accountId },
    ];
  }

  if (filters?.categoryId) {
    whereClause.categoryId = filters.categoryId;
  }

  const transactions = await prisma.transaction.findMany({
    where: whereClause,
    orderBy: { date: "desc" },
    include: {
      category: true,
      subcategory: true,
      account: true,
      toAccount: true,
    },
  });

  const groupsMap = new Map<string, DailyGroup>();

  for (const tx of transactions as TransactionWithDetails[]) {
    const txDate = new Date(tx.date);
    const dateStr = txDate.toISOString().slice(0, 10);

    if (!groupsMap.has(dateStr)) {
      const dayNumber = txDate.getDate();
      const dayOfWeek = txDate.toLocaleDateString("en-IN", { weekday: "short" });
      const dateFormatted = txDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      groupsMap.set(dateStr, {
        dateStr,
        dayNumber,
        dayOfWeek,
        dateFormatted,
        incomeSum: 0,
        expenseSum: 0,
        transactions: [],
      });
    }

    const group = groupsMap.get(dateStr)!;
    group.transactions.push(tx);

    const amt = Number(tx.amount);
    if (tx.type === "INCOME") {
      group.incomeSum += amt;
    } else if (tx.type === "EXPENSE") {
      group.expenseSum += amt;
    } else if (tx.type === "TRANSFER" && tx.fee) {
      group.expenseSum += Number(tx.fee);
    }
  }

  return Array.from(groupsMap.values()).sort((a, b) => b.dateStr.localeCompare(a.dateStr));
}

/**
 * Returns day-by-day totals for a given calendar month
 */
export async function getCalendarDayTotals(
  userId: string,
  year: number,
  month: number // 1 - 12
): Promise<Record<number, CalendarDayTotal>> {
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
    },
    select: {
      date: true,
      type: true,
      amount: true,
      fee: true,
    },
  });

  const totals: Record<number, CalendarDayTotal> = {};

  for (const tx of transactions) {
    const day = new Date(tx.date).getUTCDate();
    const dateStr = new Date(tx.date).toISOString().slice(0, 10);

    if (!totals[day]) {
      totals[day] = {
        day,
        dateStr,
        income: 0,
        expense: 0,
        net: 0,
        count: 0,
      };
    }

    const item = totals[day];
    item.count++;

    const amt = Number(tx.amount);
    if (tx.type === "INCOME") {
      item.income += amt;
    } else if (tx.type === "EXPENSE") {
      item.expense += amt;
    } else if (tx.type === "TRANSFER" && tx.fee) {
      item.expense += Number(tx.fee);
    }
    item.net = item.income - item.expense;
  }

  return totals;
}

/**
 * Returns annual 12-month summary for the Monthly view
 */
export async function getAnnualMonthlyBreakdown(
  userId: string,
  year: number
): Promise<MonthSummaryRow[]> {
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const results: MonthSummaryRow[] = [];

  for (let m = 0; m < 12; m++) {
    const start = new Date(Date.UTC(year, m, 1));
    const end = new Date(Date.UTC(year, m + 1, 0, 23, 59, 59, 999));

    const totals = await getMonthlyTotals(userId, start, end);
    results.push({
      monthIndex: m,
      monthName: monthNames[m],
      income: totals.income,
      expense: totals.expenses,
      net: totals.net,
    });
  }

  return results;
}
