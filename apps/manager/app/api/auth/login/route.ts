import { NextRequest, NextResponse } from "next/server";
import { passwordMatches, createManagerSession } from "../../../../lib/auth";

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
    await createManagerSession();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "登录失败" }, { status: 500 });
  }
}
