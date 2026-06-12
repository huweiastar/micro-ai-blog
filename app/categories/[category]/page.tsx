import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostsByCategory } from "../../../lib/posts";
import { getAllCategories, getCategoryByName } from "../../../lib/categories";
import { BlogCard } from "../../../components/BlogCard";
import { Container } from "../../../components/ui/Container";
import { EmptyState } from "../../../components/ui/EmptyState";
import { generatePageMetadata } from "../../../lib/seo";
import { renderMarkdownToHtml } from "../../../lib/posts";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

interface CategoryPageProps {
  params: { category: string };
}

export function generateStaticParams() {
  return getAllCategories().map((c) => ({ category: c.name }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const category = decodeURIComponent(params.category);
  return generatePageMetadata({
    title: category,
    description: `${category}专栏下的所有文章`,
  });
}

export default async function CategoryDetailPage({ params }: CategoryPageProps) {
  const category = decodeURIComponent(params.category);
  const posts = getPostsByCategory(category);
  const catConfig = getCategoryByName(category);

  if (!catConfig) notFound();

  return (
    <Container className="py-12">
      <Link
        href="/categories"
        className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/50 hover:shadow-[var(--primary)]/10 hover:shadow-md transition-all duration-200 mb-6 group"
        aria-label="返回专栏列表"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
      </Link>

      {/* Category Header */}
      <div className="relative rounded-2xl overflow-hidden mb-10 border border-[var(--card-border)]">
        {/* Background */}
        {catConfig.cover ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${catConfig.cover})` }}
            />
            <div className="absolute inset-0 bg-[var(--card)]/80 backdrop-blur-sm" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/15 via-[var(--accent)]/8 to-transparent" />
            <div className="absolute inset-0 bg-[var(--card)]/50 backdrop-blur-sm" />
          </>
        )}

        <div className="relative z-10 p-8">
          <h1 className="text-3xl font-bold mb-2">{category}</h1>
          {catConfig.description && (
            <p className="text-[var(--muted)] mb-4 text-base">{catConfig.description}</p>
          )}
          {catConfig.description_long && (
            <div
              className="mt-4 prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: await renderMarkdownToHtml(catConfig.description_long) }}
            />
          )}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] text-sm font-medium">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
            共 {posts.length} 篇文章
          </span>
        </div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-transparent" />
      </div>

      {posts.length === 0 ? (
        <EmptyState
          title="该专栏下还没有文章"
          description="敬请期待，更多内容正在路上"
          action={{ label: "浏览全部文章", href: "/blog" }}
        />
      ) : (
        <div className="grid gap-6">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </Container>
  );
}
