import { getAllPostsSync } from "../../lib/posts";
import { BlogCard } from "../../components/BlogCard";
import { Pagination } from "../../components/Pagination";
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
  searchParams: { page?: string };
}

export default function BlogPage({ searchParams }: BlogPageProps) {
  const posts = getAllPostsSync();
  const currentPage = Number(searchParams.page) || 1;
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);

  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const pagePosts = posts.slice(startIndex, startIndex + POSTS_PER_PAGE);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">博客文章</h1>

      <div className="grid gap-6">
        {pagePosts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} basePath="/blog" />
    </div>
  );
}
