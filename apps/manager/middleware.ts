import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// middleware 运行于 edge runtime（无 node:crypto），用 WebCrypto 校验会话签名。
// 与 apps/blog/middleware.ts 同算法；A2 暂不做会话版本校验（留 A3 接 db）。
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const encoder = new TextEncoder();
const PUBLIC_PATHS = ["/login", "/api/auth/login"];

function bytesToHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, "0");
  return hex;
}

async function sha256Hex(input: string): Promise<string> {
  return bytesToHex(await crypto.subtle.digest("SHA-256", encoder.encode(input)));
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return bytesToHex(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

async function sessionSecret(): Promise<string> {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  return sha256Hex(process.env.ADMIN_PASSWORD || "");
}

async function isValidToken(token: string): Promise<boolean> {
  if (!process.env.SESSION_SECRET && !process.env.ADMIN_PASSWORD) return false;
  const parts = token.split(".");
  if (parts.length !== 4) return false;
  const [v36, payload, ts36, sig] = parts;
  const expected = await hmacSha256Hex(await sessionSecret(), `${v36}.${payload}.${ts36}`);
  if (!timingSafeEqualHex(sig, expected)) return false;
  const issuedAt = parseInt(ts36, 36);
  if (isNaN(issuedAt) || Date.now() - issuedAt > SESSION_MAX_AGE_MS) return false;
  return true;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }
  const token = request.cookies.get("admin_session")?.value;
  if (!token || !(await isValidToken(token))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
