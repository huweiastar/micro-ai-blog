import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getAllPostsSync,
  getAllArticlesSync,
  getPostBySlug,
  getSeriesContext,
  getRelatedPosts,
  getAdjacentPosts,
} from "../../../lib/posts";
import { renderMarkdownToHtml } from "../../../lib/posts";
import { Comment } from "../../../components/Comment";
import { Tag } from "../../../components/Tag";
import { ShareButtons } from "../../../components/blog/ShareButtons";
import { PostMeta } from "../../../components/blog/PostMeta";
import { ReadingProgress } from "../../../components/ui/ReadingProgress";
import { ViewCount } from "../../../components/ViewCount";
import {
  generatePageMetadata,
  generateArticleStructuredData,
  generateBreadcrumbStructuredData,
  getSiteUrl,
} from "../../../lib/seo";
import { StructuredData } from "../../../components/StructuredData";
import { ArticleLayout } from "../../../components/ArticleLayout";
import { ArticleRail } from "../../../components/blog/ArticleRail";
import SeriesNav from "../../../components/blog/SeriesNav";
import { RelatedPosts } from "../../../components/blog/RelatedPosts";
import { PostNavigation } from "../../../components/blog/PostNavigation";
import { BookmarkButton } from "../../../components/blog/BookmarkButton";
import { LikeButton } from "../../../components/blog/LikeButton";
import { ReadingPosition } from "../../../components/blog/ReadingPosition";
import { Container } from "../../../components/ui/Container";
import { ArrowLeft, StickyNote } from "lucide-react";
import type { Metadata } from "next";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  const posts = getAllPostsSync();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(
  props: PostPageProps
): Promise<Metadata> {
  const params = await props.params;
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

export default async function PostPage(props: PostPageProps) {
  const params = await props.params;
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();

  const html = await renderMarkdownToHtml(post.content);
  const series = getSeriesContext(getAllPostsSync(), post.slug);
  // 相关文章 + 上/下篇导航：仅对正文文章计算（随手记不展示）
  const articles = post.type === "article" ? getAllArticlesSync() : [];
  const related =
    post.type === "article" ? getRelatedPosts(articles, post.slug, 4) : [];
  const adjacent =
    post.type === "article" ? getAdjacentPosts(articles, post.slug) : {};
  const siteUrl = getSiteUrl();
  const postUrl = `${siteUrl}/blog/${post.slug}`;
  const structuredData = generateArticleStructuredData(post, postUrl);
  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: "首页", url: siteUrl },
    { name: "博客", url: `${siteUrl}/blog` },
    ...(post.category
      ? [
          {
            name: post.category,
            url: `${siteUrl}/categories/${encodeURIComponent(post.category)}`,
          },
        ]
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
      <Container size="wide" className="py-12">
        <ArticleLayout
          tocItems={post.toc}
          leftRail={
            post.type === "article" ? (
              <nav className="surface-card rounded-xl p-3">
                <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  文章列表
                </h2>
                <div className="space-y-1">
                  {articles.slice(0, 12).map((item) => {
                    const active = item.slug === post.slug;
                    return (
                      <Link
                        key={item.slug}
                        href={`/blog/${item.slug}`}
                        className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                          active
                            ? "bg-[var(--primary)]/12 text-[var(--primary)] ring-1 ring-[var(--primary)]/20"
                            : "text-[var(--muted)] hover:bg-[var(--primary)]/5 hover:text-[var(--foreground)]"
                        }`}
                      >
                        <span className="line-clamp-2 leading-snug">{item.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </nav>
            ) : undefined
          }
          rail={
            <>
              <ArticleRail
                readingTime={post.readingTime}
                wordCount={post.wordCount}
              />
              {post.toc.length > 0 && (
                <nav className="surface-card rounded-xl p-4">
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    章节目录
                  </h2>
                  <div className="space-y-1">
                    {post.toc.map((item) => (
                      <Link
                        key={item.id}
                        href={`#${item.id}`}
                        className={`block border-l-2 border-transparent py-1.5 text-sm leading-snug text-[var(--muted)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)] ${
                          item.level === 3 ? "pl-5" : "pl-3"
                        }`}
                      >
                        {item.text}
                      </Link>
                    ))}
                  </div>
                </nav>
              )}
            </>
          }
          backLink={
            <Link
              href={post.type === "note" ? "/notes" : "/blog"}
              className="surface-card group inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--primary)]/50 hover:text-[var(--primary)] hover:shadow-[var(--shadow-glow)]"
              title={post.type === "note" ? "返回随手记" : "返回博客列表"}
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            </Link>
          }
        >
          {post.cover && (
            <div className="mb-8 overflow-hidden rounded-xl border border-[var(--card-border)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.cover}
                alt={post.title}
                className="h-56 w-full object-cover sm:h-72"
              />
            </div>
          )}
          <header className="mb-8">
            {post.type === "note" ? (
              // 随手记没有真正的标题（自动取自首行），详情页只标注类型，避免与正文首行重复
              <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-1 text-sm text-sky-500 dark:text-sky-400">
                <StickyNote className="h-4 w-4" />
                随手记
              </div>
            ) : (
              <h1 className="mb-4 text-3xl font-bold sm:text-4xl">
                {post.title}
              </h1>
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

            <div className="mt-4 flex flex-wrap gap-2">
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

            {post.summary && post.summary !== post.title && (
              <section className="mt-6 rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/[0.07] px-4 py-3 text-sm leading-relaxed text-[var(--muted)] shadow-sm">
                <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
                  内容概览
                </h2>
                <p>{post.summary}</p>
              </section>
            )}
          </header>

          <div
            className="prose-custom max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {/* Series Navigation */}
          {series && <SeriesNav series={series} />}

          {/* 相关文章（按共同标签/同分类） */}
          {post.type === "article" && (
            <RelatedPosts posts={related} title="相关文章" />
          )}

          {/* 上一篇 / 下一篇 */}
          {post.type === "article" && (
            <PostNavigation prev={adjacent.prev} next={adjacent.next} />
          )}

          {/* Comments */}
          <Comment slug={post.slug} title={post.title} />
        </ArticleLayout>
      </Container>
    </>
  );
}
