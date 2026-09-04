import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";

export async function PATCH(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accountId, direction } = await req.json();

    if (!accountId || (direction !== "up" && direction !== "down")) {
      return NextResponse.json(
        { error: "Missing accountId or valid direction ('up' or 'down')" },
        { status: 400 }
      );
    }

    const currentAccount = await prisma.account.findFirst({
      where: { id: accountId, userId: user.id },
    });

    if (!currentAccount) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Get all accounts in the same group ordered by sortOrder
    const groupAccounts = await prisma.account.findMany({
      where: { userId: user.id, group: currentAccount.group },
      orderBy: { sortOrder: "asc" },
    });

    const currentIndex = groupAccounts.findIndex((a) => a.id === accountId);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= groupAccounts.length) {
      // Already at the boundary
      return NextResponse.json({ success: true, message: "No reordering needed" });
    }

    const targetAccount = groupAccounts[targetIndex];

    // Swap sortOrder
    await prisma.$transaction([
      prisma.account.update({
        where: { id: currentAccount.id },
        data: { sortOrder: targetAccount.sortOrder },
      }),
      prisma.account.update({
        where: { id: targetAccount.id },
        data: { sortOrder: currentAccount.sortOrder },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to reorder accounts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
