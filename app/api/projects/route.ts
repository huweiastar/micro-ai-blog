import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";

const projectsPath = path.join(process.cwd(), "content/projects/projects.yaml");

function readProjects() {
  if (!fs.existsSync(projectsPath)) return [];
  const content = fs.readFileSync(projectsPath, "utf-8");
  return (yaml.load(content, { schema: yaml.DEFAULT_SCHEMA }) as any[]) || [];
}

function writeProjects(projects: any[]) {
  const content = yaml.dump(projects, { lineWidth: 1000 });
  fs.writeFileSync(projectsPath, content, "utf-8");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const projects = readProjects();
  if (slug) {
    const project = projects.find((p: any) => p.slug === slug);
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
    const slug = body.name
      .toLowerCase()
      .replace(/[^\w一-龥]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const project = {
      slug,
      name: body.name,
      description: body.description || "",
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

    return NextResponse.json({ success: true, project });
  } catch (error) {
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}

const ALLOWED_PROJECT_KEYS = ["name", "description", "techStack", "highlights", "githubUrl", "demoUrl", "image", "cover", "content", "details", "relatedPosts"];

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, ...rest } = body;
    const projects = readProjects();

    const index = projects.findIndex((p: any) => p.slug === slug);
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

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug } = body;
    let projects = readProjects();

    projects = projects.filter((p: any) => p.slug !== slug);
    writeProjects(projects);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
