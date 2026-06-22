"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Send,
  Loader2,
  Pencil,
  Trash2,
  StickyNote,
  ExternalLink,
  Check,
  X,
} from "lucide-react";
import { deriveNoteTitle, deriveNoteSlug } from "../../../lib/notes";
import { useToast } from "../../../components/admin/Toast";
import { ListHero } from "@pkg/admin-ui/ListHero";

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
  const toast = useToast();
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 页内编辑状态：不跳转文章编辑器，随手记就地改
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

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

  const startEdit = useCallback(
    async (slug: string) => {
      setEditingSlug(slug);
      setEditLoading(true);
      try {
        const res = await fetch(`/api/posts?slug=${encodeURIComponent(slug)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "加载失败");
        setEditContent(String(data.content || "").trim());
        setEditTags(Array.isArray(data.tags) ? data.tags.join(", ") : "");
      } catch (error) {
        toast.show((error as Error).message || "加载随手记失败", "error");
        setEditingSlug(null);
      } finally {
        setEditLoading(false);
      }
    },
    [toast]
  );

  const cancelEdit = useCallback(() => {
    setEditingSlug(null);
    setEditContent("");
    setEditTags("");
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editingSlug) return;
    const text = editContent.trim();
    if (!text) {
      toast.show("内容不能为空", "error");
      return;
    }
    setEditSaving(true);
    try {
      const res = await fetch("/api/posts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: editingSlug,
          title: deriveNoteTitle(text),
          content: text,
          tags: editTags.trim(),
          type: "note",
          draft: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "保存失败");
      toast.show("随手记已更新", "success");
      cancelEdit();
      loadNotes();
    } catch (error) {
      toast.show((error as Error).message || "保存失败", "error");
    } finally {
      setEditSaving(false);
    }
  }, [editingSlug, editContent, editTags, toast, cancelEdit, loadNotes]);

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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <ListHero
        icon={StickyNote}
        hue="sky"
        title="随手记"
        description="记下此刻学到的东西，无需标题与分类，⌘/Ctrl + Enter 直接发布"
        stats={[{ label: "条随手记", value: notes.length }]}
      />

      {/* 快速记录卡 */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4 space-y-3">
        <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-sky-400/0 via-sky-400/70 to-cyan-500/0" />
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
          className="w-full px-3 py-2.5 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-sky-400/50"
        />
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="标签（可选，逗号分隔）"
            className="flex-1 px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/50"
          />
          <button
            type="button"
            onClick={publish}
            disabled={publishing || !content.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 to-cyan-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-sky-500/25 transition-all hover:shadow-sky-500/40 hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            发布
          </button>
        </div>
      </div>

      {/* 最近随手记 */}
      <div>
        <h2 className="text-sm font-medium text-[var(--muted)] mb-3">最近随手记</h2>
        {loading ? (
          <div className="text-sm text-[var(--muted)] py-6 text-center">加载中…</div>
        ) : notes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--card-border)] p-10 text-center">
            <StickyNote className="mx-auto mb-3 h-8 w-8 text-[var(--muted)] opacity-50" />
            <p className="text-sm text-[var(--muted)]">还没有随手记，上面写一条试试。</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {notes.map((note, i) =>
              editingSlug === note.slug ? (
                <li
                  key={note.slug}
                  className="rounded-xl border border-sky-400/40 bg-[var(--card)] p-4 space-y-3 shadow-lg shadow-sky-500/10"
                >
                  {editLoading ? (
                    <div className="flex items-center gap-2 py-4 text-sm text-[var(--muted)]">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      加载内容…
                    </div>
                  ) : (
                    <>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyDown={(e) => {
                          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                            e.preventDefault();
                            saveEdit();
                          }
                          if (e.key === "Escape") cancelEdit();
                        }}
                        rows={5}
                        autoFocus
                        className="w-full px-3 py-2.5 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-sky-400/50"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editTags}
                          onChange={(e) => setEditTags(e.target.value)}
                          placeholder="标签（可选，逗号分隔）"
                          className="flex-1 px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/50"
                        />
                        <button
                          type="button"
                          onClick={saveEdit}
                          disabled={editSaving || !editContent.trim()}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-sky-400 to-cyan-500 px-3 py-1.5 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                        >
                          {editSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          保存
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--card-border)] px-3 py-1.5 text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
                        >
                          <X className="w-3.5 h-3.5" />
                          取消
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ) : (
                <li
                  key={note.slug}
                  className="group flex items-center gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 transition-all hover:border-sky-400/40 hover:shadow-md hover:shadow-sky-500/5 animate-slide-up"
                  style={{ animationDelay: `${Math.min(i, 8) * 30}ms`, animationFillMode: "backwards" }}
                >
                  <span aria-hidden className="h-8 w-1 shrink-0 rounded-full bg-gradient-to-b from-sky-400 to-cyan-500 opacity-40 transition-opacity group-hover:opacity-100" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-[var(--foreground)]">{note.title}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--muted)]">
                      <span>{formatDateTime(note.date)}</span>
                      {note.tags.length > 0 && <span>{note.tags.join(" · ")}</span>}
                    </div>
                  </div>
                  <a
                    href={`/blog/${note.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-[var(--muted)] transition-colors hover:text-sky-500"
                    title="查看"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => startEdit(note.slug)}
                    className="p-1.5 rounded-lg text-[var(--muted)] transition-colors hover:text-sky-500"
                    title="编辑"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(note.slug, note.title)}
                    className="p-1.5 rounded-lg text-[var(--muted)] transition-colors hover:text-red-400"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              )
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
