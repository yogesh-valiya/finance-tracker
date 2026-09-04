import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { processDueRecurringRules } from "@/lib/services/recurring-engine";

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await processDueRecurringRules(user.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to run recurring execution:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await processDueRecurringRules(user.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to check recurring rules:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
