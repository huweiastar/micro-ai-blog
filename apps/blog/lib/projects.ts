import fs from "fs";
import path from "path";
import { contentDir } from "./paths";
import yaml from "js-yaml";
import { atomicWriteFile } from "./atomic-file";
import type { Project } from "../types/project";

const projectsPath = path.join(contentDir(), "projects/projects.yaml");

// 读取全部项目（含草稿）——仅供后台使用。
export function getAllProjects(): Project[] {
  if (!fs.existsSync(projectsPath)) return [];
  const fileContent = fs.readFileSync(projectsPath, "utf-8");
  const data = yaml.load(fileContent, { schema: yaml.DEFAULT_SCHEMA }) as Project[];
  return data || [];
}

// 公开项目：过滤掉草稿。所有面向访客的页面都应使用此函数。
export function getProjects(): Project[] {
  return getAllProjects().filter((p) => !p.draft);
}

// 按 slug 查找（含草稿）。公开页面需自行判断 draft 后 notFound。
export function getProjectBySlug(slug: string): Project | null {
  return getAllProjects().find((p) => p.slug === slug) || null;
}

export function saveProjects(projects: Project[]) {
  const content = yaml.dump(projects, { lineWidth: 1000 });
  atomicWriteFile(projectsPath, content);
}
