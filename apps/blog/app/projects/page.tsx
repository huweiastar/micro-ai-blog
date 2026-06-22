import { ProjectListItem } from "../../components/ProjectListItem";
import { PageHeader } from "../../components/ui/PageHeader";
import { Container } from "../../components/ui/Container";
import { generatePageMetadata } from "../../lib/seo";
import { api } from "../../lib/api/client";
import type { Metadata } from "next";

export const metadata: Metadata = generatePageMetadata({
  title: "项目展示",
  description: "个人项目经历展示",
});

export default async function ProjectsPage() {
  let projects: Array<{
    slug: string;
    name: string;
    description: string | null;
    techStack: string[];
    githubUrl: string | null;
    demoUrl: string | null;
    highlights: string[];
    background?: string | null;
    problem?: string | null;
    solution?: string | null;
    results?: string | null;
  }> = [];

  try {
    const { items } = await api.projects.list();
    projects = items.map((p) => ({
      slug: p.slug,
      name: p.name,
      description: p.description,
      techStack: p.techStack,
      githubUrl: p.githubUrl,
      demoUrl: p.demoUrl,
      highlights: p.highlights,
      background: p.background,
      problem: p.problem,
      solution: p.solution,
      results: p.results,
    }));
  } catch (err) {
    console.error("Failed to fetch projects from API:", err);
  }

  return (
    <>
      <PageHeader
        title="项目展示"
        description="以下是我参与或独立完成的技术项目"
        count={projects.length}
        countLabel="个"
      />
      <Container className="pb-12">
        <div className="space-y-5">
          {projects.map((project) => (
            <ProjectListItem key={project.slug} project={project as any} />
          ))}
        </div>
      </Container>
    </>
  );
}
