import { notFound } from "next/navigation";
import { getAllChattersSync, getChatterBySlug } from "../../../lib/chatters";
import { renderMarkdownToHtml } from "../../../lib/posts";
import { Container } from "../../../components/ui/Container";
import { Comment } from "../../../components/Comment";
import { Tag } from "../../../components/Tag";
import { formatDate } from "../../../lib/utils";
import { generatePageMetadata, generateBreadcrumbStructuredData, getSiteUrl, pageUrl } from "../../../lib/seo";
import { StructuredData } from "../../../components/StructuredData";
import type { Metadata } from "next";

export function generateStaticParams() {
  return getAllChattersSync().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = getChatterBySlug(slug);
  if (!c) return {};
  return generatePageMetadata({
    title: c.title,
    description: c.summary,
    url: pageUrl(`/chatters/${encodeURIComponent(slug)}`),
  });
}

export default async function ChatterDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = getChatterBySlug(slug);
  if (!c) notFound();
  const html = await renderMarkdownToHtml(c.content);

  const siteUrl = getSiteUrl();
  const chatterUrl = pageUrl(`/chatters/${encodeURIComponent(slug)}`);
  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: "首页", url: siteUrl },
    { name: "杂谈", url: `${siteUrl}/chatters` },
    { name: c.title, url: chatterUrl },
  ]);

  return (
    <>
    <StructuredData data={breadcrumbData} />
    <Container size="prose" className="py-12">
      <header className="mb-8">
        <div className="mb-3 flex items-center gap-2 text-sm text-[var(--muted)]">
          <time>{formatDate(c.date)}</time>
          {c.mood && (
            <span className="rounded-full bg-[var(--primary)]/10 px-2 py-0.5 text-xs text-[var(--primary)]">{c.mood}</span>
          )}
        </div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">{c.title}</h1>
        {c.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {c.tags.map((t) => (
              <Tag key={t} name={t} />
            ))}
          </div>
        )}
      </header>
      <article
        className="prose-custom max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <div className="mt-16">
        <Comment slug={`chatter-${c.slug}`} title={c.title} />
      </div>
    </Container>
    </>
  );
}
