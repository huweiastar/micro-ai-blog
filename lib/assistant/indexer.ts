import fs from "fs";
import path from "path";
import { atomicWriteFile } from "../atomic-file";
import { slugify } from "../utils";
import matter from "gray-matter";
import yaml from "js-yaml";
import type { KnowledgeChunk, KnowledgeIndex } from "./types";
import type { Project } from "../../types/project";

const BLOG_DIR = path.join(process.cwd(), "content/blog");
const PROJECTS_YAML = path.join(process.cwd(), "content/projects/projects.yaml");
const INDEX_OUTPUT = path.join(process.cwd(), "public/knowledge-index.json");

function chunkId(sourceType: string, base: string, index: number): string {
  return `${sourceType}-${slugify(base)}-${index}`;
}

function indexBlogs(): KnowledgeChunk[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md") || f.endsWith(".mdx"));
  const chunks: KnowledgeChunk[] = [];

  for (const file of files) {
    const filePath = path.join(BLOG_DIR, file);
    const source = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(source);

    if (data.draft) continue;

    const slug = file.replace(/\.(md|mdx)$/, "");
    const title = (data.title as string) || "";
    const category = (data.category as string) || "";
    const tags = (data.tags as string[]) || [];
    const date = (data.date as string) || "";

    // Summary chunk (whole article overview)
    chunks.push({
      id: chunkId("blog", slug, 0),
      sourceType: "blog",
      title,
      content: content.slice(0, 2000),
      summary: (data.summary as string) || "",
      url: `/blog/${slug}`,
      filePath,
      slug,
      category,
      tags,
      updatedAt: date,
    });

    // Section chunks (split by H2)
    const sections = content.split(/^##\s+.+$/gm);
    const headings = content.match(/^##\s+.+$/gm) || [];

    for (let i = 0; i < headings.length; i++) {
      const heading = headings[i].replace(/^##\s+/, "").trim();
      let sectionContent = sections[i + 1]?.trim() || "";

      // Skip very short sections
      if (sectionContent.length < 50) continue;

      // Split long sections further
      if (sectionContent.length > 1500) {
        const subSections = splitByLength(sectionContent, 800, 100);
        for (let j = 0; j < subSections.length; j++) {
          chunks.push({
            id: chunkId("blog", `${slug}-${slugify(heading)}`, j),
            sourceType: "blog",
            title: `${title} - ${heading}`,
            content: subSections[j],
            url: `/blog/${slug}#${slugify(heading)}`,
            slug,
            category,
            tags,
            updatedAt: date,
          });
        }
      } else {
        chunks.push({
          id: chunkId("blog", `${slug}-${slugify(heading)}`, 0),
          sourceType: "blog",
          title: `${title} - ${heading}`,
          content: sectionContent,
          url: `/blog/${slug}#${slugify(heading)}`,
          slug,
          category,
          tags,
          updatedAt: date,
        });
      }
    }
  }

  return chunks;
}

function indexProjects(): KnowledgeChunk[] {
  if (!fs.existsSync(PROJECTS_YAML)) return [];

  const content = fs.readFileSync(PROJECTS_YAML, "utf-8");
  const projects = (yaml.load(content, { schema: yaml.DEFAULT_SCHEMA }) as Project[]) || [];
  const chunks: KnowledgeChunk[] = [];

  for (const project of projects) {
    const details = project.details || {};

    // Project overview chunk
    const overviewContent = [
      project.description,
      `技术栈: ${project.techStack.join(", ")}`,
      ...project.highlights.map((h) => `- ${h}`),
      details.background ? `背景: ${details.background}` : "",
      details.problem ? `问题: ${details.problem}` : "",
      details.solution ? `方案: ${details.solution}` : "",
      details.results ? `成果: ${details.results}` : "",
    ].filter(Boolean).join("\n");

    chunks.push({
      id: chunkId("project", project.slug, 0),
      sourceType: "project",
      title: project.name,
      content: overviewContent,
      summary: project.description,
      url: `/projects/${project.slug}`,
      slug: project.slug,
      projectSlug: project.slug,
      tags: project.techStack,
    });

    // Individual detail chunks
    if (details.background) {
      chunks.push({
        id: chunkId("project", `${project.slug}-background`, 0),
        sourceType: "project",
        title: `${project.name} - 项目背景`,
        content: details.background,
        projectSlug: project.slug,
        tags: project.techStack,
      });
    }
    if (details.problem) {
      chunks.push({
        id: chunkId("project", `${project.slug}-problem`, 0),
        sourceType: "project",
        title: `${project.name} - 核心问题`,
        content: details.problem,
        projectSlug: project.slug,
        tags: project.techStack,
      });
    }
    if (details.solution) {
      chunks.push({
        id: chunkId("project", `${project.slug}-solution`, 0),
        sourceType: "project",
        title: `${project.name} - 解决方案`,
        content: details.solution,
        projectSlug: project.slug,
        tags: project.techStack,
      });
    }
  }

  return chunks;
}

function splitByLength(text: string, maxLen: number, overlap: number): string[] {
  const parts: string[] = [];
  // Ensure overlap is less than maxLen to guarantee progress
  const safeOverlap = Math.min(overlap, Math.max(maxLen - 1, 0));
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + maxLen, text.length);
    parts.push(text.slice(start, end).trim());
    if (end >= text.length) break;
    start = end - safeOverlap;
  }

  return parts;
}

export function buildKnowledgeIndex(): KnowledgeIndex {
  const blogChunks = indexBlogs();
  const projectChunks = indexProjects();

  const chunks = [...blogChunks, ...projectChunks];

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    chunks,
    stats: {
      blogCount: blogChunks.length,
      projectCount: projectChunks.length,
      codeCount: 0,
      totalChunks: chunks.length,
    },
  };
}

export function saveKnowledgeIndex(): string {
  const index = buildKnowledgeIndex();

  const outputDir = path.dirname(INDEX_OUTPUT);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  atomicWriteFile(INDEX_OUTPUT, JSON.stringify(index, null, 2));
  return INDEX_OUTPUT;
}

// CLI entry point
if (require.main === module) {
  const outputPath = saveKnowledgeIndex();
  const index = JSON.parse(fs.readFileSync(outputPath, "utf-8")) as KnowledgeIndex;
  console.log(`Knowledge index saved to ${outputPath}`);
  console.log(`  Blog chunks: ${index.stats.blogCount}`);
  console.log(`  Project chunks: ${index.stats.projectCount}`);
  console.log(`  Total chunks: ${index.stats.totalChunks}`);
}
