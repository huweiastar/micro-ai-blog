import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyTokenEdge } from "@pkg/auth/edge-verify";

// middleware 运行于 edge runtime（无 node:crypto），用 WebCrypto 校验会话签名。
// 校验逻辑统一来自 @pkg/auth/edge-verify，避免两端 middleware 重复分叉。
const PUBLIC_PATHS = ["/login", "/api/auth/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }
  const token = request.cookies.get("admin_session")?.value;
  if (!token || !(await verifyTokenEdge(token))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
