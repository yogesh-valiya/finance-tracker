import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { RecurringFrequency, RecurringTiming, TransactionType } from "@prisma/client";
import Decimal from "decimal.js";

const VALID_FREQUENCIES = Object.values(RecurringFrequency);
const VALID_TYPES = Object.values(TransactionType);
const VALID_TIMINGS = Object.values(RecurringTiming);

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
    const rule = await prisma.recurringRule.findFirst({
      where: { id, userId: user.id },
      include: {
        account: true,
        toAccount: true,
        category: true,
        subcategory: true,
      },
    });

    if (!rule) {
      return NextResponse.json({ error: "Recurring rule not found" }, { status: 404 });
    }

    return NextResponse.json(rule);
  } catch (error) {
    console.error("Failed to fetch recurring rule:", error);
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
    const rule = await prisma.recurringRule.findFirst({
      where: { id, userId: user.id },
    });
    if (!rule) {
      return NextResponse.json({ error: "Recurring rule not found" }, { status: 404 });
    }

    const body = await req.json();
    const updateData: any = {};

    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
    }

    if (body.frequency) {
      if (!VALID_FREQUENCIES.includes(body.frequency)) {
        return NextResponse.json({ error: "Invalid frequency" }, { status: 400 });
      }
      updateData.frequency = body.frequency;
    }

    if (body.timing) {
      if (!VALID_TIMINGS.includes(body.timing)) {
        return NextResponse.json({ error: "Invalid timing" }, { status: 400 });
      }
      updateData.timing = body.timing;
      if (body.timing === "IN_ADVANCE") {
        updateData.advanceDays = Math.max(1, Math.min(3, parseInt(body.advanceDays || 1, 10)));
      } else {
        updateData.advanceDays = 0;
      }
    }

    if (body.nextExecutionDate) {
      updateData.nextExecutionDate = new Date(body.nextExecutionDate);
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

    if (body.accountId) {
      const acc = await prisma.account.findFirst({
        where: { id: body.accountId, userId: user.id },
      });
      if (!acc) return NextResponse.json({ error: "Account not found" }, { status: 404 });
      updateData.accountId = body.accountId;
    }

    if (body.toAccountId !== undefined) {
      if (body.toAccountId) {
        const toAcc = await prisma.account.findFirst({
          where: { id: body.toAccountId, userId: user.id },
        });
        if (!toAcc) return NextResponse.json({ error: "To-Account not found" }, { status: 404 });
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
        if (!cat) return NextResponse.json({ error: "Category not found" }, { status: 404 });
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

    const updated = await prisma.recurringRule.update({
      where: { id },
      data: updateData,
      include: {
        account: true,
        toAccount: true,
        category: true,
        subcategory: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update recurring rule:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await props.params;
    const rule = await prisma.recurringRule.findFirst({
      where: { id, userId: user.id },
    });
    if (!rule) {
      return NextResponse.json({ error: "Recurring rule not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const hardDelete = searchParams.get("hard") === "true";

    if (hardDelete) {
      await prisma.recurringRule.delete({ where: { id } });
    } else {
      // Rule 002 / §6.5 standard: mark inactive to preserve reference
      await prisma.recurringRule.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete recurring rule:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
