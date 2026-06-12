import { getAllPostsSync } from "../../lib/posts";
import { getProjects } from "../../lib/projects";
import { generatePageMetadata } from "../../lib/seo";
import { PageHeader } from "../../components/ui/PageHeader";
import { Container } from "../../components/ui/Container";
import { FileText, FolderGit2, StickyNote } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = generatePageMetadata({
  title: "足迹",
  description: "文章、随手记和项目的时间线记录",
});

type FootprintItem = {
  date: string;
  type: "article" | "note" | "project";
  title: string;
  href: string;
  description: string;
};

const TYPE_STYLES: Record<
  FootprintItem["type"],
  { label: string; dot: string; badge: string; Icon: typeof FileText; iconCls: string }
> = {
  article: {
    label: "文章",
    dot: "bg-[var(--primary)]",
    badge: "bg-[var(--primary)]/10 text-[var(--primary)]",
    Icon: FileText,
    iconCls: "text-[var(--primary)]",
  },
  note: {
    label: "随手记",
    dot: "bg-sky-400",
    badge: "bg-sky-500/10 text-sky-500 dark:text-sky-400",
    Icon: StickyNote,
    iconCls: "text-sky-500 dark:text-sky-400",
  },
  project: {
    label: "项目",
    dot: "bg-[var(--accent)]",
    badge: "bg-[var(--accent)]/10 text-[var(--accent)]",
    Icon: FolderGit2,
    iconCls: "text-[var(--accent)]",
  },
};

export default function FootprintPage() {
  const posts = getAllPostsSync();
  const projects = getProjects();

  const items: FootprintItem[] = [
    ...posts.map((post) => ({
      date: post.date,
      type: post.type,
      title: post.title,
      href: `/blog/${post.slug}`,
      // 随手记的 summary 与标题相同，时间线上不重复展示
      description: post.type === "note" ? "" : post.summary,
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
    <>
      <PageHeader
        title="足迹"
        description="记录每一篇文章、随手记和项目"
        count={items.length}
        countLabel="条"
      />
      <Container className="pb-12">
      <div className="relative border-l-2 border-[var(--card-border)] ml-4 space-y-8">
        {items.length === 0 && (
          <p className="pl-6 text-[var(--muted)]">还没有足迹</p>
        )}
        {items.map((item, index) => {
          const style = TYPE_STYLES[item.type];
          return (
            <div key={index} className="pl-6 relative">
              <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-[var(--background)] ${style.dot}`} />
              <div className="flex items-center gap-2 mb-1">
                <style.Icon className={`w-4 h-4 ${style.iconCls}`} />
                <span className="text-xs text-[var(--muted)]">{item.date}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${style.badge}`}>{style.label}</span>
              </div>
              <a href={item.href} className="font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">
                {item.title}
              </a>
              {item.description && (
                <p className="text-sm text-[var(--muted)] mt-1">{item.description}</p>
              )}
            </div>
          );
        })}
      </div>
      </Container>
    </>
  );
}
