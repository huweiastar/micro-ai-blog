import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { atomicWriteFile } from "../../../lib/atomic-file";
import { readBarrage, sanitizeBarrageInput, barragePath } from "../../../lib/barrage";

// 保存后需立即生效：禁止把 GET 静态缓存成构建期旧值。
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(readBarrage());
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const sanitized = sanitizeBarrageInput(body);
    atomicWriteFile(barragePath, JSON.stringify(sanitized, null, 2));
    // 弹幕显示在首页，写完让首页缓存失效以立即生效。
    revalidatePath("/");
    return NextResponse.json({ success: true, message: "弹幕已更新", data: sanitized });
  } catch (error) {
    console.error("更新弹幕失败:", error);
    return NextResponse.json({ success: false, message: "更新失败" }, { status: 500 });
  }
}
