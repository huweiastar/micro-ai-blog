import { getCategoryStyle } from "../../lib/category-style";

interface CategoryBarItem {
  name: string;
  count: number;
}

/**
 * 分类占比条：各专栏文章数的极简水平占比 + 颜色图例，复用专栏主题色。
 * 用于 /categories 与 /stats。空数据返回 null。
 */
export function CategoryBar({ categories }: { categories: CategoryBarItem[] }) {
  const total = categories.reduce((s, c) => s + c.count, 0);
  if (total === 0) return null;

  return (
    <div className="surface-card rounded-xl p-4">
      <div className="flex h-3 w-full overflow-hidden rounded-full border border-[var(--card-border)] bg-[var(--background)]">
        {categories.map((c) => {
          const pct = (c.count / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={c.name}
              title={`${c.name} · ${c.count} 篇 · ${pct.toFixed(0)}%`}
              style={{ width: `${pct}%`, background: getCategoryStyle(c.name).accent }}
            />
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {categories.map((c) => (
          <span
            key={c.name}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)]"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: getCategoryStyle(c.name).accent }}
            />
            {c.name}
            <span className="font-mono tabular-nums">{c.count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
