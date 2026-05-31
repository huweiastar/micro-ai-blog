import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

function getSecret(): string {
  const password = process.env.ADMIN_PASSWORD || "";
  return createHash("sha256").update(password).digest("hex");
}

export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export function verifyPasswordHash(inputHash: string, expectedHash: string): boolean {
  if (inputHash.length !== expectedHash.length) return false;
  return timingSafeEqual(Buffer.from(inputHash, "hex"), Buffer.from(expectedHash, "hex"));
}

function generateSignedToken(): string {
  const payload = randomBytes(32).toString("hex");
  const timestamp = Date.now().toString(36);
  const secret = getSecret();
  const signature = createHmac("sha256", secret).update(`${payload}.${timestamp}`).digest("hex");
  return `${payload}.${timestamp}.${signature}`;
}

function verifySignedToken(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [payload, timestamp, signature] = parts;
  const secret = getSecret();
  const expectedSignature = createHmac("sha256", secret).update(`${payload}.${timestamp}`).digest("hex");

  if (signature.length !== expectedSignature.length) return false;

  try {
    if (!timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expectedSignature, "hex"))) {
      return false;
    }
  } catch {
    return false;
  }

  // Check expiry
  const issuedAt = parseInt(timestamp, 36);
  if (isNaN(issuedAt)) return false;
  if (Date.now() - issuedAt > SESSION_MAX_AGE * 1000) return false;

  return true;
}

export async function createSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = generateSignedToken();
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

  if (!sessionCookie || !sessionCookie.value) {
    return false;
  }

  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return false;
  }

  return verifySignedToken(sessionCookie.value);
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export { COOKIE_NAME, SESSION_MAX_AGE };
