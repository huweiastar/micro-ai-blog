"use client";

import { useState } from "react";
import {
  Bold, Italic, Underline, Strikethrough, Superscript, Subscript, Highlighter, Code,
  Heading, List, ListOrdered, Quote, Minus, Table2,
  Link2, Image as ImageIcon, Code2,
  Type, TextCursorInput, Palette, AlignVerticalJustifyCenter, Columns2,
  Maximize2, Minimize2,
} from "lucide-react";

import { HeadingDialog } from "./dialogs/HeadingDialog";
import { TableDialog } from "./dialogs/TableDialog";
import { CodeBlockDialog } from "./dialogs/CodeBlockDialog";
import { LinkDialog } from "./dialogs/LinkDialog";
import { FontDialog } from "./dialogs/FontDialog";
import type { ViewMode } from "../hooks/useEditorLayout";

type DialogKind = null | "heading" | "table" | "code" | "link" | "font-family" | "font-size" | "font-color" | "line-height" | "spacing";

const ICON_CLS = "w-3.5 h-3.5";

function Btn({
  onClick,
  title,
  children,
  ariaPressed,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  ariaPressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={ariaPressed}
      className="p-1.5 rounded text-[var(--muted)] hover:bg-[var(--primary)]/10 hover:text-[var(--primary)] transition-colors"
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="w-px h-5 bg-[var(--card-border)] mx-1" />;
}

export interface ToolbarProps {
  /** Wrap selection in (before, after) with optional placeholder when empty. */
  wrap: (before: string, after: string, placeholder?: string) => void;
  /** Insert a literal string at the cursor. */
  insert: (text: string) => void;
  /** Insert markdown table. */
  insertTable: (rows: number, cols: number) => void;
  /** Insert fenced code block. */
  insertCodeBlock: (lang: string) => void;
  /** Insert heading prefix on the current line. */
  insertHeading: (level: 1 | 2 | 3 | 4 | 5 | 6) => void;
  /** Trigger the file input for image upload. The Image dialog opens AFTER upload completes. */
  onPickImage: () => void;
  /** 视图模式段控（编辑/分屏/预览）。 */
  viewMode?: ViewMode;
  onViewMode?: (m: ViewMode) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  toolbar?: {
    text?: boolean;
    block?: boolean;
    media?: boolean;
    typography?: boolean;
  };
  /** 在全屏按钮与视图模式段控之间插入额外内容（如 blog 端的 AI 菜单）。 */
  addon?: React.ReactNode;
}

export function Toolbar(props: ToolbarProps) {
  const t = {
    text: props.toolbar?.text ?? true,
    block: props.toolbar?.block ?? true,
    media: props.toolbar?.media ?? true,
    typography: props.toolbar?.typography ?? true,
  };
  const [dialog, setDialog] = useState<DialogKind>(null);
  const toggle = (k: Exclude<DialogKind, null>) =>
    setDialog((d) => (d === k ? null : k));
  const fontMode = dialog === "font-family" ? "family"
    : dialog === "font-size" ? "size"
    : dialog === "font-color" ? "color"
    : dialog === "line-height" ? "lineHeight"
    : dialog === "spacing" ? "spacing"
    : null;

  return (
    <div className="relative">
      <div role="toolbar" aria-label="编辑器工具栏" className="flex items-center gap-0.5 flex-wrap p-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)]/80 backdrop-blur sticky top-0 z-10">
        {t.text && (<>
          <Btn onClick={() => props.wrap("**", "**", "粗体文字")} title="加粗"><Bold className="w-3.5 h-3.5" /></Btn>
          <Btn onClick={() => props.wrap("*", "*", "斜体文字")} title="斜体"><Italic className="w-3.5 h-3.5" /></Btn>
          <Btn onClick={() => props.wrap("<u>", "</u>", "下划线")} title="下划线"><Underline className="w-3.5 h-3.5" /></Btn>
          <Btn onClick={() => props.wrap("~~", "~~", "删除文字")} title="删除线"><Strikethrough className="w-3.5 h-3.5" /></Btn>
          <Btn onClick={() => props.wrap("<sup>", "</sup>", "上标")} title="上标"><Superscript className="w-3.5 h-3.5" /></Btn>
          <Btn onClick={() => props.wrap("<sub>", "</sub>", "下标")} title="下标"><Subscript className="w-3.5 h-3.5" /></Btn>
          <Btn onClick={() => props.wrap("==", "==", "高亮")} title="高亮"><Highlighter className="w-3.5 h-3.5" /></Btn>
          <Btn onClick={() => props.wrap("`", "`", "代码")} title="行内代码"><Code className="w-3.5 h-3.5" /></Btn>
          <Sep />
        </>)}

        {t.block && (<>
          <Btn onClick={() => toggle("heading")} title="标题"><Heading className="w-3.5 h-3.5" /></Btn>
          <Btn onClick={() => props.insert("\n- ")} title="无序列表"><List className="w-3.5 h-3.5" /></Btn>
          <Btn onClick={() => props.insert("\n1. ")} title="有序列表"><ListOrdered className="w-3.5 h-3.5" /></Btn>
          <Btn onClick={() => props.insert("\n> ")} title="引用"><Quote className="w-3.5 h-3.5" /></Btn>
          <Btn onClick={() => props.insert("\n---\n")} title="分隔线"><Minus className="w-3.5 h-3.5" /></Btn>
          <Btn onClick={() => toggle("table")} title="表格"><Table2 className="w-3.5 h-3.5" /></Btn>
          <Sep />
        </>)}

        {t.media && (<>
          <Btn onClick={() => toggle("link")} title="链接"><Link2 className="w-3.5 h-3.5" /></Btn>
          <Btn onClick={props.onPickImage} title="图片"><ImageIcon className="w-3.5 h-3.5" /></Btn>
          <Btn onClick={() => toggle("code")} title="代码块"><Code2 className="w-3.5 h-3.5" /></Btn>
          <Sep />
        </>)}

        {t.typography && (<>
          <Btn onClick={() => toggle("font-family")} title="字体"><Type className="w-3.5 h-3.5" /></Btn>
          <Btn onClick={() => toggle("font-size")} title="字号"><TextCursorInput className="w-3.5 h-3.5" /></Btn>
          <Btn onClick={() => toggle("font-color")} title="字色"><Palette className="w-3.5 h-3.5" /></Btn>
          <Btn onClick={() => toggle("line-height")} title="行高"><AlignVerticalJustifyCenter className="w-3.5 h-3.5" /></Btn>
          <Btn onClick={() => toggle("spacing")} title="段距"><Columns2 className="w-3.5 h-3.5" /></Btn>
          <Sep />
        </>)}

        <Btn onClick={props.onToggleFullscreen} title={props.isFullscreen ? "退出全屏" : "全屏"} ariaPressed={props.isFullscreen}>
          {props.isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </Btn>

        {props.addon}

        {props.onViewMode && (
          <div className="ml-auto flex items-center gap-0.5 rounded-lg border border-[var(--card-border)] p-0.5">
            {(["edit", "split", "preview"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => props.onViewMode!(m)}
                aria-pressed={props.viewMode === m}
                className={`px-2 py-0.5 text-xs rounded transition-colors ${
                  props.viewMode === m
                    ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                    : "text-[var(--muted)] hover:text-[var(--primary)]"
                }`}
              >
                {m === "edit" ? "编辑" : m === "split" ? "分屏" : "预览"}
              </button>
            ))}
          </div>
        )}
      </div>

      <HeadingDialog
        open={dialog === "heading"}
        onClose={() => setDialog(null)}
        onConfirm={(level) => props.insertHeading(level)}
      />
      <TableDialog
        open={dialog === "table"}
        onClose={() => setDialog(null)}
        onConfirm={(rows, cols) => props.insertTable(rows, cols)}
      />
      <CodeBlockDialog
        open={dialog === "code"}
        onClose={() => setDialog(null)}
        onConfirm={(lang) => props.insertCodeBlock(lang)}
      />
      <LinkDialog
        open={dialog === "link"}
        onClose={() => setDialog(null)}
        onConfirm={(text, url) => props.insert(`[${text}](${url})`)}
      />
      <FontDialog
        mode={fontMode}
        onClose={() => setDialog(null)}
        onConfirm={(open, close) => props.wrap(open, close, "文字")}
      />
    </div>
  );
}
