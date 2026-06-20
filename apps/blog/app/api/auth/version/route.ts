import { NextResponse } from "next/server";
import { getSessionVersion } from "../../../../lib/auth-version";

// middleware（edge runtime）读不了 SQLite，通过本接口间接读会话版本号。
// 版本号只是个计数器，不泄露敏感信息，公开可读。
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ v: getSessionVersion() });
}
