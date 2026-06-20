import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

export function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | string)[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <nav aria-label="分页导航" className="flex items-center justify-center gap-2 mt-8">
      {currentPage > 1 && (
        <Link
          href={`${basePath}?page=${currentPage - 1}`}
          className="flex items-center gap-1 px-3 py-2 rounded-lg border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          上一页
        </Link>
      )}

      {pages.map((page, index) =>
        typeof page === "number" ? (
          <Link
            key={index}
            href={`${basePath}?page=${page}`}
            aria-current={page === currentPage ? "page" : undefined}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              page === currentPage
                ? "bg-[var(--primary)] text-white"
                : "border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/50"
            }`}
          >
            {page}
          </Link>
        ) : (
          <span key={index} className="px-2 text-[var(--muted)]">
            ...
          </span>
        )
      )}

      {currentPage < totalPages && (
        <Link
          href={`${basePath}?page=${currentPage + 1}`}
          className="flex items-center gap-1 px-3 py-2 rounded-lg border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/50 transition-colors"
        >
          下一页
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </nav>
  );
}
