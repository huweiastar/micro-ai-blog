import { NextRequest, NextResponse } from "next/server";
import { renderMarkdownToHtml } from "../../../../lib/posts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 后台分屏预览：用正式 remark/rehype 管线渲染，保证预览与成品文章一致。
export async function POST(req: NextRequest) {
  try {
    const { markdown } = await req.json();
    if (typeof markdown !== "string") {
      return NextResponse.json({ error: "缺少 markdown" }, { status: 400 });
    }
    const html = await renderMarkdownToHtml(markdown);
    return NextResponse.json({ html });
  } catch (error) {
    return NextResponse.json(
      { error: "渲染失败：" + (error as Error).message },
      { status: 500 }
    );
  }
}
