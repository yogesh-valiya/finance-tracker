import { prisma } from "@/lib/prisma";
import Decimal from "decimal.js";
import { Account, AccountGroup, TransactionType } from "@prisma/client";

// Classification groups
export const ASSET_GROUPS: AccountGroup[] = [
  "CASH",
  "BANK_ACCOUNT",
  "SAVINGS",
  "DEBIT_CARD",
  "INVESTMENT",
  "INSURANCE",
  "PREPAID",
  "OTHER",
];

export const LIABILITY_GROUPS: AccountGroup[] = [
  "CREDIT_CARD",
  "LOAN",
  "OVERDRAFT",
];

export interface ComputedAccount extends Account {
  currentBalance: number;
  balancePayable?: number;
  outstandingBalance?: number;
}

export interface NetWorthSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  accountsByGroup: Record<AccountGroup, ComputedAccount[]>;
}

/**
 * Computes exact balance for an account using Decimal.js
 * Balance = InitialBalance + ΣIncome - ΣExpense + ΣTransferIn - Σ(TransferOut + Fee)
 */
export async function computeAccountBalance(
  accountId: string,
  userId: string
): Promise<Decimal> {
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId },
  });

  if (!account) {
    throw new Error("Account not found");
  }

  const initial = new Decimal(account.initialBalance.toString());

  // Sum of Income transactions to this account
  const incomeSum = await prisma.transaction.aggregate({
    where: {
      accountId,
      userId,
      type: "INCOME",
    },
    _sum: { amount: true },
  });
  const income = new Decimal(incomeSum._sum.amount?.toString() || 0);

  // Sum of Expense transactions from this account
  const expenseSum = await prisma.transaction.aggregate({
    where: {
      accountId,
      userId,
      type: "EXPENSE",
    },
    _sum: { amount: true },
  });
  const expense = new Decimal(expenseSum._sum.amount?.toString() || 0);

  // Sum of Transfers into this account
  const transferInSum = await prisma.transaction.aggregate({
    where: {
      toAccountId: accountId,
      userId,
      type: "TRANSFER",
    },
    _sum: { amount: true },
  });
  const transferIn = new Decimal(transferInSum._sum.amount?.toString() || 0);

  // Sum of Transfers out of this account (amount + fee)
  const transferOutSum = await prisma.transaction.aggregate({
    where: {
      accountId,
      userId,
      type: "TRANSFER",
    },
    _sum: { amount: true, fee: true },
  });
  const transferOut = new Decimal(transferOutSum._sum.amount?.toString() || 0);
  const transferFee = new Decimal(transferOutSum._sum.fee?.toString() || 0);

  // Balance = Initial + Income - Expense + TransferIn - (TransferOut + Fee)
  const balance = initial
    .plus(income)
    .minus(expense)
    .plus(transferIn)
    .minus(transferOut.plus(transferFee));

  return balance;
}

/**
 * Computes credit card billing cycle metrics (Statement Balance Payable & Outstanding Balance)
 */
export async function computeCreditCardMetrics(
  account: Account,
  userId: string
): Promise<{ balancePayable: number; outstandingBalance: number }> {
  const balance = await computeAccountBalance(account.id, userId);
  const absBalance = balance.abs().toNumber();

  const metadata = (account.metadata as { settlementDay?: number; paymentDay?: number }) || {};
  const settlementDay = metadata.settlementDay || 1;
  const now = new Date();
  const currentDay = now.getDate();

  // If before settlement day, current cycle is still unbilled
  // For initial MVP state, balance payable is the current statement liability
  return {
    balancePayable: absBalance,
    outstandingBalance: absBalance,
  };
}

/**
 * Computes aggregated Net Worth and grouped account balances for a user
 */
export async function computeNetWorth(userId: string): Promise<NetWorthSummary> {
  const accounts = await prisma.account.findMany({
    where: { userId },
    orderBy: { sortOrder: "asc" },
  });

  let totalAssets = new Decimal(0);
  let totalLiabilities = new Decimal(0);

  const initialGroups: Record<AccountGroup, ComputedAccount[]> = {
    CASH: [],
    BANK_ACCOUNT: [],
    CREDIT_CARD: [],
    DEBIT_CARD: [],
    SAVINGS: [],
    PREPAID: [],
    INVESTMENT: [],
    OVERDRAFT: [],
    LOAN: [],
    INSURANCE: [],
    OTHER: [],
  };

  const accountsByGroup = { ...initialGroups };

  for (const account of accounts) {
    const balanceDecimal = await computeAccountBalance(account.id, userId);
    const balanceNum = balanceDecimal.toNumber();

    let computed: ComputedAccount = {
      ...account,
      currentBalance: balanceNum,
    };

    if (account.group === "CREDIT_CARD") {
      const ccMetrics = await computeCreditCardMetrics(account, userId);
      computed = {
        ...computed,
        balancePayable: ccMetrics.balancePayable,
        outstandingBalance: ccMetrics.outstandingBalance,
      };
    }

    accountsByGroup[account.group].push(computed);

    // Only include in Net Worth if includeInTotals is true
    if (account.includeInTotals) {
      if (LIABILITY_GROUPS.includes(account.group)) {
        // Liabilities are positive magnitude reducing net worth
        totalLiabilities = totalLiabilities.plus(balanceDecimal.abs());
      } else {
        // Assets are positive
        totalAssets = totalAssets.plus(balanceDecimal);
      }
    }
  }

  const netWorth = totalAssets.minus(totalLiabilities);

  return {
    totalAssets: totalAssets.toNumber(),
    totalLiabilities: totalLiabilities.toNumber(),
    netWorth: netWorth.toNumber(),
    accountsByGroup,
  };
}
