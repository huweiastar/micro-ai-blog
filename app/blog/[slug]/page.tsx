import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllPostsSync, getPostBySlug, getSeriesContext } from "../../../lib/posts";
import { renderMarkdownToHtml } from "../../../lib/posts";
import { Comment } from "../../../components/Comment";
import { Tag } from "../../../components/Tag";
import { ShareButtons } from "../../../components/blog/ShareButtons";
import { PostMeta } from "../../../components/blog/PostMeta";
import { BackToTop } from "../../../components/ui/BackToTop";
import { ReadingProgress } from "../../../components/ui/ReadingProgress";
import { ViewCount } from "../../../components/ViewCount";
import { generatePageMetadata, generateArticleStructuredData, generateBreadcrumbStructuredData, getSiteUrl } from "../../../lib/seo";
import { StructuredData } from "../../../components/StructuredData";
import { ArticleLayout } from "../../../components/ArticleLayout";
import SeriesNav from "../../../components/blog/SeriesNav";
import { BookmarkButton } from "../../../components/blog/BookmarkButton";
import { LikeButton } from "../../../components/blog/LikeButton";
import { ReadingPosition } from "../../../components/blog/ReadingPosition";
import { Container } from "../../../components/ui/Container";
import { ArrowLeft, StickyNote } from "lucide-react";
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
    category: post.category,
    image: post.cover ? `${siteUrl}${post.cover}` : undefined,
  });
}

export default async function PostPage({ params }: PostPageProps) {
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();

  const html = await renderMarkdownToHtml(post.content);
  const series = getSeriesContext(getAllPostsSync(), post.slug);
  const siteUrl = getSiteUrl();
  const postUrl = `${siteUrl}/blog/${post.slug}`;
  const structuredData = generateArticleStructuredData(post, postUrl);
  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: "首页", url: siteUrl },
    { name: "博客", url: `${siteUrl}/blog` },
    ...(post.category
      ? [{ name: post.category, url: `${siteUrl}/categories/${encodeURIComponent(post.category)}` }]
      : []),
    { name: post.title, url: postUrl },
  ]);
  const currentPath = `/blog/${post.slug}`;

  return (
    <>
      <StructuredData data={structuredData} />
      <StructuredData data={breadcrumbData} />
      <ReadingProgress />
      <ReadingPosition slug={post.slug} />
      <Container className="py-12">
        <ArticleLayout
          tocItems={post.toc}
          backLink={
            <Link
              href={post.type === "note" ? "/notes" : "/blog"}
              className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/50 hover:shadow-[var(--primary)]/10 hover:shadow-md transition-all duration-200 group"
              title={post.type === "note" ? "返回随手记" : "返回博客列表"}
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
            {post.type === "note" ? (
              // 随手记没有真正的标题（自动取自首行），详情页只标注类型，避免与正文首行重复
              <div className="mb-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-500 dark:text-sky-400 text-sm">
                <StickyNote className="w-4 h-4" />
                随手记
              </div>
            ) : (
              <h1 className="text-3xl sm:text-4xl font-bold mb-4">{post.title}</h1>
            )}

            {post.summary && post.summary !== post.title && (
              <p className="text-[var(--muted)] mb-6 leading-relaxed">{post.summary}</p>
            )}

            <PostMeta
              date={post.date}
              readingTime={post.readingTime}
              wordCount={post.wordCount}
              updated={post.updated}
              category={post.category}
            >
              <ViewCount path={currentPath} />
            </PostMeta>

            <div className="flex flex-wrap gap-2 mt-4">
              {post.tags.map((tag) => (
                <Tag key={tag} name={tag} />
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <LikeButton slug={post.slug} />
              <BookmarkButton
                slug={post.slug}
                title={post.title}
                date={post.date}
                summary={post.summary}
                category={post.category}
              />
              <ShareButtons />
            </div>
          </header>

          <div
            className="prose-custom"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {/* Series Navigation */}
          {series && <SeriesNav series={series} />}

          {/* Comments */}
          <Comment slug={post.slug} title={post.title} />
        </ArticleLayout>
      </Container>
      <BackToTop />
    </>
  );
}
