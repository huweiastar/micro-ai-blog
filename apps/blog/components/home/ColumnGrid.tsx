import Link from "next/link";
import { getCategoryStyle } from "../../lib/category-style";

interface ColumnTheme {
  name: string;
  desc: string;
  background?: string;
  bgOpacity?: number;
}

/** 专栏主题网格 —— 首页内容区顶部展示，引导用户进入各分类。 */
export function ColumnGrid({ columns }: { columns: ColumnTheme[] }) {
  if (columns.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {columns.map((theme) => {
        const style = getCategoryStyle(theme.name);
        const Icon = style.icon;
        const grad = `linear-gradient(135deg, ${style.gradient[0]}, ${style.gradient[1]})`;

        return (
          <Link
            key={theme.name}
            href={`/categories/${encodeURIComponent(theme.name)}`}
            style={{ "--cat": style.gradient[0] } as React.CSSProperties}
            className="group relative flex flex-col overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--cat)] hover:shadow-[0_12px_32px_-12px_var(--cat)]"
          >
            {/* 顶部渐变线 */}
            <div
              className="absolute inset-x-0 top-0 h-0.5 opacity-70 transition-opacity group-hover:opacity-100"
              style={{ background: grad }}
            />
            {/* 悬停光晕 */}
            <div
              className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-20"
              style={{ background: style.gradient[0] }}
            />

            <div className="relative z-10 flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-sm transition-transform duration-300 group-hover:scale-105"
                style={{ background: grad }}
              >
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[var(--foreground)] transition-colors group-hover:text-[var(--cat)]">
                  {theme.name}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--muted)] line-clamp-2">
                  {theme.desc}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
