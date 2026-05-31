import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostsByTag, getAllTags } from "../../../lib/posts";
import { BlogCard } from "../../../components/BlogCard";
import { generatePageMetadata } from "../../../lib/seo";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

interface TagPageProps {
  params: { tag: string };
}

export function generateStaticParams() {
  return getAllTags().map((t) => ({ tag: t.name }));
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const tag = decodeURIComponent(params.tag);
  return generatePageMetadata({
    title: tag,
    description: `${tag}标签下的所有文章`,
  });
}

export default function TagDetailPage({ params }: TagPageProps) {
  const tag = decodeURIComponent(params.tag);
  const posts = getPostsByTag(tag);

  if (posts.length === 0) notFound();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <Link
        href="/tags"
        className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/50 hover:shadow-[var(--primary)]/10 hover:shadow-md transition-all duration-200 mb-6 group"
        aria-label="返回标签列表"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
      </Link>

      <h1 className="text-3xl font-bold mb-2">{tag}</h1>
      <p className="text-[var(--muted)] text-sm mb-8">
        共 {posts.length} 篇文章
      </p>

      <div className="grid gap-6">
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}
