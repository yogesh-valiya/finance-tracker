import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: user.id },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(bookmarks);
  } catch (error) {
    console.error("Failed to fetch bookmarks:", error);
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
    const { name, type, amount, accountId, toAccountId, categoryId, subcategoryId, note, description, fee } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Template name is required" }, { status: 400 });
    }

    const lastBookmark = await prisma.bookmark.findFirst({
      where: { userId: user.id },
      orderBy: { sortOrder: "desc" },
    });
    const nextSort = (lastBookmark?.sortOrder ?? -1) + 1;

    const created = await prisma.bookmark.create({
      data: {
        userId: user.id,
        name: name.trim(),
        type: type || "EXPENSE",
        amount: amount ? amount.toString() : null,
        accountId: accountId || null,
        toAccountId: toAccountId || null,
        categoryId: categoryId || null,
        subcategoryId: subcategoryId || null,
        note: note || null,
        description: description || null,
        fee: fee ? fee.toString() : null,
        sortOrder: nextSort,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Failed to create bookmark:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Bookmark ID is required" }, { status: 400 });
    }

    await prisma.bookmark.deleteMany({
      where: { id, userId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete bookmark:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
