"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, FileText, CalendarDays, FolderOpen, AlignLeft } from "lucide-react";
import { ListHero } from "@pkg/admin-ui/ListHero";

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

function isScheduled(a: Article): boolean {
  return !a.draft && !!a.publish && new Date(a.publish).getTime() > Date.now();
}

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

  const draftCount = articles.filter((a) => a.draft).length;
  const scheduledCount = articles.filter(isScheduled).length;
  const totalWords = articles.reduce((s, a) => s + a.wordCount, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <ListHero
        icon={FileText}
        hue="indigo"
        title="文章"
        description="正式发布的长文，沉淀你的深度思考"
        stats={[
          { label: "篇文章", value: articles.length },
          { label: "草稿", value: draftCount },
          ...(scheduledCount > 0 ? [{ label: "定时", value: scheduledCount }] : []),
          { label: "总字数", value: totalWords.toLocaleString() },
        ]}
        action={
          <button
            onClick={() => openEditor()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:brightness-110 active:scale-95"
          >
            <Plus className="w-4 h-4" />写文章
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索标题或摘要…"
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
        <div className="flex gap-0.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                filter === f.key
                  ? "bg-indigo-500/15 text-indigo-500 dark:text-indigo-300 font-medium"
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
          className="px-2 py-1.5 text-xs rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          aria-label="排序方式"
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--card-border)] p-12 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 text-[var(--muted)] opacity-50" />
          <p className="text-sm text-[var(--muted)]">没有匹配的文章。点「写文章」开始创作。</p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {filtered.map((a, i) => (
            <li key={a.slug} className="animate-slide-up" style={{ animationDelay: `${Math.min(i, 8) * 40}ms`, animationFillMode: "backwards" }}>
              <button
                onClick={() => openEditor(a.slug)}
                className="group relative w-full overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)] text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/10"
              >
                {/* 左侧常驻蓝色识别条 + 顶部悬停发丝线 */}
                <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 to-blue-500 opacity-50 transition-opacity group-hover:opacity-100" />
                <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-indigo-500/0 via-indigo-500/60 to-blue-500/0 opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="flex gap-3 p-4 pl-5">
                  {a.cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.cover} alt="" className="h-16 w-24 shrink-0 rounded-lg object-cover ring-1 ring-[var(--card-border)]" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="line-clamp-1 text-sm font-medium text-[var(--foreground)] transition-colors group-hover:text-indigo-500 dark:group-hover:text-indigo-300">
                        {a.title || "（无标题）"}
                      </span>
                      {a.draft && <span className="shrink-0 rounded bg-fuchsia-500/10 px-1.5 py-0.5 text-[10px] text-fuchsia-500">草稿</span>}
                      {isScheduled(a) && <span className="shrink-0 rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] text-sky-400">定时</span>}
                    </div>
                    {a.summary && <p className="mb-2 line-clamp-2 text-xs text-[var(--muted)]">{a.summary}</p>}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--muted)]">
                      <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />{a.date}</span>
                      <span className="inline-flex items-center gap-1"><AlignLeft className="h-3 w-3" />{a.wordCount} 字</span>
                      <span className="inline-flex items-center gap-1"><FolderOpen className="h-3 w-3" />{a.category || "未分类"}</span>
                    </div>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
