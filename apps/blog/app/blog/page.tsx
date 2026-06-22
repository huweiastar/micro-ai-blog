import { BlogCard } from "../../components/BlogCard";
import { Pagination } from "../../components/Pagination";
import { PageHeader } from "../../components/ui/PageHeader";
import { Container } from "../../components/ui/Container";
import { generatePageMetadata, getSiteUrl } from "../../lib/seo";
import { api } from "../../lib/api/client";
import type { Metadata } from "next";

const siteUrl = getSiteUrl();

export const metadata: Metadata = generatePageMetadata({
  title: "博客文章",
  description: "所有技术文章列表",
  url: `${siteUrl}/blog`,
});

const POSTS_PER_PAGE = 10;

interface BlogPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function BlogPage(props: BlogPageProps) {
  const searchParams = await props.searchParams;
  const currentPage = Number(searchParams.page) || 1;

  let posts: any[] = [];
  let totalPages = 1;

  try {
    const result = await api.posts.list({
      page: currentPage,
      limit: POSTS_PER_PAGE,
      kind: "post",
    });

    posts = result.items.map((p) => ({
      slug: p.slug,
      title: p.title,
      date: p.publishedAt,
      summary: p.summary || "",
      tags: p.tags,
      category: p.category?.name || null,
      cover: p.cover,
      readingTime: p.readingMins,
      type: "post" as const,
    }));

    totalPages = result.pages;
  } catch (err) {
    console.error("Failed to fetch posts from API:", err);
  }

  return (
    <>
      <PageHeader
        title="博客文章"
        description="所有技术文章列表"
        count={posts.length}
        countLabel="篇"
      />
      <Container className="pb-12">
        <div className="grid gap-6">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          basePath="/blog"
        />
      </Container>
    </>
  );
}
