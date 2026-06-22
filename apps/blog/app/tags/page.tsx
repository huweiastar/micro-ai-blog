import Link from "next/link";
import { getAllTags } from "../../lib/posts";
import { PageHeader } from "../../components/ui/PageHeader";
import { Container } from "../../components/ui/Container";
import { generatePageMetadata } from "../../lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = generatePageMetadata({
  title: "标签",
  description: "所有文章标签",
  url: "/tags",
});

export default function TagsPage() {
  const tags = getAllTags();

  // 标签权重云（§Phase3.1）：字号/不透明度随文章数线性映射，越热的标签越大越实。
  const counts = tags.map((t) => t.count);
  const max = Math.max(...counts, 1);
  const min = Math.min(...counts, 0);
  const weight = (c: number) => (max === min ? 1 : (c - min) / (max - min));

  return (
    <>
      <PageHeader
        title="文章标签"
        description="按关键词检索文章，字号越大代表文章越多"
        count={tags.length}
        countLabel="个标签"
      />
      <Container className="pb-12">
        {tags.length === 0 ? (
          <p className="py-16 text-center text-[var(--muted)]">还没有标签</p>
        ) : (
          <div className="flex flex-wrap items-baseline gap-x-5 gap-y-3">
            {tags.map((tag) => {
              const w = weight(tag.count);
              return (
                <Link
                  key={tag.name}
                  href={`/tags/${encodeURIComponent(tag.name)}`}
                  className="group inline-flex items-baseline gap-1 font-medium text-[var(--foreground)] transition-colors hover:text-[var(--primary)]"
                  style={{
                    fontSize: `${(0.85 + w * 1.05).toFixed(3)}rem`,
                    opacity: (0.55 + w * 0.45).toFixed(3),
                  }}
                >
                  {tag.name}
                  <span className="font-mono text-[0.7em] tabular-nums text-[var(--muted)]">
                    {tag.count}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </Container>
    </>
  );
}
