import Link from "next/link";
import { Github, ExternalLink, FolderGit2, ArrowUpRight, Check } from "lucide-react";
import type { Project } from "../types/project";

/** 从 githubUrl 提取 owner/repo 作为仓库卡标题。 */
function repoLabel(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/github\.com\/([^/]+\/[^/?#]+)/i);
  return m ? m[1].replace(/\.git$/, "") : null;
}

/**
 * 项目列表条目（/projects）：参考 changelog/清单式布局——左侧图标/封面，
 * 右侧 GitHub 仓库卡 + 在线演示按钮突出，配技术栈与亮点。
 */
export function ProjectListItem({ project }: { project: Project }) {
  const repo = repoLabel(project.githubUrl);
  const cover = project.cover || project.image;

  return (
    <article className="group relative rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--primary)]/40 hover:shadow-[var(--shadow-glow)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {/* 图标 / 封面 */}
        <div className="shrink-0">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={project.name}
              className="h-14 w-14 rounded-xl object-cover sm:h-16 sm:w-16"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] sm:h-16 sm:w-16">
              <FolderGit2 className="h-7 w-7 text-white" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="text-lg font-semibold">
              <Link
                href={`/projects/${project.slug}`}
                className="inline-flex items-center gap-1 text-[var(--foreground)] transition-colors hover:text-[var(--primary)]"
              >
                {project.name}
                <ArrowUpRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            </h2>
            {/* 链接：GitHub 仓库卡 + 演示 */}
            <div className="flex flex-wrap items-center gap-2">
              {repo && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-2.5 py-1 text-xs text-[var(--muted)] transition-colors hover:border-[var(--primary)]/50 hover:text-[var(--primary)]"
                >
                  <Github className="h-3.5 w-3.5" />
                  <span className="font-mono">{repo}</span>
                </a>
              )}
              {project.demoUrl && (
                <a
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)]/10 px-2.5 py-1 text-xs font-medium text-[var(--primary)] transition-colors hover:bg-[var(--primary)]/20"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  在线演示
                </a>
              )}
            </div>
          </div>

          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            {project.description}
          </p>

          {/* 技术栈 */}
          {project.techStack?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {project.techStack.map((t) => (
                <span
                  key={t}
                  className="rounded-md bg-[var(--primary)]/10 px-2 py-0.5 text-xs text-[var(--primary)]"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* 亮点 */}
          {project.highlights?.length > 0 && (
            <ul className="mt-3 grid gap-1 sm:grid-cols-2">
              {project.highlights.slice(0, 4).map((h) => (
                <li
                  key={h}
                  className="flex items-start gap-1.5 text-xs text-[var(--muted)]"
                >
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--primary)]" />
                  {h}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </article>
  );
}
