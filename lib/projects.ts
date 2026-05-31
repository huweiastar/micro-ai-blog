import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import type { Project } from "../types/project";

const projectsPath = path.join(process.cwd(), "content/projects/projects.yaml");

export function getProjects(): Project[] {
  if (!fs.existsSync(projectsPath)) return [];
  const fileContent = fs.readFileSync(projectsPath, "utf-8");
  const data = yaml.load(fileContent, { schema: yaml.DEFAULT_SCHEMA }) as Project[];
  return data || [];
}

export function getProjectBySlug(slug: string): Project | null {
  return getProjects().find((p) => p.slug === slug) || null;
}

export function saveProjects(projects: Project[]) {
  const content = yaml.dump(projects, { lineWidth: 1000 });
  fs.writeFileSync(projectsPath, content, "utf-8");
}
