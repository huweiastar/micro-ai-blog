"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";

type Category = {
  name: string;
  description: string;
  background?: string;
  bgOpacity?: number;
  description_long?: string;
  cover?: string;
  draft?: boolean;
};

export default function CategoriesPage() {
  const router = useRouter();
  const [items, setItems] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data: Category[]) => setItems(Array.isArray(data) ? data : []))
      .catch(() => {});
    fetch("/api/posts")
      .then((r) => r.json())
      .then((posts: { category: string }[]) => {
        const map: Record<string, number> = {};
        (Array.isArray(posts) ? posts : []).forEach((p) => {
          map[p.category] = (map[p.category] ?? 0) + 1;
        });
        setCounts(map);
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const lq = q.trim().toLowerCase();
    return items.filter((c) => c.name.toLowerCase().includes(lq) || (c.description || "").toLowerCase().includes(lq));
  }, [items, q]);

  const openEditor = (name?: string) =>
    router.push(name ? `/admin/categories/edit?id=${encodeURIComponent(name)}` : "/admin/categories/edit?new=1");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <header className="mb-5 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">专栏</h1>
          <p className="text-sm text-[var(--muted)] mt-1">共 {items.length} 个</p>
        </div>
        <button
          onClick={() => openEditor()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90"
        >
          <Plus className="w-4 h-4" />新专栏
        </button>
      </header>

      <div className="relative mb-4 max-w-sm">
        <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索专栏…"
          className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-10 text-center text-sm text-[var(--muted)]">
          没有匹配的专栏。点「新专栏」创建。
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {filtered.map((c) => (
            <li key={c.name}>
              <button
                onClick={() => openEditor(c.name)}
                className="w-full text-left rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4 transition-all hover:border-[var(--primary)]/50 hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="font-medium text-sm line-clamp-1">{c.name}</span>
                    {c.draft && <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">草稿</span>}
                  </span>
                  <span className="shrink-0 text-xs text-[var(--muted)]">{counts[c.name] ?? 0} 篇</span>
                </div>
                {c.description && <p className="text-xs text-[var(--muted)] line-clamp-2">{c.description}</p>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
