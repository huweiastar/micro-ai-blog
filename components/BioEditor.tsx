"use client";

import { useState, useRef } from "react";
import {
  Bold, Italic, Link2, Code, Heading, List, ListOrdered, Quote, Eye,
  Strikethrough, Table2, Minus, Code2, TextCursorInput,
  Highlighter, Underline, Palette, Type, AlignVerticalJustifyCenter,
} from "lucide-react";

interface BioEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function BioEditor({ label, value, onChange }: BioEditorProps) {
  const [showPreview, setShowPreview] = useState(true);
  const [showCodeBlockLang, setShowCodeBlockLang] = useState(false);
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [showHeadingDialog, setShowHeadingDialog] = useState(false);
  const [showFontColorDialog, setShowFontColorDialog] = useState(false);
  const [showFontSizeDialog, setShowFontSizeDialog] = useState(false);
  const [selectedFontColor, setSelectedFontColor] = useState("#6366f1");
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);

    const textBefore = value.substring(Math.max(0, start - before.length), start);
    const textAfter = value.substring(end, Math.min(value.length, end + after.length));
    if (textBefore === before && textAfter === after) {
      const newText = value.substring(0, start - before.length) + selected + value.substring(end + after.length);
      onChange(newText);
      setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start - before.length, start - before.length + selected.length); }, 0);
      return;
    }

    const newText = value.substring(0, start) + before + selected + after + value.substring(end);
    onChange(newText);
    setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + before.length, start + before.length + selected.length); }, 0);
  };

  const insertList = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const contentStart = value.lastIndexOf("\n", start - 1) + 1;
    const contentEndRaw = value.indexOf("\n", end);
    const contentEnd = contentEndRaw === -1 ? value.length : contentEndRaw;
    const linesText = value.substring(contentStart, contentEnd);
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
      const newText = value.substring(0, contentStart) + processed + value.substring(contentEnd);
      onChange(newText);
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
      const newText = value.substring(0, contentStart) + processed + value.substring(contentEnd);
      onChange(newText);
      setTimeout(() => { textarea.focus(); textarea.setSelectionRange(contentStart, contentStart + processed.length); }, 0);
    }
  };

  const insertQuote = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const contentStart = value.lastIndexOf("\n", start - 1) + 1;
    const contentEndRaw = value.indexOf("\n", end);
    const contentEnd = contentEndRaw === -1 ? value.length : contentEndRaw;
    const linesText = value.substring(contentStart, contentEnd);
    const lines = linesText.split("\n");

    const allQuoted = lines.every((line) => !line.trim() || line.startsWith("> "));
    if (allQuoted) {
      const processed = lines.map((line) => !line.trim() ? line : line.startsWith("> ") ? line.slice(2) : line).join("\n");
      const newText = value.substring(0, contentStart) + processed + value.substring(contentEnd);
      onChange(newText);
      setTimeout(() => { textarea.focus(); textarea.setSelectionRange(contentStart, contentStart + processed.length); }, 0);
    } else {
      const processed = lines.map((line) => !line.trim() ? line : `> ${line}`).join("\n");
      const newText = value.substring(0, contentStart) + processed + value.substring(contentEnd);
      onChange(newText);
      setTimeout(() => { textarea.focus(); textarea.setSelectionRange(contentStart, contentStart + processed.length); }, 0);
    }
  };

  const insertCodeBlock = (lang: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const selected = value.substring(start, textarea.selectionEnd);
    const newText = value.substring(0, start) + "```" + lang + "\n" + (selected || "// code") + "\n```" + value.substring(textarea.selectionEnd);
    onChange(newText);
    setShowCodeBlockLang(false);
    setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + lang.length + 4, start + lang.length + 4 + (selected || "// code").length); }, 0);
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

  const insertFontStyle = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);
    if (!selected.trim()) return;
    const newText = value.substring(0, start) + tag + selected + "</span>" + value.substring(end);
    onChange(newText);
    setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start, start + tag.length + selected.length); }, 0);
  };

  const setFontColor = (color: string) => {
    insertFontStyle(`<span style="color: ${color}">`);
    setSelectedFontColor(color);
    setShowFontColorDialog(false);
  };

  const setFontSize = (size: number) => {
    insertFontStyle(`<span style="font-size: ${size}px">`);
    setShowFontSizeDialog(false);
  };

  const mdToolbar = [
    { icon: Bold, action: () => insertMarkdown("**", "**"), title: "加粗" },
    { icon: Italic, action: () => insertMarkdown("*", "*"), title: "斜体" },
    { icon: Underline, action: () => insertMarkdown("<u>", "</u>"), title: "下划线" },
    { icon: Strikethrough, action: () => insertMarkdown("~~", "~~"), title: "删除线" },
    { icon: Highlighter, action: () => insertMarkdown("==", "=="), title: "高亮" },
    { icon: Code2, action: () => insertMarkdown("`", "`"), title: "行内代码" },
    { icon: Heading, action: () => setShowHeadingDialog(!showHeadingDialog), title: "标题" },
    { icon: TextCursorInput, action: () => insertMarkdown("<font>", "</font>"), title: "字体" },
    { icon: Palette, action: () => setShowFontColorDialog(!showFontColorDialog), title: "字体颜色" },
    { icon: Type, action: () => setShowFontSizeDialog(!showFontSizeDialog), title: "字体大小" },
    { icon: AlignVerticalJustifyCenter, action: () => insertMarkdown("<line-height>", "</line-height>"), title: "行间距" },
    { icon: Link2, action: () => insertMarkdown("[", "](url)"), title: "链接" },
    { icon: Code, action: () => setShowCodeBlockLang(true), title: "代码块" },
    { icon: Table2, action: () => setShowTableDialog(true), title: "插入表格" },
    { icon: Quote, action: () => insertQuote(), title: "引用" },
    { icon: List, action: () => insertList("- "), title: "无序列表" },
    { icon: ListOrdered, action: () => insertList("1. "), title: "有序列表" },
    { icon: Minus, action: () => insertMarkdown("\n---\n"), title: "分隔线" },
  ];

  const renderPreview = (md: string) => {
    if (!md.trim()) return { __html: '<span class="text-[var(--muted)] text-sm">暂无内容</span>' };

    let processedMd = md.replace(/\|(.+)\|\n\|[-\s|:]+\|\n((?:\|.+\|\n?)*)/g, (match, headerRow, bodyRows) => {
      const headers = headerRow.split("|").filter((c: string) => c.trim()).map((c: string) => `<th class="px-4 py-2 text-left font-semibold bg-[var(--card)] border-b border-[var(--card-border)]">${c.trim()}</th>`).join("");
      const rows = bodyRows.trim().split("\n").map((row: string) => {
        const cells = row.split("|").filter((c: string) => c.trim()).map((c: string) => `<td class="px-4 py-2 border-b border-[var(--card-border)]">${c.trim()}</td>`).join("");
        return `<tr>${cells}</tr>`;
      }).join("");
      return `<table class="w-full border-collapse my-3 rounded-lg overflow-hidden border border-[var(--card-border)]"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
    });

    let html = processedMd
      .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
        `<pre class="bg-[var(--code-bg)] text-[var(--code-text)] rounded-lg p-3 my-3 overflow-x-auto text-xs font-mono"><code class="language-${lang}">${code.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`)
      .replace(/^###### (.+)$/gm, "<h6 class='text-xs font-semibold mt-3 mb-1'>$1</h6>")
      .replace(/^##### (.+)$/gm, "<h5 class='text-sm font-semibold mt-4 mb-1'>$1</h5>")
      .replace(/^#### (.+)$/gm, "<h4 class='text-base font-semibold mt-4 mb-2'>$1</h4>")
      .replace(/^### (.+)$/gm, "<h3 class='text-base font-semibold mt-4 mb-2'>$1</h3>")
      .replace(/^## (.+)$/gm, "<h2 class='text-lg font-bold mt-6 mb-2'>$1</h2>")
      .replace(/^# (.+)$/gm, "<h1 class='text-xl font-bold mt-6 mb-3'>$1</h1>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/~~(.+?)~~/g, "<del>$1</del>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/==(.+?)==/g, "<mark class='bg-yellow-200 dark:bg-yellow-800 px-1 rounded'>$1</mark>")
      .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-lg my-3"/>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-[var(--link)] hover:text-[var(--link-hover)] underline underline-offset-2">$1</a>')
      .replace(/`([^`]+?)`/g, '<code class="px-2 py-0.5 rounded bg-[var(--card)] text-[var(--primary)] text-xs font-mono">$1</code>')
      .replace(/^- (.+)$/gm, "<li class='ml-4 list-disc my-0.5'>$1</li>")
      .replace(/^\d+\. (.+)$/gm, "<li class='ml-4 list-decimal my-0.5'>$1</li>")
      .replace(/^> (.+)$/gm, "<blockquote class='border-l-4 border-[var(--primary)] pl-4 my-3 text-[var(--muted)] italic bg-[var(--card)]/50 py-2 pr-4 rounded-r-lg'>$1</blockquote>")
      .replace(/^---$/gm, '<hr class="border-[var(--card-border)] my-4"/>');

    html = html.replace(/\n\n/g, "<br/><br/>");
    return { __html: html };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm text-[var(--muted)]">{label}</label>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors ${showPreview ? "bg-[var(--primary)]/10 text-[var(--primary)]" : "text-[var(--muted)] hover:text-[var(--primary)] border border-[var(--card-border)]"}`}
        >
          <Eye className="w-3.5 h-3.5" />{showPreview ? "关闭预览" : "预览"}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative flex-1">
          <div className="flex flex-wrap items-center gap-0.5 p-1 rounded-lg border border-[var(--card-border)] bg-[var(--card)]">
            {mdToolbar.map((tool, i) => (
              <div key={i} className="relative group">
                <button onClick={tool.action} className="p-1.5 rounded hover:text-[var(--primary)] text-[var(--muted)] hover:bg-[var(--primary)]/10 transition-colors">
                  <tool.icon className="w-3.5 h-3.5" />
                </button>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 rounded bg-[var(--foreground)] text-[var(--card)] text-[10px] whitespace-nowrap pointer-events-none opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                  {tool.title}
                </div>
              </div>
            ))}
          </div>

          {/* Code Block Language Dropdown */}
          {showCodeBlockLang && (
            <div
              className="absolute z-40 top-full left-0 mt-1 p-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl grid grid-cols-4 gap-1 w-72"
              onMouseLeave={() => setShowCodeBlockLang(false)}
            >
              {["javascript", "typescript", "python", "java", "sql", "shell", "bash", "yaml", "markdown", "css", "html", "go", "rust", "swift", "json", "dockerfile"].map((lang) => (
                <button key={lang} onClick={() => insertCodeBlock(lang)} className="text-xs px-2 py-1.5 rounded text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors text-left">
                  {lang}
                </button>
              ))}
            </div>
          )}

          {/* Heading Dialog */}
          {showHeadingDialog && (
            <div
              className="absolute z-40 top-full left-0 mt-1 p-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl w-48"
              onMouseLeave={() => setShowHeadingDialog(false)}
            >
              <p className="text-xs text-[var(--muted)] mb-2 px-2">选择标题级别</p>
              <div className="space-y-1">
                {[
                  { level: 1, label: "一级标题", prefix: "# " },
                  { level: 2, label: "二级标题", prefix: "## " },
                  { level: 3, label: "三级标题", prefix: "### " },
                  { level: 4, label: "四级标题", prefix: "#### " },
                  { level: 5, label: "五级标题", prefix: "##### " },
                  { level: 6, label: "六级标题", prefix: "###### " },
                ].map((heading) => (
                  <button
                    key={heading.level}
                    onClick={() => { insertMarkdown(heading.prefix); setShowHeadingDialog(false); }}
                    className="w-full text-left text-xs px-3 py-2 rounded text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors flex items-center justify-between"
                  >
                    <span>{heading.label}</span>
                    <span className="text-[10px] font-mono opacity-50">{heading.prefix}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Table Dialog */}
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

          {/* Font Color Dialog */}
          {showFontColorDialog && (
            <div className="absolute z-40 top-full left-0 mt-1 p-3 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl w-72"
              onMouseLeave={() => setShowFontColorDialog(false)}>
              <p className="text-xs text-[var(--muted)] mb-2 px-1">选择颜色</p>
              <div className="grid grid-cols-6 gap-1.5 mb-2">
                {["#1e293b", "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#6b7280", "#94a3b8", "#000000"].map((color) => (
                  <button key={color} onClick={() => setFontColor(color)}
                    className="w-8 h-8 rounded-md border border-[var(--card-border)] hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }} title={color} />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input type="color" value={selectedFontColor} onChange={(e) => setSelectedFontColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-0" />
                <span className="text-xs text-[var(--muted)] font-mono">{selectedFontColor}</span>
                <button onClick={() => setFontColor(selectedFontColor)} className="text-xs px-2 py-1 rounded bg-[var(--primary)] text-white ml-auto">应用</button>
              </div>
            </div>
          )}

          {/* Font Size Dialog */}
          {showFontSizeDialog && (
            <div className="absolute z-40 top-full left-0 mt-1 p-3 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl w-48"
              onMouseLeave={() => setShowFontSizeDialog(false)}>
              <p className="text-xs text-[var(--muted)] mb-2 px-1">字体大小 (px)</p>
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                {[12, 14, 16, 18, 20, 24].map((size) => (
                  <button key={size} onClick={() => setFontSize(size)}
                    className="text-xs px-2 py-1.5 rounded text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors text-center">
                    {size}px
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={`flex gap-3 ${showPreview ? "" : "hidden"}`}>
          <div className="flex-1 flex flex-col">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              rows={10}
              placeholder="支持 Markdown 语法..."
              className="flex-1 w-full px-3 py-2.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none text-sm min-h-[200px]"
            />
          </div>
          <div className="flex-1 overflow-auto">
            <div
              className="h-full px-3 py-2.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] min-h-[200px]"
              dangerouslySetInnerHTML={renderPreview(value)}
            />
          </div>
        </div>

        {!showPreview && (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={10}
            placeholder="支持 Markdown 语法..."
            className="w-full px-3 py-2.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none text-sm min-h-[200px]"
          />
        )}
      </div>
    </div>
  );
}
