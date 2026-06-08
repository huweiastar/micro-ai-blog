import Link from "next/link";
import { getAllPostsSync } from "../../lib/posts";
import { PageHeader } from "../../components/ui/PageHeader";
import { Container } from "../../components/ui/Container";
import { generatePageMetadata } from "../../lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = generatePageMetadata({
  title: "归档",
  description: "文章归档",
});

export default function ArchivePage() {
  const posts = getAllPostsSync();
  const grouped = groupPostsByYearAndMonth(posts);

  return (
    <>
      <PageHeader
        title="文章归档"
        description="按时间回顾全部文章"
        count={posts.length}
        countLabel="篇"
      />
      <Container className="pb-12">
        <div className="space-y-8">
        {Object.entries(grouped)
          .sort((a, b) => b[0].localeCompare(a[0]))
          .map(([year, months]) => (
            <div key={year}>
              <h2 className="text-2xl font-bold mb-4 text-[var(--primary)]">
                {year} 年
              </h2>
              <div className="space-y-6 pl-4">
                {Object.entries(months)
                  .sort((a, b) => b[0].localeCompare(a[0]))
                  .map(([month, monthPosts]) => (
                    <div key={month}>
                      <h3 className="text-lg font-semibold mb-3 text-[var(--muted)]">
                        {month} 月
                      </h3>
                      <ul className="space-y-2 ml-4">
                        {monthPosts.map((post) => (
                          <li key={post.slug}>
                            <Link
                              href={`/blog/${post.slug}`}
                              className="text-sm text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
                            >
                              {post.title}
                            </Link>
                            <span className="text-xs text-[var(--muted)] ml-2">
                              {post.date}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </>
  );
}

function groupPostsByYearAndMonth(
  posts: { slug: string; title: string; date: string }[]
): Record<string, Record<string, { slug: string; title: string; date: string }[]>> {
  const grouped: Record<string, Record<string, { slug: string; title: string; date: string }[]>> = {};

  posts.forEach((post) => {
    const date = new Date(post.date);
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");

    if (!grouped[year]) grouped[year] = {};
    if (!grouped[year][month]) grouped[year][month] = [];

    grouped[year][month].push({ slug: post.slug, title: post.title, date: post.date });
  });

  return grouped;
}
