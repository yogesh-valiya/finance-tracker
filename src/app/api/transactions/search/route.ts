import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";

    if (!query) {
      return NextResponse.json({
        metrics: { income: 0, expenses: 0, transfers: 0, total: 0 },
        transactions: [],
      });
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        OR: [
          { note: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { category: { name: { contains: query, mode: "insensitive" } } },
          { subcategory: { name: { contains: query, mode: "insensitive" } } },
          { account: { name: { contains: query, mode: "insensitive" } } },
          { toAccount: { name: { contains: query, mode: "insensitive" } } },
        ],
      },
      orderBy: { date: "desc" },
      take: 100,
      include: {
        category: true,
        subcategory: true,
        account: true,
        toAccount: true,
      },
    });

    let matchedIncome = 0;
    let matchedExpense = 0;
    let matchedTransfer = 0;

    for (const tx of transactions) {
      const amt = Number(tx.amount);
      if (tx.type === "INCOME") matchedIncome += amt;
      if (tx.type === "EXPENSE") matchedExpense += amt;
      if (tx.type === "TRANSFER") matchedTransfer += amt;
    }

    return NextResponse.json({
      metrics: {
        income: matchedIncome,
        expenses: matchedExpense,
        transfers: matchedTransfer,
        count: transactions.length,
      },
      transactions,
    });
  } catch (error) {
    console.error("Failed to search transactions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
