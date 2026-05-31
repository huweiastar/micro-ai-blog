import { NextRequest, NextResponse } from "next/server";
import { createSession, hashPassword, verifyPasswordHash } from "../../../../lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: "请输入密码" },
        { status: 400 }
      );
    }

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return NextResponse.json(
        { error: "管理员密码未配置" },
        { status: 500 }
      );
    }

    const inputHash = hashPassword(password);
    const expectedHash = hashPassword(adminPassword);

    if (!verifyPasswordHash(inputHash, expectedHash)) {
      return NextResponse.json(
        { error: "密码错误" },
        { status: 401 }
      );
    }

    await createSession();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "登录失败，请稍后重试" },
      { status: 500 }
    );
  }
}
