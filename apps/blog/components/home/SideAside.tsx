import Link from "next/link";
import { Hash } from "lucide-react";

interface Counted {
  name: string;
  count: number;
}

/** 首页侧栏：热门标签。桌面端显示，填充右侧留白。 */
export function SideAside({ tags }: { tags: Counted[] }) {
  if (tags.length === 0) return null;

  return (
    <div className="sticky top-24">
      <section className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
          <Hash className="h-4 w-4 text-[var(--primary)]" />
          热门标签
        </h2>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <Link
              key={t.name}
              href={`/tags/${encodeURIComponent(t.name)}`}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--card-border)] bg-[var(--card)] px-2.5 py-1 text-xs text-[var(--muted)] transition-colors hover:border-[var(--primary)]/50 hover:text-[var(--primary)]"
            >
              {t.name}
              <span className="font-mono tabular-nums opacity-70">{t.count}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
