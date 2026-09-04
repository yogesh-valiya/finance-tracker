import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import Decimal from "decimal.js";

const LIABILITY_GROUPS = new Set(["CREDIT_CARD", "LOAN"]);

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString(), 10);

    const accounts = await prisma.account.findMany({
      where: { userId: user.id, isHidden: false, includeInTotals: true },
    });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const trajectory = [];

    // For each of the 12 months, compute cumulative balances as of the end of the month
    for (let m = 0; m < 12; m++) {
      const monthEnd = new Date(Date.UTC(year, m + 1, 0, 23, 59, 59, 999));
      const monthStart = new Date(Date.UTC(year, m, 1, 0, 0, 0, 0));

      // 1. Transactions up to monthEnd to compute balances
      const historicalTransactions = await prisma.transaction.findMany({
        where: {
          userId: user.id,
          date: { lte: monthEnd },
        },
      });

      let totalAssets = new Decimal(0);
      let totalLiabilities = new Decimal(0);

      for (const acc of accounts) {
        let bal = new Decimal(acc.initialBalance.toString());

        for (const tx of historicalTransactions) {
          const amt = new Decimal(tx.amount.toString());
          const fee = tx.fee ? new Decimal(tx.fee.toString()) : new Decimal(0);

          if (tx.accountId === acc.id) {
            if (tx.type === "INCOME") bal = bal.plus(amt);
            else if (tx.type === "EXPENSE") bal = bal.minus(amt);
            else if (tx.type === "TRANSFER") bal = bal.minus(amt).minus(fee);
          } else if (tx.toAccountId === acc.id && tx.type === "TRANSFER") {
            bal = bal.plus(amt);
          }
        }

        if (LIABILITY_GROUPS.has(acc.group)) {
          // Liability
          if (acc.group === "CREDIT_CARD") {
            if (bal.isNegative()) {
              totalLiabilities = totalLiabilities.plus(bal.abs());
            }
          } else {
            // LOAN
            if (bal.isNegative()) {
              totalLiabilities = totalLiabilities.plus(bal.abs());
            } else {
              totalLiabilities = totalLiabilities.plus(bal);
            }
          }
        } else {
          // Asset
          totalAssets = totalAssets.plus(bal);
        }
      }

      const netWorth = totalAssets.minus(totalLiabilities).toNumber();

      // 2. Cashflow within this month
      const monthlyTxs = historicalTransactions.filter(
        (tx) => tx.date >= monthStart && tx.date <= monthEnd
      );

      let mIncome = new Decimal(0);
      let mExpense = new Decimal(0);

      for (const tx of monthlyTxs) {
        const amt = new Decimal(tx.amount.toString());
        if (tx.type === "INCOME") mIncome = mIncome.plus(amt);
        if (tx.type === "EXPENSE") mExpense = mExpense.plus(amt);
      }

      trajectory.push({
        month: monthNames[m],
        monthIndex: m,
        netWorth,
        assets: totalAssets.toNumber(),
        liabilities: totalLiabilities.toNumber(),
        income: mIncome.toNumber(),
        expenses: mExpense.toNumber(),
      });
    }

    return NextResponse.json({
      year,
      trajectory,
    });
  } catch (error) {
    console.error("Failed to get net worth trajectory:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
