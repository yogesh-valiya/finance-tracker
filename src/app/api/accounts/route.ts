import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { computeNetWorth } from "@/lib/services/balance";
import { AccountGroup } from "@prisma/client";
import Decimal from "decimal.js";

const VALID_GROUPS = Object.values(AccountGroup);

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const summary = await computeNetWorth(user.id);
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Failed to fetch accounts:", error);
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
      name,
      group,
      initialBalance = 0,
      description,
      includeInTotals = true,
      isHidden = false,
      metadata,
      reconcile = false,
    } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "Account name is required" }, { status: 400 });
    }

    if (!group || !VALID_GROUPS.includes(group as AccountGroup)) {
      return NextResponse.json(
        { error: `Invalid account group. Must be one of: ${VALID_GROUPS.join(", ")}` },
        { status: 400 }
      );
    }

    // Exact decimal validation
    let balanceDecimal: Decimal;
    try {
      balanceDecimal = new Decimal(initialBalance);
    } catch {
      return NextResponse.json({ error: "Invalid initial balance format" }, { status: 400 });
    }

    // Loans must be negative balances per Rule 011 and §4.5
    if (group === "LOAN" && balanceDecimal.isPositive() && !balanceDecimal.isZero()) {
      balanceDecimal = balanceDecimal.negated();
    }

    // Get highest sortOrder in group for ordering
    const lastAccount = await prisma.account.findFirst({
      where: { userId: user.id, group: group as AccountGroup },
      orderBy: { sortOrder: "desc" },
    });
    const nextSortOrder = (lastAccount?.sortOrder ?? -1) + 1;

    // Run creation & optional reconciliation transaction
    const result = await prisma.$transaction(async (tx) => {
      const newAccount = await tx.account.create({
        data: {
          userId: user.id,
          name: name.trim(),
          group: group as AccountGroup,
          initialBalance: reconcile ? "0" : balanceDecimal.toString(),
          description: description?.trim() || null,
          includeInTotals: Boolean(includeInTotals),
          isHidden: Boolean(isHidden),
          sortOrder: nextSortOrder,
          metadata: metadata || null,
        },
      });

      // Reconciliation: If initial balance > 0 and user opts in, create an Income transaction
      if (reconcile && balanceDecimal.isPositive() && !balanceDecimal.isZero()) {
        await tx.transaction.create({
          data: {
            userId: user.id,
            accountId: newAccount.id,
            type: "INCOME",
            amount: balanceDecimal.toString(),
            date: new Date(),
            note: "Account opening balance reconciliation",
          },
        });
      }

      return newAccount;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Failed to create account:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
