import Link from "next/link";
import { getAllArticlesSync, getAllPostsSync, getAllTags } from "../../lib/posts";
import { getAllCategories } from "../../lib/categories";
import { getProjects } from "../../lib/projects";
import { getAnalytics } from "../../lib/analytics";
import { PageHeader } from "../../components/ui/PageHeader";
import { Container } from "../../components/ui/Container";
import { CategoryBar } from "../../components/ui/CategoryBar";
import { PublishHeatmap } from "../../components/ui/PublishHeatmap";
import { generatePageMetadata } from "../../lib/seo";
import { FileText, StickyNote, Layers, Tag as TagIcon, BookOpen, FolderGit2, Eye, Users } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = generatePageMetadata({
  title: "数据统计",
  description: "博客的数字侧写：文章、字数、访问与发布节奏",
});

const wordsFormat = (n: number) =>
  n > 10000 ? `${(n / 10000).toFixed(1)}万` : `${n}`;

export default function StatsPage() {
  const allPosts = getAllPostsSync();
  const articles = getAllArticlesSync();
  const noteCount = allPosts.length - articles.length;
  const totalWords = articles.reduce((s, p) => s + (p.wordCount || 0), 0);
  const categories = getAllCategories();
  const tags = getAllTags();
  const projects = getProjects();

  let visits = { pv: 0, uv: 0 };
  try {
    visits = getAnalytics();
  } catch {
    /* db 不可用时兜底为 0 */
  }

  const statItems = [
    { icon: FileText, label: "文章", value: articles.length.toString() },
    { icon: StickyNote, label: "随手记", value: noteCount.toString() },
    { icon: Layers, label: "专栏", value: categories.length.toString() },
    { icon: TagIcon, label: "标签", value: tags.length.toString() },
    { icon: BookOpen, label: "字数", value: wordsFormat(totalWords) },
    { icon: FolderGit2, label: "项目", value: projects.length.toString() },
    { icon: Eye, label: "访问量", value: visits.pv.toLocaleString() },
    { icon: Users, label: "访客", value: visits.uv.toLocaleString() },
  ];

  // 发布热力：文章 + 随手记的发布日期
  const heatmapDates = allPosts.map((p) => p.date);

  // 热门标签（按文章数加权字号）
  const topTags = [...tags].sort((a, b) => b.count - a.count).slice(0, 30);
  const maxTag = Math.max(...topTags.map((t) => t.count), 1);

  return (
    <>
      <PageHeader title="数据统计" description="博客的数字侧写" />
      <Container className="space-y-10 pb-16">
        {/* 数字概览：发丝线网格 */}
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card-border)] sm:grid-cols-4">
          {statItems.map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center bg-[var(--card)] px-2 py-6 text-center"
            >
              <item.icon className="mb-2 h-4 w-4 text-[var(--muted)]" />
              <div className="font-mono text-2xl font-bold tabular-nums text-[var(--foreground)]">
                {item.value}
              </div>
              <div className="mt-1 text-xs text-[var(--muted)]">{item.label}</div>
            </div>
          ))}
        </div>

        {/* 发布热力 */}
        <PublishHeatmap dates={heatmapDates} />

        {/* 专栏占比 */}
        {categories.length > 0 && (
          <section className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5">
            <h2 className="mb-4 text-sm font-medium text-[var(--foreground)]">
              专栏占比
            </h2>
            <CategoryBar categories={categories} />
          </section>
        )}

        {/* 热门标签 */}
        {topTags.length > 0 && (
          <section className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5">
            <h2 className="mb-4 text-sm font-medium text-[var(--foreground)]">
              热门标签
            </h2>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
              {topTags.map((tag) => {
                const w = tag.count / maxTag;
                return (
                  <Link
                    key={tag.name}
                    href={`/tags/${encodeURIComponent(tag.name)}`}
                    className="font-medium text-[var(--foreground)] transition-colors hover:text-[var(--primary)]"
                    style={{
                      fontSize: `${(0.8 + w * 0.7).toFixed(3)}rem`,
                      opacity: (0.6 + w * 0.4).toFixed(3),
                    }}
                  >
                    {tag.name}
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </Container>
    </>
  );
}
