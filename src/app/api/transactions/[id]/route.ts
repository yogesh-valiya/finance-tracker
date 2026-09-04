import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { TransactionType } from "@prisma/client";
import Decimal from "decimal.js";

const VALID_TYPES = Object.values(TransactionType);

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

    const tx = await prisma.transaction.findFirst({
      where: { id, userId: user.id },
      include: {
        category: true,
        subcategory: true,
        account: true,
        toAccount: true,
      },
    });

    if (!tx) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    return NextResponse.json(tx);
  } catch (error) {
    console.error("Failed to get transaction detail:", error);
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
    const existing = await prisma.transaction.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    if (body.type !== undefined) {
      if (!VALID_TYPES.includes(body.type as TransactionType)) {
        return NextResponse.json({ error: "Invalid transaction type" }, { status: 400 });
      }
      updateData.type = body.type as TransactionType;
    }

    if (body.amount !== undefined) {
      try {
        const amt = new Decimal(body.amount);
        if (amt.isNegative() || amt.isZero()) {
          return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 });
        }
        updateData.amount = amt.toString();
      } catch {
        return NextResponse.json({ error: "Invalid amount format" }, { status: 400 });
      }
    }

    if (body.fee !== undefined) {
      if (body.fee === null || body.fee === "") {
        updateData.fee = null;
      } else {
        try {
          const feeDec = new Decimal(body.fee);
          if (feeDec.isNegative()) {
            return NextResponse.json({ error: "Fee cannot be negative" }, { status: 400 });
          }
          updateData.fee = feeDec.toString();
        } catch {
          return NextResponse.json({ error: "Invalid fee format" }, { status: 400 });
        }
      }
    }

    if (body.date !== undefined) {
      updateData.date = new Date(body.date);
    }

    if (body.accountId !== undefined) {
      const acc = await prisma.account.findFirst({
        where: { id: body.accountId, userId: user.id },
      });
      if (!acc) {
        return NextResponse.json({ error: "Source account not found" }, { status: 404 });
      }
      updateData.accountId = body.accountId;
    }

    if (body.toAccountId !== undefined) {
      if (body.toAccountId) {
        const toAcc = await prisma.account.findFirst({
          where: { id: body.toAccountId, userId: user.id },
        });
        if (!toAcc) {
          return NextResponse.json({ error: "Destination account not found" }, { status: 404 });
        }
        updateData.toAccountId = body.toAccountId;
      } else {
        updateData.toAccountId = null;
      }
    }

    if (body.categoryId !== undefined) {
      if (body.categoryId) {
        const cat = await prisma.category.findFirst({
          where: { id: body.categoryId, userId: user.id },
        });
        if (!cat) {
          return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }
        updateData.categoryId = body.categoryId;
      } else {
        updateData.categoryId = null;
      }
    }

    if (body.subcategoryId !== undefined) {
      updateData.subcategoryId = body.subcategoryId || null;
    }

    if (body.note !== undefined) {
      updateData.note = body.note?.trim() || null;
    }

    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null;
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        subcategory: true,
        account: true,
        toAccount: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update transaction:", error);
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

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    await prisma.transaction.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete transaction:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
