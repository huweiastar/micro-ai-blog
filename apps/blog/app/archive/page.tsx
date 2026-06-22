import { getAllPostsSync } from "../../lib/posts";
import { PageHeader } from "../../components/ui/PageHeader";
import { Container } from "../../components/ui/Container";
import { TimeRiver } from "../../components/archive/TimeRiver";
import { generatePageMetadata } from "../../lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = generatePageMetadata({
  title: "归档",
  description: "文章归档",
});

export default function ArchivePage() {
  const posts = getAllPostsSync();
  const years = buildArchiveTree(posts);

  return (
    <>
      <PageHeader
        title="文章归档"
        description="按时间回顾全部文章"
        count={posts.length}
        countLabel="篇"
      />
      <Container className="pb-12">
        {posts.length === 0 ? (
          <p className="py-16 text-center text-[var(--muted)]">还没有文章</p>
        ) : (
          <TimeRiver years={years} />
        )}
      </Container>
    </>
  );
}

function buildArchiveTree(posts: { slug: string; title: string; date: string; category?: string }[]) {
  const yearMap = new Map<number, Map<number, any[]>>();

  for (const post of posts) {
    const d = new Date(post.date);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;

    if (!yearMap.has(year)) yearMap.set(year, new Map());
    const monthMap = yearMap.get(year)!;
    if (!monthMap.has(month)) monthMap.set(month, []);

    monthMap.get(month)!.push({
      slug: post.slug,
      title: post.title,
      publishedAt: post.date,
      category: post.category ? { slug: post.category, name: post.category } : null,
    });
  }

  return Array.from(yearMap.entries())
    .sort(([a], [b]) => b - a)
    .map(([year, monthMap]) => ({
      year,
      count: Array.from(monthMap.values()).reduce((s, m) => s + m.length, 0),
      months: Array.from(monthMap.entries())
        .sort(([a], [b]) => b - a)
        .map(([month, posts]) => ({ month, posts })),
    }));
}
