import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, date, summary, tags, category, content } = body;

    if (!title || !date || !content) {
      return NextResponse.json(
        { error: "标题、日期和正文不能为空" },
        { status: 400 }
      );
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^\w一-龥]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const safeSlug = slug || `article-${Date.now()}`;
    const fileName = `${safeSlug}.md`;

    // Ensure directory exists
    const blogDir = path.join(process.cwd(), "content/blog");
    if (!fs.existsSync(blogDir)) {
      fs.mkdirSync(blogDir, { recursive: true });
    }

    // Check for duplicate slug
    const existingPath = path.join(blogDir, fileName);
    let finalFileName = fileName;
    let counter = 1;
    while (fs.existsSync(path.join(blogDir, finalFileName))) {
      finalFileName = `${safeSlug}-${counter}.md`;
      counter++;
    }

    // Build markdown content
    const tagsArray = tags
      .split(/[,，]/)
      .map((t: string) => t.trim())
      .filter(Boolean);

    // Sanitize YAML string values: escape backslashes, quotes, and newlines
    const yamlEscape = (s: string) =>
      s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/[\n\r]/g, " ");

    const mdContent = `---
title: "${yamlEscape(title)}"
date: "${yamlEscape(date)}"
summary: "${yamlEscape(summary || title)}"
tags: [${tagsArray.map((t: string) => `"${yamlEscape(t)}"`).join(", ")}]
category: "${yamlEscape(category)}"
draft: false
---

${content}
`;

    // Write file
    fs.writeFileSync(path.join(blogDir, finalFileName), mdContent, "utf-8");

    return NextResponse.json({
      success: true,
      message: `文章已发布：${finalFileName}`,
      fileName: finalFileName,
    });
  } catch (error) {
    console.error("Publish error:", error);
    return NextResponse.json(
      { error: "发布失败：" + (error as Error).message },
      { status: 500 }
    );
  }
}
