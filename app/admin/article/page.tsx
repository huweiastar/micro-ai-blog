"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Loader2, Check, X, Plus, Pencil, Trash2, Eye, ArrowLeft,
  Import, Sparkles, Clock, Eraser, PenTool, Search,
  ChevronDown, ChevronUp, Tag, FolderOpen, FileText,
  Bold, Italic, Underline, Strikethrough, Superscript, Subscript,
  Highlighter, Code2, Heading, Image as ImageIcon, List, ListOrdered,
  Quote, Table2, Minus, Type, Palette, AlignVerticalJustifyCenter, Columns2,
  Minus as MinusIcon, TextCursorInput, Link2, Code, Footprints,
  Maximize2, Minimize2,
} from "lucide-react";
import { AiWriteModal } from "../../../components/admin/ai-write-modal";

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
  const [showPreview, setShowPreview] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [metaExpanded, setMetaExpanded] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Feishu import
  const [showFeishuImport, setShowFeishuImport] = useState(false);
  const [feishuUrl, setFeishuUrl] = useState("");
  const [feishuLoading, setFeishuLoading] = useState(false);
  const [feishuError, setFeishuError] = useState("");
  const [showAiWrite, setShowAiWrite] = useState(false);

  // Table/dialog states
  const [showCodeBlockLang, setShowCodeBlockLang] = useState(false);
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [showHeadingDialog, setShowHeadingDialog] = useState(false);
  const [showFontFamilyDialog, setShowFontFamilyDialog] = useState(false);
  const [showFontSizeDialog, setShowFontSizeDialog] = useState(false);
  const [showFontColorDialog, setShowFontColorDialog] = useState(false);
  const [showLineHeightDialog, setShowLineHeightDialog] = useState(false);
  const [showParagraphSpacingDialog, setShowParagraphSpacingDialog] = useState(false);
  const [selectedFontColor, setSelectedFontColor] = useState("#6366f1");
  const [customFontSize, setCustomFontSize] = useState(16);
  const [customLineHeight, setCustomLineHeight] = useState(1.8);
  const [customParagraphSpacing, setCustomParagraphSpacing] = useState(8);
  const [globalStyleMode, setGlobalStyleMode] = useState<"selection" | "global">("selection");
  const [customImageWidth, setCustomImageWidth] = useState(400);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [pendingImageUrl, setPendingImageUrl] = useState("");
  const [pendingImageAlt, setPendingImageAlt] = useState("");
  const [imageSize, setImageSize] = useState("full");
  const [imageLayout, setImageLayout] = useState<"single" | "double">("single");
  const [doubleImageQueue, setDoubleImageQueue] = useState<string[]>([]);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  // --- Load articles & categories ---
  useEffect(() => {
    fetch("/api/posts").then((res) => res.json()).then((data) => { setArticles(Array.isArray(data) ? data : []); setLoading(false); }).catch(() => setLoading(false));
    fetch("/api/categories").then((res) => res.json()).then((data) => { setCategories(data); if (data.length > 0 && !articleCategory) setArticleCategory(data[0].name); }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Toggle fullscreen ---
  const toggleFullscreen = async () => {
    if (!editorRef.current) return;
    if (document.fullscreenElement) { document.exitFullscreen(); setIsFullscreen(false); }
    else { try { await editorRef.current.requestFullscreen(); setIsFullscreen(true); } catch {} }
  };
  useEffect(() => { const fn = () => setIsFullscreen(!!document.fullscreenElement); document.addEventListener("fullscreenchange", fn); return () => document.removeEventListener("fullscreenchange", fn); }, []);

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
    setArticleTags(""); setArticleContent(""); setShowPreview(false); setView("editor");
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

  // --- Word count ---
  const getWordCount = () => {
    const text = articleContent.replace(/[#*`~\-\[\]!()]/g, "").trim();
    const cn = (text.match(/[一-鿿]/g) || []).length;
    const en = (text.replace(/[一-鿿]/g, "").match(/\b\w+\b/g) || []).length;
    return { cn, en, total: cn + en };
  };

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

  // --- Markdown helpers ---
  const insertMarkdown = (before: string, after: string = "") => {
    const textarea = document.querySelector("#article-content") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart; const end = textarea.selectionEnd; const selected = articleContent.substring(start, end);
    const textBefore = articleContent.substring(Math.max(0, start - before.length), start); const textAfter = articleContent.substring(end, Math.min(articleContent.length, end + after.length));
    if (textBefore === before && textAfter === after) { const newText = articleContent.substring(0, start - before.length) + selected + articleContent.substring(end + after.length); setArticleContent(newText); setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start - before.length, start - before.length + selected.length); }, 0); return; }
    const newText = articleContent.substring(0, start) + before + selected + after + articleContent.substring(end);
    setArticleContent(newText); setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + before.length, start + before.length + selected.length); }, 0);
  };
  const insertList = (prefix: string) => {
    const textarea = document.querySelector("#article-content") as HTMLTextAreaElement; if (!textarea) return;
    const start = textarea.selectionStart; const end = textarea.selectionEnd;
    const contentStart = articleContent.lastIndexOf("\n", start - 1) + 1; const contentEndRaw = articleContent.indexOf("\n", end); const contentEnd = contentEndRaw === -1 ? articleContent.length : contentEndRaw;
    const lines = articleContent.substring(contentStart, contentEnd).split("\n");
    const allPrefixed = lines.every((l) => !l.trim() || (prefix === "1. " ? /^\d+\. /.test(l) : l.startsWith(prefix)));
    const processed = allPrefixed ? lines.map((l) => { if (!l.trim()) return l; if (prefix === "1. ") return l.replace(/^\d+\. /, ""); return l.startsWith(prefix) ? l.slice(prefix.length) : l; }).join("\n") : (() => { let c = 1; return lines.map((l) => { if (!l.trim()) return l; if (prefix === "1. ") { const clean = l.replace(/^\d+\. /, ""); return `${c++}. ${clean}`; } return `${prefix}${l}`; }).join("\n"); })();
    setArticleContent(articleContent.substring(0, contentStart) + processed + articleContent.substring(contentEnd));
    setTimeout(() => { textarea.focus(); textarea.setSelectionRange(contentStart, contentStart + processed.length); }, 0);
  };
  const insertQuote = () => {
    const textarea = document.querySelector("#article-content") as HTMLTextAreaElement; if (!textarea) return;
    const start = textarea.selectionStart; const end = textarea.selectionEnd;
    const contentStart = articleContent.lastIndexOf("\n", start - 1) + 1; const contentEndRaw = articleContent.indexOf("\n", end); const contentEnd = contentEndRaw === -1 ? articleContent.length : contentEndRaw;
    const lines = articleContent.substring(contentStart, contentEnd).split("\n");
    const allQuoted = lines.every((l) => !l.trim() || l.startsWith("> "));
    const processed = allQuoted ? lines.map((l) => !l.trim() ? l : l.startsWith("> ") ? l.slice(2) : l).join("\n") : lines.map((l) => !l.trim() ? l : `> ${l}`).join("\n");
    setArticleContent(articleContent.substring(0, contentStart) + processed + articleContent.substring(contentEnd));
    setTimeout(() => { textarea.focus(); textarea.setSelectionRange(contentStart, contentStart + processed.length); }, 0);
  };
  const insertCodeBlock = (lang: string) => { const textarea = document.querySelector("#article-content") as HTMLTextAreaElement; if (!textarea) return; const start = textarea.selectionStart; const selected = articleContent.substring(start, textarea.selectionEnd); setArticleContent(articleContent.substring(0, start) + "```" + lang + "\n" + (selected || "// code") + "\n```" + articleContent.substring(textarea.selectionEnd)); setShowCodeBlockLang(false); setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + lang.length + 4, start + lang.length + 4 + (selected || "// code").length); }, 0); };
  const insertFootnote = () => { const textarea = document.querySelector("#article-content") as HTMLTextAreaElement; if (!textarea) return; const start = textarea.selectionStart; const footnotes = articleContent.match(/\[\^(\d+)\]/g) || []; const nums = footnotes.map((m) => parseInt(m.replace(/[\[\^:]/g, ""))); const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1; const ref = `[^${nextNum}]`; const def = `[^${nextNum}]: 脚注内容`; const newText = articleContent.substring(0, start) + ref + articleContent.substring(start) + "\n\n" + def; setArticleContent(newText); setTimeout(() => { textarea.focus(); const defPos = newText.indexOf(def); if (defPos !== -1) textarea.setSelectionRange(defPos + ref.length + 2, defPos + ref.length + 6); }, 0); };
  const insertTable = () => { let table = "\n"; table += `| ${Array.from({ length: tableCols }, () => "列名").join(" | ")} |\n`; table += `| ${Array.from({ length: tableCols }, () => "---").join(" | ")} |\n`; for (let r = 0; r < tableRows - 1; r++) table += `| ${Array.from({ length: tableCols }, () => "内容").join(" | ")} |\n`; insertMarkdown(table); setShowTableDialog(false); };
  const insertFontStyle = (tag: string) => { const textarea = document.querySelector("#article-content") as HTMLTextAreaElement; if (!textarea) return; const start = textarea.selectionStart; const end = textarea.selectionEnd; const selected = articleContent.substring(start, end); if (!selected.trim()) return; setArticleContent(articleContent.substring(0, start) + tag + selected + "</span>" + articleContent.substring(end)); setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start, start + tag.length + selected.length); }, 0); };
  const setFontFamily = (f: string) => { insertFontStyle(`<span style="font-family: '${f}'">`); setShowFontFamilyDialog(false); };
  const setFontSize = (s: number) => { insertFontStyle(`<span style="font-size: ${s}px">`); setShowFontSizeDialog(false); };
  const setFontColor = (c: string) => { insertFontStyle(`<span style="color: ${c}">`); setSelectedFontColor(c); setShowFontColorDialog(false); };
  const setLineHeight = (v: number) => { insertFontStyle(`<span style="line-height: ${v}">`); setShowLineHeightDialog(false); };
  const setParagraphSpacing = (v: number) => { insertFontStyle(`<span style="margin-bottom: ${v}px">`); setShowParagraphSpacingDialog(false); };
  const setGlobalStyle = (prop: string, val: string | number) => { const styleTag = `<style>\n.editor-preview * { ${prop}: ${val} !important; }\n</style>`; const ms = '<!--editor-global-style-->'; const me = '<!--/editor-global-style-->'; const existing = articleContent.match(new RegExp(`${ms.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${me.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)); setArticleContent(existing ? articleContent.replace(existing[0], `${ms}\n${styleTag}\n${me}`) : `${ms}\n${styleTag}\n${me}\n\n${articleContent}`); };
  const applyStyle = (fn: () => void, gf: () => void) => { globalStyleMode === "global" ? gf() : fn(); };
  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; const fd = new FormData(); fd.append("file", file); fd.append("type", "blog"); fd.append("category", articleCategory || "未分类"); fd.append("articleTitle", articleTitle || "草稿"); const res = await fetch("/api/upload", { method: "POST", body: fd }); const data = await res.json(); if (data.success) { setUploadedImageUrl(data.url); setPendingImageUrl(data.url); setPendingImageAlt(""); setImageSize("full"); setImageLayout("single"); setShowImageDialog(true); } e.target.value = ""; };
  const getImageSizeStyle = () => { switch (imageSize) { case "small": return `style="max-width: 33%; margin: 0 auto;"`; case "medium": return `style="max-width: 66%; margin: 0 auto;"`; case "custom": return `style="max-width: ${customImageWidth}px; margin: 0 auto;"`; default: return `class="max-w-full"`; } };
  const insertImageWithSettings = () => { const sa = getImageSizeStyle(); const alt = pendingImageAlt || "图片"; const cap = pendingImageAlt || "在此输入图片描述..."; let content = ""; if (imageLayout === "double") { setDoubleImageQueue(prev => [...prev, pendingImageUrl]); if (doubleImageQueue.length === 0) { setPendingImageUrl(""); setPendingImageAlt(""); setShowImageDialog(false); return; } content = `\n<div class="flex gap-4">\n<figure class="image-block flex-1"><img src="${doubleImageQueue[0]}" alt="图片1" ${sa} /><figcaption class="image-caption">在此输入图片描述...</figcaption></figure>\n<figure class="image-block flex-1"><img src="${pendingImageUrl}" alt="${alt}" ${sa} /><figcaption class="image-caption">${cap}</figcaption></figure>\n</div>\n`; setDoubleImageQueue([]); } else { content = `\n<figure class="image-block">\n  <img src="${pendingImageUrl}" alt="${alt}" ${sa} />\n  <figcaption class="image-caption">${cap}</figcaption>\n</figure>\n`; } insertMarkdown(content); setShowImageDialog(false); setPendingImageUrl(""); setPendingImageAlt(""); };
  const cancelImageInsert = () => { setShowImageDialog(false); setPendingImageUrl(""); setPendingImageAlt(""); setDoubleImageQueue([]); };

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

  const mdToolbar = [
    { icon: Bold, action: () => insertMarkdown("**", "**"), title: "加粗" },
    { icon: Italic, action: () => insertMarkdown("*", "*"), title: "斜体" },
    { icon: Underline, action: () => insertMarkdown("<u>", "</u>"), title: "下划线" },
    { icon: Strikethrough, action: () => insertMarkdown("~~", "~~"), title: "删除线" },
    { icon: Superscript, action: () => insertMarkdown("<sup>", "</sup>"), title: "上标" },
    { icon: Subscript, action: () => insertMarkdown("<sub>", "</sub>"), title: "下标" },
    { icon: Highlighter, action: () => insertMarkdown("==", "=="), title: "高亮" },
    { icon: Code2, action: () => insertMarkdown("`", "`"), title: "行内代码" },
    { icon: Heading, action: () => setShowHeadingDialog(!showHeadingDialog), title: "标题" },
    { icon: TextCursorInput, action: () => setShowFontFamilyDialog(!showFontFamilyDialog), title: "字体" },
    { icon: Palette, action: () => setShowFontColorDialog(!showFontColorDialog), title: "字体颜色" },
    { icon: Type, action: () => setShowFontSizeDialog(!showFontSizeDialog), title: "字体大小" },
    { icon: AlignVerticalJustifyCenter, action: () => setShowLineHeightDialog(!showLineHeightDialog), title: "行间距" },
    { icon: Columns2, action: () => setShowParagraphSpacingDialog(!showParagraphSpacingDialog), title: "段落间距" },
    { icon: Link2, action: () => insertMarkdown("[", "](url)"), title: "链接" },
    { icon: ImageIcon, action: () => document.getElementById("img-upload")?.click(), title: "插入图片" },
    { icon: Code, action: () => setShowCodeBlockLang(true), title: "代码块" },
    { icon: Table2, action: () => setShowTableDialog(true), title: "插入表格" },
    { icon: Quote, action: () => insertQuote(), title: "引用" },
    { icon: List, action: () => insertList("- "), title: "无序列表" },
    { icon: ListOrdered, action: () => insertList("1. "), title: "有序列表" },
    { icon: Footprints, action: insertFootnote, title: "脚注" },
    { icon: MinusIcon, action: () => insertMarkdown("\n---\n"), title: "分隔线" },
    { icon: isFullscreen ? Minimize2 : Maximize2, action: toggleFullscreen, title: isFullscreen ? "退出全屏" : "全屏" },
  ];

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
                <div ref={editorRef} className={`editor-container flex flex-col ${showPreview ? "min-h-[60vh]" : "min-h-[40vh]"}`}>
                  {/* Toolbar */}
                  <div className="sticky top-0 z-30 border-t border-b border-[var(--card-border)] bg-[var(--card)]/90 backdrop-blur-sm">
                    <div className="flex items-center justify-between p-1.5">
                      <div className="relative flex-1">
                        <div className="flex flex-wrap items-center gap-0.5 p-1 rounded-lg border border-[var(--card-border)]">
                          {mdToolbar.map((tool, i) => (
                            <div key={i} className="relative group">
                              <button onClick={tool.action} className="p-1 rounded hover:text-[var(--primary)] text-[var(--muted)] hover:bg-[var(--primary)]/10 transition-colors">
                                <tool.icon className="w-3.5 h-3.5" />
                              </button>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 rounded bg-[var(--foreground)] text-[var(--card)] text-[10px] whitespace-nowrap pointer-events-none opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">{tool.title}</div>
                            </div>
                          ))}
                          <input id="img-upload" type="file" accept="image/*" onChange={uploadImage} className="hidden" />
                        </div>
                        {/* ... dialogs ... */}
                        {showHeadingDialog && <div className="absolute z-40 top-full left-0 mt-1 p-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl w-48" onMouseLeave={() => setShowHeadingDialog(false)}><p className="text-xs text-[var(--muted)] mb-2 px-2">选择标题级别</p>{[{ level: 1, label: "一级标题", prefix: "# " }, { level: 2, label: "二级标题", prefix: "## " }, { level: 3, label: "三级标题", prefix: "### " }, { level: 4, label: "四级标题", prefix: "#### " }, { level: 5, label: "五级标题", prefix: "##### " }, { level: 6, label: "六级标题", prefix: "###### " }].map((h) => <button key={h.level} onClick={() => { insertMarkdown(h.prefix); setShowHeadingDialog(false); }} className="w-full text-left text-sm px-3 py-2 rounded text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors flex items-center justify-between"><span>{h.label}</span><span className="text-xs font-mono opacity-50">{h.prefix}</span></button>)}</div>}
                        {showCodeBlockLang && <div className="absolute z-40 top-full left-0 mt-1 p-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl grid grid-cols-4 gap-1 w-72" onMouseLeave={() => setShowCodeBlockLang(false)}>{["javascript", "typescript", "python", "java", "sql", "shell", "bash", "yaml", "markdown", "css", "html", "go", "rust", "swift", "json", "dockerfile"].map((lang) => <button key={lang} onClick={() => insertCodeBlock(lang)} className="text-xs px-2 py-1.5 rounded text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors text-left">{lang}</button>)}</div>}
                        {showTableDialog && <div className="absolute z-40 top-full left-0 mt-1 p-4 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl w-56"><p className="text-sm text-[var(--foreground)] mb-3">插入表格</p><div className="grid grid-cols-2 gap-3 mb-3"><div><label className="text-xs text-[var(--muted)]">行数</label><input type="number" min={2} max={10} value={tableRows} onChange={(e) => setTableRows(Number(e.target.value))} className="w-full px-2 py-1 rounded border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--foreground)]" /></div><div><label className="text-xs text-[var(--muted)]">列数</label><input type="number" min={2} max={6} value={tableCols} onChange={(e) => setTableCols(Number(e.target.value))} className="w-full px-2 py-1 rounded border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--foreground)]" /></div></div><div className="flex gap-2"><button onClick={insertTable} className="flex-1 text-xs px-3 py-1.5 rounded bg-[var(--primary)] text-white">插入</button><button onClick={() => setShowTableDialog(false)} className="flex-1 text-xs px-3 py-1.5 rounded border border-[var(--card-border)] text-[var(--muted)]">取消</button></div></div>}
                        {showFontFamilyDialog && <div className="absolute z-40 top-full left-0 mt-1 p-3 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl w-64" onMouseLeave={() => setShowFontFamilyDialog(false)}><p className="text-xs text-[var(--muted)] mb-2 px-1">选择字体</p><div className="flex gap-1 mb-2 px-1"><button onClick={() => setGlobalStyleMode("selection")} className={`text-[10px] px-2 py-0.5 rounded transition-colors ${globalStyleMode === "selection" ? "bg-[var(--primary)] text-white" : "text-[var(--muted)] hover:bg-[var(--primary)]/10"}`}>仅对选中文字</button><button onClick={() => setGlobalStyleMode("global")} className={`text-[10px] px-2 py-0.5 rounded transition-colors ${globalStyleMode === "global" ? "bg-[var(--primary)] text-white" : "text-[var(--muted)] hover:bg-[var(--primary)]/10"}`}>通篇应用</button></div><div className="grid grid-cols-2 gap-1.5">{["Arial", "Georgia", "Times New Roman", "Courier New", "Verdana", "PingFang SC", "Microsoft YaHei"].map((font) => <button key={font} onClick={() => applyStyle(() => setFontFamily(font), () => { setGlobalStyle("font-family", `'${font}'`); setShowFontFamilyDialog(false); })} className="text-xs px-2 py-1.5 rounded text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors text-left truncate" style={{ fontFamily: font }}>{font}</button>)}</div></div>}
                        {showFontColorDialog && <div className="absolute z-40 top-full left-0 mt-1 p-3 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl w-72" onMouseLeave={() => setShowFontColorDialog(false)}><p className="text-xs text-[var(--muted)] mb-2 px-1">选择颜色</p><div className="grid grid-cols-6 gap-1.5 mb-2">{["#1e293b", "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#6b7280", "#94a3b8", "#000000"].map((color) => <button key={color} onClick={() => setFontColor(color)} className="w-8 h-8 rounded-md border border-[var(--card-border)] hover:scale-110 transition-transform" style={{ backgroundColor: color }} title={color} />)}</div><div className="flex items-center gap-2"><input type="color" value={selectedFontColor} onChange={(e) => setSelectedFontColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" /><span className="text-xs text-[var(--muted)] font-mono">{selectedFontColor}</span><button onClick={() => { insertFontStyle(`<span style="color: ${selectedFontColor}">`); setShowFontColorDialog(false); }} className="text-xs px-2 py-1 rounded bg-[var(--primary)] text-white ml-auto">应用</button></div></div>}
                        {showFontSizeDialog && <div className="absolute z-40 top-full left-0 mt-1 p-3 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl w-48" onMouseLeave={() => setShowFontSizeDialog(false)}><p className="text-xs text-[var(--muted)] mb-2 px-1">字体大小 (px)</p><div className="flex gap-1 mb-2 px-1"><button onClick={() => setGlobalStyleMode("selection")} className={`text-[10px] px-2 py-0.5 rounded transition-colors ${globalStyleMode === "selection" ? "bg-[var(--primary)] text-white" : "text-[var(--muted)] hover:bg-[var(--primary)]/10"}`}>仅对选中文字</button><button onClick={() => setGlobalStyleMode("global")} className={`text-[10px] px-2 py-0.5 rounded transition-colors ${globalStyleMode === "global" ? "bg-[var(--primary)] text-white" : "text-[var(--muted)] hover:bg-[var(--primary)]/10"}`}>通篇应用</button></div><div className="grid grid-cols-3 gap-1.5 mb-3">{[12, 14, 16, 18, 20, 24, 28, 32, 36].map((size) => <button key={size} onClick={() => applyStyle(() => { insertFontStyle(`<span style="font-size: ${size}px">`); setShowFontSizeDialog(false); }, () => { setGlobalStyle("font-size", `${size}px`); setShowFontSizeDialog(false); })} className="text-xs px-2 py-1.5 rounded text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors text-center">{size}px</button>)}</div><div className="flex items-center gap-2"><label className="text-xs text-[var(--muted)]">自定义</label><input type="number" min={8} max={72} value={customFontSize} onChange={(e) => setCustomFontSize(Number(e.target.value))} className="w-16 px-2 py-1 rounded border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--foreground)]" /><button onClick={() => applyStyle(() => { insertFontStyle(`<span style="font-size: ${customFontSize}px">`); setShowFontSizeDialog(false); }, () => { setGlobalStyle("font-size", `${customFontSize}px`); setShowFontSizeDialog(false); })} className="text-xs px-2 py-1 rounded bg-[var(--primary)] text-white">应用</button></div></div>}
                        {showLineHeightDialog && <div className="absolute z-40 top-full left-0 mt-1 p-3 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl w-48" onMouseLeave={() => setShowLineHeightDialog(false)}><p className="text-xs text-[var(--muted)] mb-2 px-1">行间距</p><div className="flex gap-1 mb-2 px-1"><button onClick={() => setGlobalStyleMode("selection")} className={`text-[10px] px-2 py-0.5 rounded transition-colors ${globalStyleMode === "selection" ? "bg-[var(--primary)] text-white" : "text-[var(--muted)] hover:bg-[var(--primary)]/10"}`}>仅对选中文字</button><button onClick={() => setGlobalStyleMode("global")} className={`text-[10px] px-2 py-0.5 rounded transition-colors ${globalStyleMode === "global" ? "bg-[var(--primary)] text-white" : "text-[var(--muted)] hover:bg-[var(--primary)]/10"}`}>通篇应用</button></div><div className="grid grid-cols-3 gap-1.5 mb-3">{[1, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4, 2.6].map((value) => <button key={value} onClick={() => applyStyle(() => { insertFontStyle(`<span style="line-height: ${value}">`); setShowLineHeightDialog(false); }, () => { setGlobalStyle("line-height", String(value)); setShowLineHeightDialog(false); })} className="text-xs px-2 py-1.5 rounded text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors text-center">{value}</button>)}</div><div className="flex items-center gap-2"><label className="text-xs text-[var(--muted)]">自定义</label><input type="number" min={0.5} max={4} step={0.1} value={customLineHeight} onChange={(e) => setCustomLineHeight(Number(e.target.value))} className="w-16 px-2 py-1 rounded border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--foreground)]" /><button onClick={() => applyStyle(() => { insertFontStyle(`<span style="line-height: ${customLineHeight}">`); setShowLineHeightDialog(false); }, () => { setGlobalStyle("line-height", String(customLineHeight)); setShowLineHeightDialog(false); })} className="text-xs px-2 py-1 rounded bg-[var(--primary)] text-white">应用</button></div></div>}
                        {showParagraphSpacingDialog && <div className="absolute z-40 top-full left-0 mt-1 p-3 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl w-48" onMouseLeave={() => setShowParagraphSpacingDialog(false)}><p className="text-xs text-[var(--muted)] mb-2 px-1">段落间距 (px)</p><div className="flex gap-1 mb-2 px-1"><button onClick={() => setGlobalStyleMode("selection")} className={`text-[10px] px-2 py-0.5 rounded transition-colors ${globalStyleMode === "selection" ? "bg-[var(--primary)] text-white" : "text-[var(--muted)] hover:bg-[var(--primary)]/10"}`}>仅对选中文字</button><button onClick={() => setGlobalStyleMode("global")} className={`text-[10px] px-2 py-0.5 rounded transition-colors ${globalStyleMode === "global" ? "bg-[var(--primary)] text-white" : "text-[var(--muted)] hover:bg-[var(--primary)]/10"}`}>通篇应用</button></div><div className="grid grid-cols-3 gap-1.5 mb-3">{[4, 8, 12, 16, 20, 24, 32, 40, 48].map((value) => <button key={value} onClick={() => applyStyle(() => { insertFontStyle(`<span style="margin-bottom: ${value}px">`); setShowParagraphSpacingDialog(false); }, () => { setGlobalStyle("margin-bottom", `${value}px`); setShowParagraphSpacingDialog(false); })} className="text-xs px-2 py-1.5 rounded text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors text-center">{value}px</button>)}</div><div className="flex items-center gap-2"><label className="text-xs text-[var(--muted)]">自定义</label><input type="number" min={0} max={100} value={customParagraphSpacing} onChange={(e) => setCustomParagraphSpacing(Number(e.target.value))} className="w-16 px-2 py-1 rounded border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--foreground)]" /><button onClick={() => applyStyle(() => { insertFontStyle(`<span style="margin-bottom: ${customParagraphSpacing}px">`); setShowParagraphSpacingDialog(false); }, () => { setGlobalStyle("margin-bottom", `${customParagraphSpacing}px`); setShowParagraphSpacingDialog(false); })} className="text-xs px-2 py-1 rounded bg-[var(--primary)] text-white">应用</button></div></div>}
                        {showImageDialog && <div className="absolute z-40 top-full left-0 mt-1 p-4 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl w-80" onMouseLeave={() => setShowImageDialog(false)}><p className="text-sm font-medium text-[var(--foreground)] mb-3">图片设置</p><div className="mb-3"><label className="text-xs text-[var(--muted)] block mb-1">图片描述</label><input type="text" value={pendingImageAlt} onChange={(e) => setPendingImageAlt(e.target.value)} placeholder="图片描述..." className="w-full px-2 py-1.5 rounded border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--foreground)]" /></div><div className="mb-3"><label className="text-xs text-[var(--muted)] block mb-1">图片大小</label><div className="grid grid-cols-4 gap-1.5 mb-2">{[{ key: "small", label: "小", sub: "33%" }, { key: "medium", label: "中", sub: "66%" }, { key: "full", label: "大", sub: "100%" }, { key: "custom", label: "自定义", sub: "" }].map((s) => <button key={s.key} onClick={() => setImageSize(s.key as typeof imageSize)} className={`text-xs px-2 py-1.5 rounded transition-colors text-center ${imageSize === s.key ? "bg-[var(--primary)] text-white" : "text-[var(--muted)] hover:bg-[var(--primary)]/10"}`}>{s.label}{s.sub && <span className="block text-[10px] opacity-60">{s.sub}</span>}</button>)}</div>{imageSize === "custom" && <div className="flex items-center gap-2"><input type="number" min={50} max={2000} value={customImageWidth} onChange={(e) => setCustomImageWidth(Number(e.target.value))} className="w-20 px-2 py-1 rounded border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--foreground)]" /><span className="text-xs text-[var(--muted)]">px</span></div>}</div><div className="mb-4"><label className="text-xs text-[var(--muted)] block mb-1">排版</label><div className="grid grid-cols-2 gap-1.5">{[{ key: "single", label: "单图", icon: "️" }, { key: "double", label: "双栏并排", icon: "️️" }].map((l) => <button key={l.key} onClick={() => setImageLayout(l.key as typeof imageLayout)} className={`text-xs px-2 py-2 rounded transition-colors text-center ${imageLayout === l.key ? "bg-[var(--primary)] text-white" : "text-[var(--muted)] hover:bg-[var(--primary)]/10"}`}><span>{l.icon}</span><span className="block">{l.label}</span></button>)}</div></div><div className="flex gap-2"><button onClick={insertImageWithSettings} className="flex-1 text-xs px-3 py-1.5 rounded bg-[var(--primary)] text-white">{imageLayout === "double" && doubleImageQueue.length === 0 ? "插入第一张" : "插入"}</button><button onClick={cancelImageInsert} className="flex-1 text-xs px-3 py-1.5 rounded border border-[var(--card-border)] text-[var(--muted)]">取消</button></div></div>}
                      </div>
                      <button onClick={() => setShowPreview(!showPreview)} className={`ml-3 inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors ${showPreview ? "bg-[var(--primary)]/10 text-[var(--primary)]" : "text-[var(--muted)] hover:text-[var(--primary)] border border-[var(--card-border)]"}`}>
                        <Eye className="w-3 h-3" />{showPreview ? "关闭预览" : "预览"}
                      </button>
                    </div>
                  </div>

                  {/* Editor area */}
                  <div className={`flex-1 flex min-h-0`}>
                    <div className={`${showPreview ? "flex-1 border-r border-[var(--card-border)]" : "w-full"} flex flex-col`}>
                      <textarea id="article-content" value={articleContent} onChange={(e) => setArticleContent(e.target.value)} placeholder={"## 标题\n\n正文内容..."} className="flex-1 w-full px-6 py-4 bg-transparent text-[var(--foreground)] focus:outline-none resize-none text-sm leading-relaxed min-h-[400px]" />
                    </div>
                    {showPreview && <div className="flex-1 overflow-auto"><div className="h-full px-6 py-4 text-[var(--foreground)] min-h-[400px] prose-custom" dangerouslySetInnerHTML={renderPreview(articleContent)} /></div>}
                  </div>
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
