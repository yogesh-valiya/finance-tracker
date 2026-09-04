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

    const { id: categoryId } = await props.params;
    const subcategories = await prisma.subcategory.findMany({
      where: { categoryId, userId: user.id },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(subcategories);
  } catch (error) {
    console.error("Failed to fetch subcategories:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: categoryId } = await props.params;
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId: user.id },
    });
    if (!category) {
      return NextResponse.json({ error: "Parent category not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Subcategory name is required" }, { status: 400 });
    }

    const maxOrder = await prisma.subcategory.findFirst({
      where: { categoryId, userId: user.id },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const sortOrder = (maxOrder?.sortOrder ?? -1) + 1;

    const created = await prisma.subcategory.create({
      data: {
        userId: user.id,
        categoryId,
        name: name.trim(),
        sortOrder,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Failed to create subcategory:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
