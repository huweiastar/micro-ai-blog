import Link from "next/link";
import type { CSSProperties } from "react";
import { getCategoryStyle } from "../../lib/category-style";

interface CategoryBadgeProps {
  name: string;
  count?: number;
}

export function CategoryBadge({ name, count }: CategoryBadgeProps) {
  const { accent } = getCategoryStyle(name);

  return (
    <Link
      href={`/categories/${encodeURIComponent(name)}`}
      style={{ "--cat": accent } as CSSProperties}
      className="inline-flex items-center gap-1 rounded-lg bg-[var(--cat)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--cat)] transition-colors hover:bg-[var(--cat)]/20"
    >
      {name}
      {count !== undefined && <span className="text-[var(--muted)]">{count}</span>}
    </Link>
  );
}
