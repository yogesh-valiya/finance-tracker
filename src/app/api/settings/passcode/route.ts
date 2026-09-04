import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import crypto from "crypto";

function hashPin(pin: string): string {
  return crypto.createHash("sha256").update(pin).digest("hex");
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { pin } = body;

    if (!pin || typeof pin !== "string" || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: "PIN must be exactly 4 digits" }, { status: 400 });
    }

    const hashed = hashPin(pin);

    const updated = await prisma.userSettings.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        passcodeEnabled: true,
        passcodeHash: hashed,
      },
      update: {
        passcodeEnabled: true,
        passcodeHash: hashed,
      },
    });

    return NextResponse.json({ success: true, passcodeEnabled: updated.passcodeEnabled });
  } catch (error) {
    console.error("Failed to set passcode:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { pin } = body;

    if (!pin || typeof pin !== "string") {
      return NextResponse.json({ error: "PIN is required" }, { status: 400 });
    }

    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    });

    if (!settings || !settings.passcodeHash) {
      return NextResponse.json({ valid: true }); // no passcode configured
    }

    const hashed = hashPin(pin);
    const valid = hashed === settings.passcodeHash;

    return NextResponse.json({ valid });
  } catch (error) {
    console.error("Failed to verify passcode:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updated = await prisma.userSettings.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        passcodeEnabled: false,
        passcodeHash: null,
      },
      update: {
        passcodeEnabled: false,
        passcodeHash: null,
      },
    });

    return NextResponse.json({ success: true, passcodeEnabled: updated.passcodeEnabled });
  } catch (error) {
    console.error("Failed to disable passcode:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
