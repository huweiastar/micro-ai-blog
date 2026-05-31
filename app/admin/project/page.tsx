"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2, Check, X,
  Bold, Italic, Link2, Code, Heading, Image as ImageIcon, List, ListOrdered,
  Quote, Eye, Pencil, Strikethrough, Table2, Minus, Type,
  ArrowLeft, Save, Github, ExternalLink, Code2, Upload, Palette,
  AlignVerticalJustifyCenter, Columns2,
  Minus as MinusIcon, Code2 as CodeIcon, TextCursorInput, Highlighter,
  Superscript, Subscript, Footprints,
  Undo2, Redo2, Maximize2, Minimize2, Underline,
} from "lucide-react";

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
  const router = useRouter();
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
  const [showPreview, setShowPreview] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Dialog states
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
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  const toggleFullscreen = async () => {
    if (!editorRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    } else {
      try {
        await editorRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch {}
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

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

  // --- Markdown insert helpers (same as blog writer) ---
  const insertMarkdown = (before: string, after: string = "") => {
    const textarea = document.querySelector("#proj-content") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = projContent.substring(start, end);

    const textBefore = projContent.substring(Math.max(0, start - before.length), start);
    const textAfter = projContent.substring(end, Math.min(projContent.length, end + after.length));
    if (textBefore === before && textAfter === after) {
      const newText = projContent.substring(0, start - before.length) + selected + projContent.substring(end + after.length);
      setProjContent(newText);
      setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start - before.length, start - before.length + selected.length); }, 0);
      return;
    }

    const newText = projContent.substring(0, start) + before + selected + after + projContent.substring(end);
    setProjContent(newText);
    setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + before.length, start + before.length + selected.length); }, 0);
  };

  const insertList = (prefix: string) => {
    const textarea = document.querySelector("#proj-content") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const contentStart = projContent.lastIndexOf("\n", start - 1) + 1;
    const contentEndRaw = projContent.indexOf("\n", end);
    const contentEnd = contentEndRaw === -1 ? projContent.length : contentEndRaw;
    const linesText = projContent.substring(contentStart, contentEnd);
    const lines = linesText.split("\n");

    const allPrefixed = lines.every((line) => {
      if (!line.trim()) return true;
      if (prefix === "1. ") return /^\d+\. /.test(line);
      return line.startsWith(prefix);
    });

    if (allPrefixed) {
      const processed = lines.map((line) => {
        if (!line.trim()) return line;
        if (prefix === "1. ") return line.replace(/^\d+\. /, "");
        return line.startsWith(prefix) ? line.slice(prefix.length) : line;
      }).join("\n");
      const newText = projContent.substring(0, contentStart) + processed + projContent.substring(contentEnd);
      setProjContent(newText);
      setTimeout(() => { textarea.focus(); textarea.setSelectionRange(contentStart, contentStart + processed.length); }, 0);
    } else {
      let counter = 1;
      const processed = lines.map((line) => {
        if (!line.trim()) return line;
        if (prefix === "1. ") {
          const clean = line.replace(/^\d+\. /, "");
          return `${counter++}. ${clean}`;
        }
        return `${prefix}${line}`;
      }).join("\n");
      const newText = projContent.substring(0, contentStart) + processed + projContent.substring(contentEnd);
      setProjContent(newText);
      setTimeout(() => { textarea.focus(); textarea.setSelectionRange(contentStart, contentStart + processed.length); }, 0);
    }
  };

  const insertQuote = () => {
    const textarea = document.querySelector("#proj-content") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const contentStart = projContent.lastIndexOf("\n", start - 1) + 1;
    const contentEndRaw = projContent.indexOf("\n", end);
    const contentEnd = contentEndRaw === -1 ? projContent.length : contentEndRaw;
    const linesText = projContent.substring(contentStart, contentEnd);
    const lines = linesText.split("\n");

    const allQuoted = lines.every((line) => {
      if (!line.trim()) return true;
      return line.startsWith("> ");
    });

    if (allQuoted) {
      const processed = lines.map((line) => line.trim() ? line.startsWith("> ") ? line.slice(2) : line : line).join("\n");
      const newText = projContent.substring(0, contentStart) + processed + projContent.substring(contentEnd);
      setProjContent(newText);
      setTimeout(() => { textarea.focus(); textarea.setSelectionRange(contentStart, contentStart + processed.length); }, 0);
    } else {
      const processed = lines.map((line) => line.trim() ? `> ${line}` : line).join("\n");
      const newText = projContent.substring(0, contentStart) + processed + projContent.substring(contentEnd);
      setProjContent(newText);
      setTimeout(() => { textarea.focus(); textarea.setSelectionRange(contentStart, contentStart + processed.length); }, 0);
    }
  };

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "blog");
    formData.append("category", "项目");
    formData.append("articleTitle", projName || "草稿");
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (data.success) {
      insertMarkdown(`![图片](${data.url})`);
    }
  };

  const insertCodeBlock = (lang: string) => {
    const textarea = document.querySelector("#proj-content") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const selected = projContent.substring(start, textarea.selectionEnd);
    const newText = projContent.substring(0, start) + "```" + lang + "\n" + (selected || "// code") + "\n```" + projContent.substring(textarea.selectionEnd);
    setProjContent(newText);
    setShowCodeBlockLang(false);
    setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + lang.length + 4, start + lang.length + 4 + (selected || "// code").length); }, 0);
  };

  const insertFootnote = () => {
    const textarea = document.querySelector("#proj-content") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const footnotes = projContent.match(/\[\^(\d+)\]/g) || [];
    const numbers = footnotes.map((m) => parseInt(m.replace(/[\[\^:]/g, "")));
    const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
    const ref = `[^${nextNum}]`;
    const def = `[^${nextNum}]: 脚注内容`;
    const newText = projContent.substring(0, start) + ref + projContent.substring(start) + "\n\n" + def;
    setProjContent(newText);
    setTimeout(() => {
      textarea.focus();
      const defPos = newText.indexOf(def);
      if (defPos !== -1) {
        const contentStart = defPos + ref.length + 2;
        textarea.setSelectionRange(contentStart, contentStart + 4);
      }
    }, 0);
  };

  const insertTable = () => {
    let table = "\n";
    const headerCells = Array.from({ length: tableCols }, () => "列名").join(" | ");
    table += `| ${headerCells} |\n`;
    const sepCells = Array.from({ length: tableCols }, () => "---").join(" | ");
    table += `| ${sepCells} |\n`;
    for (let r = 0; r < tableRows - 1; r++) {
      const dataCells = Array.from({ length: tableCols }, () => "内容").join(" | ");
      table += `| ${dataCells} |\n`;
    }
    insertMarkdown(table);
    setShowTableDialog(false);
  };

  // Font formatting
  const insertFontStyle = (tag: string) => {
    const textarea = document.querySelector("#proj-content") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = projContent.substring(start, end);
    if (!selected.trim()) return;
    const newText = projContent.substring(0, start) + tag + selected + "</span>" + projContent.substring(end);
    setProjContent(newText);
    setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start, start + tag.length + selected.length); }, 0);
  };

  const setFontFamily = (family: string) => { insertFontStyle(`<span style="font-family: '${family}'">`); setShowFontFamilyDialog(false); };
  const setFontSize = (size: number) => { insertFontStyle(`<span style="font-size: ${size}px">`); setShowFontSizeDialog(false); };
  const setCustomFontSizeValue = () => { insertFontStyle(`<span style="font-size: ${customFontSize}px">`); setShowFontSizeDialog(false); };
  const setFontColor = (color: string) => { insertFontStyle(`<span style="color: ${color}">`); setSelectedFontColor(color); setShowFontColorDialog(false); };
  const setCustomFontColor = () => { insertFontStyle(`<span style="color: ${selectedFontColor}">`); setShowFontColorDialog(false); };
  const setLineHeight = (value: number) => { insertFontStyle(`<span style="line-height: ${value}">`); setShowLineHeightDialog(false); };
  const setCustomLineHeightValue = () => { insertFontStyle(`<span style="line-height: ${customLineHeight}">`); setShowLineHeightDialog(false); };
  const setParagraphSpacing = (value: number) => { insertFontStyle(`<span style="margin-bottom: ${value}px">`); setShowParagraphSpacingDialog(false); };
  const setCustomParagraphSpacingValue = () => { insertFontStyle(`<span style="margin-bottom: ${customParagraphSpacing}px">`); setShowParagraphSpacingDialog(false); };

  const setGlobalStyle = (property: string, value: string | number) => {
    const styleTag = `<style>\n.editor-preview * { ${property}: ${value} !important; }\n</style>`;
    const markerStart = '<!--editor-global-style-->';
    const markerEnd = '<!--/editor-global-style-->';
    const existingBlock = projContent.match(new RegExp(`${markerStart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${markerEnd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
    if (existingBlock) {
      setProjContent(projContent.replace(existingBlock[0], `${markerStart}\n${styleTag}\n${markerEnd}`));
    } else {
      setProjContent(`${markerStart}\n${styleTag}\n${markerEnd}\n\n${projContent}`);
    }
  };

  const applyStyle = (fn: () => void, globalFn: () => void) => {
    if (globalStyleMode === "global") globalFn(); else fn();
  };

  // --- Markdown preview renderer ---
  const renderPreview = (md: string) => {
    if (!md.trim()) return { __html: '<span class="text-[var(--muted)] text-sm">暂无内容</span>' };

    let processedMd = md.replace(/\|(.+)\|\n\|[-\s|:]+\|\n((?:\|.+\|\n?)*)/g, (match, headerRow, bodyRows) => {
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
    const payload: Record<string, any> = {
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

  const mdToolbar = [
    { icon: Bold, action: () => insertMarkdown("**", "**"), title: "加粗" },
    { icon: Italic, action: () => insertMarkdown("*", "*"), title: "斜体" },
    { icon: Underline, action: () => insertMarkdown("<u>", "</u>"), title: "下划线" },
    { icon: Strikethrough, action: () => insertMarkdown("~~", "~~"), title: "删除线" },
    { icon: Superscript, action: () => insertMarkdown("<sup>", "</sup>"), title: "上标" },
    { icon: Subscript, action: () => insertMarkdown("<sub>", "</sub>"), title: "下标" },
    { icon: Highlighter, action: () => insertMarkdown("==", "=="), title: "高亮" },
    { icon: CodeIcon, action: () => insertMarkdown("`", "`"), title: "行内代码" },
    { icon: Heading, action: () => setShowHeadingDialog(!showHeadingDialog), title: "标题" },
    { icon: TextCursorInput, action: () => setShowFontFamilyDialog(!showFontFamilyDialog), title: "字体" },
    { icon: Palette, action: () => setShowFontColorDialog(!showFontColorDialog), title: "字体颜色" },
    { icon: Type, action: () => setShowFontSizeDialog(!showFontSizeDialog), title: "字体大小" },
    { icon: AlignVerticalJustifyCenter, action: () => setShowLineHeightDialog(!showLineHeightDialog), title: "行间距" },
    { icon: Columns2, action: () => setShowParagraphSpacingDialog(!showParagraphSpacingDialog), title: "段落间距" },
    { icon: Link2, action: () => insertMarkdown("[", "](url)"), title: "链接" },
    { icon: ImageIcon, action: () => document.getElementById("proj-img-upload")?.click(), title: "插入图片" },
    { icon: Code, action: () => setShowCodeBlockLang(true), title: "代码块" },
    { icon: Table2, action: () => setShowTableDialog(true), title: "插入表格" },
    { icon: Quote, action: () => insertQuote(), title: "引用" },
    { icon: List, action: () => insertList("- "), title: "无序列表" },
    { icon: ListOrdered, action: () => insertList("1. "), title: "有序列表" },
    { icon: Footprints, action: insertFootnote, title: "脚注" },
    { icon: MinusIcon, action: () => insertMarkdown("\n---\n"), title: "分隔线" },
    { icon: isFullscreen ? Minimize2 : Maximize2, action: toggleFullscreen, title: isFullscreen ? "退出全屏" : "全屏" },
  ];

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
          <div ref={editorRef} className="editor-container glass rounded-xl p-5 flex flex-col min-h-[calc(100vh-380px)]">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-3">
              <div className="relative flex-1">
                <div className="flex flex-wrap items-center gap-0.5 p-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)]">
                  {mdToolbar.map((tool, i) => (
                    <div key={i} className="relative group">
                      <button onClick={tool.action} className="p-2 rounded hover:text-[var(--primary)] text-[var(--muted)] hover:bg-[var(--primary)]/10 transition-colors">
                        <tool.icon className="w-4 h-4" />
                      </button>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 rounded bg-[var(--foreground)] text-[var(--card)] text-[11px] whitespace-nowrap pointer-events-none opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                        {tool.title}
                      </div>
                    </div>
                  ))}
                  <input id="proj-img-upload" type="file" accept="image/*" onChange={uploadImage} className="hidden" />
                </div>

                {/* Dialogs (abbreviated for brevity - same as blog writer) */}
                {showHeadingDialog && (
                  <div className="absolute z-40 top-full left-0 mt-1 p-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl w-48" onMouseLeave={() => setShowHeadingDialog(false)}>
                    <p className="text-xs text-[var(--muted)] mb-2 px-2">选择标题级别</p>
                    {[
                      { level: 1, label: "一级标题", prefix: "# " },
                      { level: 2, label: "二级标题", prefix: "## " },
                      { level: 3, label: "三级标题", prefix: "### " },
                      { level: 4, label: "四级标题", prefix: "#### " },
                      { level: 5, label: "五级标题", prefix: "##### " },
                      { level: 6, label: "六级标题", prefix: "###### " },
                    ].map((h) => (
                      <button key={h.level} onClick={() => { insertMarkdown(h.prefix); setShowHeadingDialog(false); }}
                        className="w-full text-left text-sm px-3 py-2 rounded text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors flex items-center justify-between">
                        <span>{h.label}</span>
                        <span className="text-xs font-mono opacity-50">{h.prefix}</span>
                      </button>
                    ))}
                  </div>
                )}

                {showCodeBlockLang && (
                  <div className="absolute z-40 top-full left-0 mt-1 p-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl grid grid-cols-4 gap-1 w-72" onMouseLeave={() => setShowCodeBlockLang(false)}>
                    {["javascript", "typescript", "python", "java", "sql", "shell", "bash", "yaml", "markdown", "css", "html", "go", "rust", "swift", "json", "dockerfile"].map((lang) => (
                      <button key={lang} onClick={() => insertCodeBlock(lang)} className="text-xs px-2 py-1.5 rounded text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors text-left">{lang}</button>
                    ))}
                  </div>
                )}

                {showTableDialog && (
                  <div className="absolute z-40 top-full left-0 mt-1 p-4 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl w-56">
                    <p className="text-sm text-[var(--foreground)] mb-3">插入表格</p>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div><label className="text-xs text-[var(--muted)]">行数</label><input type="number" min={2} max={10} value={tableRows} onChange={(e) => setTableRows(Number(e.target.value))} className="w-full px-2 py-1 rounded border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--foreground)]" /></div>
                      <div><label className="text-xs text-[var(--muted)]">列数</label><input type="number" min={2} max={6} value={tableCols} onChange={(e) => setTableCols(Number(e.target.value))} className="w-full px-2 py-1 rounded border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--foreground)]" /></div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={insertTable} className="flex-1 text-xs px-3 py-1.5 rounded bg-[var(--primary)] text-white">插入</button>
                      <button onClick={() => setShowTableDialog(false)} className="flex-1 text-xs px-3 py-1.5 rounded border border-[var(--card-border)] text-[var(--muted)]">取消</button>
                    </div>
                  </div>
                )}

                {showFontFamilyDialog && (
                  <div className="absolute z-40 top-full left-0 mt-1 p-3 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl w-64" onMouseLeave={() => setShowFontFamilyDialog(false)}>
                    <p className="text-xs text-[var(--muted)] mb-2 px-1">选择字体</p>
                    <div className="flex gap-1 mb-2 px-1">
                      <button onClick={() => setGlobalStyleMode("selection")} className={`text-[10px] px-2 py-0.5 rounded transition-colors ${globalStyleMode === "selection" ? "bg-[var(--primary)] text-white" : "text-[var(--muted)] hover:bg-[var(--primary)]/10"}`}>仅对选中文字</button>
                      <button onClick={() => setGlobalStyleMode("global")} className={`text-[10px] px-2 py-0.5 rounded transition-colors ${globalStyleMode === "global" ? "bg-[var(--primary)] text-white" : "text-[var(--muted)] hover:bg-[var(--primary)]/10"}`}>通篇应用</button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {["Arial", "Georgia", "Times New Roman", "Courier New", "Verdana", "PingFang SC", "Microsoft YaHei"].map((font) => (
                        <button key={font} onClick={() => applyStyle(() => setFontFamily(font), () => { setGlobalStyle("font-family", `'${font}'`); setShowFontFamilyDialog(false); })}
                          className="text-xs px-2 py-1.5 rounded text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors text-left truncate" style={{ fontFamily: font }}>
                          {font}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {showFontColorDialog && (
                  <div className="absolute z-40 top-full left-0 mt-1 p-3 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl w-72" onMouseLeave={() => setShowFontColorDialog(false)}>
                    <p className="text-xs text-[var(--muted)] mb-2 px-1">选择颜色</p>
                    <div className="grid grid-cols-6 gap-1.5 mb-2">
                      {["#1e293b", "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#6b7280", "#94a3b8", "#000000"].map((color) => (
                        <button key={color} onClick={() => setFontColor(color)} className="w-8 h-8 rounded-md border border-[var(--card-border)] hover:scale-110 transition-transform" style={{ backgroundColor: color }} title={color} />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="color" value={selectedFontColor} onChange={(e) => setSelectedFontColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
                      <span className="text-xs text-[var(--muted)] font-mono">{selectedFontColor}</span>
                      <button onClick={setCustomFontColor} className="text-xs px-2 py-1 rounded bg-[var(--primary)] text-white ml-auto">应用</button>
                    </div>
                  </div>
                )}

                {showFontSizeDialog && (
                  <div className="absolute z-40 top-full left-0 mt-1 p-3 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl w-48" onMouseLeave={() => setShowFontSizeDialog(false)}>
                    <p className="text-xs text-[var(--muted)] mb-2 px-1">字体大小 (px)</p>
                    <div className="flex gap-1 mb-2 px-1">
                      <button onClick={() => setGlobalStyleMode("selection")} className={`text-[10px] px-2 py-0.5 rounded transition-colors ${globalStyleMode === "selection" ? "bg-[var(--primary)] text-white" : "text-[var(--muted)] hover:bg-[var(--primary)]/10"}`}>仅对选中文字</button>
                      <button onClick={() => setGlobalStyleMode("global")} className={`text-[10px] px-2 py-0.5 rounded transition-colors ${globalStyleMode === "global" ? "bg-[var(--primary)] text-white" : "text-[var(--muted)] hover:bg-[var(--primary)]/10"}`}>通篇应用</button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 mb-3">
                      {[12, 14, 16, 18, 20, 24, 28, 32, 36].map((size) => (
                        <button key={size} onClick={() => applyStyle(() => setFontSize(size), () => { setGlobalStyle("font-size", `${size}px`); setShowFontSizeDialog(false); })}
                          className="text-xs px-2 py-1.5 rounded text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors text-center">{size}px</button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-[var(--muted)]">自定义</label>
                      <input type="number" min={8} max={72} value={customFontSize} onChange={(e) => setCustomFontSize(Number(e.target.value))} className="w-16 px-2 py-1 rounded border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--foreground)]" />
                      <button onClick={() => applyStyle(setCustomFontSizeValue, () => { setGlobalStyle("font-size", `${customFontSize}px`); setShowFontSizeDialog(false); })} className="text-xs px-2 py-1 rounded bg-[var(--primary)] text-white">应用</button>
                    </div>
                  </div>
                )}

                {showLineHeightDialog && (
                  <div className="absolute z-40 top-full left-0 mt-1 p-3 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl w-48" onMouseLeave={() => setShowLineHeightDialog(false)}>
                    <p className="text-xs text-[var(--muted)] mb-2 px-1">行间距</p>
                    <div className="flex gap-1 mb-2 px-1">
                      <button onClick={() => setGlobalStyleMode("selection")} className={`text-[10px] px-2 py-0.5 rounded transition-colors ${globalStyleMode === "selection" ? "bg-[var(--primary)] text-white" : "text-[var(--muted)] hover:bg-[var(--primary)]/10"}`}>仅对选中文字</button>
                      <button onClick={() => setGlobalStyleMode("global")} className={`text-[10px] px-2 py-0.5 rounded transition-colors ${globalStyleMode === "global" ? "bg-[var(--primary)] text-white" : "text-[var(--muted)] hover:bg-[var(--primary)]/10"}`}>通篇应用</button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 mb-3">
                      {[1, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4, 2.6].map((value) => (
                        <button key={value} onClick={() => applyStyle(() => setLineHeight(value), () => { setGlobalStyle("line-height", String(value)); setShowLineHeightDialog(false); })}
                          className="text-xs px-2 py-1.5 rounded text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors text-center">{value}</button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-[var(--muted)]">自定义</label>
                      <input type="number" min={0.5} max={4} step={0.1} value={customLineHeight} onChange={(e) => setCustomLineHeight(Number(e.target.value))} className="w-16 px-2 py-1 rounded border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--foreground)]" />
                      <button onClick={() => applyStyle(setCustomLineHeightValue, () => { setGlobalStyle("line-height", String(customLineHeight)); setShowLineHeightDialog(false); })} className="text-xs px-2 py-1 rounded bg-[var(--primary)] text-white">应用</button>
                    </div>
                  </div>
                )}

                {showParagraphSpacingDialog && (
                  <div className="absolute z-40 top-full left-0 mt-1 p-3 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl w-48" onMouseLeave={() => setShowParagraphSpacingDialog(false)}>
                    <p className="text-xs text-[var(--muted)] mb-2 px-1">段落间距 (px)</p>
                    <div className="flex gap-1 mb-2 px-1">
                      <button onClick={() => setGlobalStyleMode("selection")} className={`text-[10px] px-2 py-0.5 rounded transition-colors ${globalStyleMode === "selection" ? "bg-[var(--primary)] text-white" : "text-[var(--muted)] hover:bg-[var(--primary)]/10"}`}>仅对选中文字</button>
                      <button onClick={() => setGlobalStyleMode("global")} className={`text-[10px] px-2 py-0.5 rounded transition-colors ${globalStyleMode === "global" ? "bg-[var(--primary)] text-white" : "text-[var(--muted)] hover:bg-[var(--primary)]/10"}`}>通篇应用</button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 mb-3">
                      {[4, 8, 12, 16, 20, 24, 32, 40, 48].map((value) => (
                        <button key={value} onClick={() => applyStyle(() => setParagraphSpacing(value), () => { setGlobalStyle("margin-bottom", `${value}px`); setShowParagraphSpacingDialog(false); })}
                          className="text-xs px-2 py-1.5 rounded text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors text-center">{value}px</button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-[var(--muted)]">自定义</label>
                      <input type="number" min={0} max={100} value={customParagraphSpacing} onChange={(e) => setCustomParagraphSpacing(Number(e.target.value))} className="w-16 px-2 py-1 rounded border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--foreground)]" />
                      <button onClick={() => applyStyle(setCustomParagraphSpacingValue, () => { setGlobalStyle("margin-bottom", `${customParagraphSpacing}px`); setShowParagraphSpacingDialog(false); })} className="text-xs px-2 py-1 rounded bg-[var(--primary)] text-white">应用</button>
                    </div>
                  </div>
                )}
              </div>

              <button onClick={() => setShowPreview(!showPreview)} className={`ml-3 inline-flex items-center gap-1 text-xs px-3 py-2 rounded-lg transition-colors ${showPreview ? "bg-[var(--primary)]/10 text-[var(--primary)]" : "text-[var(--muted)] hover:text-[var(--primary)] border border-[var(--card-border)]"}`}>
                <Eye className="w-3.5 h-3.5" />{showPreview ? "关闭预览" : "预览"}
              </button>
            </div>

            {/* Editor area */}
            <div className={`flex-1 flex gap-4 min-h-0`}>
              <div className={`${showPreview ? "flex-1" : "w-full"} flex flex-col`}>
                <textarea
                  id="proj-content"
                  value={projContent}
                  onChange={(e) => setProjContent(e.target.value)}
                  placeholder={"## 项目介绍\n\n这里是项目的详细介绍，支持 Markdown 语法..."}
                  className="flex-1 w-full px-4 py-3 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none font-mono text-sm min-h-[500px]"
                />
              </div>
              {showPreview && (
                <div className="flex-1 overflow-auto">
                  <div className="h-full px-4 py-3 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] min-h-[500px] prose-custom" dangerouslySetInnerHTML={renderPreview(projContent)} />
                </div>
              )}
            </div>
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
