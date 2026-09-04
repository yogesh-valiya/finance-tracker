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

    const { id } = await props.params;
    const body = await req.json().catch(() => ({}));

    const existing = await prisma.account.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const isHidden =
      typeof body.isHidden === "boolean" ? body.isHidden : !existing.isHidden;

    const updated = await prisma.account.update({
      where: { id },
      data: { isHidden },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to toggle account visibility:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
