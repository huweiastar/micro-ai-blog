import { notFound } from "next/navigation";
import Link from "next/link";
import { getProjects, getProjectBySlug } from "../../../lib/projects";
import { getPostBySlug, renderMarkdownToHtml } from "../../../lib/posts";
import { formatDate } from "../../../lib/utils";
import { generatePageMetadata } from "../../../lib/seo";
import { Comment } from "../../../components/Comment";
import { ViewCount } from "../../../components/ViewCount";
import { ProjectCover } from "../../../components/ProjectCover";
import {
  ArrowLeft,
  Github,
  ExternalLink,
  Code2,
  FolderOpen,
} from "lucide-react";
import type { Metadata } from "next";

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  const projects = getProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  props: ProjectPageProps
): Promise<Metadata> {
  const params = await props.params;
  const project = getProjectBySlug(params.slug);
  if (!project || project.draft) return { title: "项目未找到" };

  return generatePageMetadata({
    title: `${project.name} | 项目`,
    description: project.description,
    keywords: project.techStack.join(", "),
    type: "website",
  });
}

export default async function ProjectDetailPage(props: ProjectPageProps) {
  const params = await props.params;
  const project = getProjectBySlug(params.slug);
  if (!project || project.draft) notFound();

  // Fetch related posts
  const relatedPosts = await Promise.all(
    (project.relatedPosts || []).map((slug) => getPostBySlug(slug))
  ).then((results) => results.filter(Boolean));

  const details = project.details || {};

  // Render Markdown content if available, otherwise fall back to legacy details
  const hasMarkdownContent =
    project.content && project.content.trim().length > 0;
  const contentHtml = hasMarkdownContent
    ? { __html: await renderMarkdownToHtml(project.content!) }
    : null;
  const currentPath = `/projects/${project.slug}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Link
        href="/projects"
        className="hover:border-[var(--primary)]/50 hover:shadow-[var(--primary)]/10 group mb-8 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--card-border)] text-[var(--muted)] transition-all duration-200 hover:text-[var(--primary)] hover:shadow-md"
        aria-label="返回项目列表"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
      </Link>

      {/* Project Header */}
      <header className="glass mb-8 rounded-xl border border-[var(--card-border)] p-8">
        {/* Cover hero — real image, or deterministic generated artwork when absent */}
        <ProjectCover
          src={project.cover}
          alt={project.name}
          seed={project.slug}
        />
        <h1 className="mb-3 text-3xl font-bold">{project.name}</h1>
        <p className="mb-6 text-lg leading-relaxed text-[var(--muted)]">
          {project.description}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:border-[var(--primary)]/50 inline-flex items-center gap-2 rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm text-[var(--muted)] transition-colors hover:text-[var(--primary)]"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
          )}
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:border-[var(--primary)]/50 inline-flex items-center gap-2 rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm text-[var(--muted)] transition-colors hover:text-[var(--primary)]"
            >
              <ExternalLink className="h-4 w-4" />
              在线演示
            </a>
          )}
          <ViewCount path={currentPath} className="ml-auto" />
        </div>
      </header>

      <div className="space-y-8">
        {/* Tech Stack */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-[var(--primary)]" />
            <span className="font-medium text-[var(--foreground)]">
              技术栈：
            </span>
          </div>
          {project.techStack.map((tech) => (
            <span
              key={tech}
              className="bg-[var(--primary)]/10 border-[var(--primary)]/20 rounded-full border px-2.5 py-1 text-xs text-[var(--primary)]"
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Markdown Content (new style) — rendered like a blog post */}
        {hasMarkdownContent && contentHtml && (
          <div className="prose-custom glass rounded-xl border border-[var(--card-border)] p-6">
            <div dangerouslySetInnerHTML={contentHtml} />
          </div>
        )}

        {/* Legacy Details (fallback) */}
        {!hasMarkdownContent &&
          (details.background ||
            details.problem ||
            details.solution ||
            details.results) && (
            <div className="glass rounded-xl border border-[var(--card-border)] p-6">
              <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold">
                <FolderOpen className="h-5 w-5 text-[var(--primary)]" />
                项目详情
              </h2>
              <div className="space-y-6">
                {details.background && (
                  <div>
                    <h3 className="mb-2 font-medium text-[var(--foreground)]">
                      项目背景
                    </h3>
                    <p className="leading-relaxed text-[var(--muted)]">
                      {details.background}
                    </p>
                  </div>
                )}
                {details.problem && (
                  <div>
                    <h3 className="mb-2 font-medium text-[var(--foreground)]">
                      核心问题
                    </h3>
                    <p className="leading-relaxed text-[var(--muted)]">
                      {details.problem}
                    </p>
                  </div>
                )}
                {details.solution && (
                  <div>
                    <h3 className="mb-2 font-medium text-[var(--foreground)]">
                      解决方案
                    </h3>
                    <p className="leading-relaxed text-[var(--muted)]">
                      {details.solution}
                    </p>
                  </div>
                )}
                {details.results && (
                  <div>
                    <h3 className="mb-2 font-medium text-[var(--foreground)]">
                      项目成果
                    </h3>
                    <p className="leading-relaxed text-[var(--muted)]">
                      {details.results}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Highlights */}
        <div className="glass rounded-xl border border-[var(--card-border)] p-6">
          <h2 className="mb-4 text-lg font-semibold">项目亮点</h2>
          <ul className="space-y-3">
            {project.highlights.map((highlight, index) => (
              <li
                key={index}
                className="flex items-start gap-3 text-[var(--muted)]"
              >
                <span className="mt-0.5 font-bold text-[var(--primary)]">
                  +
                </span>
                <span className="leading-relaxed">{highlight}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="glass rounded-xl border border-[var(--card-border)] p-6">
            <h2 className="mb-4 text-lg font-semibold">相关文章</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {relatedPosts.map((post) => (
                <Link
                  key={post!.slug}
                  href={`/blog/${post!.slug}`}
                  className="hover:border-[var(--primary)]/50 rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-4 transition-colors"
                >
                  <h3 className="mb-1 line-clamp-2 text-sm font-medium">
                    {post!.title}
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    {formatDate(post!.date)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        <div className="mt-12">
          <Comment slug={`project-${project.slug}`} title={project.name} />
        </div>
      </div>
    </div>
  );
}
