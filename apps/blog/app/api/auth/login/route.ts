import { NextRequest, NextResponse } from "next/server";
import { createSession, hashPassword, verifyPasswordHash } from "../../../../lib/auth";
import {
  checkLoginAllowed,
  recordLoginFailure,
  recordLoginSuccess,
} from "../../../../lib/login-guard";

function clientIp(req: NextRequest): string {
  // nginx 反代设置了 X-Forwarded-For（见 scripts/nginx.conf），取第一跳
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return "local";
}

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);

    const gate = checkLoginAllowed(ip);
    if (!gate.allowed) {
      return NextResponse.json(
        { error: "尝试次数过多，请稍后再试", retryAfter: gate.retryAfterSec },
        { status: 429, headers: { "Retry-After": String(gate.retryAfterSec) } }
      );
    }

    const body = await req.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: "请输入密码" }, { status: 400 });
    }

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return NextResponse.json({ error: "管理员密码未配置" }, { status: 500 });
    }

    if (!verifyPasswordHash(hashPassword(password), hashPassword(adminPassword))) {
      recordLoginFailure(ip);
      console.warn(`[auth] 登录失败 ip=${ip}`);
      return NextResponse.json({ error: "密码错误" }, { status: 401 });
    }

    recordLoginSuccess(ip);
    await createSession();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "登录失败，请稍后重试" }, { status: 500 });
  }
}
