"use client";

import { useRef, useState } from "react";
import { Toolbar } from "./Toolbar";
import { useMarkdownInsert } from "./hooks/useMarkdownInsert";
import { useFullscreen } from "./hooks/useFullscreen";
import { useImageUpload } from "./hooks/useImageUpload";
import { useDraftAutosave } from "./hooks/useDraftAutosave";
import { usePreviewRender } from "./hooks/usePreviewRender";
import { ImageDialog } from "./dialogs/ImageDialog";
import type { ViewMode } from "../hooks/useEditorLayout";

export interface MarkdownEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  toolbar?: {
    text?: boolean;
    block?: boolean;
    media?: boolean;
    typography?: boolean;
  };
  fullscreen?: boolean;
  /** 受控视图模式；不传则内部自管，默认 edit。 */
  viewMode?: ViewMode;
  onViewModeChange?: (m: ViewMode) => void;
  className?: string;
  uploadEndpoint?: string;
  uploadMeta?: { type?: string; category?: string; articleTitle?: string };
  draftKey?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "在此输入 Markdown 内容...",
  toolbar,
  fullscreen = true,
  viewMode,
  onViewModeChange,
  className,
  uploadEndpoint,
  uploadMeta,
  draftKey,
}: MarkdownEditorProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [innerMode, setInnerMode] = useState<ViewMode>("edit");
  const mode = viewMode ?? innerMode;
  const setMode = onViewModeChange ?? setInnerMode;
  const previewOn = mode === "split" || mode === "preview";

  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);

  const { wrap, insert, insertTable, insertCodeBlock, insertHeading } =
    useMarkdownInsert(textareaRef, value, onChange);
  const { isFullscreen, toggle } = useFullscreen(wrapRef);
  const { upload } = useImageUpload(uploadEndpoint);
  const { detectedDraft, restore, discard } = useDraftAutosave(draftKey, value);
  const { html: previewHtml } = usePreviewRender(value, previewOn);

  const handleRestore = () => {
    const v = restore();
    if (v !== null) onChange(v);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const result = await upload(file, uploadMeta);
    if (result?.url) setPendingImageUrl(result.url);
  };

  // 分屏下源码滚动按比例联动预览。
  const syncScroll = () => {
    const ta = textareaRef.current;
    const pv = previewRef.current;
    if (!ta || !pv) return;
    const denom = ta.scrollHeight - ta.clientHeight || 1;
    const ratio = ta.scrollTop / denom;
    pv.scrollTop = ratio * (pv.scrollHeight - pv.clientHeight);
  };

  return (
    <div
      ref={wrapRef}
      className={`flex flex-col gap-2 ${isFullscreen ? "h-screen bg-[var(--background)] p-4" : ""} ${className ?? ""}`}
    >
      {detectedDraft && (
        <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-amber-500/30 bg-amber-500/5 text-sm text-amber-300">
          <span>检测到未保存的草稿（{Math.max(1, Math.round((Date.now() - detectedDraft.updatedAt) / 60000))} 分钟前）</span>
          <div className="flex items-center gap-2">
            <button onClick={handleRestore} className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30">恢复</button>
            <button onClick={discard} className="px-2 py-0.5 rounded text-amber-300/70 hover:text-amber-200">丢弃</button>
          </div>
        </div>
      )}
      <Toolbar
        wrap={wrap}
        insert={insert}
        insertTable={insertTable}
        insertCodeBlock={insertCodeBlock}
        insertHeading={insertHeading}
        onPickImage={() => fileRef.current?.click()}
        isFullscreen={isFullscreen}
        onToggleFullscreen={fullscreen ? toggle : () => {}}
        viewMode={mode}
        onViewMode={setMode}
        toolbar={toolbar}
      />

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      <div className={`flex gap-3 ${isFullscreen ? "flex-1 min-h-0" : ""}`}>
        {mode !== "preview" && (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onScroll={mode === "split" ? syncScroll : undefined}
            placeholder={placeholder}
            className={`px-4 py-3 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none text-sm leading-relaxed font-mono ${isFullscreen ? "flex-1 min-h-0" : "min-h-[400px]"} ${mode === "split" ? "w-1/2" : "w-full"}`}
          />
        )}
        {previewOn && (
          <div
            ref={previewRef}
            className={`prose-custom overflow-auto rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 ${isFullscreen ? "flex-1 min-h-0" : "min-h-[400px]"} ${mode === "split" ? "w-1/2" : "w-full"}`}
            dangerouslySetInnerHTML={{
              __html: previewHtml || '<span class="text-[var(--muted)] text-sm">开始输入以预览…</span>',
            }}
          />
        )}
      </div>

      {pendingImageUrl !== null && (
        <ImageDialog
          open={true}
          primaryUrl={pendingImageUrl}
          onClose={() => setPendingImageUrl(null)}
          onConfirm={(md) => insert(md)}
        />
      )}
    </div>
  );
}
