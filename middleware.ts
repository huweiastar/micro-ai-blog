import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

const WRITE_API_PATHS = [
  "/api/publish",
  "/api/upload",
  "/api/categories",
  "/api/projects",
  "/api/theme",
  "/api/feishu",
  "/api/admin/reindex",
  "/api/about",
];

const READ_ONLY_METHODS = ["GET", "HEAD", "OPTIONS"];

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyToken(token: string): Promise<boolean> {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [payload, timestamp, signature] = parts;
  const secret = await sha256Hex(password);
  const expectedSignature = await hmacSha256Hex(secret, `${payload}.${timestamp}`);

  if (signature.length !== expectedSignature.length) return false;
  if (signature !== expectedSignature) return false;

  const issuedAt = parseInt(timestamp, 36);
  if (isNaN(issuedAt)) return false;
  if (Date.now() - issuedAt > SESSION_MAX_AGE) return false;

  return true;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const sessionCookie = request.cookies.get("admin_session");
  const isAuthenticated = !!sessionCookie?.value && await verifyToken(sessionCookie.value);

  // Protect /admin pages (but not /admin/login)
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      if (isAuthenticated) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.next();
    }

    if (!isAuthenticated) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname + search);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // Protect write APIs
  if (
    WRITE_API_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
  ) {
    if (!READ_ONLY_METHODS.includes(request.method)) {
      if (!isAuthenticated) {
        return NextResponse.json(
          { error: "未授权访问，请先登录" },
          { status: 401 }
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
