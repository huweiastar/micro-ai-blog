import { notFound } from "next/navigation";
import Link from "next/link";
import { getProjects, getProjectBySlug } from "../../../lib/projects";
import { getPostBySlug, renderMarkdownToHtml } from "../../../lib/posts";
import { formatDate } from "../../../lib/utils";
import { generatePageMetadata } from "../../../lib/seo";
import { Comment } from "../../../components/Comment";
import { ViewCount } from "../../../components/ViewCount";
import { ProjectCover } from "../../../components/ProjectCover";
import { ArrowLeft, Github, ExternalLink, Code2, FolderOpen } from "lucide-react";
import type { Metadata } from "next";

interface ProjectPageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  const projects = getProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const project = getProjectBySlug(params.slug);
  if (!project) return { title: "项目未找到" };

  return generatePageMetadata({
    title: `${project.name} | 项目`,
    description: project.description,
    keywords: project.techStack.join(", "),
    type: "website",
  });
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const project = getProjectBySlug(params.slug);
  if (!project) notFound();

  // Fetch related posts
  const relatedPosts = await Promise.all(
    (project.relatedPosts || []).map((slug) => getPostBySlug(slug))
  ).then((results) => results.filter(Boolean));

  const details = project.details || {};

  // Render Markdown content if available, otherwise fall back to legacy details
  const hasMarkdownContent = project.content && project.content.trim().length > 0;
  const contentHtml = hasMarkdownContent ? { __html: await renderMarkdownToHtml(project.content!) } : null;
  const currentPath = `/projects/${project.slug}`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <Link
        href="/projects"
        className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/50 hover:shadow-[var(--primary)]/10 hover:shadow-md transition-all duration-200 mb-8 group"
        aria-label="返回项目列表"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
      </Link>

      {/* Project Header */}
      <header className="glass rounded-xl p-8 border border-[var(--card-border)] mb-8">
        {/* Cover hero — real image, or deterministic generated artwork when absent */}
        <ProjectCover src={project.cover} alt={project.name} seed={project.slug} />
        <h1 className="text-3xl font-bold mb-3">{project.name}</h1>
        <p className="text-[var(--muted)] text-lg leading-relaxed mb-6">{project.description}</p>

        <div className="flex flex-wrap gap-3 items-center">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/50 transition-colors"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
          )}
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/50 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
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
            <Code2 className="w-4 h-4 text-[var(--primary)]" />
            <span className="font-medium text-[var(--foreground)]">技术栈：</span>
          </div>
          {project.techStack.map((tech) => (
            <span
              key={tech}
              className="px-2.5 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-xs border border-[var(--primary)]/20"
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Markdown Content (new style) — rendered like a blog post */}
        {hasMarkdownContent && contentHtml && (
          <div className="prose-custom glass rounded-xl p-6 border border-[var(--card-border)]">
            <div dangerouslySetInnerHTML={contentHtml} />
          </div>
        )}

        {/* Legacy Details (fallback) */}
        {!hasMarkdownContent && (details.background || details.problem || details.solution || details.results) && (
          <div className="glass rounded-xl p-6 border border-[var(--card-border)]">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-[var(--primary)]" />
              项目详情
            </h2>
            <div className="space-y-6">
              {details.background && (
                <div>
                  <h3 className="font-medium text-[var(--foreground)] mb-2">项目背景</h3>
                  <p className="text-[var(--muted)] leading-relaxed">{details.background}</p>
                </div>
              )}
              {details.problem && (
                <div>
                  <h3 className="font-medium text-[var(--foreground)] mb-2">核心问题</h3>
                  <p className="text-[var(--muted)] leading-relaxed">{details.problem}</p>
                </div>
              )}
              {details.solution && (
                <div>
                  <h3 className="font-medium text-[var(--foreground)] mb-2">解决方案</h3>
                  <p className="text-[var(--muted)] leading-relaxed">{details.solution}</p>
                </div>
              )}
              {details.results && (
                <div>
                  <h3 className="font-medium text-[var(--foreground)] mb-2">项目成果</h3>
                  <p className="text-[var(--muted)] leading-relaxed">{details.results}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Highlights */}
        <div className="glass rounded-xl p-6 border border-[var(--card-border)]">
          <h2 className="text-lg font-semibold mb-4">项目亮点</h2>
          <ul className="space-y-3">
            {project.highlights.map((highlight, index) => (
              <li key={index} className="flex items-start gap-3 text-[var(--muted)]">
                <span className="text-[var(--primary)] font-bold mt-0.5">+</span>
                <span className="leading-relaxed">{highlight}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="glass rounded-xl p-6 border border-[var(--card-border)]">
            <h2 className="text-lg font-semibold mb-4">相关文章</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {relatedPosts.map((post) => (
                <Link
                  key={post!.slug}
                  href={`/blog/${post!.slug}`}
                  className="p-4 rounded-lg border border-[var(--card-border)] bg-[var(--card)] hover:border-[var(--primary)]/50 transition-colors"
                >
                  <h3 className="font-medium text-sm mb-1 line-clamp-2">{post!.title}</h3>
                  <p className="text-xs text-[var(--muted)]">{formatDate(post!.date)}</p>
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
