import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string; subId: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: categoryId, subId } = await props.params;
    const sub = await prisma.subcategory.findFirst({
      where: { id: subId, categoryId, userId: user.id },
    });

    if (!sub) {
      return NextResponse.json({ error: "Subcategory not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, sortOrder } = body;

    const updateData: any = {};
    if (name && typeof name === "string") updateData.name = name.trim();
    if (typeof sortOrder === "number") updateData.sortOrder = sortOrder;

    const updated = await prisma.subcategory.update({
      where: { id: subId },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update subcategory:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string; subId: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: categoryId, subId } = await props.params;
    const sub = await prisma.subcategory.findFirst({
      where: { id: subId, categoryId, userId: user.id },
    });

    if (!sub) {
      return NextResponse.json({ error: "Subcategory not found" }, { status: 404 });
    }

    // Set null on referencing transactions, bookmarks, and recurring rules
    await prisma.$transaction(async (tx) => {
      await tx.transaction.updateMany({
        where: { subcategoryId: subId, userId: user.id },
        data: { subcategoryId: null },
      });
      await tx.recurringRule.updateMany({
        where: { subcategoryId: subId, userId: user.id },
        data: { subcategoryId: null },
      });
      await tx.bookmark.updateMany({
        where: { subcategoryId: subId, userId: user.id },
        data: { subcategoryId: null },
      });
      await tx.subcategory.delete({ where: { id: subId } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete subcategory:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
