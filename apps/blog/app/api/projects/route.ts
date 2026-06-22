import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { contentDir } from "../../../lib/paths";
import yaml from "js-yaml";
import { atomicWriteFile } from "../../../lib/atomic-file";
import { refreshAfterContentChange } from "../../../lib/regenerate";
import { slugifyCjk } from "../../../lib/utils";
import type { Project } from "../../../types/project";

// 后台保存后立即生效：禁止 GET 被静态缓存成旧值。
export const dynamic = "force-dynamic";

const projectsPath = path.join(contentDir(), "projects/projects.yaml");

function readProjects(): Project[] {
  if (!fs.existsSync(projectsPath)) return [];
  const content = fs.readFileSync(projectsPath, "utf-8");
  return (yaml.load(content) as Project[]) || [];
}

function writeProjects(projects: Project[]) {
  const content = yaml.dump(projects, { lineWidth: 1000 });
  atomicWriteFile(projectsPath, content);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const projects = readProjects();
  if (slug) {
    const project = projects.find((p) => p.slug === slug);
    return project
      ? NextResponse.json({ success: true, project })
      : NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const projects = readProjects();

    // Generate slug
    const slug = slugifyCjk(body.name);

    const project = {
      slug,
      name: body.name,
      description: body.description || "",
      draft: body.draft || false,
      techStack: body.techStack || [],
      highlights: body.highlights || [],
      githubUrl: body.githubUrl || "",
      demoUrl: body.demoUrl || "",
      image: body.image || "",
      cover: body.cover || "",
      content: body.content || "",
      details: body.details || {},
      relatedPosts: body.relatedPosts || [],
    };

    projects.push(project);
    writeProjects(projects);

    refreshAfterContentChange(undefined, 'project');

    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error("创建项目失败:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}

const ALLOWED_PROJECT_KEYS = ["name", "description", "draft", "techStack", "highlights", "githubUrl", "demoUrl", "image", "cover", "content", "details", "relatedPosts"];

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, ...rest } = body;
    const projects = readProjects();

    const index = projects.findIndex((p) => p.slug === slug);
    if (index === -1) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 });
    }

    // Only allow known project keys to prevent prototype pollution
    const updates: Record<string, unknown> = {};
    for (const key of ALLOWED_PROJECT_KEYS) {
      if (key in rest) {
        updates[key] = rest[key];
      }
    }

    projects[index] = { ...projects[index], ...updates };
    writeProjects(projects);

    refreshAfterContentChange(undefined, 'project');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("更新项目失败:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug } = body;
    let projects = readProjects();

    projects = projects.filter((p) => p.slug !== slug);
    writeProjects(projects);

    refreshAfterContentChange(undefined, 'project');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除项目失败:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
