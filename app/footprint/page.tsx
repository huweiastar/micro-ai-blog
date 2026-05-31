import { getAllPostsSync } from "../../lib/posts";
import { getProjects } from "../../lib/projects";
import { formatDate } from "../../lib/utils";
import { generatePageMetadata } from "../../lib/seo";
import { FileText, FolderGit2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = generatePageMetadata({
  title: "足迹",
  description: "文章和项目的时间线记录",
});

type FootprintItem = {
  date: string;
  type: "article" | "project";
  title: string;
  href: string;
  description: string;
};

export default function FootprintPage() {
  const posts = getAllPostsSync();
  const projects = getProjects();

  const items: FootprintItem[] = [
    ...posts.map((post) => ({
      date: post.date,
      type: "article" as const,
      title: post.title,
      href: `/blog/${post.slug}`,
      description: post.summary,
    })),
    ...projects.map((project) => ({
      date: new Date().toISOString().split("T")[0],
      type: "project" as const,
      title: project.name,
      href: project.githubUrl || project.demoUrl || "/projects",
      description: project.description,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">足迹</h1>
      <p className="text-[var(--muted)] mb-8">记录每一篇文章和项目</p>

      <div className="relative border-l-2 border-[var(--card-border)] ml-4 space-y-8">
        {items.length === 0 && (
          <p className="pl-6 text-[var(--muted)]">还没有足迹</p>
        )}
        {items.map((item, index) => (
          <div key={index} className="pl-6 relative">
            <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-[var(--background)] ${item.type === "article" ? "bg-[var(--primary)]" : "bg-[var(--accent)]"}`} />
            <div className="flex items-center gap-2 mb-1">
              {item.type === "article" ? (
                <FileText className="w-4 h-4 text-[var(--primary)]" />
              ) : (
                <FolderGit2 className="w-4 h-4 text-[var(--accent)]" />
              )}
              <span className="text-xs text-[var(--muted)]">{item.date}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${item.type === "article" ? "bg-[var(--primary)]/10 text-[var(--primary)]" : "bg-[var(--accent)]/10 text-[var(--accent)]"}`}>
                {item.type === "article" ? "文章" : "项目"}
              </span>
            </div>
            <a href={item.href} className="font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">
              {item.title}
            </a>
            <p className="text-sm text-[var(--muted)] mt-1">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
