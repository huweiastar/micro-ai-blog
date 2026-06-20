import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "../../../../lib/auth";
import { bumpSessionVersion } from "../../../../lib/auth-version";

export async function POST(req: NextRequest) {
  // {all:true} = 吊销所有设备的会话。必须已登录才允许，
  // 否则任何人都能把管理员从所有设备踢下线。
  let all = false;
  try {
    const body = await req.json();
    all = body?.all === true;
  } catch {
    // 无 body 的普通退出
  }
  if (all && (await verifySession())) {
    bumpSessionVersion();
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("admin_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
  return response;
}
