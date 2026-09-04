import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { computeAccountBalance, computeCreditCardMetrics } from "@/lib/services/balance";
import { AccountGroup } from "@prisma/client";
import Decimal from "decimal.js";

const VALID_GROUPS = Object.values(AccountGroup);

export async function GET(
  _req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await props.params;

    const account = await prisma.account.findFirst({
      where: { id, userId: user.id },
      include: {
        transactionsFrom: {
          orderBy: { date: "desc" },
          take: 50,
          include: { category: true, subcategory: true },
        },
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const balanceDecimal = await computeAccountBalance(account.id, user.id);
    let extraMetrics = {};

    if (account.group === "CREDIT_CARD") {
      extraMetrics = await computeCreditCardMetrics(account, user.id);
    }

    return NextResponse.json({
      ...account,
      currentBalance: balanceDecimal.toNumber(),
      ...extraMetrics,
    });
  } catch (error) {
    console.error("Failed to fetch account detail:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await props.params;
    const body = await req.json();

    const existing = await prisma.account.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const dataToUpdate: Record<string, unknown> = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim() === "") {
        return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      }
      dataToUpdate.name = body.name.trim();
    }

    if (body.group !== undefined) {
      if (!VALID_GROUPS.includes(body.group as AccountGroup)) {
        return NextResponse.json({ error: "Invalid group" }, { status: 400 });
      }
      dataToUpdate.group = body.group as AccountGroup;
    }

    if (body.description !== undefined) {
      dataToUpdate.description = body.description?.trim() || null;
    }

    if (body.includeInTotals !== undefined) {
      dataToUpdate.includeInTotals = Boolean(body.includeInTotals);
    }

    if (body.isHidden !== undefined) {
      dataToUpdate.isHidden = Boolean(body.isHidden);
    }

    if (body.metadata !== undefined) {
      dataToUpdate.metadata = body.metadata;
    }

    if (body.initialBalance !== undefined) {
      try {
        let dec = new Decimal(body.initialBalance);
        if (
          (dataToUpdate.group === "LOAN" || existing.group === "LOAN") &&
          dec.isPositive() &&
          !dec.isZero()
        ) {
          dec = dec.negated();
        }
        dataToUpdate.initialBalance = dec.toString();
      } catch {
        return NextResponse.json({ error: "Invalid initial balance format" }, { status: 400 });
      }
    }

    const updated = await prisma.account.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update account:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await props.params;

    const existing = await prisma.account.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Check for existing transactions
    const transactionCount = await prisma.transaction.count({
      where: {
        OR: [{ accountId: id }, { toAccountId: id }],
      },
    });

    if (transactionCount > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete account with existing transactions. Please delete or reassign all transactions in this account first (§8.5).",
        },
        { status: 409 }
      );
    }

    await prisma.account.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete account:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
