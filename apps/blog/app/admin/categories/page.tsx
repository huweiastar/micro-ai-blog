"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, FolderOpen, BookOpen } from "lucide-react";
import { ListHero } from "@pkg/admin-ui/ListHero";

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

  const totalPosts = items.reduce((s, c) => s + (counts[c.name] ?? 0), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <ListHero
        icon={FolderOpen}
        hue="violet"
        title="专栏"
        description="把文章串成系列，构建成体系的知识"
        stats={[
          { label: "个专栏", value: items.length },
          { label: "篇文章", value: totalPosts },
        ]}
        action={
          <button
            onClick={() => openEditor()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:brightness-110 active:scale-95"
          >
            <Plus className="w-4 h-4" />新专栏
          </button>
        }
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索专栏…"
          className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--card-border)] p-12 text-center">
          <FolderOpen className="mx-auto mb-3 h-8 w-8 text-[var(--muted)] opacity-50" />
          <p className="text-sm text-[var(--muted)]">没有匹配的专栏。点「新专栏」创建。</p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {filtered.map((c, i) => (
            <li key={c.name} className="animate-slide-up" style={{ animationDelay: `${Math.min(i, 8) * 40}ms`, animationFillMode: "backwards" }}>
              <button
                onClick={() => openEditor(c.name)}
                className="group relative w-full overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)] text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/10"
              >
                {c.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.cover} alt="" className="h-20 w-full object-cover opacity-90 transition-opacity group-hover:opacity-100" />
                ) : (
                  <div aria-hidden className="h-1.5 w-full bg-gradient-to-r from-violet-500/50 via-fuchsia-500/30 to-transparent" />
                )}
                <div className="p-4">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="line-clamp-1 text-sm font-medium transition-colors group-hover:text-violet-500 dark:group-hover:text-violet-300">{c.name}</span>
                      {c.draft && <span className="shrink-0 rounded bg-fuchsia-500/10 px-1.5 py-0.5 text-[10px] text-fuchsia-500">草稿</span>}
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-xs text-violet-500 dark:text-violet-300">
                      <BookOpen className="h-3 w-3" />
                      {counts[c.name] ?? 0} 篇
                    </span>
                  </div>
                  {c.description && <p className="line-clamp-2 text-xs text-[var(--muted)]">{c.description}</p>}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
