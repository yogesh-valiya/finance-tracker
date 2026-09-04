import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: categoryId } = await props.params;
    const body = await req.json();
    const { subcategoryIds } = body;

    if (!Array.isArray(subcategoryIds) || subcategoryIds.length === 0) {
      return NextResponse.json({ error: "subcategoryIds array is required" }, { status: 400 });
    }

    await prisma.$transaction(
      subcategoryIds.map((subId: string, index: number) =>
        prisma.subcategory.updateMany({
          where: { id: subId, categoryId, userId: user.id },
          data: { sortOrder: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to reorder subcategories:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
