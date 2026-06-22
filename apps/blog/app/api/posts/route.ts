import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { contentDir } from "../../../lib/paths";
import matter from "gray-matter";
import { atomicWriteFile } from "../../../lib/atomic-file";
import { refreshAfterContentChange } from "../../../lib/regenerate";
import { snapshotPost } from "../../../lib/revisions";
import { countWords as calculateWordCount } from "../../../lib/word-count";

const postsDirectory = path.join(contentDir(), "blog");
const redirectsFile = path.join(process.cwd(), "config", "redirects.json");

// Only allow alphanumeric, underscore, dash, and CJK characters in slugs
// to prevent path traversal.
const SLUG_PATTERN = /^[\w一-龥-]+$/;

// 自定义 slug 仅允许小写字母/数字/连字符，保证链接干净且 URL 安全。
const CUSTOM_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function getSlug(filename: string): string {
  return filename.replace(/\.(md|mdx)$/, "");
}

// 一篇文章的规范 slug：优先 frontmatter.slug，否则取文件名。
function canonicalSlug(data: Record<string, unknown>, file: string): string {
  return typeof data.slug === "string" && data.slug ? data.slug : getSlug(file);
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

// 从标题派生 ascii slug；中文等非 ascii 字符会被剔除，
// 若结果为空（如纯中文标题）则回退到时间戳，避免再产生中文文件名/链接。
function deriveSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
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

type RedirectEntry = {
  source: string;
  destination: string;
  permanent: boolean;
};

function readRedirects(): RedirectEntry[] {
  try {
    const raw = fs.readFileSync(redirectsFile, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRedirects(entries: RedirectEntry[]): void {
  fs.mkdirSync(path.dirname(redirectsFile), { recursive: true });
  atomicWriteFile(redirectsFile, JSON.stringify(entries, null, 2) + "\n");
}

function redirectSourcesForSlug(slug: string): string[] {
  const raw = `/blog/${slug}`;
  const encoded = `/blog/${encodeURIComponent(slug)}`;
  return raw === encoded ? [raw] : [encoded, raw];
}

function recordSlugRedirect(fromSlug: string, toSlug: string): void {
  if (fromSlug === toSlug) return;
  const destination = `/blog/${toSlug}`;
  const existing = readRedirects().filter((entry) => entry.destination !== entry.source);
  const bySource = new Map(existing.map((entry) => [entry.source, entry]));
  for (const source of redirectSourcesForSlug(fromSlug)) {
    if (source !== destination) bySource.set(source, { source, destination, permanent: true });
  }
  writeRedirects(Array.from(bySource.values()));
}

// 按规范 slug 定位文件：先扫描 frontmatter.slug，再回退文件名匹配。
function findPostFile(slug: string): string | null {
  if (!fs.existsSync(postsDirectory)) return null;
  const files = fs.readdirSync(postsDirectory).filter((f) => f.endsWith(".md") || f.endsWith(".mdx"));
  // 优先匹配自定义 slug
  for (const file of files) {
    const filePath = path.join(postsDirectory, file);
    const { data } = matter(fs.readFileSync(filePath, "utf-8"));
    if (typeof data.slug === "string" && data.slug === slug) return filePath;
  }
  // 回退：文件名匹配，但需排除「该文件名已被其它 frontmatter.slug 覆盖」的情况
  for (const file of files) {
    if (getSlug(file) !== slug) continue;
    const filePath = path.join(postsDirectory, file);
    const { data } = matter(fs.readFileSync(filePath, "utf-8"));
    if (typeof data.slug === "string" && data.slug && data.slug !== slug) continue;
    return filePath;
  }
  return null;
}

// 检查某个 slug 是否已被占用（用于改名查重，单次调用）。
function slugExists(slug: string): boolean {
  return findPostFile(slug) !== null;
}

// 一次性收集所有文章的规范 slug（frontmatter.slug 优先，否则文件名）。
// 新建去重的 while 循环原先每轮都 findPostFile 重扫全目录（O(n²)），
// 改为先建集合再内存查重。
function collectExistingSlugs(): Set<string> {
  const slugs = new Set<string>();
  if (!fs.existsSync(postsDirectory)) return slugs;
  const files = fs
    .readdirSync(postsDirectory)
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"));
  for (const file of files) {
    const { data } = matter(fs.readFileSync(path.join(postsDirectory, file), "utf-8"));
    slugs.add(canonicalSlug(data, file));
  }
  return slugs;
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
  slug?: string;
  type?: "article" | "note";
  content: string;
}): string {
  const { title, date, summary, tags, category, draft, cover, publish, slug, type, content } = opts;
  const lines = [
    "---",
    `title: "${yamlEscape(title)}"`,
    `date: "${yamlEscape(date)}"`,
    `summary: "${yamlEscape(summary || title)}"`,
    `tags: [${tags.map((t) => `"${yamlEscape(t)}"`).join(", ")}]`,
    `category: "${yamlEscape(category)}"`,
    `draft: ${draft ? "true" : "false"}`,
  ];
  // article 为缺省值，仅 note 需要落到 frontmatter。
  if (type === "note") lines.push("type: note");
  // 仅当自定义 slug 与文件名不一致时才写入 frontmatter，保持文件整洁。
  if (slug) lines.push(`slug: "${yamlEscape(slug)}"`);
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
        type: data.type === "note" ? "note" : "article",
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
        slug: canonicalSlug(data, file),
        type: data.type === "note" ? "note" : "article",
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

    // 优先使用作者自定义的干净 slug；非法或留空时从标题派生。
    const customSlug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
    if (customSlug && !CUSTOM_SLUG_PATTERN.test(customSlug)) {
      return NextResponse.json({ error: "链接仅能包含小写字母、数字和连字符" }, { status: 400 });
    }
    const baseSlug = customSlug || deriveSlug(String(title));

    if (!fs.existsSync(postsDirectory)) {
      fs.mkdirSync(postsDirectory, { recursive: true });
    }

    // Disambiguate slug if duplicate exists（一次性建集合，内存查重）。
    const existingSlugs = collectExistingSlugs();
    let finalSlug = baseSlug;
    let counter = 1;
    while (existingSlugs.has(finalSlug)) {
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
      type: body.type === "note" ? "note" : undefined,
      content: String(content ?? ""),
    });

    atomicWriteFile(path.join(postsDirectory, fileName), mdContent);

    refreshAfterContentChange(finalSlug, 'post');

    return NextResponse.json({
      success: true,
      slug: finalSlug,
      fileName,
    });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json(
      { error: "创建文章失败，请稍后重试" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, newSlug, title, summary, category, tags, content, draft } = body;
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

    // 解析目标 slug：作者改了「链接」字段时生效，校验为干净 ascii 且不与他文冲突。
    const desiredSlug = typeof newSlug === "string" ? newSlug.trim().toLowerCase() : "";
    let finalSlug = slug;
    if (desiredSlug && desiredSlug !== slug) {
      if (!CUSTOM_SLUG_PATTERN.test(desiredSlug)) {
        return NextResponse.json({ error: "链接仅能包含小写字母、数字和连字符" }, { status: 400 });
      }
      if (slugExists(desiredSlug)) {
        return NextResponse.json({ error: "该链接已被占用" }, { status: 400 });
      }
      finalSlug = desiredSlug;
    }

    // Preserve original date unless explicitly overridden.
    const existingSource = fs.readFileSync(filePath, "utf-8");
    const { data: existingData } = matter(existingSource);
    // 覆盖前为旧版本留快照，便于历史回溯。
    snapshotPost(slug, existingSource);
    const date = body.date
      ? String(body.date)
      : (existingData.date as string) || todayDate();

    // 仅当 slug 与文件名不一致时写入 frontmatter.slug；一致则省略保持整洁。
    const fileBaseSlug = getSlug(path.basename(filePath));
    const frontmatterSlug = finalSlug === fileBaseSlug ? undefined : finalSlug;

    const mdContent = buildFrontmatter({
      title: String(title),
      date,
      summary: String(summary || ""),
      tags: normalizeTags(tags),
      category: String(category || ""),
      draft: isDraft,
      cover: body.cover ? String(body.cover) : undefined,
      publish: body.publish ? String(body.publish) : undefined,
      slug: frontmatterSlug,
      // ArticleEditor 的保存请求不带 type，必须从既有 frontmatter 保留，否则编辑随手记会丢类型。
      type: body.type === "note" || (body.type === undefined && existingData.type === "note") ? "note" : undefined,
      content: String(content ?? ""),
    });

    atomicWriteFile(filePath, mdContent);
    if (finalSlug !== slug) {
      recordSlugRedirect(slug, finalSlug);
    }

    refreshAfterContentChange(finalSlug, 'post');

    return NextResponse.json({ success: true, slug: finalSlug });
  } catch (error) {
    console.error("Update post error:", error);
    return NextResponse.json(
      { error: "更新文章失败，请稍后重试" },
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

    refreshAfterContentChange(slug, "post");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json(
      { error: "删除文章失败，请稍后重试" },
      { status: 500 }
    );
  }
}
