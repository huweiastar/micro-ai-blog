import Link from "next/link";

interface CategoryBadgeProps {
  name: string;
  count?: number;
}

export function CategoryBadge({ name, count }: CategoryBadgeProps) {
  return (
    <Link
      href={`/categories/${encodeURIComponent(name)}`}
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
    >
      {name}
      {count !== undefined && <span className="text-[var(--muted)]">{count}</span>}
    </Link>
  );
}
