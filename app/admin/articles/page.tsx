"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
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
  X,
} from "lucide-react";
import { AiWriteModal } from "../../../components/admin/ai-write-modal";
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

function ArticleEditor({ slug, isNew, categories, onSaved, onDeleted }: ArticleEditorProps) {
  const [articleTitle, setArticleTitle] = useState("");
  const [articleSummary, setArticleSummary] = useState("");
  const [articleCover, setArticleCover] = useState("");
  const [articleCategory, setArticleCategory] = useState("");
  const [articleTags, setArticleTags] = useState("");
  const [articleContent, setArticleContent] = useState("");
  const [draft, setDraft] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);
  const [metaExpanded, setMetaExpanded] = useState(false);

  const [showFeishuImport, setShowFeishuImport] = useState(false);
  const [feishuUrl, setFeishuUrl] = useState("");
  const [feishuLoading, setFeishuLoading] = useState(false);
  const [feishuError, setFeishuError] = useState("");
  const [showAiWrite, setShowAiWrite] = useState(false);

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
      setSaveResult({ success: false, message: "请输入文章标题" });
      setTimeout(() => setSaveResult(null), 2000);
      return;
    }
    if (!saveAsDraft && !articleContent.trim()) {
      setSaveResult({ success: false, message: "请输入文章内容" });
      setTimeout(() => setSaveResult(null), 2000);
      return;
    }

    setSaving(true);
    setSaveResult(null);
    const payload = {
      slug: isEdit ? slug : undefined,
      title: articleTitle,
      date: new Date().toISOString().split("T")[0],
      summary: articleSummary || articleTitle,
      cover: articleCover || undefined,
      tags: articleTags,
      category: articleCategory,
      content: articleContent,
      draft: saveAsDraft,
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
        setSaveResult({
          success: true,
          message: saveAsDraft ? "草稿已保存" : isEdit ? "文章已更新" : "文章已发布",
        });
        const savedSlug: string = data.slug ?? slug ?? "";
        onSaved(savedSlug);
        setTimeout(() => setSaveResult(null), 2000);
      } else {
        setSaveResult({
          success: false,
          message: data.error || (saveAsDraft ? "草稿保存失败" : isEdit ? "更新失败" : "发布失败"),
        });
      }
    } catch {
      setSaveResult({ success: false, message: "网络错误" });
    } finally {
      setSaving(false);
    }
  };

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
              </div>
            )}
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

          {saveResult && (
            <div
              className={`p-3 text-sm text-center ${
                saveResult.success
                  ? "bg-green-500/10 text-green-400 border-t border-green-500/20"
                  : "bg-red-500/10 text-red-400 border-t border-red-500/20"
              }`}
            >
              {saveResult.message}
            </div>
          )}
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
    </div>
  );
}
