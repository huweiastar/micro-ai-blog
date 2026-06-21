import { NextRequest, NextResponse } from "next/server";
import { passwordMatches, createManagerSession } from "../../../../lib/auth";

function cookieDomainFromHost(host: string | null): string | undefined {
  const cleanHost = host?.split(":")[0];
  if (!cleanHost || cleanHost === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(cleanHost)) {
    return undefined;
  }
  const parts = cleanHost.split(".");
  if (parts.length < 3) return undefined;
  return `.${parts.slice(-3).join(".")}`;
}

async function currentBlogSessionVersion(): Promise<number> {
  const origin = process.env.BLOG_ORIGIN || "http://127.0.0.1:3000";
  try {
    const res = await fetch(`${origin}/api/auth/version`, { cache: "no-store" });
    if (!res.ok) return 1;
    const data = await res.json();
    return typeof data.v === "number" ? data.v : 1;
  } catch {
    return 1;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    if (!password) {
      return NextResponse.json({ error: "请输入密码" }, { status: 400 });
    }
    const admin = process.env.ADMIN_PASSWORD;
    if (!admin) {
      return NextResponse.json({ error: "管理员密码未配置" }, { status: 500 });
    }
    if (!passwordMatches(password, admin)) {
      return NextResponse.json({ error: "密码错误" }, { status: 401 });
    }
    const version = await currentBlogSessionVersion();
    const domain = process.env.SESSION_COOKIE_DOMAIN || cookieDomainFromHost(req.headers.get("x-forwarded-host") || req.headers.get("host"));
    await createManagerSession(version, domain);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "登录失败" }, { status: 500 });
  }
}
