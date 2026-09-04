import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyTokenOrBypass } from "@/lib/auth/session";
import { provisionUser } from "@/lib/auth/provision";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { idToken } = body;

    if (!idToken) {
      return NextResponse.json({ error: "Missing ID token" }, { status: 400 });
    }

    const sessionUser = await verifyTokenOrBypass(idToken);
    if (!sessionUser) {
      return NextResponse.json({ error: "Invalid ID token" }, { status: 401 });
    }

    // Automatically provision user with default seed accounts and categories
    const dbUser = await provisionUser(sessionUser);

    // Set 14-day session cookie (only enforce Secure flag when request is actually HTTPS)
    const forwardedProto = req.headers.get("x-forwarded-proto");
    const isHttps = forwardedProto === "https" || req.url.startsWith("https://");

    const cookieStore = await cookies();
    cookieStore.set("__session", idToken, {
      maxAge: 14 * 24 * 60 * 60,
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        firebaseUid: dbUser.firebaseUid,
        email: dbUser.email,
        displayName: dbUser.displayName,
      },
    });
  } catch (err: unknown) {
    console.error("Session creation error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set("__session", "", {
    maxAge: 0,
    path: "/",
  });
  return NextResponse.json({ success: true });
}
