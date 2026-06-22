import { notFound } from "next/navigation";
import Link from "next/link";
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
import { RelatedPosts } from "../../../components/blog/RelatedPosts";
import { PostNavigation } from "../../../components/blog/PostNavigation";
import { BookmarkButton } from "../../../components/blog/BookmarkButton";
import { LikeButton } from "../../../components/blog/LikeButton";
import { ReadingPosition } from "../../../components/blog/ReadingPosition";
import { Container } from "../../../components/ui/Container";
import { api } from "../../../lib/api/client";
import { ArrowLeft, StickyNote } from "lucide-react";
import type { Metadata } from "next";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(
  props: PostPageProps
): Promise<Metadata> {
  const params = await props.params;
  try {
    const { post } = await api.posts.get(params.slug);
    const siteUrl = getSiteUrl();
    return generatePageMetadata({
      title: post.title,
      description: post.summary || "",
      keywords: post.tags.join(", "),
      type: "article",
      url: `${siteUrl}/blog/${post.slug}`,
      category: post.category?.name,
      image: post.cover ? `${siteUrl}${post.cover}` : undefined,
    });
  } catch {
    return { title: "文章未找到" };
  }
}

export default async function PostPage(props: PostPageProps) {
  const params = await props.params;

  let postData: any;
  try {
    const { post } = await api.posts.get(params.slug);
    postData = post;
  } catch {
    notFound();
  }

  // 渲染 markdown 为 HTML（保留服务端渲染，因为 API 可能没有 contentHtml）
  const html = await renderMarkdownToHtml(postData.contentMd);

  // 获取相关文章
  let related: any[] = [];
  let adjacent: { prev?: any; next?: any } = {};
  if (postData.kind === "post") {
    try {
      const { items } = await api.posts.related(postData.slug, 4);
      related = items.map((p) => ({
        slug: p.slug,
        title: p.title,
        date: p.publishedAt,
        summary: p.summary,
        cover: p.cover,
        readingTime: p.readingMins,
      }));
    } catch {
      // 忽略
    }
  }

  const siteUrl = getSiteUrl();
  const postUrl = `${siteUrl}/blog/${postData.slug}`;
  const currentPath = `/blog/${postData.slug}`;

  const postForStructuredData = {
    ...postData,
    date: postData.publishedAt,
    readingTime: postData.readingMins,
    category: postData.category?.name || null,
    type: postData.kind === "post" ? "article" : "note",
    toc: [],
    wordCount: postData.wordCount,
  };

  const structuredData = generateArticleStructuredData(postForStructuredData, postUrl);
  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: "首页", url: siteUrl },
    { name: "博客", url: `${siteUrl}/blog` },
    ...(postData.category
      ? [{ name: postData.category.name, url: `${siteUrl}/categories/${encodeURIComponent(postData.category.slug)}` }]
      : []),
    { name: postData.title, url: postUrl },
  ]);

  return (
    <>
      <StructuredData data={structuredData} />
      <StructuredData data={breadcrumbData} />
      <ReadingProgress />
      <ReadingPosition slug={postData.slug} />
      <Container size="wide" className="py-12">
        <ArticleLayout
          tocItems={[]}
          leftRail={undefined}
          rail={
            <ArticleRail
              readingTime={postData.readingMins}
              wordCount={postData.wordCount}
            />
          }
          backLink={
            <Link
              href={postData.kind === "note" ? "/notes" : "/blog"}
              className="surface-card group inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--primary)]/50 hover:text-[var(--primary)] hover:shadow-[var(--shadow-glow)]"
              title={postData.kind === "note" ? "返回随手记" : "返回博客列表"}
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            </Link>
          }
        >
          {postData.cover && (
            <div className="mb-8 overflow-hidden rounded-xl border border-[var(--card-border)]">
              <img
                src={postData.cover}
                alt={postData.title}
                className="h-56 w-full object-cover sm:h-72"
              />
            </div>
          )}
          <header className="mb-8">
            {postData.kind === "note" ? (
              <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-1 text-sm text-sky-500 dark:text-sky-400">
                <StickyNote className="h-4 w-4" />
                随手记
              </div>
            ) : (
              <h1 className="mb-4 text-3xl font-bold sm:text-4xl">
                {postData.title}
              </h1>
            )}

            <PostMeta
              date={postData.publishedAt}
              readingTime={postData.readingMins}
              wordCount={postData.wordCount}
              updated={postData.updatedAt}
              category={postData.category?.name}
            >
              <ViewCount path={currentPath} />
            </PostMeta>

            <div className="mt-4 flex flex-wrap gap-2">
              {postData.tags.map((tag: string) => (
                <Tag key={tag} name={tag} />
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <LikeButton slug={postData.slug} />
              <BookmarkButton
                slug={postData.slug}
                title={postData.title}
                date={postData.publishedAt}
                summary={postData.summary}
                category={postData.category?.name}
              />
              <ShareButtons />
            </div>

            {postData.summary && postData.summary !== postData.title && (
              <section className="mt-6 rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/[0.07] px-4 py-3 text-sm leading-relaxed text-[var(--muted)] shadow-sm">
                <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
                  内容概览
                </h2>
                <p>{postData.summary}</p>
              </section>
            )}
          </header>

          <div
            className="prose-custom max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {related.length > 0 && (
            <RelatedPosts posts={related} title="相关文章" />
          )}

          <PostNavigation prev={adjacent.prev} next={adjacent.next} />

          <Comment slug={postData.slug} title={postData.title} />
        </ArticleLayout>
      </Container>
    </>
  );
}
