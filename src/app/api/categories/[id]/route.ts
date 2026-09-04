import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";

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
    const category = await prisma.category.findFirst({
      where: { id, userId: user.id },
      include: {
        subcategories: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Failed to fetch category:", error);
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
    const category = await prisma.category.findFirst({
      where: { id, userId: user.id },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, emoji, sortOrder } = body;

    const updateData: any = {};
    if (name && typeof name === "string") updateData.name = name.trim();
    if (emoji && typeof emoji === "string") updateData.emoji = emoji.trim();
    if (typeof sortOrder === "number") updateData.sortOrder = sortOrder;

    const updated = await prisma.category.update({
      where: { id },
      data: updateData,
      include: {
        subcategories: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update category:", error);
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
    const category = await prisma.category.findFirst({
      where: { id, userId: user.id },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    let reassignToCategoryId = searchParams.get("reassignToCategoryId");

    // Also check JSON body if available
    try {
      const body = await req.json();
      if (body.reassignToCategoryId) {
        reassignToCategoryId = body.reassignToCategoryId;
      }
    } catch {
      // Body may be empty
    }

    // Check transactions referencing this category
    const transactionCount = await prisma.transaction.count({
      where: { categoryId: id, userId: user.id },
    });

    if (transactionCount > 0) {
      if (!reassignToCategoryId) {
        return NextResponse.json(
          {
            error: "Category has linked transactions",
            transactionCount,
            requiresReassignment: true,
          },
          { status: 409 }
        );
      }

      // Verify target category
      const targetCategory = await prisma.category.findFirst({
        where: { id: reassignToCategoryId, userId: user.id },
      });
      if (!targetCategory) {
        return NextResponse.json({ error: "Target category not found" }, { status: 400 });
      }

      // Atomically reassign transactions and delete category
      await prisma.$transaction(async (tx) => {
        await tx.transaction.updateMany({
          where: { categoryId: id, userId: user.id },
          data: { categoryId: reassignToCategoryId, subcategoryId: null },
        });

        // Also update any recurring rules or bookmarks
        await tx.recurringRule.updateMany({
          where: { categoryId: id, userId: user.id },
          data: { categoryId: reassignToCategoryId, subcategoryId: null },
        });

        await tx.bookmark.updateMany({
          where: { categoryId: id, userId: user.id },
          data: { categoryId: reassignToCategoryId, subcategoryId: null },
        });

        await tx.category.delete({ where: { id } });
      });

      return NextResponse.json({ success: true, reassignedCount: transactionCount });
    }

    // No linked transactions -> safe delete
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete category:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
