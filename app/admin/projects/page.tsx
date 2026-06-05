"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { SplitWorkspace } from "../../../components/admin/SplitWorkspace";
import { MarkdownEditor } from "../../../components/admin/MarkdownEditor";
import { renderMarkdownPreview as renderPreview } from "../../../lib/markdown/render";

type Project = {
  id: string;
  slug: string;
  name: string;
  description: string;
  cover?: string;
  techStack: string[];
  highlights: string[];
  githubUrl?: string;
  demoUrl?: string;
  content?: string;
};

export default function ProjectsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const selectedId = params.get("id");
  const isNew = params.get("new") === "1";

  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => setProjects(Array.isArray(d) ? d.map((p: Omit<Project, "id">) => ({ ...p, id: p.slug })) : []))
      .catch(() => {});
  }, []);

  return (
    <SplitWorkspace<Project>
      items={projects}
      selectedId={selectedId}
      onSelect={(id) => router.push(id ? `/admin/projects?id=${id}` : "/admin/projects")}
      onNew={() => router.push("/admin/projects?new=1")}
      newButtonLabel="新项目"
      searchPredicate={(p, q) => p.name.toLowerCase().includes(q)}
      renderRow={(p) => (
        <div className="flex items-center gap-3">
          {p.cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.cover} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
          )}
          <div className="min-w-0">
            <div className="font-medium text-sm line-clamp-1">{p.name}</div>
            <div className="text-xs text-[var(--muted)] line-clamp-1">
              {p.techStack.slice(0, 4).join(" · ")}
            </div>
          </div>
        </div>
      )}
    >
      {selectedId || isNew ? (
        <ProjectEditor
          key={selectedId ?? "new"}
          slug={selectedId}
          isNew={isNew}
          onSaved={(s) => {
            fetch("/api/projects")
              .then((r) => r.json())
              .then((d) => setProjects(Array.isArray(d) ? d.map((p: Omit<Project, "id">) => ({ ...p, id: p.slug })) : []));
            router.replace(`/admin/projects?id=${s}`);
          }}
          onDeleted={(s) => {
            setProjects((prev) => prev.filter((p) => p.id !== s));
            router.replace("/admin/projects");
          }}
        />
      ) : null}
    </SplitWorkspace>
  );
}

// ===========================
// === ProjectEditor (pane) ==
// ===========================

function ProjectEditor({ slug, isNew, onSaved, onDeleted }: {
  slug: string | null; isNew: boolean; onSaved: (s: string) => void; onDeleted: (s: string) => void;
}) {
  const [projName, setProjName] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projTechStack, setProjTechStack] = useState("");
  const [projHighlights, setProjHighlights] = useState("");
  const [projGithub, setProjGithub] = useState("");
  const [projDemo, setProjDemo] = useState("");
  const [projCover, setProjCover] = useState("");
  const [projContent, setProjContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);

  const isEdit = !isNew && !!slug;

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
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, isEdit]);

  const saveProject = async () => {
    if (!projName.trim()) { setSaveResult({ success: false, message: "请输入项目名称" }); return; }
    if (!projContent.trim()) { setSaveResult({ success: false, message: "请输入项目内容" }); return; }

    setSaving(true); setSaveResult(null);
    const techStack = projTechStack.split(/[,，]/).map((t) => t.trim()).filter(Boolean);
    const highlights = projHighlights.split("\n").map((h) => h.trim()).filter(Boolean);

    const payload: Record<string, unknown> = {
      name: projName,
      description: projDesc,
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
          setSaveResult({ success: true, message: "更新成功" });
          onSaved(data.slug ?? slug ?? "");
          setTimeout(() => setSaveResult(null), 2000);
        } else {
          setSaveResult({ success: false, message: data.error || "更新失败" });
        }
      } else {
        const res = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const data = await res.json();
        if (data.success) {
          setSaveResult({ success: true, message: "创建成功" });
          onSaved(data.slug ?? "");
          setTimeout(() => setSaveResult(null), 2000);
        } else {
          setSaveResult({ success: false, message: data.error || "创建失败" });
        }
      }
    } catch {
      setSaveResult({ success: false, message: "网络错误" });
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{isNew ? "新建项目" : `编辑：${projName || slug}`}</h1>
        <div className="flex items-center gap-2">
          {!isNew && (
            <button onClick={deleteProject} className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-red-400 hover:border-red-500/30 inline-flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> 删除
            </button>
          )}
          <button onClick={saveProject} disabled={saving} className="px-4 py-1.5 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>

      {saveResult && (
        <div className={`px-3 py-2 rounded text-sm ${saveResult.success ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
          {saveResult.message}
        </div>
      )}

      {/* Meta fields */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>项目名称 <span className="text-red-400">*</span></label>
            <input type="text" value={projName} onChange={(e) => setProjName(e.target.value)} placeholder="项目名称" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>项目描述</label>
            <input type="text" value={projDesc} onChange={(e) => setProjDesc(e.target.value)} placeholder="一句话概括" className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>技术栈（逗号分隔）</label>
            <input type="text" value={projTechStack} onChange={(e) => setProjTechStack(e.target.value)} placeholder="Python, Spark, Hive" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>封面图片 URL</label>
            <input type="text" value={projCover} onChange={(e) => setProjCover(e.target.value)} placeholder="/images/projects/cover.png" className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>GitHub 地址</label>
            <input type="text" value={projGithub} onChange={(e) => setProjGithub(e.target.value)} placeholder="https://github.com/..." className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>在线演示地址</label>
            <input type="text" value={projDemo} onChange={(e) => setProjDemo(e.target.value)} placeholder="https://demo.example.com" className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>项目亮点（每行一个）</label>
          <textarea value={projHighlights} onChange={(e) => setProjHighlights(e.target.value)} placeholder={"支持亿级数据去重\n实现文档级和段落级去重"} rows={2} className={`${inputCls} resize-none`} />
        </div>
      </div>

      {/* Markdown editor */}
      <div>
        <label className="block text-sm text-[var(--muted)] mb-2">项目内容 <span className="text-red-400">*</span></label>
        <MarkdownEditor
          value={projContent}
          onChange={setProjContent}
          uploadMeta={{ type: "projects" }}
          renderPreview={renderPreview}
        />
      </div>
    </div>
  );
}
