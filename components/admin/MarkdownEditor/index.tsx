"use client";

import { useRef, useState } from "react";
import { Toolbar } from "./Toolbar";
import { Preview } from "./Preview";
import { useMarkdownInsert } from "./hooks/useMarkdownInsert";
import { useFullscreen } from "./hooks/useFullscreen";
import { useImageUpload } from "./hooks/useImageUpload";
import { useDraftAutosave } from "./hooks/useDraftAutosave";
import { ImageDialog } from "./dialogs/ImageDialog";

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
  preview?: boolean;
  renderPreview?: (md: string) => { __html: string };
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
  preview = true,
  renderPreview,
  className,
  uploadEndpoint,
  uploadMeta,
  draftKey,
}: MarkdownEditorProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [showPreview, setShowPreview] = useState(false);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);

  const { wrap, insert, insertTable, insertCodeBlock, insertHeading } =
    useMarkdownInsert(textareaRef, value, onChange);
  const { isFullscreen, toggle } = useFullscreen(wrapRef);
  const { upload } = useImageUpload(uploadEndpoint);
  const { detectedDraft, restore, discard } = useDraftAutosave(draftKey, value);

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

  return (
    <div ref={wrapRef} className={`flex flex-col gap-2 ${isFullscreen ? "h-screen bg-[var(--background)] p-4" : ""} ${className ?? ""}`}>
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
        onTogglePreview={preview ? () => setShowPreview((v) => !v) : undefined}
        previewActive={showPreview}
        toolbar={toolbar}
      />

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      {showPreview && (
        <Preview
          markdown={value}
          render={renderPreview}
          className={`flex-1 min-h-[400px] border border-[var(--card-border)] rounded-lg ${isFullscreen ? "overflow-auto" : ""}`}
        />
      )}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none text-sm leading-relaxed font-mono ${isFullscreen ? "flex-1 min-h-0" : "min-h-[400px]"} ${showPreview ? "hidden" : ""}`}
      />

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
