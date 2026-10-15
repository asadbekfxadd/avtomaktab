import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";

export const SESSION_COOKIE = "am_session";
const secret = () => new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-change-me-please-32chars");

export type SessionPayload = { uid: number; role: "ADMIN" | "MANAGER"; name: string };

export async function createSession(p: SessionPayload) {
  const token = await new SignJWT(p).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("30d").sign(secret());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function verifyToken(token?: string) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const s = await verifyToken(token);
  if (!s) return null;
  const user = await db.user.findUnique({ where: { id: s.uid } });
  if (!user || !user.active) return null;
  return user;
}

export async function requireUser() {
  const u = await getSession();
  if (!u) redirect("/admin/login");
  return u;
}

export async function requireAdmin() {
  const u = await requireUser();
  if (u.role !== "ADMIN") redirect("/admin");
  return u;
}
