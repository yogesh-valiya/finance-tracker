import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { executeSingleRecurringRule } from "@/lib/services/recurring-engine";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    let targetDate: Date | undefined = undefined;

    try {
      const body = await req.json();
      if (body.targetDate) {
        targetDate = new Date(body.targetDate);
      }
    } catch {
      // Body might be empty, targetDate remains undefined
    }

    const result = await executeSingleRecurringRule(id, user.id, targetDate);

    return NextResponse.json({
      success: true,
      transactionId: result.transactionId,
      nextExecutionDate: result.nextExecutionDate.toISOString(),
    });
  } catch (error: any) {
    console.error("Failed to post recurring rule now:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
