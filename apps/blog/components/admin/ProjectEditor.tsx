"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, Trash2, ArrowLeft } from "lucide-react";
import { MarkdownEditor } from "@pkg/admin-ui/markdown-editor";
import { useToast } from "./Toast";
import { EditorChrome } from "@pkg/admin-ui/EditorChrome";
import { EditorInspector } from "@pkg/admin-ui/inspector/EditorInspector";
import { InspectorSection } from "@pkg/admin-ui/inspector/InspectorSection";
import { useEditorLayout } from "@pkg/admin-ui/hooks/useEditorLayout";


// ===========================
// === ProjectEditor (pane) ==
// ===========================

export function ProjectEditor({ slug, isNew, onSaved, onDeleted, onBack }: {
  slug: string | null; isNew: boolean; onSaved: (s: string) => void; onDeleted: (s: string) => void;
  onBack?: () => void;
}) {
  const [projName, setProjName] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projTechStack, setProjTechStack] = useState("");
  const [projHighlights, setProjHighlights] = useState("");
  const [projGithub, setProjGithub] = useState("");
  const [projDemo, setProjDemo] = useState("");
  const [projCover, setProjCover] = useState("");
  const [projContent, setProjContent] = useState("");
  const [projDraft, setProjDraft] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { viewMode, setViewMode, inspectorOpen, setInspectorOpen } = useEditorLayout();

  const isEdit = !isNew && !!slug;
  const draftKey = `draft:projects:${slug ?? "new"}`;

  // Load project data when editing
  useEffect(() => {
    if (!isEdit || !slug) return;
    setLoading(true);
    fetch(`/api/projects?slug=${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.project) {
          const p = data.project;
          setProjName(p.name || "");
          setProjDesc(p.description || "");
          setProjTechStack((p.techStack || []).join(", "));
          setProjHighlights((p.highlights || []).join("\n"));
          setProjGithub(p.githubUrl || "");
          setProjDemo(p.demoUrl || "");
          setProjCover(p.cover || p.image || "");
          setProjContent(p.content || "");
          setProjDraft(Boolean(p.draft));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, isEdit]);

  // asDraft 显式指定保存为草稿（不传则沿用当前草稿开关状态）。
  // 草稿仅需项目名称即可入库；正式发布才要求正文非空。
  const saveProject = async (asDraft?: boolean) => {
    const saveAsDraft = asDraft ?? projDraft;
    if (!projName.trim()) { toast.show("请输入项目名称", "error"); return; }
    if (!saveAsDraft && !projContent.trim()) { toast.show("请输入项目内容", "error"); return; }

    setProjDraft(saveAsDraft);
    setSaving(true);
    const techStack = projTechStack.split(/[,，]/).map((t) => t.trim()).filter(Boolean);
    const highlights = projHighlights.split("\n").map((h) => h.trim()).filter(Boolean);

    const payload: Record<string, unknown> = {
      name: projName,
      description: projDesc,
      draft: saveAsDraft,
      techStack,
      highlights,
      githubUrl: projGithub,
      demoUrl: projDemo,
      cover: projCover,
      content: projContent,
    };

    try {
      if (isEdit) {
        payload.slug = slug;
        const res = await fetch("/api/projects", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const data = await res.json();
        if (data.success) {
          if (typeof window !== "undefined") window.localStorage.removeItem(draftKey);
          toast.show(saveAsDraft ? "草稿已保存" : "已发布", "success");
          onSaved(data.slug ?? slug ?? "");
        } else {
          toast.show(data.error || "更新失败", "error");
        }
      } else {
        const res = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const data = await res.json();
        if (data.success) {
          if (typeof window !== "undefined") window.localStorage.removeItem(draftKey);
          toast.show(saveAsDraft ? "草稿已保存" : "已发布", "success");
          onSaved(data.slug ?? "");
        } else {
          toast.show(data.error || "创建失败", "error");
        }
      }
    } catch {
      toast.show("网络错误", "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteProject = async () => {
    if (!slug || isNew) return;
    if (!confirm(`确定删除项目「${projName}」吗？`)) return;
    const res = await fetch("/api/projects", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    const data = await res.json();
    if (data.success) onDeleted(slug);
  };

  const inputCls = "w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 text-sm";
  const labelCls = "block text-sm text-[var(--muted)] mb-1";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--muted)]">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />加载中...
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 px-4 sm:px-6 h-14 border-b border-[var(--card-border)] shrink-0">
        <div className="flex items-center gap-2 shrink-0 min-w-0">
          {onBack && (
            <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--primary)] transition-colors">
              <ArrowLeft className="w-4 h-4" />返回
            </button>
          )}
          <h2 className="text-base font-semibold truncate">{isNew ? "新建项目" : `编辑：${projName || slug}`}</h2>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <button onClick={deleteProject} className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-red-400 hover:border-red-500/30 inline-flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> 删除
            </button>
          )}
          <button onClick={() => saveProject(true)} disabled={saving} className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-[var(--primary)] transition-colors inline-flex items-center gap-1 disabled:opacity-50">
            <Save className="w-3.5 h-3.5" /> 保存草稿
          </button>
          <button onClick={() => saveProject(projDraft)} disabled={saving} className="px-4 py-1.5 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saving ? "保存中..." : projDraft ? "保存草稿" : isEdit ? "更新" : "发布"}
          </button>
        </div>
      </div>

      <EditorChrome
        inspectorOpen={inspectorOpen}
        onToggleInspector={() => setInspectorOpen(!inspectorOpen)}
        inspector={
          <EditorInspector>
            <InspectorSection id="proj-publish" title="发布">
              <label className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                <input type="checkbox" checked={projDraft} onChange={(e) => setProjDraft(e.target.checked)} className="accent-[var(--primary)]" />
                存为草稿（不公开）
              </label>
              <p className="text-[11px] text-[var(--muted)]">草稿不会出现在项目列表、首页与搜索中，仅后台可见。</p>
            </InspectorSection>
            <InspectorSection id="proj-basic" title="基本信息">
              <div>
                <label className={labelCls}>项目描述</label>
                <input type="text" value={projDesc} onChange={(e) => setProjDesc(e.target.value)} placeholder="一句话概括" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>技术栈（逗号分隔）</label>
                <input type="text" value={projTechStack} onChange={(e) => setProjTechStack(e.target.value)} placeholder="Python, Spark, Hive" className={inputCls} />
              </div>
            </InspectorSection>

            <InspectorSection id="proj-cover" title="封面">
              <div className="flex gap-2">
                <input type="text" value={projCover} onChange={(e) => setProjCover(e.target.value)} placeholder="/images/projects/cover.png" className={inputCls} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    const fd = new FormData();
                    fd.append("file", file);
                    fd.append("type", "projects");
                    const res = await fetch("/api/upload", { method: "POST", body: fd });
                    const data = await res.json();
                    if (data.success && data.url) setProjCover(data.url);
                  }}
                  className="hidden"
                  id="project-cover-upload"
                />
                <label htmlFor="project-cover-upload" className="px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--muted)] hover:text-[var(--primary)] cursor-pointer shrink-0">上传</label>
              </div>
              {projCover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={projCover} alt="封面预览" className="mt-2 w-full rounded-lg border border-[var(--card-border)] object-cover aspect-video" />
              )}
            </InspectorSection>

            <InspectorSection id="proj-links" title="链接">
              <div>
                <label className={labelCls}>GitHub 地址</label>
                <input type="text" value={projGithub} onChange={(e) => setProjGithub(e.target.value)} placeholder="https://github.com/..." className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>在线演示地址</label>
                <input type="text" value={projDemo} onChange={(e) => setProjDemo(e.target.value)} placeholder="https://demo.example.com" className={inputCls} />
              </div>
            </InspectorSection>

            <InspectorSection id="proj-highlights" title="项目亮点">
              <textarea value={projHighlights} onChange={(e) => setProjHighlights(e.target.value)} placeholder={"支持亿级数据去重\n实现文档级和段落级去重"} rows={4} className={`${inputCls} resize-none`} />
              <p className="text-[11px] text-[var(--muted)]">每行一个亮点。</p>
            </InspectorSection>
          </EditorInspector>
        }
      >
        <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 2xl:px-12 py-6">
          <input
            type="text"
            value={projName}
            onChange={(e) => setProjName(e.target.value)}
            placeholder="项目名称"
            className="w-full text-2xl font-bold bg-transparent text-[var(--foreground)] placeholder:text-[var(--muted)]/30 focus:outline-none border-none mb-4 pr-20"
          />
          <MarkdownEditor
            value={projContent}
            onChange={setProjContent}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            uploadMeta={{ type: "projects" }}
            draftKey={draftKey}
          />
        </div>
      </EditorChrome>
    </div>
  );
}
