import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const postsDirectory = path.join(process.cwd(), "content/blog");

function getSlug(filename: string): string {
  return filename.replace(/\.(md|mdx)$/, "");
}

function calculateWordCount(content: string): number {
  const text = content.replace(/[#*`~\-\[\]!()]/g, "").trim();
  const cn = (text.match(/[一-鿿]/g) || []).length;
  const en = (text.replace(/[一-鿿]/g, "").match(/\b\w+\b/g) || []).length;
  return cn + en;
}

export async function GET() {
  try {
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
        wordCount: calculateWordCount(content),
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
