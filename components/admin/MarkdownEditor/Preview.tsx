"use client";

import { useMemo } from "react";
import { renderMarkdownPreview as defaultRender } from "../../../lib/markdown/render";

export interface PreviewProps {
  markdown: string;
  /** Optional renderer override; if not provided, uses the built-in. */
  render?: (md: string) => { __html: string };
  className?: string;
}

export function Preview({ markdown, render, className }: PreviewProps) {
  const html = useMemo(() => (render ?? defaultRender)(markdown), [markdown, render]);
  return (
    <div
      className={`prose-custom prose prose-invert max-w-none px-4 py-3 ${className ?? ""}`}
      dangerouslySetInnerHTML={html}
    />
  );
}
