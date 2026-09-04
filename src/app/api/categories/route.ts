import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categories = await prisma.category.findMany({
      where: { userId: user.id },
      include: {
        subcategories: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    const incomeCategories = categories.filter((c) => c.type === "INCOME");
    const expenseCategories = categories.filter((c) => c.type === "EXPENSE");

    return NextResponse.json({
      all: categories,
      income: incomeCategories,
      expense: expenseCategories,
    });
  } catch (error) {
    console.error("Failed to fetch categories:", error);
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
    const { name, emoji = "📁", type, subcategories = [] } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    if (type !== "INCOME" && type !== "EXPENSE") {
      return NextResponse.json({ error: "Type must be INCOME or EXPENSE" }, { status: 400 });
    }

    // Get current max sortOrder
    const maxOrder = await prisma.category.findFirst({
      where: { userId: user.id, type },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const sortOrder = (maxOrder?.sortOrder ?? -1) + 1;

    const created = await prisma.category.create({
      data: {
        userId: user.id,
        name: name.trim(),
        emoji: emoji.trim() || "📁",
        type,
        sortOrder,
        subcategories: {
          create: Array.isArray(subcategories)
            ? subcategories
                .filter((s: any) => typeof s === "string" && s.trim())
                .map((s: string, idx: number) => ({
                  userId: user.id,
                  name: s.trim(),
                  sortOrder: idx,
                }))
            : [],
        },
      },
      include: {
        subcategories: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Failed to create category:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

