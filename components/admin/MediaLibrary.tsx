"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Trash2, Copy, Check, RefreshCw, ImageOff } from "lucide-react";

type MediaItem = {
  url: string;
  name: string;
  dir: string;
  size: number;
  mtime: number;
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/** 顶层目录（blog/uploads/avatar/...）用于分组筛选。 */
function topDir(dir: string): string {
  return dir.split("/")[0] || "根目录";
}

/** 媒体库内容（不含外层页面边距，由调用方包裹）。 */
export function MediaLibrary() {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [filter, setFilter] = useState("all");
  const [copied, setCopied] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(() => {
    setItems(null);
    fetch("/api/admin/media")
      .then((r) => (r.ok ? r.json() : []))
      .then((d: MediaItem[]) => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const groups = useMemo(() => {
    const set = new Set((items ?? []).map((i) => topDir(i.dir)));
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    if (!items) return [];
    if (filter === "all") return items;
    return items.filter((i) => topDir(i.dir) === filter);
  }, [items, filter]);

  const totalSize = useMemo(
    () => (items ?? []).reduce((s, i) => s + i.size, 0),
    [items]
  );

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied((c) => (c === url ? null : c)), 1500);
    } catch {
      /* 剪贴板不可用时静默 */
    }
  };

  const remove = async (item: MediaItem) => {
    if (!confirm(`删除图片「${item.name}」？此操作不可恢复，若有文章正在引用会显示破图。`)) return;
    setDeleting(item.url);
    try {
      const res = await fetch("/api/admin/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: item.url }),
      });
      const data = await res.json();
      if (data.success) {
        setItems((prev) => (prev ? prev.filter((i) => i.url !== item.url) : prev));
      } else {
        alert(data.error || "删除失败");
      }
    } catch {
      alert("网络错误");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-[var(--muted)]">
          {items === null ? "加载中…" : `共 ${items.length} 张图片 · ${formatBytes(totalSize)}`}
        </p>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />刷新
        </button>
      </div>

      {/* 目录筛选 */}
      {groups.length > 1 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {["all", ...groups].map((g) => (
            <button
              key={g}
              onClick={() => setFilter(g)}
              className={`px-2.5 py-1 text-xs rounded ${
                filter === g
                  ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {g === "all" ? "全部" : g}
            </button>
          ))}
        </div>
      )}

      {items === null ? (
        <div className="flex items-center justify-center py-20 text-[var(--muted)]">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />加载中…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-10 text-center text-[var(--muted)]">
          <ImageOff className="w-10 h-10 mx-auto mb-3 opacity-60" />
          还没有图片。在文章编辑器里上传封面或插图后会出现在这里。
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((item) => (
            <div
              key={item.url}
              className="group rounded-xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden"
            >
              <div className="aspect-video bg-black/20 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.name} loading="lazy" className="w-full h-full object-cover" />
              </div>
              <div className="p-2.5">
                <p className="text-xs text-[var(--foreground)] truncate" title={item.name}>
                  {item.name}
                </p>
                <p className="text-[11px] text-[var(--muted)] truncate" title={item.dir}>
                  {item.dir || "根目录"} · {formatBytes(item.size)}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <button
                    onClick={() => copyUrl(item.url)}
                    className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] px-2 py-1 rounded border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
                  >
                    {copied === item.url ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied === item.url ? "已复制" : "复制路径"}
                  </button>
                  <button
                    onClick={() => remove(item)}
                    disabled={deleting === item.url}
                    className="inline-flex items-center justify-center px-2 py-1 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    title="删除"
                  >
                    {deleting === item.url ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
