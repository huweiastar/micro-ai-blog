"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { MarkdownEditor } from "../../../components/admin/MarkdownEditor";

type ExistingProject = {
  slug: string;
  name: string;
  description: string;
  cover?: string;
  image?: string;
  techStack: string[];
  highlights: string[];
  githubUrl?: string;
  demoUrl?: string;
  relatedPosts?: string[];
  content?: string;
  details?: Record<string, string>;
};

export default function ProjectEditPage() {
  const [projects, setProjects] = useState<ExistingProject[]>([]);
  const [editSlug, setEditSlug] = useState<string | null>(null);

  // Form fields
  const [projName, setProjName] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projTechStack, setProjTechStack] = useState("");
  const [projHighlights, setProjHighlights] = useState("");
  const [projGithub, setProjGithub] = useState("");
  const [projDemo, setProjDemo] = useState("");
  const [projCover, setProjCover] = useState("");
  const [projContent, setProjContent] = useState("");

  // UI state
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load existing projects for selector
  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => setProjects(data))
      .catch(() => {});
  }, []);

  // Read slug from URL query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");
    if (slug) setEditSlug(slug);
  }, []);

  // Load project if editing
  useEffect(() => {
    if (!editSlug) {
      setProjName(""); setProjDesc(""); setProjTechStack("");
      setProjHighlights(""); setProjGithub(""); setProjDemo("");
      setProjCover(""); setProjContent("");
      return;
    }
    fetch(`/api/projects?slug=${editSlug}`)
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
      .catch(() => {});
  }, [editSlug]);

  // --- Markdown preview renderer ---
  const renderPreview = (md: string) => {
    if (!md.trim()) return { __html: '<span class="text-[var(--muted)] text-sm">暂无内容</span>' };

    const processedMd = md.replace(/\|(.+)\|\n\|[-\s|:]+\|\n((?:\|.+\|\n?)*)/g, (match, headerRow, bodyRows) => {
      const headers = headerRow.split("|").filter((c: string) => c.trim()).map((c: string) => `<th class="px-4 py-3 text-left font-semibold bg-[var(--card)] border-b border-[var(--card-border)]">${c.trim()}</th>`).join("");
      const rows = bodyRows.trim().split("\n").map((row: string) => {
        const cells = row.split("|").filter((c: string) => c.trim()).map((c: string) => `<td class="px-4 py-3 border-b border-[var(--card-border)]">${c.trim()}</td>`).join("");
        return `<tr>${cells}</tr>`;
      }).join("");
      return `<table class="w-full border-collapse my-4 rounded-lg overflow-hidden border border-[var(--card-border)]"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
    });

    let html = processedMd
      .replace(/<figure[^>]*class="([^"]*image-block[^"]*)"[^>]*>([\s\S]*?)<\/figure>/gi, (_, cls, inner) => {
        const isSingle = !cls.includes("flex-1");
        const imgMatch = inner.match(/<img[^>]*>/i);
        const imgHtml = imgMatch ? imgMatch[0] : "";
        const captionMatch = inner.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i);
        const caption = captionMatch ? captionMatch[1] : "";
        const figClass = isSingle ? "my-6 text-center" : "flex-1 text-center";
        const imgEl = imgHtml.replace(/class="([^"]*)"/, `class="$1 rounded-lg shadow-sm"`);
        return `<div class="${figClass}">${imgEl}${caption ? `<p class="text-xs text-[var(--muted)] mt-2 italic">${caption}</p>` : ""}</div>`;
      })
      .replace(/<div\s+class="flex\s+gap-4">([\s\S]*?)<\/div>/gi, (_, inner) => `<div class="flex gap-4 my-6">${inner}</div>`)
      .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
        `<pre class="bg-[var(--code-bg)] text-[var(--code-text)] rounded-lg p-4 my-4 overflow-x-auto text-sm font-mono"><code class="language-${lang}">${code.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`)
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

    html = html.replace(/\n\n/g, "<br/><br/>");
    return { __html: html };
  };

  // --- Save ---
  const saveProject = async () => {
    if (!projName.trim()) { setSaveResult({ success: false, message: "请输入项目名称" }); return; }
    if (!projContent.trim()) { setSaveResult({ success: false, message: "请输入项目内容" }); return; }

    setSaving(true); setSaveResult(null);
    const techStack = projTechStack.split(/[,，]/).map((t) => t.trim()).filter(Boolean);
    const highlights = projHighlights.split("\n").map((h) => h.trim()).filter(Boolean);

    const isEdit = !!editSlug;
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
        payload.slug = editSlug;
        const res = await fetch("/api/projects", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const data = await res.json();
        if (data.success) {
          setSaveResult({ success: true, message: "更新成功" });
          setTimeout(() => setSaveResult(null), 2000);
        } else {
          setSaveResult({ success: false, message: data.error || "更新失败" });
        }
      } else {
        const res = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const data = await res.json();
        if (data.success) {
          setSaveResult({ success: true, message: "创建成功" });
          // Reset form
          setEditSlug(null);
          setProjName(""); setProjDesc(""); setProjTechStack("");
          setProjHighlights(""); setProjGithub(""); setProjDemo("");
          setProjCover(""); setProjContent("");
          // Refresh project list
          fetch("/api/projects").then((res) => res.json()).then((data) => setProjects(data)).catch(() => {});
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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-40 border-b border-[var(--card-border)] glass">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
              <ArrowLeft className="w-4 h-4" />返回管理
            </Link>
            <span className="text-sm font-medium">{editSlug ? "编辑项目" : "新建项目"}</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Project selector for quick edit */}
            <select
              value={editSlug || ""}
              onChange={(e) => setEditSlug(e.target.value || null)}
              className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            >
              <option value="">+ 新建项目</option>
              {projects.map((p) => (
                <option key={p.slug} value={p.slug}>{p.name}</option>
              ))}
            </select>
            <button onClick={saveProject} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[var(--primary)] text-white text-sm hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6">
        <div className="space-y-6">
          {/* Meta fields */}
          <div className="glass rounded-xl p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">项目名称 <span className="text-red-400">*</span></label>
                <input type="text" value={projName} onChange={(e) => setProjName(e.target.value)} placeholder="项目名称" className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 text-sm" />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">项目描述</label>
                <input type="text" value={projDesc} onChange={(e) => setProjDesc(e.target.value)} placeholder="一句话概括" className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 text-sm" />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">封面图片URL</label>
                <input type="text" value={projCover} onChange={(e) => setProjCover(e.target.value)} placeholder="/images/projects/cover.png" className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 text-sm" />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">技术栈（逗号分隔）</label>
                <input type="text" value={projTechStack} onChange={(e) => setProjTechStack(e.target.value)} placeholder="Python, Spark, Hive" className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 text-sm" />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">GitHub 地址</label>
                <input type="text" value={projGithub} onChange={(e) => setProjGithub(e.target.value)} placeholder="https://github.com/..." className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 text-sm" />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">在线演示地址</label>
                <input type="text" value={projDemo} onChange={(e) => setProjDemo(e.target.value)} placeholder="https://demo.example.com" className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 text-sm" />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm text-[var(--muted)] mb-1">项目亮点（每行一个）</label>
              <textarea value={projHighlights} onChange={(e) => setProjHighlights(e.target.value)} placeholder={"支持亿级数据去重\n实现文档级和段落级去重"} rows={2} className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 text-sm resize-none" />
            </div>
          </div>

          {/* Editor */}
          <div className="glass rounded-xl p-5">
            <MarkdownEditor
              value={projContent}
              onChange={setProjContent}
              uploadMeta={{ type: "project", articleTitle: projName || "项目" }}
              renderPreview={renderPreview}
            />
          </div>

          {/* Save result */}
          {saveResult && (
            <div className={`p-3 rounded-lg text-sm text-center ${saveResult.success ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
              {saveResult.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
