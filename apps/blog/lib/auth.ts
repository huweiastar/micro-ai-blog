import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { signToken, verifyToken, SESSION_MAX_AGE } from "@pkg/auth";
import { getSessionVersion } from "./auth-version";

const COOKIE_NAME = "admin_session";

export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export function verifyPasswordHash(inputHash: string, expectedHash: string): boolean {
  if (inputHash.length !== expectedHash.length) return false;
  return timingSafeEqual(Buffer.from(inputHash, "hex"), Buffer.from(expectedHash, "hex"));
}

export async function createSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = signToken(getSessionVersion());
  const expires = new Date(Date.now() + SESSION_MAX_AGE * 1000);

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires,
    path: "/",
  });

  return true;
}

export async function verifySession(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);
  if (!sessionCookie?.value) return false;

  const result = verifyToken(sessionCookie.value);
  if (!result.valid) return false;
  // Node 侧实时校验版本（proxy 侧有 ≤60s 缓存，这里无延迟兜底）
  return result.version === getSessionVersion();
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export { COOKIE_NAME, SESSION_MAX_AGE };
