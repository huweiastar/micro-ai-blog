import Link from "next/link";
import { ChevronLeft, ChevronRight, ListOrdered } from "lucide-react";
import { getCategoryStyle } from "../../lib/category-style";
import type { SeriesContext } from "../../lib/posts";

interface SeriesNavProps {
  series: SeriesContext;
}

/**
 * 专栏连载导航：展示当前文章在所属分类中的序号（第 X / N 篇），
 * 并提供专栏内上一篇 / 下一篇的快捷跳转。
 */
export default function SeriesNav({ series }: SeriesNavProps) {
  const style = getCategoryStyle(series.category);
  const Icon = style.icon;

  return (
    <section
      className="mt-12 overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card)]"
      style={{ ["--cat" as string]: style.accent }}
      aria-label="专栏连载导航"
    >
      <div
        className="h-1 w-full"
        style={{
          backgroundImage: `linear-gradient(90deg, ${style.gradient[0]}, ${style.gradient[1]})`,
        }}
      />
      <div className="p-5">
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
            style={{
              backgroundImage: `linear-gradient(135deg, ${style.gradient[0]}, ${style.gradient[1]})`,
            }}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <Link
              href={`/categories/${encodeURIComponent(series.category)}`}
              className="block truncate text-sm font-semibold text-[var(--foreground)] transition-colors hover:text-[var(--cat)]"
            >
              {series.category}
            </Link>
            <p className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
              <ListOrdered className="h-3.5 w-3.5" />
              本专栏第{" "}
              <span className="font-mono font-semibold tabular-nums text-[var(--cat)]">
                {series.position}
              </span>{" "}
              / {series.total} 篇
            </p>
          </div>
          {/* Progress pips */}
          <div className="ml-auto hidden items-center gap-1 sm:flex" aria-hidden="true">
            {Array.from({ length: series.total }).map((_, i) => (
              <span
                key={i}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: i + 1 === series.position ? "1.25rem" : "0.375rem",
                  backgroundColor:
                    i + 1 === series.position ? style.accent : "var(--card-border)",
                }}
              />
            ))}
          </div>
        </div>

        {(series.prev || series.next) && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {series.prev ? (
              <Link
                href={`/blog/${series.prev.slug}`}
                className="group flex items-center gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--background)]/40 px-3 py-2.5 transition-all hover:border-[var(--cat)]/50"
              >
                <ChevronLeft className="h-4 w-4 shrink-0 text-[var(--muted)] transition-transform group-hover:-translate-x-0.5 group-hover:text-[var(--cat)]" />
                <span className="min-w-0">
                  <span className="block text-[10px] uppercase tracking-wide text-[var(--muted)]">
                    上一篇
                  </span>
                  <span className="block truncate text-sm text-[var(--foreground)] group-hover:text-[var(--cat)]">
                    {series.prev.title}
                  </span>
                </span>
              </Link>
            ) : (
              <div className="hidden sm:block" />
            )}
            {series.next && (
              <Link
                href={`/blog/${series.next.slug}`}
                className="group flex items-center gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--background)]/40 px-3 py-2.5 text-right transition-all hover:border-[var(--cat)]/50 sm:justify-end"
              >
                <span className="min-w-0">
                  <span className="block text-[10px] uppercase tracking-wide text-[var(--muted)]">
                    下一篇
                  </span>
                  <span className="block truncate text-sm text-[var(--foreground)] group-hover:text-[var(--cat)]">
                    {series.next.title}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-[var(--muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--cat)]" />
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
