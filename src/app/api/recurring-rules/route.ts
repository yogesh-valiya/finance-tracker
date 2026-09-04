import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { RecurringFrequency, RecurringTiming, TransactionType } from "@prisma/client";
import Decimal from "decimal.js";

const VALID_FREQUENCIES = Object.values(RecurringFrequency);
const VALID_TYPES = Object.values(TransactionType);
const VALID_TIMINGS = Object.values(RecurringTiming);

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rules = await prisma.recurringRule.findMany({
      where: { userId: user.id },
      include: {
        account: true,
        toAccount: true,
        category: true,
        subcategory: true,
      },
      orderBy: { nextExecutionDate: "asc" },
    });

    const expenses = rules.filter((r) => r.type === "EXPENSE");
    const transfers = rules.filter((r) => r.type === "TRANSFER");
    const income = rules.filter((r) => r.type === "INCOME");

    return NextResponse.json({
      all: rules,
      expenses,
      transfers,
      income,
    });
  } catch (error) {
    console.error("Failed to fetch recurring rules:", error);
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
      type,
      frequency,
      timing = "ON_DATE",
      advanceDays = 0,
      startDate,
      accountId,
      toAccountId,
      categoryId,
      subcategoryId,
      amount,
      fee,
      note,
      description,
    } = body;

    // Type validation
    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Frequency validation
    if (!frequency || !VALID_FREQUENCIES.includes(frequency)) {
      return NextResponse.json(
        { error: `Invalid frequency. Must be one of: ${VALID_FREQUENCIES.join(", ")}` },
        { status: 400 }
      );
    }

    // Timing validation
    if (timing && !VALID_TIMINGS.includes(timing)) {
      return NextResponse.json(
        { error: `Invalid timing. Must be ON_DATE or IN_ADVANCE` },
        { status: 400 }
      );
    }

    // Amount validation
    let amountDec: Decimal;
    try {
      amountDec = new Decimal(amount);
      if (amountDec.isNegative() || amountDec.isZero()) {
        return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid amount format" }, { status: 400 });
    }

    // Fee validation
    let feeDec: Decimal | null = null;
    if (fee !== undefined && fee !== null && fee !== "") {
      try {
        feeDec = new Decimal(fee);
        if (feeDec.isNegative()) {
          return NextResponse.json({ error: "Fee cannot be negative" }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ error: "Invalid fee format" }, { status: 400 });
      }
    }

    // Account validation
    if (!accountId) {
      return NextResponse.json({ error: "Source account is required" }, { status: 400 });
    }

    const sourceAccount = await prisma.account.findFirst({
      where: { id: accountId, userId: user.id },
    });
    if (!sourceAccount) {
      return NextResponse.json({ error: "Source account not found" }, { status: 404 });
    }

    if (type === "TRANSFER") {
      if (!toAccountId) {
        return NextResponse.json({ error: "Destination account is required for transfers" }, { status: 400 });
      }
      if (toAccountId === accountId) {
        return NextResponse.json({ error: "Source and destination accounts must be different" }, { status: 400 });
      }
      const destAccount = await prisma.account.findFirst({
        where: { id: toAccountId, userId: user.id },
      });
      if (!destAccount) {
        return NextResponse.json({ error: "Destination account not found" }, { status: 404 });
      }
    }

    // Category validation
    if (type !== "TRANSFER" && !categoryId) {
      return NextResponse.json({ error: "Category is required for income and expense" }, { status: 400 });
    }

    if (categoryId) {
      const cat = await prisma.category.findFirst({
        where: { id: categoryId, userId: user.id },
      });
      if (!cat) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
      }
    }

    const firstDate = startDate ? new Date(startDate) : new Date();

    const created = await prisma.recurringRule.create({
      data: {
        userId: user.id,
        type,
        frequency,
        timing,
        advanceDays: timing === "IN_ADVANCE" ? Math.max(1, Math.min(3, parseInt(advanceDays || 1, 10))) : 0,
        nextExecutionDate: firstDate,
        accountId,
        toAccountId: type === "TRANSFER" ? toAccountId : null,
        categoryId: type !== "TRANSFER" ? categoryId : null,
        subcategoryId: type !== "TRANSFER" ? subcategoryId || null : null,
        amount: amountDec.toString(),
        fee: feeDec ? feeDec.toString() : null,
        note: note?.trim() || null,
        description: description?.trim() || null,
        isActive: true,
      },
      include: {
        account: true,
        toAccount: true,
        category: true,
        subcategory: true,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Failed to create recurring rule:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
