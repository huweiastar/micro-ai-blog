import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllPostsSync, getPostBySlug, getAdjacentPosts, getRelatedPosts } from "../../../lib/posts";
import { renderMarkdownToHtml } from "../../../lib/posts";
import { Comment } from "../../../components/Comment";
import { Tag } from "../../../components/Tag";
import { ShareButtons } from "../../../components/blog/ShareButtons";
import { BackToTop } from "../../../components/ui/BackToTop";
import { ReadingProgress } from "../../../components/ui/ReadingProgress";
import { ViewCount } from "../../../components/ViewCount";
import { formatDate, formatShortDate } from "../../../lib/utils";
import { generatePageMetadata, generateArticleStructuredData, getSiteUrl } from "../../../lib/seo";
import { StructuredData } from "../../../components/StructuredData";
import { ArticleLayout } from "../../../components/ArticleLayout";
import { Container } from "../../../components/ui/Container";
import { ArrowLeft, ArrowRight, Calendar, Clock, FolderOpen, Hash } from "lucide-react";
import type { Metadata } from "next";

interface PostPageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  const posts = getAllPostsSync();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  if (!post) return { title: "文章未找到" };

  const siteUrl = getSiteUrl();
  const postUrl = `${siteUrl}/blog/${post.slug}`;

  return generatePageMetadata({
    title: post.title,
    description: post.summary,
    keywords: post.tags.join(", "),
    type: "article",
    url: postUrl,
    image: post.cover ? `${siteUrl}${post.cover}` : undefined,
  });
}

export default async function PostPage({ params }: PostPageProps) {
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();

  const html = await renderMarkdownToHtml(post.content);
  const { prev, next } = getAdjacentPosts(getAllPostsSync(), post.slug);
  const relatedPosts = getRelatedPosts(getAllPostsSync(), post.slug);
  const siteUrl = getSiteUrl();
  const postUrl = `${siteUrl}/blog/${post.slug}`;
  const structuredData = generateArticleStructuredData(post, postUrl);
  const currentPath = `/blog/${post.slug}`;

  return (
    <>
      <StructuredData data={structuredData} />
      <ReadingProgress />
      <Container className="py-12">
        <ArticleLayout
          tocItems={post.toc}
          backLink={
            <Link
              href="/blog"
              className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/50 hover:shadow-[var(--primary)]/10 hover:shadow-md transition-all duration-200 group"
              title="返回博客列表"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            </Link>
          }
        >
          {post.cover && (
            <div className="mb-8 overflow-hidden rounded-xl border border-[var(--card-border)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.cover}
                alt={post.title}
                className="w-full h-56 sm:h-72 object-cover"
              />
            </div>
          )}
          <header className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">{post.title}</h1>

            <p className="text-[var(--muted)] mb-6 leading-relaxed">{post.summary}</p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--muted)]">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(post.date)}
              </span>
              {post.updated && (
                <span className="inline-flex items-center gap-1">
                  更新于 {formatDate(post.updated)}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {post.readingTime}
              </span>
              <span className="inline-flex items-center gap-1">
                <Hash className="w-4 h-4" />
                {post.wordCount} 字
              </span>
              <span className="inline-flex items-center gap-1">
                <FolderOpen className="w-4 h-4" />
                {post.category}
              </span>
              <ViewCount path={currentPath} />
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {post.tags.map((tag) => (
                <Tag key={tag} name={tag} />
              ))}
            </div>

            <div className="mt-4">
              <ShareButtons />
            </div>
          </header>

          <div
            className="prose-custom"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {/* Adjacent Posts */}
          <div className="flex justify-between items-center mt-12 pt-6 border-t border-[var(--card-border)]">
            {prev ? (
              <Link
                href={`/blog/${prev.slug}`}
                className="inline-flex items-center gap-2 text-sm text-[var(--primary)] hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                {prev.title}
              </Link>
            ) : (
              <div />
            )}
            {next && (
              <Link
                href={`/blog/${next.slug}`}
                className="inline-flex items-center gap-2 text-sm text-[var(--primary)] hover:underline"
              >
                {next.title}
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xl font-bold mb-4">相关文章</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {relatedPosts.map((rp) => (
                  <Link
                    key={rp.slug}
                    href={`/blog/${rp.slug}`}
                    className="group p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] transition-all duration-300 hover:border-[var(--primary)]/50 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
                  >
                    <h3 className="font-medium text-sm mb-1 line-clamp-2 group-hover:text-[var(--primary)] transition-colors">
                      {rp.title}
                    </h3>
                    <p className="text-xs text-[var(--muted)]">{formatShortDate(rp.date)}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Comments */}
          <Comment slug={post.slug} title={post.title} />
        </ArticleLayout>
      </Container>
      <BackToTop />
    </>
  );
}
