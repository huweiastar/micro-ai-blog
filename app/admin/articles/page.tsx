"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  Save,
  Trash2,
  Import,
  Sparkles,
  Eraser,
  ChevronDown,
  ChevronUp,
  Tag,
  FolderOpen,
  CalendarDays,
  Clock,
  Share2,
  BookOpen,
  X,
} from "lucide-react";
import { AiWriteModal } from "../../../components/admin/ai-write-modal";
import { SyntaxCheatsheet } from "../../../components/admin/SyntaxCheatsheet";
import { useToast } from "../../../components/admin/Toast";
import { MarkdownEditor } from "../../../components/admin/MarkdownEditor";
import { renderMarkdownPreview as renderPreview } from "../../../lib/markdown/render";
import { SplitWorkspace } from "../../../components/admin/SplitWorkspace";

type Article = {
  id: string;
  slug: string;
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

type CategoryConfig = { name: string; description: string };

export default function ArticlesPage() {
  return (
    <Suspense fallback={null}>
      <ArticlesPageInner />
    </Suspense>
  );
}

function ArticlesPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const selectedId = params.get("id");
  const isNew = params.get("new") === "1";

  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<CategoryConfig[]>([]);

  const refreshList = useCallback(() => {
    return fetch("/api/posts")
      .then((r) => r.json())
      .then((d) => {
        setArticles(
          Array.isArray(d) ? d.map((p: Omit<Article, "id">) => ({ ...p, id: p.slug })) : []
        );
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshList();
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [refreshList]);

  const handleSelect = (id: string | null) =>
    router.push(id ? `/admin/articles?id=${id}` : "/admin/articles");
  const handleNew = () => router.push("/admin/articles?new=1");

  return (
    <SplitWorkspace<Article>
      items={articles}
      selectedId={selectedId}
      onSelect={handleSelect}
      onNew={handleNew}
      newButtonLabel="写文章"
      searchPredicate={(a, q) =>
        a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q)
      }
      filters={[
        { key: "draft", label: "草稿", predicate: (a) => a.draft },
        { key: "published", label: "已发布", predicate: (a) => !a.draft },
      ]}
      sorts={[
        { key: "date-desc", label: "最新发布", compare: (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() },
        { key: "date-asc", label: "最早发布", compare: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() },
        { key: "words-desc", label: "字数多→少", compare: (a, b) => b.wordCount - a.wordCount },
        { key: "title-asc", label: "标题 A→Z", compare: (a, b) => a.title.localeCompare(b.title, "zh-CN") },
      ]}
      renderRow={(a) => (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-[var(--foreground)] text-sm line-clamp-1">
              {a.title || "（无标题）"}
            </span>
            {a.draft && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">
                草稿
              </span>
            )}
            {!a.draft && a.publish && new Date(a.publish).getTime() > Date.now() && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400">
                定时
              </span>
            )}
          </div>
          <div className="text-xs text-[var(--muted)]">
            {a.date} · {a.wordCount} 字 · {a.category}
          </div>
        </div>
      )}
    >
      {selectedId || isNew ? (
        <ArticleEditor
          key={selectedId ?? "new"}
          slug={selectedId}
          isNew={isNew}
          categories={categories}
          onSaved={(savedSlug) => {
            refreshList();
            if (savedSlug) router.replace(`/admin/articles?id=${savedSlug}`);
          }}
          onDeleted={(deletedSlug) => {
            setArticles((prev) => prev.filter((a) => a.id !== deletedSlug));
            router.replace("/admin/articles");
          }}
        />
      ) : null}
    </SplitWorkspace>
  );
}

// ===========================
// === ArticleEditor (pane) ==
// ===========================

interface ArticleEditorProps {
  slug: string | null;
  isNew: boolean;
  categories: CategoryConfig[];
  onSaved: (savedSlug: string) => void;
  onDeleted: (slug: string) => void;
}

// —— 写作反馈阈值（与后台「内容体检」保持一致）——
const TITLE_MAX = 60;
const SUMMARY_MIN = 20;
const SUMMARY_MAX = 160;
const CONTENT_MIN = 150;

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** datetime-local 格式（本地时区）YYYY-MM-DDTHH:mm */
function toDatetimeLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** 默认定时时间：次日同一时刻。 */
function defaultScheduleStr(): string {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return toDatetimeLocal(d);
}

/** 统计字数：中文按字 + 英文按词。 */
function countWords(md: string): number {
  const text = md.replace(/[#*`~\-[\]!()>]/g, "").trim();
  const cn = (text.match(/[一-鿿]/g) || []).length;
  const en = (text.replace(/[一-鿿]/g, "").match(/\b\w+\b/g) || []).length;
  return cn + en;
}

function ArticleEditor({ slug, isNew, categories, onSaved, onDeleted }: ArticleEditorProps) {
  const [articleTitle, setArticleTitle] = useState("");
  const [articleSummary, setArticleSummary] = useState("");
  const [articleCover, setArticleCover] = useState("");
  const [articleCategory, setArticleCategory] = useState("");
  const [articleTags, setArticleTags] = useState("");
  const [articleContent, setArticleContent] = useState("");
  const [articleDate, setArticleDate] = useState(todayStr());
  const [scheduled, setScheduled] = useState(false);
  const [publishAt, setPublishAt] = useState(defaultScheduleStr());
  const [draft, setDraft] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const toast = useToast();
  const [metaExpanded, setMetaExpanded] = useState(false);

  const [showFeishuImport, setShowFeishuImport] = useState(false);
  const [feishuUrl, setFeishuUrl] = useState("");
  const [feishuLoading, setFeishuLoading] = useState(false);
  const [feishuError, setFeishuError] = useState("");
  const [showAiWrite, setShowAiWrite] = useState(false);
  const [showOg, setShowOg] = useState(false);
  const [ogUrl, setOgUrl] = useState("");
  const [showCheatsheet, setShowCheatsheet] = useState(false);

  const isEdit = !isNew && !!slug;
  const draftKey = `draft:articles:${slug ?? "new"}`;

  // Load existing article when editing
  useEffect(() => {
    if (!isEdit || !slug) {
      // For new article: pick first category by default
      if (categories.length > 0 && !articleCategory) {
        setArticleCategory(categories[0].name);
      }
      return;
    }
    setLoading(true);
    fetch(`/api/posts?slug=${slug}`)
      .then((r) => r.json())
      .then((data) => {
        const post = data?.article ?? data;
        if (post && typeof post === "object") {
          setArticleTitle(post.title || "");
          setArticleSummary(post.summary || "");
          setArticleCover(post.cover || "");
          setArticleCategory(post.category || categories[0]?.name || "");
          setArticleTags(Array.isArray(post.tags) ? post.tags.join(", ") : post.tags || "");
          setArticleContent(post.content || "");
          setDraft(Boolean(post.draft));
          if (post.date) setArticleDate(String(post.date));
          if (post.publish) {
            const d = new Date(String(post.publish));
            if (!Number.isNaN(d.getTime())) {
              setScheduled(true);
              setPublishAt(toDatetimeLocal(d));
            }
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, isEdit]);

  // asDraft 显式指定保存为草稿（不传则沿用当前草稿开关状态）。
  // 草稿仅需标题即可入库；正式发布才要求正文非空。
  const saveArticle = async (asDraft?: boolean) => {
    const saveAsDraft = asDraft ?? draft;
    if (!articleTitle.trim()) {
      toast.show("请输入文章标题", "error");
      return;
    }
    if (!saveAsDraft && !articleContent.trim()) {
      toast.show("请输入文章内容", "error");
      return;
    }

    setSaving(true);
    const payload = {
      slug: isEdit ? slug : undefined,
      title: articleTitle,
      date: articleDate || todayStr(),
      summary: articleSummary || articleTitle,
      cover: articleCover || undefined,
      tags: articleTags,
      category: articleCategory,
      content: articleContent,
      draft: saveAsDraft,
      publish: scheduled && publishAt ? publishAt : undefined,
    };
    try {
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch("/api/posts", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        if (typeof window !== "undefined") window.localStorage.removeItem(draftKey);
        if (saveAsDraft) setDraft(true);
        setLastSavedAt(Date.now());
        toast.show(saveAsDraft ? "草稿已保存" : isEdit ? "文章已更新" : "文章已发布", "success");
        const savedSlug: string = data.slug ?? slug ?? "";
        onSaved(savedSlug);
      } else {
        toast.show(
          data.error || (saveAsDraft ? "草稿保存失败" : isEdit ? "更新失败" : "发布失败"),
          "error"
        );
      }
    } catch {
      toast.show("网络错误", "error");
    } finally {
      setSaving(false);
    }
  };

  // OG 分享卡实时预览：防抖构建 /og 地址，仅在展开时请求。
  useEffect(() => {
    if (!showOg) return;
    const t = setTimeout(() => {
      if (!articleTitle.trim()) {
        setOgUrl("");
        return;
      }
      const params = new URLSearchParams({ title: articleTitle.trim() });
      if (articleCategory) params.set("category", articleCategory);
      setOgUrl(`/og?${params.toString()}`);
    }, 600);
    return () => clearTimeout(t);
  }, [showOg, articleTitle, articleCategory]);

  // 键盘快捷键：⌘/Ctrl+S 保存草稿，⌘/Ctrl+Enter 按当前状态保存/发布。
  const saveRef = useRef(saveArticle);
  saveRef.current = saveArticle;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        saveRef.current(true);
      } else if (e.key === "Enter") {
        e.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const deleteArticle = async () => {
    if (!slug) return;
    if (!confirm(`删除文章「${articleTitle}」？`)) return;
    const res = await fetch("/api/posts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    const data = await res.json();
    if (data.success) onDeleted(slug);
  };

  const importFromFeishu = async () => {
    if (!feishuUrl.trim()) {
      setFeishuError("请输入飞书文档链接");
      return;
    }
    setFeishuLoading(true);
    setFeishuError("");
    try {
      const res = await fetch("/api/feishu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: feishuUrl.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setArticleTitle(data.title || "");
        setArticleContent(data.content || "");
        setShowFeishuImport(false);
        setFeishuUrl("");
      } else {
        setFeishuError(data.message || "导入失败");
      }
    } catch {
      setFeishuError("网络错误，请重试");
    } finally {
      setFeishuLoading(false);
    }
  };

  const handleAiInsert = (result: {
    title: string;
    summary: string;
    tags: string;
    category: string;
    content: string;
  }) => {
    if (result.title) setArticleTitle(result.title);
    if (result.summary) setArticleSummary(result.summary);
    if (result.tags) setArticleTags(result.tags);
    if (result.content) setArticleContent((prev) => (prev ? `${prev}\n\n${result.content}` : result.content));
    if (result.category) {
      const m = categories.find((c) => c.name === result.category);
      if (m) setArticleCategory(m.name);
    }
  };

  const inputCls =
    "w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 text-sm placeholder:text-[var(--muted)]/50";
  const labelCls = "block text-xs text-[var(--muted)] mb-1";

  // —— 实时写作反馈 ——
  const wordCount = countWords(articleContent);
  const readMinutes = Math.max(1, Math.round(wordCount / 300));
  const titleLen = articleTitle.trim().length;
  const summaryLen = articleSummary.trim().length;
  const tagCount = articleTags.split(/[,，]/).map((s) => s.trim()).filter(Boolean).length;
  const qualityChecks = [
    titleLen > 0 && titleLen <= TITLE_MAX,
    summaryLen >= SUMMARY_MIN && summaryLen <= SUMMARY_MAX,
    tagCount >= 1,
    !!articleCover,
    wordCount >= CONTENT_MIN,
  ];
  const qualityScore = qualityChecks.filter(Boolean).length;
  const quality =
    qualityScore >= 5
      ? { label: "优秀", cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" }
      : qualityScore >= 3
        ? { label: "良好", cls: "text-amber-400 bg-amber-500/10 border-amber-500/20" }
        : { label: "待完善", cls: "text-red-400 bg-red-500/10 border-red-500/20" };
  const metricTone = (ok: boolean) => (ok ? "text-[var(--muted)]" : "text-amber-400");

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-4 gap-2">
        <h2 className="text-xl font-semibold">{isNew ? "写新文章" : "编辑文章"}</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowFeishuImport(true)}
            className="inline-flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
          >
            <Import className="w-3 h-3" />飞书导入
          </button>
          <button
            onClick={() => setShowAiWrite(true)}
            className="inline-flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border border-[var(--primary)]/30 text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"
          >
            <Sparkles className="w-3 h-3" />AI 帮写
          </button>
          <button
            onClick={() => setShowCheatsheet(true)}
            className="inline-flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
          >
            <BookOpen className="w-3 h-3" />语法
          </button>
          <button
            onClick={() => {
              setArticleTitle("");
              setArticleSummary("");
              setArticleTags("");
              setArticleContent("");
            }}
            className="text-xs px-2 py-1.5 rounded-lg text-[var(--muted)] hover:text-red-400 transition-colors"
          >
            <Eraser className="w-3 h-3 inline mr-1" />清除
          </button>
          {isEdit && (
            <button
              onClick={deleteArticle}
              className="inline-flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-3 h-3" />删除
            </button>
          )}
          <button
            onClick={() => saveArticle(true)}
            disabled={saving}
            className="inline-flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--primary)] transition-colors disabled:opacity-50"
          >
            <Save className="w-3 h-3" />保存草稿
          </button>
          <button
            onClick={() => saveArticle(draft ? true : false)}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saving ? "保存中..." : draft ? "保存草稿" : isEdit ? "更新" : "发布"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-[var(--muted)]">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />加载中...
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden">
          <input
            type="text"
            value={articleTitle}
            onChange={(e) => setArticleTitle(e.target.value)}
            placeholder="文章标题"
            className="w-full text-2xl font-bold bg-transparent text-[var(--foreground)] placeholder:text-[var(--muted)]/30 focus:outline-none border-none px-6 pt-6 pb-2"
          />
          <input
            type="text"
            value={articleSummary}
            onChange={(e) => setArticleSummary(e.target.value)}
            placeholder="一句话概括这篇文章..."
            className="w-full text-base bg-transparent text-[var(--muted)] placeholder:text-[var(--muted)]/30 focus:outline-none border-none px-6 pb-4"
          />

          {/* Cover Image */}
          <div className="px-6 pb-4">
            <label className="block text-xs text-[var(--muted)] mb-1">封面图片</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={articleCover}
                onChange={(e) => setArticleCover(e.target.value)}
                placeholder="/images/covers/cover.png"
                className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 text-sm placeholder:text-[var(--muted)]/50"
              />
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  const fd = new FormData();
                  fd.append("file", file);
                  fd.append("type", "blog");
                  const res = await fetch("/api/upload", { method: "POST", body: fd });
                  const data = await res.json();
                  if (data.success && data.url) setArticleCover(data.url);
                }}
                className="hidden"
                id="article-cover-upload"
              />
              <label
                htmlFor="article-cover-upload"
                className="px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--muted)] hover:text-[var(--primary)] cursor-pointer shrink-0"
              >
                上传
              </label>
            </div>
          </div>

          <div className="px-6 pb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMetaExpanded(!metaExpanded)}
                className="inline-flex items-center gap-2 text-xs text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
              >
                {metaExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
                文章信息 {metaExpanded ? "（收起）" : "（展开）"}
              </button>
              <label className="inline-flex items-center gap-1 text-xs text-[var(--muted)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft}
                  onChange={(e) => setDraft(e.target.checked)}
                  className="accent-[var(--primary)]"
                />
                草稿
              </label>
            </div>
            {metaExpanded && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className={labelCls}>
                    <FolderOpen className="w-3 h-3 inline mr-1" />分类
                  </label>
                  <select
                    value={articleCategory}
                    onChange={(e) => setArticleCategory(e.target.value)}
                    className={inputCls}
                  >
                    {categories.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>
                    <Tag className="w-3 h-3 inline mr-1" />标签
                  </label>
                  <input
                    type="text"
                    value={articleTags}
                    onChange={(e) => setArticleTags(e.target.value)}
                    placeholder="Spark, LLM"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    <CalendarDays className="w-3 h-3 inline mr-1" />发布日期
                  </label>
                  <input
                    type="date"
                    value={articleDate}
                    onChange={(e) => setArticleDate(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="inline-flex items-center gap-2 text-xs text-[var(--muted)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scheduled}
                      onChange={(e) => setScheduled(e.target.checked)}
                      className="accent-[var(--primary)]"
                    />
                    <Clock className="w-3 h-3" />定时发布（到点前对访客隐藏）
                  </label>
                  {scheduled && (
                    <div className="mt-2">
                      <input
                        type="datetime-local"
                        value={publishAt}
                        onChange={(e) => setPublishAt(e.target.value)}
                        className={inputCls}
                      />
                      <p className="mt-1 text-[11px] text-[var(--muted)]">
                        定时文章需在该时间后重新部署才会出现在列表；按 URL 直达会在到点后自动可见。
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* OG 分享卡预览 */}
          <div className="px-6 pb-3">
            <button
              onClick={() => setShowOg((v) => !v)}
              className="inline-flex items-center gap-2 text-xs text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
            >
              {showOg ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <Share2 className="w-3 h-3" />分享预览（OG 卡片）
            </button>
            {showOg && (
              <div className="mt-2 rounded-lg border border-[var(--card-border)] overflow-hidden max-w-md">
                {ogUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ogUrl} alt="OG 分享预览" className="w-full aspect-[1200/630] object-cover" />
                ) : (
                  <div className="aspect-[1200/630] flex items-center justify-center text-xs text-[var(--muted)] bg-[var(--card)]">
                    输入标题后生成预览
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="px-6 pb-2">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[var(--muted)] border-t border-[var(--card-border)] pt-3">
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border ${quality.cls}`}>
                质量 {quality.label} · {qualityScore}/5
              </span>
              <span>{wordCount} 字</span>
              <span>约 {readMinutes} 分钟阅读</span>
              <span className={metricTone(titleLen > 0 && titleLen <= TITLE_MAX)}>
                标题 {titleLen}/{TITLE_MAX}
              </span>
              <span className={metricTone(summaryLen >= SUMMARY_MIN && summaryLen <= SUMMARY_MAX)}>
                摘要 {summaryLen}（建议 {SUMMARY_MIN}–{SUMMARY_MAX}）
              </span>
              <span className={metricTone(tagCount >= 1)}>标签 {tagCount}</span>
              <span className={metricTone(!!articleCover)}>{articleCover ? "有封面" : "无封面"}</span>
              <span className="ml-auto text-[var(--muted)]/70">
                {lastSavedAt
                  ? `上次保存 ${new Date(lastSavedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`
                  : "⌘S 存草稿 · ⌘↵ 发布"}
              </span>
            </div>
          </div>
          <div className="px-6 pb-6">
            <MarkdownEditor
              value={articleContent}
              onChange={setArticleContent}
              uploadMeta={{
                type: "blog",
                category: articleCategory || "未分类",
                articleTitle: articleTitle || "草稿",
              }}
              renderPreview={renderPreview}
              draftKey={draftKey}
            />
          </div>
        </div>
      )}

      {/* Feishu import modal */}
      {showFeishuImport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowFeishuImport(false)}
        >
          <div
            className="glass rounded-2xl p-6 mx-4 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">从飞书导入</h3>
              <button
                onClick={() => setShowFeishuImport(false)}
                className="p-1 rounded text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-[var(--muted)] mb-4">
              粘贴飞书文档链接，自动抓取内容并转换为 Markdown
            </p>
            <input
              type="text"
              value={feishuUrl}
              onChange={(e) => setFeishuUrl(e.target.value)}
              placeholder="https://xxx.feishu.cn/docx/xxx"
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 text-sm"
              onKeyDown={(e) => e.key === "Enter" && importFromFeishu()}
            />
            {feishuError && <p className="text-sm text-red-400 mt-2">{feishuError}</p>}
            <div className="flex gap-3 mt-4">
              <button
                onClick={importFromFeishu}
                disabled={feishuLoading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--primary)] text-white text-sm disabled:opacity-50"
              >
                {feishuLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {feishuLoading ? "导入中..." : "导入"}
              </button>
              <button
                onClick={() => setShowFeishuImport(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--card-border)] text-sm text-[var(--muted)]"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      <AiWriteModal
        isOpen={showAiWrite}
        onClose={() => setShowAiWrite(false)}
        onInsert={handleAiInsert}
      />

      <SyntaxCheatsheet open={showCheatsheet} onClose={() => setShowCheatsheet(false)} />
    </div>
  );
}
