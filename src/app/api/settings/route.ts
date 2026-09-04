import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let settings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    });

    if (!settings) {
      // Auto-provision default settings if not found
      settings = await prisma.userSettings.create({
        data: {
          userId: user.id,
          baseCurrency: user.baseCurrency || "INR",
        },
      });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        baseCurrency: user.baseCurrency,
      },
      settings,
    });
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const allowedFields = [
      "baseCurrency",
      "subCurrency",
      "exchangeRate",
      "startScreen",
      "monthlyStartDate",
      "weeklyStartDay",
      "carryOver",
      "swipeGesture",
      "colorScheme",
      "timeInput",
      "showDescription",
      "autocomplete",
      "inputOrder",
      "noteButton",
      "subcategoryEnabled",
      "reminderEnabled",
      "reminderTime",
    ];

    const updateData: any = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        if (key === "monthlyStartDate") {
          updateData[key] = Math.max(1, Math.min(28, parseInt(body[key], 10)));
        } else {
          updateData[key] = body[key];
        }
      }
    }

    // Also sync user's baseCurrency if updated
    if (body.baseCurrency && typeof body.baseCurrency === "string") {
      await prisma.user.update({
        where: { id: user.id },
        data: { baseCurrency: body.baseCurrency },
      });
    }

    const updated = await prisma.userSettings.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        ...updateData,
      },
      update: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
