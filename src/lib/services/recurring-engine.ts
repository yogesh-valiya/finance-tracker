import { prisma } from "@/lib/prisma";
import { RecurringFrequency, RecurringTiming, RecurringRule, Prisma, TransactionType } from "@prisma/client";

/**
 * Computes the next execution date for a recurring rule given its base date and frequency.
 */
export function computeNextExecutionDate(baseDate: Date, frequency: RecurringFrequency): Date {
  const next = new Date(baseDate.getTime());

  switch (frequency) {
    case "DAILY": {
      next.setDate(next.getDate() + 1);
      return next;
    }
    case "WEEKDAYS": {
      // Monday(1) to Friday(5)
      do {
        next.setDate(next.getDate() + 1);
      } while (next.getDay() === 0 || next.getDay() === 6);
      return next;
    }
    case "WEEKEND": {
      // Saturday(6) or Sunday(0)
      do {
        next.setDate(next.getDate() + 1);
      } while (next.getDay() !== 0 && next.getDay() !== 6);
      return next;
    }
    case "WEEKLY": {
      next.setDate(next.getDate() + 7);
      return next;
    }
    case "BIWEEKLY": {
      next.setDate(next.getDate() + 14);
      return next;
    }
    case "EVERY_4_WEEKS": {
      next.setDate(next.getDate() + 28);
      return next;
    }
    case "MONTHLY": {
      const originalDay = baseDate.getDate();
      // Set to 1st of next month to avoid skipping months when target month has fewer days
      next.setDate(1);
      next.setMonth(next.getMonth() + 1);
      const daysInNextMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      next.setDate(Math.min(originalDay, daysInNextMonth));
      return next;
    }
    case "END_OF_MONTH": {
      // Move to 1st of next month, then find last day of that month
      next.setDate(1);
      next.setMonth(next.getMonth() + 1);
      const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      next.setDate(lastDay);
      return next;
    }
    case "EVERY_2_MONTHS": {
      const originalDay = baseDate.getDate();
      next.setDate(1);
      next.setMonth(next.getMonth() + 2);
      const daysInMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      next.setDate(Math.min(originalDay, daysInMonth));
      return next;
    }
    case "EVERY_3_MONTHS": {
      const originalDay = baseDate.getDate();
      next.setDate(1);
      next.setMonth(next.getMonth() + 3);
      const daysInMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      next.setDate(Math.min(originalDay, daysInMonth));
      return next;
    }
    case "EVERY_4_MONTHS": {
      const originalDay = baseDate.getDate();
      next.setDate(1);
      next.setMonth(next.getMonth() + 4);
      const daysInMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      next.setDate(Math.min(originalDay, daysInMonth));
      return next;
    }
    case "EVERY_6_MONTHS": {
      const originalDay = baseDate.getDate();
      next.setDate(1);
      next.setMonth(next.getMonth() + 6);
      const daysInMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      next.setDate(Math.min(originalDay, daysInMonth));
      return next;
    }
    case "ANNUALLY": {
      const originalDay = baseDate.getDate();
      const originalMonth = baseDate.getMonth();
      next.setFullYear(next.getFullYear() + 1);
      // Handle Feb 29 leap-year edge cases
      const daysInMonth = new Date(next.getFullYear(), originalMonth + 1, 0).getDate();
      next.setDate(Math.min(originalDay, daysInMonth));
      return next;
    }
    default: {
      next.setDate(next.getDate() + 1);
      return next;
    }
  }
}

/**
 * Formats frequency enum to clean user-friendly label.
 */
export const RECURRING_FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  DAILY: "Daily",
  WEEKDAYS: "Every Weekday (Mon–Fri)",
  WEEKEND: "Every Weekend (Sat–Sun)",
  WEEKLY: "Weekly",
  BIWEEKLY: "Every 2 Weeks",
  EVERY_4_WEEKS: "Every 4 Weeks",
  MONTHLY: "Monthly",
  END_OF_MONTH: "End of Month",
  EVERY_2_MONTHS: "Every 2 Months",
  EVERY_3_MONTHS: "Every 3 Months (Quarterly)",
  EVERY_4_MONTHS: "Every 4 Months",
  EVERY_6_MONTHS: "Every 6 Months (Half-Yearly)",
  ANNUALLY: "Annually",
};

export interface RecurringExecutionResult {
  processedCount: number;
  createdTransactionIds: string[];
  errors: Array<{ ruleId: string; error: string }>;
}

/**
 * Finds and executes all due recurring rules atomically.
 * If timing is IN_ADVANCE, triggers when (now + advanceDays) >= nextExecutionDate.
 */
export async function processDueRecurringRules(userId?: string): Promise<RecurringExecutionResult> {
  const now = new Date();
  
  // Find active rules
  const whereClause: Prisma.RecurringRuleWhereInput = {
    isActive: true,
  };
  if (userId) {
    whereClause.userId = userId;
  }

  const activeRules = await prisma.recurringRule.findMany({
    where: whereClause,
    include: {
      account: true,
      toAccount: true,
      category: true,
      subcategory: true,
    },
  });

  const result: RecurringExecutionResult = {
    processedCount: 0,
    createdTransactionIds: [],
    errors: [],
  };

  for (const rule of activeRules) {
    // Effective trigger threshold
    const effectiveTriggerDate = new Date(now.getTime());
    if (rule.timing === "IN_ADVANCE" && rule.advanceDays) {
      effectiveTriggerDate.setDate(effectiveTriggerDate.getDate() + rule.advanceDays);
    }

    if (rule.nextExecutionDate <= effectiveTriggerDate) {
      try {
        await prisma.$transaction(async (tx) => {
          // Double-check rule is still active and due inside transaction
          const currentRule = await tx.recurringRule.findUnique({
            where: { id: rule.id },
          });
          if (!currentRule || !currentRule.isActive || currentRule.nextExecutionDate > effectiveTriggerDate) {
            return;
          }

          // Create the scheduled transaction
          const createdTx = await tx.transaction.create({
            data: {
              userId: rule.userId,
              type: rule.type,
              amount: rule.amount,
              date: rule.nextExecutionDate,
              accountId: rule.accountId,
              toAccountId: rule.type === "TRANSFER" ? rule.toAccountId : null,
              categoryId: rule.type !== "TRANSFER" ? rule.categoryId : null,
              subcategoryId: rule.type !== "TRANSFER" ? rule.subcategoryId : null,
              fee: rule.fee,
              note: rule.note || `Recurring: ${RECURRING_FREQUENCY_LABELS[rule.frequency]}`,
              description: rule.description,
              recurringRuleId: rule.id,
            },
          });

          // Calculate next execution date
          const nextDate = computeNextExecutionDate(rule.nextExecutionDate, rule.frequency);

          // Update rule's next execution date
          await tx.recurringRule.update({
            where: { id: rule.id },
            data: {
              nextExecutionDate: nextDate,
            },
          });

          result.processedCount++;
          result.createdTransactionIds.push(createdTx.id);
        });
      } catch (err: any) {
        console.error(`Failed to execute recurring rule ${rule.id}:`, err);
        result.errors.push({ ruleId: rule.id, error: err?.message || "Execution failed" });
      }
    }
  }

  return result;
}

export interface UpcomingRecurringOccurrence {
  id: string;
  ruleId: string;
  isProjected: true;
  type: TransactionType;
  frequency: RecurringFrequency;
  frequencyLabel: string;
  amount: number;
  fee: number | null;
  date: string; // ISO string
  dateStr: string; // YYYY-MM-DD
  dayNumber: number;
  dayOfWeek: string;
  dateFormatted: string;
  note: string | null;
  description: string | null;
  accountId: string;
  account: { id: string; name: string; group: string };
  toAccountId: string | null;
  toAccount: { id: string; name: string; group: string } | null;
  categoryId: string | null;
  category: { id: string; name: string; emoji: string; type: string } | null;
  subcategoryId: string | null;
  subcategory: { id: string; name: string } | null;
  isDue: boolean;
  timing: RecurringTiming;
  advanceDays: number | null;
}

export interface UpcomingRecurringSummary {
  count: number;
  projectedIncome: number;
  projectedExpenses: number;
  projectedNet: number;
}

/**
 * Computes all projected occurrences of active recurring rules that fall within a given period [startDate, endDate].
 * Omits occurrences where a transaction was already posted for that rule on that date.
 */
export async function getProjectedRecurringOccurrences(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  occurrences: UpcomingRecurringOccurrence[];
  summary: UpcomingRecurringSummary;
}> {
  const activeRules = await prisma.recurringRule.findMany({
    where: {
      userId,
      isActive: true,
    },
    include: {
      account: { select: { id: true, name: true, group: true } },
      toAccount: { select: { id: true, name: true, group: true } },
      category: { select: { id: true, name: true, emoji: true, type: true } },
      subcategory: { select: { id: true, name: true } },
      transactions: {
        where: {
          date: { gte: startDate, lte: endDate },
        },
        select: { date: true },
      },
    },
  });

  const occurrences: UpcomingRecurringOccurrence[] = [];
  const now = new Date();

  for (const rule of activeRules) {
    const postedDates = new Set(
      rule.transactions.map((t) => t.date.toISOString().slice(0, 10))
    );

    let cur = new Date(rule.nextExecutionDate);
    let guard = 0;

    // Fast-forward to start of period if rule is in past
    while (cur < startDate && guard < 500) {
      cur = computeNextExecutionDate(cur, rule.frequency);
      guard++;
    }

    guard = 0;
    while (cur <= endDate && guard < 100) {
      if (cur >= startDate) {
        const dateStr = cur.toISOString().slice(0, 10);
        if (!postedDates.has(dateStr)) {
          const dayNumber = cur.getUTCDate();
          const dayOfWeek = cur.toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" });
          const dateFormatted = cur.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            timeZone: "UTC",
          });

          occurrences.push({
            id: `proj_${rule.id}_${dateStr}`,
            ruleId: rule.id,
            isProjected: true,
            type: rule.type,
            frequency: rule.frequency,
            frequencyLabel: RECURRING_FREQUENCY_LABELS[rule.frequency],
            amount: Number(rule.amount),
            fee: rule.fee ? Number(rule.fee) : null,
            date: cur.toISOString(),
            dateStr,
            dayNumber,
            dayOfWeek,
            dateFormatted,
            note: rule.note || `Recurring: ${RECURRING_FREQUENCY_LABELS[rule.frequency]}`,
            description: rule.description,
            accountId: rule.accountId,
            account: rule.account,
            toAccountId: rule.toAccountId,
            toAccount: rule.toAccount,
            categoryId: rule.categoryId,
            category: rule.category,
            subcategoryId: rule.subcategoryId,
            subcategory: rule.subcategory,
            isDue: cur <= now,
            timing: rule.timing,
            advanceDays: rule.advanceDays,
          });
        }
      }

      cur = computeNextExecutionDate(cur, rule.frequency);
      guard++;
    }
  }

  // Sort chronologically
  occurrences.sort((a, b) => a.date.localeCompare(b.date));

  let projectedIncome = 0;
  let projectedExpenses = 0;
  for (const occ of occurrences) {
    if (occ.type === "INCOME") {
      projectedIncome += occ.amount;
    } else if (occ.type === "EXPENSE") {
      projectedExpenses += occ.amount + (occ.fee || 0);
    } else if (occ.type === "TRANSFER" && occ.fee) {
      projectedExpenses += occ.fee;
    }
  }

  return {
    occurrences,
    summary: {
      count: occurrences.length,
      projectedIncome: Math.round(projectedIncome * 100) / 100,
      projectedExpenses: Math.round(projectedExpenses * 100) / 100,
      projectedNet: Math.round((projectedIncome - projectedExpenses) * 100) / 100,
    },
  };
}

/**
 * Manually posts an upcoming recurring rule execution immediately ahead of time.
 */
export async function executeSingleRecurringRule(
  ruleId: string,
  userId: string,
  targetDate?: Date
): Promise<{ transactionId: string; nextExecutionDate: Date }> {
  return await prisma.$transaction(async (tx) => {
    const rule = await tx.recurringRule.findFirst({
      where: { id: ruleId, userId },
    });

    if (!rule) {
      throw new Error("Recurring rule not found");
    }

    const executionDate = targetDate || rule.nextExecutionDate;

    // Create the transaction
    const createdTx = await tx.transaction.create({
      data: {
        userId: rule.userId,
        type: rule.type,
        amount: rule.amount,
        date: executionDate,
        accountId: rule.accountId,
        toAccountId: rule.type === "TRANSFER" ? rule.toAccountId : null,
        categoryId: rule.type !== "TRANSFER" ? rule.categoryId : null,
        subcategoryId: rule.type !== "TRANSFER" ? rule.subcategoryId : null,
        fee: rule.fee,
        note: rule.note || `Recurring: ${RECURRING_FREQUENCY_LABELS[rule.frequency]}`,
        description: rule.description,
        recurringRuleId: rule.id,
      },
    });

    // Advance nextExecutionDate
    const nextDate = computeNextExecutionDate(rule.nextExecutionDate, rule.frequency);

    await tx.recurringRule.update({
      where: { id: rule.id },
      data: {
        nextExecutionDate: nextDate,
      },
    });

    return {
      transactionId: createdTx.id,
      nextExecutionDate: nextDate,
    };
  });
}

