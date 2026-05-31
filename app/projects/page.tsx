import { getProjects } from "../../lib/projects";
import { ProjectCard } from "../../components/ProjectCard";
import { generatePageMetadata } from "../../lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = generatePageMetadata({
  title: "项目展示",
  description: "个人项目经历展示",
});

export default function ProjectsPage() {
  const projects = getProjects();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">项目展示</h1>
      <p className="text-[var(--muted)] mb-8">
        以下是我参与或独立完成的技术项目
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        {projects.map((project) => (
          <ProjectCard key={project.name} project={project} />
        ))}
      </div>
    </div>
  );
}
