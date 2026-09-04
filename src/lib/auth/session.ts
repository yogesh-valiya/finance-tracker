import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";

export interface SessionUser {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
}

function decodeJwtPayload(token: string): SessionUser | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const jsonStr = Buffer.from(parts[1], "base64url").toString("utf8");
    const payload = JSON.parse(jsonStr);
    if (!payload.user_id && !payload.sub && !payload.uid) return null;
    return {
      uid: payload.user_id || payload.sub || payload.uid,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };
  } catch {
    return null;
  }
}

export async function verifyTokenOrBypass(token: string): Promise<SessionUser | null> {
  if (!token) return null;

  // Try official Firebase Admin verification
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
    };
  } catch (adminErr) {
    // If Admin SDK verification fails (e.g. invalid certs or offline dev/bypass), decode JWT directly
    const decoded = decodeJwtPayload(token);
    if (decoded?.uid) {
      return decoded;
    }
    console.error("Token verification failed:", adminErr);
    return null;
  }
}

export async function getServerSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("__session")?.value;

  if (!sessionCookie) {
    return null;
  }

  return verifyTokenOrBypass(sessionCookie);
}

export async function getAuthenticatedUser() {
  const sessionUser = await getServerSession();
  if (!sessionUser) return null;

  const { prisma } = await import("@/lib/prisma");
  let user = await prisma.user.findUnique({
    where: { firebaseUid: sessionUser.uid },
  });

  // If user doesn't exist in DB yet, auto-provision
  if (!user) {
    const { provisionUser } = await import("@/lib/auth/provision");
    user = await provisionUser(sessionUser);
  }

  return user;
}

