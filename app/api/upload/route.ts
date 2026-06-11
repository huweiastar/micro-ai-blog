import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { atomicWriteFile } from "../../../lib/atomic-file";

const ALLOWED_UPLOAD_TYPES = new Set(["uploads", "column-bg", "avatar", "theme-bg", "blog", "projects", "category"]);
const ALLOWED_IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "gif", "avif", "bmp"]);
const BLOCKED_EXTENSIONS = new Set(["svg", "svgz", "html", "htm", "xml", "xhtml"]);

/**
 * Slugify: convert Chinese/unicode text to a URL-safe string.
 * Falls back to codepoint-based romanization for unknown chars.
 */
function slugify(text: string): string {
  const cnMap: Record<string, string> = {
    大: "da", 模: "mo", 型: "xing", 基: "ji", 础: "chu", 架: "jia", 构: "gou",
    从: "cong", 入: "ru", 门: "men", 到: "dao", 实: "shi", 践: "jian",
    数: "shu", 据: "ju", 清: "qing", 洗: "xi", 处: "chu", 理: "li",
    工: "gong", 程: "cheng", 开: "kai", 发: "fa", 安: "an", 全: "quan",
    应: "ying", 用: "yong", 训: "xun", 练: "lian", 优: "you", 化: "hua",
    知: "zhi", 识: "shi", 图: "tu", 谱: "pu", 流: "liu", 管: "guan",
    多: "duo", 态: "tai", 搜: "sou", 索: "suo", 推: "tui", 荐: "jian",
    排: "pai", 序: "xu", 分: "fen", 类: "lei", 标: "biao", 签: "qian",
    项: "xiang", 目: "mu", 足: "zu", 迹: "ji", 关: "guan", 于: "yu",
    我: "wo", 首: "shou", 页: "ye", 博: "bo", 客: "ke", 专: "zhuan",
    栏: "lan", 新: "xin", 文: "wen", 章: "zhang", 总: "zong", 结: "jie",
    探: "tan", 技: "ji", 术: "shu", 个: "ge", 人: "ren", 日: "ri",
    志: "zhi", 研: "yan", 师: "shi", 与: "yu", 设: "she", 计: "ji",
    现: "xian", 原: "yuan", 析: "xi", 经: "jing", 验: "yan", 享: "xiang",
    笔: "bi", 记: "ji", 心: "xin", 得: "de", 体: "ti", 会: "hui",
    小: "xiao", 回: "hui", 顾: "gu", 展: "zhan", 望: "wang", 前: "qian",
    瞻: "zhan", 测: "ce", 试: "shi", 报: "bao", 告: "gao", 案: "an",
    例: "li", 究: "jiu", 调: "tiao",
  };

  let converted = "";
  for (const ch of text.toLowerCase()) {
    if (cnMap[ch]) {
      converted += cnMap[ch];
    } else if (/[一-鿿]/.test(ch)) {
      converted += `z${ch.charCodeAt(0)}`;
    } else {
      converted += ch;
    }
  }

  // Replace spaces and common separators with dashes
  converted = converted.replace(/[\s_]+/g, "-");
  // Strip remaining non-ASCII, non-alphanumeric, non-dash chars
  converted = converted.replace(/[^\w-]/g, "");
  // Collapse multiple dashes, trim leading/trailing
  converted = converted.replace(/-+/g, "-").replace(/^-|-$/g, "");

  return converted || "untitled";
}

function hasImageSignature(buffer: Buffer, ext: string): boolean {
  const normalized = ext === "jpg" ? "jpeg" : ext;
  if (normalized === "png") return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (normalized === "jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (normalized === "gif") return buffer.subarray(0, 4).toString("ascii") === "GIF8";
  if (normalized === "webp") return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  if (normalized === "avif") return buffer.subarray(4, 12).toString("ascii") === "ftypavif" || buffer.subarray(4, 12).toString("ascii") === "ftypavis";
  if (normalized === "bmp") return buffer.subarray(0, 2).toString("ascii") === "BM";
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const rawType = (formData.get("type") as string) || "uploads";
    const type = ALLOWED_UPLOAD_TYPES.has(rawType) ? rawType : "uploads";

    if (!file) {
      return NextResponse.json({ error: "未找到文件" }, { status: 400 });
    }

    // Validate file type — block SVG and other dangerous types
    if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
      return NextResponse.json({ error: "仅支持图片文件（不支持 SVG）" }, { status: 400 });
    }

    // Validate file size (10MB, avatar 5MB)
    const maxBytes = type === "avatar" ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json({ error: `文件不能超过 ${maxBytes / 1024 / 1024}MB` }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = (file.name.split(".").pop() || "png").toLowerCase();

    // Block dangerous or unsupported extensions.
    if (BLOCKED_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: "不支持的文件格式" }, { status: 400 });
    }
    if (!ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: "仅支持 png、jpg、webp、gif、avif、bmp 图片" }, { status: 400 });
    }
    if (!hasImageSignature(buffer, ext)) {
      return NextResponse.json({ error: "图片内容与文件格式不匹配" }, { status: 400 });
    }

    let uploadDir: string;
    let fileName: string;

    if (type === "column-bg") {
      uploadDir = "column-bg";
      fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    } else if (type === "avatar") {
      uploadDir = "avatar";
      fileName = `avatar.${ext}`;
    } else if (type === "theme-bg") {
      uploadDir = "theme-bg";
      fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    } else if (type === "projects") {
      uploadDir = "projects";
      fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    } else if (type === "category") {
      const category = (formData.get("category") as string) || "未命名";
      uploadDir = path.join("category", slugify(category));
      fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    } else if (type === "blog") {
      // Blog images: organized by category/article-title
      const category = (formData.get("category") as string) || "未分类";
      const articleTitle = (formData.get("articleTitle") as string) || "草稿";
      const categorySlug = slugify(category);
      const articleSlug = slugify(articleTitle);
      uploadDir = path.join("blog", categorySlug, articleSlug);
      fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    } else {
      uploadDir = "uploads";
      fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    }

    const dirPath = path.join(process.cwd(), "public/images", uploadDir);

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const filePath = path.join(dirPath, fileName);
    atomicWriteFile(filePath, buffer);

    // Build URL with forward slashes (handle Windows paths)
    const url = `/images/${uploadDir.split(path.sep).join("/")}/${fileName}`;
    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}
