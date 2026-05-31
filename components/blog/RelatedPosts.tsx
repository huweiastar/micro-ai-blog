import Link from "next/link";
import type { BlogPost } from "../../lib/posts";
import { formatShortDate } from "../../lib/utils";

interface RelatedPostsProps {
  posts: BlogPost[];
  title: string;
}

export function RelatedPosts({ posts, title }: RelatedPostsProps) {
  if (posts.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-xl font-bold mb-4">{title || "相关文章"}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="p-4 rounded-lg border border-[var(--card-border)] bg-[var(--card)] hover:border-[var(--primary)]/50 transition-colors"
          >
            <h3 className="font-medium text-sm mb-1 line-clamp-2">{post.title}</h3>
            <p className="text-xs text-[var(--muted)]">{formatShortDate(post.date)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
