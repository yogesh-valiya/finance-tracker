import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import Decimal from "decimal.js";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await props.params;
    const { searchParams } = new URL(req.url);
    const now = new Date();

    const period = searchParams.get("period") || "daily";
    const year = parseInt(searchParams.get("year") || now.getFullYear().toString(), 10);
    const month = parseInt(searchParams.get("month") || (now.getMonth() + 1).toString(), 10);

    const account = await prisma.account.findFirst({
      where: { id, userId: user.id },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Determine period boundaries
    let startDate: Date;
    let endDate: Date;

    if (period === "annually") {
      startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
    } else {
      // daily & monthly views default to the active month
      startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    }

    // 1. Calculate Starting Balance before startDate
    // Starting balance = InitialBalance + sum(prior credits) - sum(prior debits)
    let startingBalance = new Decimal(account.initialBalance.toString());

    // Prior transactions involving this account
    const priorTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: { lt: startDate },
        OR: [{ accountId: id }, { toAccountId: id }],
      },
    });

    for (const tx of priorTransactions) {
      const amt = new Decimal(tx.amount.toString());
      const fee = tx.fee ? new Decimal(tx.fee.toString()) : new Decimal(0);

      if (tx.accountId === id) {
        if (tx.type === "INCOME") {
          startingBalance = startingBalance.plus(amt);
        } else if (tx.type === "EXPENSE") {
          startingBalance = startingBalance.minus(amt);
        } else if (tx.type === "TRANSFER") {
          // Outgoing transfer from this account
          startingBalance = startingBalance.minus(amt).minus(fee);
        }
      } else if (tx.toAccountId === id && tx.type === "TRANSFER") {
        // Incoming transfer to this account
        startingBalance = startingBalance.plus(amt);
      }
    }

    // 2. Fetch transactions within the period, ordered chronologically (asc) to calculate running balance
    const periodTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: { gte: startDate, lte: endDate },
        OR: [{ accountId: id }, { toAccountId: id }],
      },
      orderBy: { date: "asc" },
      include: {
        category: true,
        subcategory: true,
        account: true,
        toAccount: true,
      },
    });

    let currentRunning = new Decimal(startingBalance);
    let totalDeposits = new Decimal(0);
    let totalWithdrawals = new Decimal(0);

    const ledgerItems = periodTransactions.map((tx) => {
      const amt = new Decimal(tx.amount.toString());
      const fee = tx.fee ? new Decimal(tx.fee.toString()) : new Decimal(0);

      let delta = new Decimal(0);
      let isCredit = false;

      if (tx.accountId === id) {
        if (tx.type === "INCOME") {
          delta = amt;
          isCredit = true;
          totalDeposits = totalDeposits.plus(amt);
        } else if (tx.type === "EXPENSE") {
          delta = amt.negated();
          isCredit = false;
          totalWithdrawals = totalWithdrawals.plus(amt);
        } else if (tx.type === "TRANSFER") {
          // Debit: amount + fee
          delta = amt.plus(fee).negated();
          isCredit = false;
          totalWithdrawals = totalWithdrawals.plus(amt.plus(fee));
        }
      } else if (tx.toAccountId === id && tx.type === "TRANSFER") {
        delta = amt;
        isCredit = true;
        totalDeposits = totalDeposits.plus(amt);
      }

      currentRunning = currentRunning.plus(delta);

      return {
        ...tx,
        isCredit,
        delta: delta.toNumber(),
        runningBalance: currentRunning.toNumber(),
      };
    });

    // Reverse for UI display (newest first)
    ledgerItems.reverse();

    // 4-Metric Statement Summary
    const closingBalance = currentRunning.toNumber();
    const netFlow = totalDeposits.minus(totalWithdrawals).toNumber();

    return NextResponse.json({
      account,
      period: { year, month, period },
      summary: {
        startingBalance: startingBalance.toNumber(),
        deposits: totalDeposits.toNumber(),
        withdrawals: totalWithdrawals.toNumber(),
        total: netFlow,
        closingBalance,
      },
      transactions: ledgerItems,
    });
  } catch (error) {
    console.error("Failed to get account ledger transactions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
