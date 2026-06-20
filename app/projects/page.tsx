import { getProjects } from "../../lib/projects";
import { ProjectListItem } from "../../components/ProjectListItem";
import { PageHeader } from "../../components/ui/PageHeader";
import { Container } from "../../components/ui/Container";
import { generatePageMetadata } from "../../lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = generatePageMetadata({
  title: "项目展示",
  description: "个人项目经历展示",
});

export default function ProjectsPage() {
  const projects = getProjects();

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
            <ProjectListItem key={project.slug} project={project} />
          ))}
        </div>
      </Container>
    </>
  );
}
