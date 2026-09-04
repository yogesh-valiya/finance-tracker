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
    const year = parseInt(searchParams.get("year") || now.getFullYear().toString(), 10);
    const month = parseInt(searchParams.get("month") || (now.getMonth() + 1).toString(), 10);

    const category = await prisma.category.findFirst({
      where: { id, userId: user.id },
      include: { subcategories: true },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Period boundaries for current view
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    // Transactions in this category during the active month
    const periodTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        categoryId: id,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: "desc" },
      include: {
        subcategory: true,
        account: true,
      },
    });

    let periodTotal = new Decimal(0);
    const subcategoryTotals: Record<string, { id: string; name: string; amount: Decimal }> = {};

    for (const tx of periodTransactions) {
      const amt = new Decimal(tx.amount.toString());
      periodTotal = periodTotal.plus(amt);

      if (tx.subcategory) {
        if (!subcategoryTotals[tx.subcategory.id]) {
          subcategoryTotals[tx.subcategory.id] = {
            id: tx.subcategory.id,
            name: tx.subcategory.name,
            amount: new Decimal(0),
          };
        }
        subcategoryTotals[tx.subcategory.id].amount = subcategoryTotals[tx.subcategory.id].amount.plus(amt);
      }
    }

    const subcategoryBreakdown = Object.values(subcategoryTotals).map((s) => ({
      id: s.id,
      name: s.name,
      amount: s.amount.toNumber(),
      percentage: periodTotal.isZero() ? 0 : Math.round(s.amount.dividedBy(periodTotal).times(100).toNumber()),
    })).sort((a, b) => b.amount - a.amount);

    // 12-Month Historical Trend for this Category
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const annualTrend = [];

    for (let m = 0; m < 12; m++) {
      const mStart = new Date(Date.UTC(year, m, 1, 0, 0, 0, 0));
      const mEnd = new Date(Date.UTC(year, m + 1, 0, 23, 59, 59, 999));

      const mSum = await prisma.transaction.aggregate({
        where: {
          userId: user.id,
          categoryId: id,
          date: { gte: mStart, lte: mEnd },
        },
        _sum: { amount: true },
      });

      annualTrend.push({
        month: monthNames[m],
        monthIndex: m,
        amount: new Decimal(mSum._sum.amount?.toString() || 0).toNumber(),
      });
    }

    return NextResponse.json({
      category,
      period: { year, month },
      periodTotal: periodTotal.toNumber(),
      subcategoryBreakdown,
      annualTrend,
      transactions: periodTransactions,
    });
  } catch (error) {
    console.error("Failed to get category deep dive:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
