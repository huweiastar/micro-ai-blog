import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostsByTag, getAllTags } from "../../../lib/posts";
import { BlogCard } from "../../../components/BlogCard";
import { Container } from "../../../components/ui/Container";
import { generatePageMetadata } from "../../../lib/seo";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

interface TagPageProps {
  params: Promise<{ tag: string }>;
}

export function generateStaticParams() {
  return getAllTags().map((t) => ({ tag: t.name }));
}

export async function generateMetadata(props: TagPageProps): Promise<Metadata> {
  const params = await props.params;
  const tag = decodeURIComponent(params.tag);
  return generatePageMetadata({
    title: tag,
    description: `${tag}标签下的所有文章`,
  });
}

export default async function TagDetailPage(props: TagPageProps) {
  const params = await props.params;
  const tag = decodeURIComponent(params.tag);
  const posts = getPostsByTag(tag);

  if (posts.length === 0) notFound();

  return (
    <Container className="py-12">
      <Link
        href="/tags"
        className="hover:border-[var(--primary)]/50 hover:shadow-[var(--primary)]/10 group mb-6 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--card-border)] text-[var(--muted)] transition-all duration-200 hover:text-[var(--primary)] hover:shadow-md"
        aria-label="返回标签列表"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
      </Link>

      <h1 className="mb-2 text-3xl font-bold">{tag}</h1>
      <p className="mb-8 text-sm text-[var(--muted)]">
        共 {posts.length} 篇文章
      </p>

      <div className="grid gap-6">
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>
    </Container>
  );
}
