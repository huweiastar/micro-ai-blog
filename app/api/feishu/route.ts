import { NextRequest, NextResponse } from "next/server";
import { fetchFeishuDocument } from "../../../lib/feishu";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ success: false, message: "请提供飞书文档链接" }, { status: 400 });
    }

    const { title, content } = await fetchFeishuDocument(url);

    return NextResponse.json({
      success: true,
      title,
      content,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message || "获取飞书文档失败" },
      { status: 500 }
    );
  }
}
