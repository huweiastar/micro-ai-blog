"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Loader2, X, Plus, Pencil, Trash2, Eye, ArrowLeft,
  Import, Sparkles, Eraser, Search,
  ChevronDown, ChevronUp, Tag, FolderOpen, FileText,
} from "lucide-react";
import { AiWriteModal } from "../../../components/admin/ai-write-modal";
import { MarkdownEditor } from "../../../components/admin/MarkdownEditor";

type Article = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  category: string;
  draft: boolean;
  wordCount: number;
};

type CategoryConfig = { name: string; description: string };

export default function ArticleManagementPage() {
  // --- State: Article List ---
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "editor">("list");
  const [editingSlug, setEditingSlug] = useState<string | null>(null);

  // --- State: Search/Filter ---
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [categories, setCategories] = useState<CategoryConfig[]>([]);

  // --- State: Editor ---
  const [articleTitle, setArticleTitle] = useState("");
  const [articleSummary, setArticleSummary] = useState("");
  const [articleCategory, setArticleCategory] = useState("");
  const [articleTags, setArticleTags] = useState("");
  const [articleContent, setArticleContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);
  const [metaExpanded, setMetaExpanded] = useState(false);

  // Feishu import
  const [showFeishuImport, setShowFeishuImport] = useState(false);
  const [feishuUrl, setFeishuUrl] = useState("");
  const [feishuLoading, setFeishuLoading] = useState(false);
  const [feishuError, setFeishuError] = useState("");
  const [showAiWrite, setShowAiWrite] = useState(false);

  // --- Load articles & categories ---
  useEffect(() => {
    fetch("/api/posts").then((res) => res.json()).then((data) => { setArticles(Array.isArray(data) ? data : []); setLoading(false); }).catch(() => setLoading(false));
    fetch("/api/categories").then((res) => res.json()).then((data) => { setCategories(data); if (data.length > 0 && !articleCategory) setArticleCategory(data[0].name); }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Draft auto-save ---
  useEffect(() => {
    const timer = setInterval(() => {
      if (articleTitle || articleContent) localStorage.setItem("blog-draft", JSON.stringify({ title: articleTitle, summary: articleSummary, tags: articleTags, category: articleCategory, content: articleContent }));
    }, 10000);
    return () => clearInterval(timer);
  }, [articleTitle, articleSummary, articleTags, articleCategory, articleContent]);

  // --- Filter articles ---
  const filtered = articles.filter((a) => {
    const matchSearch = !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = !filterCategory || a.category === filterCategory;
    return matchSearch && matchCategory;
  });

  // --- New article ---
  const startNew = () => {
    setEditingSlug(null);
    setArticleTitle(""); setArticleSummary(""); setArticleCategory(categories[0]?.name || "");
    setArticleTags(""); setArticleContent(""); setView("editor");
  };

  // --- Edit article ---
  const startEdit = async (slug: string) => {
    setLoading(true);
    const res = await fetch(`/api/posts?slug=${slug}`);
    const data = await res.json();
    if (data.article) {
      setEditingSlug(slug);
      setArticleTitle(data.article.title || "");
      setArticleSummary(data.article.summary || "");
      setArticleCategory(data.article.category || "");
      setArticleTags((data.article.tags || []).join(", "));
      setArticleContent(data.article.content || "");
    }
    setLoading(false);
    setView("editor");
  };

  // --- Delete article ---
  const deleteArticle = async (slug: string, title: string) => {
    if (!confirm(`确定删除文章「${title}」吗？此操作不可撤销。`)) return;
    const res = await fetch("/api/posts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }) });
    const data = await res.json();
    if (data.success) {
      setArticles(articles.filter((a) => a.slug !== slug));
      if (editingSlug === slug) { setView("list"); setEditingSlug(null); }
    }
  };

  // --- Save (create or update) ---
  const saveArticle = async () => {
    if (!articleTitle.trim()) { setSaveResult({ success: false, message: "请输入文章标题" }); setTimeout(() => setSaveResult(null), 2000); return; }
    if (!articleContent.trim()) { setSaveResult({ success: false, message: "请输入文章内容" }); setTimeout(() => setSaveResult(null), 2000); return; }

    setSaving(true); setSaveResult(null);
    const isEdit = !!editingSlug;
    const payload = {
      slug: editingSlug,
      title: articleTitle,
      date: new Date().toISOString().split("T")[0],
      summary: articleSummary || articleTitle,
      tags: articleTags,
      category: articleCategory,
      content: articleContent,
    };
    try {
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch("/api/posts", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) {
        setSaveResult({ success: true, message: isEdit ? "文章已更新" : "文章已发布" });
        if (!isEdit) { setArticleTitle(""); setArticleSummary(""); setArticleTags(""); setArticleContent(""); localStorage.removeItem("blog-draft"); }
        // Refresh list
        fetch("/api/posts").then((r) => r.json()).then((d) => { setArticles(Array.isArray(d) ? d : []); }).catch(() => {});
        setTimeout(() => { setSaveResult(null); if (!isEdit) setView("list"); }, 2000);
      } else {
        setSaveResult({ success: false, message: data.error || (isEdit ? "更新失败" : "发布失败") });
      }
    } catch { setSaveResult({ success: false, message: "网络错误" }); }
    finally { setSaving(false); }
  };

  // --- Cancel edit ---
  const cancelEdit = () => { setView("list"); setEditingSlug(null); };

  // --- Feishu import ---
  const importFromFeishu = async () => {
    if (!feishuUrl.trim()) { setFeishuError("请输入飞书文档链接"); return; }
    setFeishuLoading(true); setFeishuError("");
    try {
      const res = await fetch("/api/feishu", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: feishuUrl.trim() }) });
      const data = await res.json();
      if (data.success) { setArticleTitle(data.title || ""); setArticleContent(data.content || ""); setShowFeishuImport(false); setFeishuUrl(""); }
      else setFeishuError(data.message || "导入失败");
    } catch { setFeishuError("网络错误，请重试"); }
    finally { setFeishuLoading(false); }
  };

  // --- AI insert ---
  const handleAiInsert = (result: { title: string; summary: string; tags: string; category: string; content: string }) => {
    if (result.title) setArticleTitle(result.title);
    if (result.summary) setArticleSummary(result.summary);
    if (result.tags) setArticleTags(result.tags);
    if (result.content) setArticleContent(result.content);
    if (result.category) { const m = categories.find((c) => c.name === result.category); if (m) setArticleCategory(m.name); }
    localStorage.setItem("blog-draft", JSON.stringify({ title: result.title || articleTitle, summary: result.summary || articleSummary, tags: result.tags || articleTags, category: articleCategory, content: result.content || articleContent }));
  };

  // --- Markdown preview ---
  const renderPreview = (md: string) => {
    if (!md.trim()) return { __html: '<span class="text-[var(--muted)] text-sm">暂无内容</span>' };
    const codeBlocks: string[] = [];
    let pmd = md.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => { const idx = codeBlocks.length; codeBlocks.push(`<pre class="bg-[var(--code-bg)] text-[var(--code-text)] rounded-lg p-4 my-4 overflow-x-auto text-sm font-mono"><code class="language-${lang}">${code.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`); return `\x00CODEBLOCK_${idx}\x00`; });
    pmd = pmd.replace(/\|(.+)\|\n\|[-\s|:]+\|\n((?:\|.+\|\n?)*)/g, (_, hr, br) => { const hs = hr.split("|").filter((c: string) => c.trim()).map((c: string) => `<th class="px-4 py-3 text-left font-semibold bg-[var(--card)] border-b border-[var(--card-border)]">${c.trim()}</th>`).join(""); const rs = br.trim().split("\n").map((row: string) => `<tr>${row.split("|").filter((c: string) => c.trim()).map((c: string) => `<td class="px-4 py-3 border-b border-[var(--card-border)]">${c.trim()}</td>`).join("")}</tr>`).join(""); return `<table class="w-full border-collapse my-4 rounded-lg overflow-hidden border border-[var(--card-border)]"><thead><tr>${hs}</tr></thead><tbody>${rs}</tbody></table>`; });
    let html = pmd
      .replace(/<figure[^>]*class="([^"]*image-block[^"]*)"[^>]*>([\s\S]*?)<\/figure>/gi, (_, cls, inner) => { const isSingle = !cls.includes("flex-1"); const imgMatch = inner.match(/<img[^>]*>/i); const imgHtml = imgMatch ? imgMatch[0] : ""; const capMatch = inner.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i); const caption = capMatch ? capMatch[1] : ""; return `<div class="${isSingle ? "my-6 text-center" : "flex-1 text-center"}">${imgHtml.replace(/class="([^"]*)"/, `class="$1 rounded-lg shadow-sm"`)}${caption ? `<p class="text-xs text-[var(--muted)] mt-2 italic">${caption}</p>` : ""}</div>`; })
      .replace(/<div\s+class="flex\s+gap-4">([\s\S]*?)<\/div>/gi, (_, inner) => `<div class="flex gap-4 my-6">${inner}</div>`)
      .replace(/^###### (.+)$/gm, "<h6 class='text-sm font-semibold mt-4 mb-2'>$1</h6>")
      .replace(/^##### (.+)$/gm, "<h5 class='text-base font-semibold mt-5 mb-2'>$1</h5>")
      .replace(/^#### (.+)$/gm, "<h4 class='text-lg font-semibold mt-6 mb-3'>$1</h4>")
      .replace(/^### (.+)$/gm, "<h3 class='text-lg font-semibold mt-6 mb-3'>$1</h3>")
      .replace(/^## (.+)$/gm, "<h2 class='text-xl font-bold mt-8 mb-4'>$1</h2>")
      .replace(/^# (.+)$/gm, "<h1 class='text-2xl font-bold mt-8 mb-4'>$1</h1>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/~~(.+?)~~/g, "<del>$1</del>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/==(.+?)==/g, "<mark class='bg-yellow-200 dark:bg-yellow-800 px-1 rounded'>$1</mark>")
      .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-lg my-4"/>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-[var(--link)] hover:text-[var(--link-hover)] underline underline-offset-2">$1</a>')
      .replace(/`([^`]+?)`/g, '<code class="px-2 py-0.5 rounded bg-[var(--card)] text-[var(--primary)] text-sm font-mono">$1</code>')
      .replace(/^- \[ \] (.+)$/gm, '<li class="flex items-center gap-2 my-1"><input type="checkbox" disabled class="accent-[var(--primary)]"><span>$1</span></li>')
      .replace(/^- \[x\] (.+)$/gm, '<li class="flex items-center gap-2 my-1"><input type="checkbox" checked disabled class="accent-[var(--primary)]"><span class="line-through text-[var(--muted)]">$1</span></li>')
      .replace(/^- (.+)$/gm, "<li class='ml-4 list-disc my-1'>$1</li>")
      .replace(/^\d+\. (.+)$/gm, "<li class='ml-4 list-decimal my-1'>$1</li>")
      .replace(/^> (.+)$/gm, "<blockquote class='border-l-4 border-[var(--primary)] pl-4 my-4 text-[var(--muted)] italic bg-[var(--card)]/50 py-3 pr-4 rounded-r-lg'>$1</blockquote>")
      .replace(/\$\$(.+?)\$\$/g, '<div class="text-center my-4 p-3 bg-[var(--card)] rounded-lg font-mono">$1</div>')
      .replace(/\$(.+?)\$/g, '<span class="font-mono text-[var(--primary)]">$1</span>')
      .replace(/^---$/gm, '<hr class="border-[var(--card-border)] my-6"/>');
    html = html.replace(/\x00CODEBLOCK_(\d+)\x00/g, (_, idx) => codeBlocks[parseInt(idx)] || "");
    html = html.replace(/\n\n/g, "<br/><br/>");
    const footnotes: Record<string, string> = {};
    html = html.replace(/\[\^(\d+)\]:\s*(.+?)(?=\n\n|\[\^|$)/g, (_, num, content) => { footnotes[num] = content; return ""; });
    html = html.replace(/\[\^(\d+)\]/g, (_, num) => `<sup class="text-[var(--primary)] font-semibold cursor-pointer hover:underline">${num}</sup>`);
    if (Object.keys(footnotes).length > 0) html += `<hr class="border-[var(--card-border)] my-6"/><div class="mt-4 pt-4 border-t border-[var(--card-border)]"><h4 class="text-sm font-semibold text-[var(--muted)] mb-2">脚注</h4>${Object.entries(footnotes).map(([num, content]) => `<div class="flex gap-2 my-1 text-xs text-[var(--muted)]"><sup class="text-[var(--primary)] font-semibold">${num}.</sup><span>${content}</span></div>`).join("")}</div>`;
    return { __html: html };
  };

  const inputCls = "w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 text-sm placeholder:text-[var(--muted)]/50";
  const labelCls = "block text-xs text-[var(--muted)] mb-1";

  // ========================
  // === LIST VIEW ===
  // ========================
  if (view === "list") {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Top bar */}
        <div className="sticky top-0 z-40 border-b border-[var(--card-border)] glass backdrop-blur-md">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                <ArrowLeft className="w-4 h-4" />返回管理
              </Link>
              <span className="text-sm font-medium text-[var(--foreground)]/60">/</span>
              <span className="text-sm font-medium">文章管理</span>
            </div>
            <button onClick={startNew} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors shadow-sm">
              <Plus className="w-4 h-4" />新建文章
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-8">
          {/* Stats + Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <FileText className="w-4 h-4" />
              <span className="font-medium text-[var(--foreground)]">{articles.length}</span> 篇文章
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-3 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="搜索文章..." className="pl-9 pr-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 w-48" />
              </div>
              {/* Category filter */}
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50">
                <option value="">全部分类</option>
                {categories.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Article list */}
          {loading ? (
            <div className="flex items-center justify-center py-20 text-[var(--muted)]"><Loader2 className="w-5 h-5 animate-spin mr-2" />加载中...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <FileText className="w-12 h-12 text-[var(--muted)]/30 mx-auto mb-4" />
              <p className="text-[var(--muted)] mb-4">{articles.length === 0 ? "还没有文章" : "没有找到匹配的文章"}</p>
              {articles.length === 0 && (
                <button onClick={startNew} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--primary)] text-white text-sm hover:bg-[var(--primary-hover)] transition-colors">
                  <Plus className="w-4 h-4" />写第一篇文章
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((a) => (
                <div key={a.slug} className="group flex items-start gap-4 p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] hover:border-[var(--primary)]/30 transition-colors">
                  {/* Title + info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-[var(--foreground)] truncate">{a.title}</h3>
                      {a.draft && <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400">草稿</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                      <span>{a.date}</span>
                      <span>·</span>
                      <span>{a.wordCount} 字</span>
                      {a.category && <><span>·</span><span className="px-1.5 py-0.5 rounded bg-[var(--primary)]/10 text-[var(--primary)]">{a.category}</span></>}
                      {a.tags.slice(0, 3).map((t) => <span key={t} className="px-1.5 py-0.5 rounded bg-[var(--card)]/50">{t}</span>)}
                      {a.tags.length > 3 && <span className="text-[var(--muted)]">+{a.tags.length - 3}</span>}
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/blog/${a.slug}`} className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors" title="查看">
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button onClick={() => startEdit(a.slug)} className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors" title="编辑">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteArticle(a.slug, a.title)} className="p-2 rounded-lg text-[var(--muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors" title="删除">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Editor Modal (when editing) */}
        {view === "editor" && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center overflow-auto pt-4 pb-4">
            <div className="w-full max-w-[1400px] mx-4">
              {/* Editor Top Bar */}
              <div className="sticky top-0 z-50 flex items-center justify-between p-3 rounded-t-xl border border-b-0 border-[var(--card-border)] bg-[var(--card)]">
                <div className="flex items-center gap-3">
                  <button onClick={cancelEdit} className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card)] transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-medium">{editingSlug ? "编辑文章" : "新建文章"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowFeishuImport(true)} className="inline-flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--primary)] transition-colors">
                    <Import className="w-3 h-3" />飞书导入
                  </button>
                  <button onClick={() => setShowAiWrite(true)} className="inline-flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border border-[var(--primary)]/30 text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors">
                    <Sparkles className="w-3 h-3" />AI 帮写
                  </button>
                  <button onClick={() => { localStorage.removeItem("blog-draft"); setArticleTitle(""); setArticleSummary(""); setArticleTags(""); setArticleContent(""); }} className="text-xs px-2 py-1.5 rounded-lg text-[var(--muted)] hover:text-red-400 transition-colors">
                    <Eraser className="w-3 h-3 inline mr-1" />清除
                  </button>
                  <button onClick={saveArticle} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50">
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}{saving ? "保存中..." : editingSlug ? "更新" : "发布"}
                  </button>
                </div>
              </div>

              {/* Editor Body */}
              <div className="rounded-b-xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden">
                {/* Title */}
                <input type="text" value={articleTitle} onChange={(e) => setArticleTitle(e.target.value)} placeholder="文章标题" className="w-full text-2xl font-bold bg-transparent text-[var(--foreground)] placeholder:text-[var(--muted)]/30 focus:outline-none border-none px-6 pt-6 pb-2" />
                <input type="text" value={articleSummary} onChange={(e) => setArticleSummary(e.target.value)} placeholder="一句话概括这篇文章..." className="w-full text-base bg-transparent text-[var(--muted)] placeholder:text-[var(--muted)]/30 focus:outline-none border-none px-6 pb-4" />

                {/* Meta toggle */}
                <div className="px-6 pb-3">
                  <button onClick={() => setMetaExpanded(!metaExpanded)} className="inline-flex items-center gap-2 text-xs text-[var(--muted)] hover:text-[var(--primary)] transition-colors">
                    {metaExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    文章信息 {metaExpanded ? "（收起）" : "（展开）"}
                  </button>
                  {metaExpanded && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className={labelCls}><FolderOpen className="w-3 h-3 inline mr-1" />分类</label>
                        <select value={articleCategory} onChange={(e) => setArticleCategory(e.target.value)} className={inputCls}>
                          {categories.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}><Tag className="w-3 h-3 inline mr-1" />标签</label>
                        <input type="text" value={articleTags} onChange={(e) => setArticleTags(e.target.value)} placeholder="Spark, LLM" className={inputCls} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Editor */}
                <div className="px-6 pb-6">
                  <MarkdownEditor
                    value={articleContent}
                    onChange={setArticleContent}
                    uploadMeta={{ type: "blog", category: articleCategory || "未分类", articleTitle: articleTitle || "草稿" }}
                    renderPreview={renderPreview}
                  />
                </div>

                {/* Save result */}
                {saveResult && <div className={`p-3 text-sm text-center ${saveResult.success ? "bg-green-500/10 text-green-400 border-t border-green-500/20" : "bg-red-500/10 text-red-400 border-t border-red-500/20"}`}>{saveResult.message}</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ========================
  // === FEISHU MODAL ===
  // ========================
  return (
    <div className="min-h-screen flex flex-col">
      {/* (same top bar as list view) */}
      <div className="sticky top-0 z-40 border-b border-[var(--card-border)] glass backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
              <ArrowLeft className="w-4 h-4" />返回管理
            </Link>
            <span className="text-sm font-medium text-[var(--foreground)]/60">/</span>
            <span className="text-sm font-medium">文章管理</span>
          </div>
          <button onClick={startNew} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors shadow-sm">
            <Plus className="w-4 h-4" />新建文章
          </button>
        </div>
      </div>

      {showFeishuImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowFeishuImport(false)}>
          <div className="glass rounded-2xl p-6 mx-4 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">从飞书导入</h3>
              <button onClick={() => setShowFeishuImport(false)} className="p-1 rounded text-[var(--muted)] hover:text-[var(--foreground)]"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-[var(--muted)] mb-4">粘贴飞书文档链接，自动抓取内容并转换为 Markdown</p>
            <input type="text" value={feishuUrl} onChange={(e) => setFeishuUrl(e.target.value)} placeholder="https://xxx.feishu.cn/docx/xxx" className="w-full px-4 py-2.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 text-sm" onKeyDown={(e) => e.key === "Enter" && importFromFeishu()} />
            {feishuError && <p className="text-sm text-red-400 mt-2">{feishuError}</p>}
            <div className="flex gap-3 mt-4">
              <button onClick={importFromFeishu} disabled={feishuLoading} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--primary)] text-white text-sm disabled:opacity-50">
                {feishuLoading && <Loader2 className="w-4 h-4 animate-spin" />}{feishuLoading ? "导入中..." : "导入"}
              </button>
              <button onClick={() => setShowFeishuImport(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--card-border)] text-sm text-[var(--muted)]">取消</button>
            </div>
          </div>
        </div>
      )}
      <AiWriteModal isOpen={showAiWrite} onClose={() => setShowAiWrite(false)} onInsert={handleAiInsert} />
    </div>
  );
}
