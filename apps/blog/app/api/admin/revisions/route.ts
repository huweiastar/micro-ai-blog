import { NextRequest, NextResponse } from "next/server";
import matter from "gray-matter";
import { listRevisions, readRevision } from "../../../../lib/revisions";

export const dynamic = "force-dynamic";

const SLUG_OK = /^[\w一-龥-]+$/;

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  const id = req.nextUrl.searchParams.get("id");
  if (!slug || !SLUG_OK.test(slug)) {
    return NextResponse.json({ error: "无效的 slug" }, { status: 400 });
  }

  // 取单个版本的完整内容（用于载入到编辑器）。
  if (id) {
    const raw = readRevision(slug, id);
    if (raw == null) {
      return NextResponse.json({ error: "版本不存在" }, { status: 404 });
    }
    const { data, content } = matter(raw);
    return NextResponse.json({
      id,
      title: (data.title as string) || "",
      summary: (data.summary as string) || "",
      tags: (data.tags as string[]) || [],
      category: (data.category as string) || "",
      cover: (data.cover as string) || undefined,
      date: (data.date as string) || "",
      publish: (data.publish as string) || undefined,
      draft: (data.draft as boolean) || false,
      content,
    });
  }

  // 列出版本（附标题，便于辨识）。
  const revs = listRevisions(slug).map((r) => {
    const raw = readRevision(slug, r.id);
    let title = "";
    if (raw) {
      try {
        title = (matter(raw).data.title as string) || "";
      } catch {
        /* 解析失败则留空标题 */
      }
    }
    return { ...r, title };
  });
  return NextResponse.json(revs);
}
