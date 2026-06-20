import Link from "next/link";

interface TagProps {
  name: string;
  count?: number;
}

export function Tag({ name, count }: TagProps) {
  return (
    <Link
      href={`/tags/${encodeURIComponent(name)}`}
      className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)]/60 backdrop-blur-sm text-sm font-medium text-[var(--foreground)] hover:border-[var(--primary)]/50 hover:bg-[var(--primary)]/10 hover:shadow-lg hover:shadow-[var(--primary)]/5 hover:-translate-y-0.5 transition-all duration-300"
    >
      <span className="text-[var(--primary)] transition-colors duration-300">
        {name}
      </span>
      {count !== undefined && (
        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold bg-[var(--primary)]/15 text-[var(--primary)] group-hover:bg-[var(--primary)]/25 transition-colors">
          {count}
        </span>
      )}
    </Link>
  );
}
