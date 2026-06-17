import { getAllArticlesSync } from "../../lib/posts";
import { BlogCard } from "../../components/BlogCard";
import { Pagination } from "../../components/Pagination";
import { PageHeader } from "../../components/ui/PageHeader";
import { Container } from "../../components/ui/Container";
import { generatePageMetadata, getSiteUrl } from "../../lib/seo";
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
  const posts = getAllArticlesSync();
  const currentPage = Number(searchParams.page) || 1;
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);

  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const pagePosts = posts.slice(startIndex, startIndex + POSTS_PER_PAGE);

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
          {pagePosts.map((post) => (
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
