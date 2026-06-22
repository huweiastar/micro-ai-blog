"use client";

import { useState } from "react";
import { Loader2, Save, Trash2, ArrowLeft } from "lucide-react";
import { MarkdownEditor } from "@pkg/admin-ui/markdown-editor";
import { useToast } from "@pkg/admin-ui/Toast";
import { EditorChrome } from "@pkg/admin-ui/EditorChrome";
import { EditorInspector } from "@pkg/admin-ui/inspector/EditorInspector";
import { InspectorSection } from "@pkg/admin-ui/inspector/InspectorSection";
import { useEditorLayout } from "@pkg/admin-ui/hooks/useEditorLayout";

export type Category = {
  id?: string;
  name: string;
  description: string;
  background?: string;
  bgOpacity?: number;
  description_long?: string;
  cover?: string;
  draft?: boolean;
};

const BG_PRESETS = ["gradient-1", "gradient-2", "gradient-3", "gradient-4", "gradient-5", "gradient-6"];

export function CategoryEditor({
  name,
  isNew,
  existing,
  onSaved,
  onDeleted,
  onBack,
}: {
  name: string | null;
  isNew: boolean;
  existing?: Category;
  onSaved: (name: string) => void;
  onDeleted: (name: string) => void;
  onBack?: () => void;
}) {
  const [formName, setFormName] = useState(existing?.name ?? "");
  const [formDesc, setFormDesc] = useState(existing?.description ?? "");
  const [formBg, setFormBg] = useState(existing?.background ?? "");
  const [formOpacity, setFormOpacity] = useState(existing?.bgOpacity ?? 15);
  const [formCover, setFormCover] = useState(existing?.cover ?? "");
  const [formLongDesc, setFormLongDesc] = useState(existing?.description_long ?? "");
  const [formDraft, setFormDraft] = useState(existing?.draft ?? false);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const { viewMode, setViewMode, inspectorOpen, setInspectorOpen } = useEditorLayout();

  const isEdit = !isNew && !!name;
  const draftKey = `draft:categories:${name ?? "new"}`;
  const inputCls =
    "w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 text-sm";
  const labelCls = "block text-xs text-[var(--muted)] mb-1";

  const save = async (asDraft?: boolean) => {
    const saveAsDraft = asDraft ?? formDraft;
    if (!formName.trim()) {
      toast.show("名称不能为空", "error");
      return;
    }
    setFormDraft(saveAsDraft);
    setSaving(true);
    const payload = {
      name: formName.trim(),
      description: formDesc,
      background: formBg || undefined,
      bgOpacity: formOpacity,
      description_long: formLongDesc || undefined,
      cover: formCover || undefined,
      draft: saveAsDraft,
    };
    const res = await fetch("/api/categories", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isEdit ? { ...payload, oldName: name } : payload),
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      if (typeof window !== "undefined") window.localStorage.removeItem(draftKey);
      toast.show(saveAsDraft ? "草稿已保存" : "已发布", "success");
      onSaved(payload.name);
    } else {
      toast.show(data.error || "保存失败", "error");
    }
  };

  const remove = async () => {
    if (!name || isNew) return;
    if (!confirm(`确定删除专栏 "${name}"？`)) return;
    const res = await fetch("/api/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (data.success) onDeleted(name);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 px-4 sm:px-6 h-14 border-b border-[var(--card-border)] shrink-0">
        <div className="flex items-center gap-2 shrink-0 min-w-0">
          {onBack && (
            <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--primary)] transition-colors">
              <ArrowLeft className="w-4 h-4" />返回
            </button>
          )}
          <h2 className="text-base font-semibold truncate">{isNew ? "新建专栏" : `编辑：${name}`}</h2>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <button onClick={remove} className="px-3 py-1.5 rounded-lg border border-red-500/30 text-sm text-red-400 hover:bg-red-500/10 inline-flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> 删除
            </button>
          )}
          <button
            onClick={() => save(true)}
            disabled={saving}
            className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-[var(--primary)] transition-colors inline-flex items-center gap-1 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" /> 保存草稿
          </button>
          <button onClick={() => save(formDraft)} disabled={saving} className="px-4 py-1.5 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saving ? "保存中..." : formDraft ? "保存草稿" : isEdit ? "更新" : "发布"}
          </button>
        </div>
      </div>

      <EditorChrome
        inspectorOpen={inspectorOpen}
        onToggleInspector={() => setInspectorOpen(!inspectorOpen)}
        inspector={
          <EditorInspector>
            <InspectorSection id="cat-publish" title="发布">
              <label className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                <input type="checkbox" checked={formDraft} onChange={(e) => setFormDraft(e.target.checked)} className="accent-[var(--primary)]" />
                存为草稿（不公开）
              </label>
              <p className="text-[11px] text-[var(--muted)]">草稿不会出现在专栏列表与专栏详情页，仅后台可见。</p>
            </InspectorSection>
            <InspectorSection id="cat-desc" title="短描述">
              <textarea rows={3} value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className={`${inputCls} resize-none`} placeholder="一句话介绍这个专栏" />
            </InspectorSection>
            <InspectorSection id="cat-appear" title="外观">
              <div>
                <label className={labelCls}>背景预设</label>
                <select value={formBg} onChange={(e) => setFormBg(e.target.value)} className={inputCls}>
                  <option value="">（无）</option>
                  {BG_PRESETS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>背景透明度（0-100）</label>
                <input type="number" min={0} max={100} value={formOpacity} onChange={(e) => setFormOpacity(Number(e.target.value))} className={inputCls} />
              </div>
            </InspectorSection>
            <InspectorSection id="cat-cover" title="封面">
              <div className="flex gap-2">
                <input type="text" value={formCover} onChange={(e) => setFormCover(e.target.value)} placeholder="/images/covers/category.png" className={inputCls} />
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
                    if (data.success && data.url) setFormCover(data.url);
                  }}
                  className="hidden"
                  id="category-cover-upload"
                />
                <label htmlFor="category-cover-upload" className="px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--muted)] hover:text-[var(--primary)] cursor-pointer shrink-0">上传</label>
              </div>
              {formCover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={formCover} alt="封面预览" className="mt-2 w-full rounded-lg border border-[var(--card-border)] object-cover aspect-video" />
              )}
            </InspectorSection>
          </EditorInspector>
        }
      >
        <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 2xl:px-12 py-6">
          <input
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="专栏名称"
            className="w-full text-2xl font-bold bg-transparent text-[var(--foreground)] placeholder:text-[var(--muted)]/30 focus:outline-none border-none mb-2 pr-20"
          />
          <p className="text-xs text-[var(--muted)] mb-3">详细描述（用于专栏详情页，支持 Markdown / 分屏预览）</p>
          <MarkdownEditor
            value={formLongDesc}
            onChange={setFormLongDesc}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            placeholder="描述这个专栏的内容定位、目标读者、阅读顺序等…"
            uploadMeta={{ type: "category", category: formName || "未命名" }}
            draftKey={draftKey}
          />
        </div>
      </EditorChrome>
    </div>
  );
}
