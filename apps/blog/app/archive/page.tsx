import Link from "next/link";
import { getAllPostsSync } from "../../lib/posts";
import { PageHeader } from "../../components/ui/PageHeader";
import { Container } from "../../components/ui/Container";
import { generatePageMetadata } from "../../lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = generatePageMetadata({
  title: "归档",
  description: "文章归档",
  url: "/archive",
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
        {posts.length === 0 ? (
          <p className="py-16 text-center text-[var(--muted)]">还没有文章</p>
        ) : (
          /* 归档时间线（§Phase3.2）：按年分组的竖向时间轴，左侧年份节点 + 发丝线 */
          <div className="space-y-12">
            {Object.entries(grouped)
              .sort((a, b) => b[0].localeCompare(a[0]))
              .map(([year, months]) => {
                const yearCount = Object.values(months).reduce(
                  (s, m) => s + m.length,
                  0
                );
                return (
                  <section key={year}>
                    {/* 年份节点 */}
                    <div className="mb-5 flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary)] font-mono text-sm font-bold tabular-nums text-white">
                        {year.slice(2)}
                      </span>
                      <h2 className="text-2xl font-bold">
                        {year} 年
                        <span className="ml-2 text-sm font-normal text-[var(--muted)]">
                          {yearCount} 篇
                        </span>
                      </h2>
                    </div>
                    {/* 该年时间轴 */}
                    <div className="ml-5 space-y-6 border-l-2 border-[var(--card-border)] pl-7">
                      {Object.entries(months)
                        .sort((a, b) => b[0].localeCompare(a[0]))
                        .map(([month, monthPosts]) => (
                          <div key={month}>
                            <h3 className="mb-3 font-mono text-sm font-semibold tabular-nums text-[var(--muted)]">
                              {month} 月
                            </h3>
                            <ul className="space-y-2.5">
                              {monthPosts.map((post) => (
                                <li key={post.slug} className="relative">
                                  <span
                                    aria-hidden
                                    style={{ left: "-34px" }}
                                    className="absolute top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--card-border)] ring-4 ring-[var(--background)]"
                                  />
                                  <Link
                                    href={`/blog/${post.slug}`}
                                    className="text-sm text-[var(--foreground)] transition-colors hover:text-[var(--primary)]"
                                  >
                                    {post.title}
                                  </Link>
                                  <span className="ml-2 font-mono text-xs tabular-nums text-[var(--muted)]">
                                    {post.date}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                    </div>
                  </section>
                );
              })}
          </div>
        )}
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
