import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { refreshAfterContentChange } from "../../../lib/regenerate";
import { snapshotPost } from "../../../lib/revisions";

const postsDirectory = path.join(process.cwd(), "content/blog");

// Only allow alphanumeric, underscore, dash, and CJK characters in slugs
// to prevent path traversal.
const SLUG_PATTERN = /^[\w一-龥-]+$/;

function getSlug(filename: string): string {
  return filename.replace(/\.(md|mdx)$/, "");
}

function calculateWordCount(content: string): number {
  const text = content.replace(/[#*`~\-\[\]!()]/g, "").trim();
  const cn = (text.match(/[一-鿿]/g) || []).length;
  const en = (text.replace(/[一-鿿]/g, "").match(/\b\w+\b/g) || []).length;
  return cn + en;
}

// Sanitize YAML string values: escape backslashes, quotes, and newlines.
function yamlEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/[\n\r]/g, " ");
}

function normalizeTags(tags: unknown): string[] {
  if (Array.isArray(tags)) {
    return tags.map((t) => String(t).trim()).filter(Boolean);
  }
  if (typeof tags === "string") {
    return tags
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

function deriveSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^\w一-龥]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `article-${Date.now()}`;
}

function todayDate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function findPostFile(slug: string): string | null {
  const mdPath = path.join(postsDirectory, `${slug}.md`);
  if (fs.existsSync(mdPath)) return mdPath;
  const mdxPath = path.join(postsDirectory, `${slug}.mdx`);
  if (fs.existsSync(mdxPath)) return mdxPath;
  return null;
}

function buildFrontmatter(opts: {
  title: string;
  date: string;
  summary: string;
  tags: string[];
  category: string;
  draft: boolean;
  cover?: string;
  publish?: string;
  content: string;
}): string {
  const { title, date, summary, tags, category, draft, cover, publish, content } = opts;
  const lines = [
    "---",
    `title: "${yamlEscape(title)}"`,
    `date: "${yamlEscape(date)}"`,
    `summary: "${yamlEscape(summary || title)}"`,
    `tags: [${tags.map((t) => `"${yamlEscape(t)}"`).join(", ")}]`,
    `category: "${yamlEscape(category)}"`,
    `draft: ${draft ? "true" : "false"}`,
  ];
  if (publish) lines.push(`publish: "${yamlEscape(publish)}"`);
  if (cover) lines.push(`cover: "${yamlEscape(cover)}"`);
  lines.push("---", "", content, "");
  return lines.join("\n");
}

export async function GET(req: NextRequest) {
  try {
    const slugParam = req.nextUrl.searchParams.get("slug");

    if (slugParam) {
      if (!SLUG_PATTERN.test(slugParam)) {
        return NextResponse.json({ error: "无效的 slug" }, { status: 400 });
      }
      const filePath = findPostFile(slugParam);
      if (!filePath) {
        return NextResponse.json({ error: "文章不存在" }, { status: 404 });
      }
      const source = fs.readFileSync(filePath, "utf-8");
      const { data, content } = matter(source);
      return NextResponse.json({
        slug: slugParam,
        title: (data.title as string) || "",
        date: (data.date as string) || "",
        summary: (data.summary as string) || "",
        tags: (data.tags as string[]) || [],
        category: (data.category as string) || "",
        draft: (data.draft as boolean) || false,
        publish: (data.publish as string) || undefined,
        content,
        cover: (data.cover as string) || undefined,
      });
    }

    if (!fs.existsSync(postsDirectory)) {
      return NextResponse.json([]);
    }

    const files = fs.readdirSync(postsDirectory).filter((file) =>
      file.endsWith(".md") || file.endsWith(".mdx")
    );

    const posts = files.map((file) => {
      const filePath = path.join(postsDirectory, file);
      const source = fs.readFileSync(filePath, "utf-8");
      const { data, content } = matter(source);

      return {
        slug: getSlug(file),
        title: (data.title as string) || "",
        date: (data.date as string) || "",
        summary: (data.summary as string) || "",
        tags: (data.tags as string[]) || [],
        category: (data.category as string) || "",
        draft: (data.draft as boolean) || false,
        publish: (data.publish as string) || undefined,
        wordCount: calculateWordCount(content),
        cover: (data.cover as string) || undefined,
      };
    });

    // Sort by date descending
    posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ error: "获取文章列表失败" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, summary, category, tags, content, draft } = body;
    const isDraft = Boolean(draft);

    if (!title) {
      return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
    }
    // 草稿允许正文为空（仅占位标题即可入草稿箱）；正式发布才强制正文。
    if (!isDraft && !content) {
      return NextResponse.json({ error: "正文不能为空" }, { status: 400 });
    }

    const baseSlug = deriveSlug(String(title));

    if (!fs.existsSync(postsDirectory)) {
      fs.mkdirSync(postsDirectory, { recursive: true });
    }

    // Disambiguate slug if duplicate exists.
    let finalSlug = baseSlug;
    let counter = 1;
    while (
      fs.existsSync(path.join(postsDirectory, `${finalSlug}.md`)) ||
      fs.existsSync(path.join(postsDirectory, `${finalSlug}.mdx`))
    ) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const fileName = `${finalSlug}.md`;
    const date = body.date ? String(body.date) : todayDate();

    const mdContent = buildFrontmatter({
      title: String(title),
      date,
      summary: String(summary || ""),
      tags: normalizeTags(tags),
      category: String(category || ""),
      draft: isDraft,
      cover: body.cover ? String(body.cover) : undefined,
      publish: body.publish ? String(body.publish) : undefined,
      content: String(content ?? ""),
    });

    fs.writeFileSync(path.join(postsDirectory, fileName), mdContent, "utf-8");

    refreshAfterContentChange(finalSlug);

    return NextResponse.json({
      success: true,
      slug: finalSlug,
      fileName,
    });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json(
      { error: "创建文章失败：" + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, title, summary, category, tags, content, draft } = body;
    const isDraft = Boolean(draft);

    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "缺少 slug" }, { status: 400 });
    }
    if (!SLUG_PATTERN.test(slug)) {
      return NextResponse.json({ error: "无效的 slug" }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
    }
    if (!isDraft && !content) {
      return NextResponse.json({ error: "正文不能为空" }, { status: 400 });
    }

    const filePath = findPostFile(slug);
    if (!filePath) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    // Preserve original date unless explicitly overridden.
    const existingSource = fs.readFileSync(filePath, "utf-8");
    const { data: existingData } = matter(existingSource);
    // 覆盖前为旧版本留快照，便于历史回溯。
    snapshotPost(slug, existingSource);
    const date = body.date
      ? String(body.date)
      : (existingData.date as string) || todayDate();

    const mdContent = buildFrontmatter({
      title: String(title),
      date,
      summary: String(summary || ""),
      tags: normalizeTags(tags),
      category: String(category || ""),
      draft: isDraft,
      cover: body.cover ? String(body.cover) : undefined,
      publish: body.publish ? String(body.publish) : undefined,
      content: String(content ?? ""),
    });

    fs.writeFileSync(filePath, mdContent, "utf-8");

    refreshAfterContentChange(slug);

    return NextResponse.json({ success: true, slug });
  } catch (error) {
    console.error("Update post error:", error);
    return NextResponse.json(
      { error: "更新文章失败：" + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug } = body;

    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "缺少 slug" }, { status: 400 });
    }
    if (!SLUG_PATTERN.test(slug)) {
      return NextResponse.json({ error: "无效的 slug" }, { status: 400 });
    }

    const filePath = findPostFile(slug);
    if (!filePath) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    // 删除前留快照，避免误删无法找回。
    try {
      snapshotPost(slug, fs.readFileSync(filePath, "utf-8"));
    } catch {
      /* 快照失败不阻断删除 */
    }
    fs.unlinkSync(filePath);

    refreshAfterContentChange(slug);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json(
      { error: "删除文章失败：" + (error as Error).message },
      { status: 500 }
    );
  }
}
