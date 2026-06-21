import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

const WRITE_API_PATHS = [
  "/api/publish",
  "/api/posts",
  "/api/upload",
  "/api/categories",
  "/api/projects",
  "/api/theme",
  "/api/barrage",
  "/api/feishu",
  "/api/admin/reindex",
  "/api/admin/media",
  "/api/about",
  "/api/assistant/write",
  "/api/assistant/assist",
];

const READ_ONLY_METHODS = ["GET", "HEAD", "OPTIONS"];

// 这些接口连读取也要鉴权：仅后台使用，且会暴露草稿/未上线内容或后台计数。
const READ_PROTECTED_API_PATHS = [
  "/api/posts",
  "/api/projects",
  "/api/categories",
  "/api/admin/overview",
  "/api/admin/media",
  "/api/admin/revisions",
  "/api/admin/preview",
];

const encoder = new TextEncoder();

function bytesToHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(input));
  return bytesToHex(digest);
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return bytesToHex(sig);
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

// 反代后 request.url 的 host 会被固定成进程绑定地址（localhost:3000），
// 不反映真实的对外域名。构造跳转 URL 时改用代理转发的 Host 头，避免把外部
// 用户重定向到 localhost。
function getRequestOrigin(request: NextRequest): string {
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return request.nextUrl.origin;
  const proto =
    request.headers.get("x-forwarded-proto") ??
    request.nextUrl.protocol.replace(/:$/, "");
  return `${proto}://${host}`;
}

async function getSessionSecretEdge(): Promise<string> {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;
  return sha256Hex(process.env.ADMIN_PASSWORD || "");
}

// 会话版本：从 /api/auth/version 拉取并缓存 60s。proxy 运行在 nodejs runtime，
// 但仍沿用内部 fetch 间接读版本号（与会话存储解耦，避免 proxy 直连 SQLite）；
// 接口故障时沿用旧缓存或 fail-open（只验签名），避免把管理员锁在门外。
// 该 fetch 不带 cookie，不会递归触发鉴权。
let cachedVersion: number | null = null;
let cachedAt = 0;

async function getCurrentSessionVersion(origin: string): Promise<number | null> {
  if (cachedVersion !== null && Date.now() - cachedAt < 60_000) return cachedVersion;
  try {
    const res = await fetch(`${origin}/api/auth/version`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (typeof data.v === "number") {
        cachedVersion = data.v;
        cachedAt = Date.now();
      }
    }
  } catch {
    // 网络失败：保留旧缓存值
  }
  return cachedVersion;
}

async function verifyToken(token: string, origin: string): Promise<boolean> {
  if (!process.env.SESSION_SECRET && !process.env.ADMIN_PASSWORD) return false;

  const parts = token.split(".");
  if (parts.length !== 4) return false;

  const [v36, payload, timestamp, signature] = parts;
  const secret = await getSessionSecretEdge();
  const expectedSignature = await hmacSha256Hex(secret, `${v36}.${payload}.${timestamp}`);

  if (!timingSafeEqualHex(signature, expectedSignature)) return false;

  const issuedAt = parseInt(timestamp, 36);
  if (isNaN(issuedAt)) return false;
  if (Date.now() - issuedAt > SESSION_MAX_AGE) return false;

  const tokenVersion = parseInt(v36, 36);
  if (isNaN(tokenVersion)) return false;
  const currentVersion = await getCurrentSessionVersion(origin);
  if (currentVersion !== null && tokenVersion !== currentVersion) return false;

  return true;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const sessionCookie = request.cookies.get("admin_session");
  const isAuthenticated =
    !!sessionCookie?.value &&
    (await verifyToken(sessionCookie.value, request.nextUrl.origin));

  // Protect /admin pages (but not /admin/login)
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      if (isAuthenticated) {
        return NextResponse.redirect(new URL("/admin", getRequestOrigin(request)));
      }
      return NextResponse.next();
    }

    if (!isAuthenticated) {
      const loginUrl = new URL("/admin/login", getRequestOrigin(request));
      loginUrl.searchParams.set("callbackUrl", pathname + search);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // Fully-protected read APIs：任何方法都需登录（避免泄露草稿/未上线内容）。
  if (
    READ_PROTECTED_API_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
  ) {
    if (!isAuthenticated) {
      return NextResponse.json({ error: "未授权访问，请先登录" }, { status: 401 });
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
