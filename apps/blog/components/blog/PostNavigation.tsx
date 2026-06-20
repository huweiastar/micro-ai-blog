import Link from "next/link";
import type { BlogPost } from "../../lib/posts";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface PostNavigationProps {
  prev?: BlogPost;
  next?: BlogPost;
}

export function PostNavigation({ prev, next }: PostNavigationProps) {
  return (
    <div className="flex justify-between items-center mt-12 pt-6 border-t border-[var(--card-border)]">
      {prev ? (
        <Link
          href={`/blog/${prev.slug}`}
          className="inline-flex items-center gap-2 text-sm text-[var(--primary)] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="max-w-xs truncate">{prev.title}</span>
        </Link>
      ) : (
        <div />
      )}
      {next && (
        <Link
          href={`/blog/${next.slug}`}
          className="inline-flex items-center gap-2 text-sm text-[var(--primary)] hover:underline"
        >
          <span className="max-w-xs truncate">{next.title}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}
