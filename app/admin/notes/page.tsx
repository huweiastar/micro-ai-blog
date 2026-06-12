"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, Pencil, Trash2, StickyNote, ExternalLink } from "lucide-react";
import { deriveNoteTitle, deriveNoteSlug } from "../../../lib/notes";
import { useToast } from "../../../components/admin/Toast";

type NoteItem = {
  slug: string;
  type?: string;
  title: string;
  date: string;
  tags: string[];
  wordCount: number;
};

function formatDateTime(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
}

export default function AdminNotesPage() {
  const router = useRouter();
  const toast = useToast();
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotes = useCallback(async () => {
    try {
      const res = await fetch("/api/posts");
      const data = await res.json();
      setNotes(Array.isArray(data) ? data.filter((p: NoteItem) => p.type === "note") : []);
    } catch {
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const publish = useCallback(async () => {
    const text = content.trim();
    if (!text) {
      toast.show("先写点什么吧", "error");
      return;
    }
    setPublishing(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: deriveNoteTitle(text),
          slug: deriveNoteSlug(),
          content: text,
          tags: tags.trim(),
          type: "note",
          draft: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "发布失败");
      toast.show("随手记已发布", "success");
      setContent("");
      setTags("");
      loadNotes();
    } catch (error) {
      toast.show((error as Error).message || "发布失败", "error");
    } finally {
      setPublishing(false);
    }
  }, [content, tags, toast, loadNotes]);

  const remove = useCallback(
    async (slug: string, title: string) => {
      if (!window.confirm(`确定删除「${title}」？删除前会自动留快照。`)) return;
      try {
        const res = await fetch("/api/posts", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "删除失败");
        toast.show("已删除", "success");
        setNotes((prev) => prev.filter((n) => n.slug !== slug));
      } catch (error) {
        toast.show((error as Error).message || "删除失败", "error");
      }
    },
    [toast]
  );

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-1">
          <StickyNote className="w-6 h-6 text-[var(--primary)]" />
          随手记
        </h1>
        <p className="text-sm text-[var(--muted)]">
          记下此刻学到的东西，无需标题与分类，⌘/Ctrl + Enter 直接发布。
        </p>
      </div>

      {/* 快速记录卡 */}
      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4 space-y-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              publish();
            }
          }}
          placeholder="今天学到了什么？支持 Markdown，可贴代码块……"
          rows={5}
          autoFocus
          className="w-full px-3 py-2.5 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
        />
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="标签（可选，逗号分隔）"
            className="flex-1 px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          />
          <button
            type="button"
            onClick={publish}
            disabled={publishing || !content.trim()}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            发布
          </button>
        </div>
      </div>

      {/* 最近随手记 */}
      <div>
        <h2 className="text-sm font-medium text-[var(--muted)] mb-3">
          最近随手记{notes.length > 0 ? `（${notes.length} 条）` : ""}
        </h2>
        {loading ? (
          <div className="text-sm text-[var(--muted)] py-6 text-center">加载中…</div>
        ) : notes.length === 0 ? (
          <div className="text-sm text-[var(--muted)] py-6 text-center rounded-xl border border-dashed border-[var(--card-border)]">
            还没有随手记，上面写一条试试。
          </div>
        ) : (
          <ul className="space-y-2">
            {notes.map((note) => (
              <li
                key={note.slug}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--card-border)] bg-[var(--card)]"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[var(--foreground)] truncate">{note.title}</div>
                  <div className="text-xs text-[var(--muted)] mt-0.5 flex items-center gap-2">
                    <span>{formatDateTime(note.date)}</span>
                    {note.tags.length > 0 && <span>{note.tags.join(" · ")}</span>}
                  </div>
                </div>
                <a
                  href={`/blog/${note.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
                  title="查看"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => router.push(`/admin/articles/edit?slug=${encodeURIComponent(note.slug)}`)}
                  className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
                  title="编辑"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(note.slug, note.title)}
                  className="p-1.5 rounded-lg text-[var(--muted)] hover:text-red-400 transition-colors"
                  title="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
