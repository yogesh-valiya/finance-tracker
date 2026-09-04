import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";

export async function PATCH(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { categoryIds } = body;

    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return NextResponse.json({ error: "categoryIds array is required" }, { status: 400 });
    }

    await prisma.$transaction(
      categoryIds.map((id: string, index: number) =>
        prisma.category.updateMany({
          where: { id, userId: user.id },
          data: { sortOrder: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to reorder categories:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
