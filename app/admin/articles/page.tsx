"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";

type Article = {
  slug: string;
  type?: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  category: string;
  draft: boolean;
  publish?: string;
  wordCount: number;
  cover?: string;
};

type FilterKey = "all" | "draft" | "published";
type SortKey = "date-desc" | "date-asc" | "words-desc" | "title-asc";

const SORTS: { key: SortKey; label: string; compare: (a: Article, b: Article) => number }[] = [
  { key: "date-desc", label: "最新发布", compare: (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() },
  { key: "date-asc", label: "最早发布", compare: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() },
  { key: "words-desc", label: "字数多→少", compare: (a, b) => b.wordCount - a.wordCount },
  { key: "title-asc", label: "标题 A→Z", compare: (a, b) => a.title.localeCompare(b.title, "zh-CN") },
];

export default function ArticlesPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date-desc");

  useEffect(() => {
    fetch("/api/posts")
      .then((r) => r.json())
      .then((d) =>
        // 随手记由 /admin/notes 管理，文章列表只展示正式文章
        setArticles(Array.isArray(d) ? d.filter((a: Article) => a.type !== "note") : [])
      )
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    let out = articles;
    if (filter === "draft") out = out.filter((a) => a.draft);
    else if (filter === "published") out = out.filter((a) => !a.draft);
    if (q.trim()) {
      const lq = q.trim().toLowerCase();
      out = out.filter((a) => a.title.toLowerCase().includes(lq) || a.summary.toLowerCase().includes(lq));
    }
    const sorter = SORTS.find((s) => s.key === sortKey);
    if (sorter) out = [...out].sort(sorter.compare);
    return out;
  }, [articles, filter, q, sortKey]);

  const openEditor = (slug?: string) =>
    router.push(slug ? `/admin/articles/edit?id=${slug}` : "/admin/articles/edit?new=1");

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: "all", label: "全部" },
    { key: "published", label: "已发布" },
    { key: "draft", label: "草稿" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <header className="mb-5 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">文章</h1>
          <p className="text-sm text-[var(--muted)] mt-1">共 {articles.length} 篇</p>
        </div>
        <button
          onClick={() => openEditor()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90"
        >
          <Plus className="w-4 h-4" />写文章
        </button>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索标题或摘要…"
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          />
        </div>
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-2.5 py-1.5 text-xs rounded-lg ${
                filter === f.key
                  ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="px-2 py-1.5 text-xs rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
          aria-label="排序方式"
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-10 text-center text-sm text-[var(--muted)]">
          没有匹配的文章。点「写文章」开始创作。
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {filtered.map((a) => (
            <li key={a.slug}>
              <button
                onClick={() => openEditor(a.slug)}
                className="w-full text-left rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4 transition-all hover:border-[var(--primary)]/50 hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-[var(--foreground)] text-sm line-clamp-1">{a.title || "（无标题）"}</span>
                  {a.draft && <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">草稿</span>}
                  {!a.draft && a.publish && new Date(a.publish).getTime() > Date.now() && (
                    <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400">定时</span>
                  )}
                </div>
                {a.summary && <p className="text-xs text-[var(--muted)] line-clamp-2 mb-2">{a.summary}</p>}
                <div className="text-[11px] text-[var(--muted)]">{a.date} · {a.wordCount} 字 · {a.category || "未分类"}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
