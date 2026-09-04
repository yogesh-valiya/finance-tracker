import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";

function escapeCsvField(field: any): string {
  if (field === null || field === undefined) return "";
  const str = String(field);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { startDate, endDate, format = "csv" } = body;

    const whereClause: any = { userId: user.id };
    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
      include: {
        account: true,
        toAccount: true,
        category: true,
        subcategory: true,
      },
    });

    if (format === "json") {
      return NextResponse.json({
        exportDate: new Date().toISOString(),
        totalCount: transactions.length,
        transactions,
      });
    }

    // Generate CSV
    const rows: string[] = [];

    // Header
    rows.push(
      [
        "Transaction ID",
        "Date",
        "Type",
        "Amount",
        "Account",
        "To Account",
        "Category",
        "Subcategory",
        "Fee",
        "Note",
        "Description",
      ].join(",")
    );

    for (const tx of transactions) {
      rows.push(
        [
          escapeCsvField(tx.id),
          escapeCsvField(tx.date.toISOString().slice(0, 10)),
          escapeCsvField(tx.type),
          escapeCsvField(Number(tx.amount).toFixed(2)),
          escapeCsvField(tx.account.name),
          escapeCsvField(tx.toAccount?.name || ""),
          escapeCsvField(tx.category?.name || ""),
          escapeCsvField(tx.subcategory?.name || ""),
          escapeCsvField(tx.fee ? Number(tx.fee).toFixed(2) : ""),
          escapeCsvField(tx.note || ""),
          escapeCsvField(tx.description || ""),
        ].join(",")
      );
    }

    const csvContent = rows.join("\r\n");

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="transactions-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error("Failed to generate export:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
