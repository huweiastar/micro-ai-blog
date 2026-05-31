import { NextResponse } from "next/server";
import { getAllPostsSync } from "../../../lib/posts";
import { getProjects } from "../../../lib/projects";

export async function GET() {
  try {
    const posts = getAllPostsSync();
    const projects = getProjects();
    const totalWords = posts.reduce((sum, post) => sum + post.wordCount, 0);

    return NextResponse.json({
      postCount: posts.length,
      totalWords,
      projectCount: projects.length,
    });
  } catch {
    return NextResponse.json({ postCount: 0, totalWords: 0, projectCount: 0 });
  }
}
