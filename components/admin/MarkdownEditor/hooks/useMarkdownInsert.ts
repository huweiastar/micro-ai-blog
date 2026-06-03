"use client";

import { RefObject, useCallback } from "react";
import { applyMarkdownInsert } from "../utils";

export function useMarkdownInsert(
  textareaRef: RefObject<HTMLTextAreaElement>,
  value: string,
  onChange: (next: string) => void,
) {
  /** Wrap current selection with `before`/`after`. If no selection, insert `placeholder` between them. */
  const wrap = useCallback(
    (before: string, after: string = "", placeholder: string = "") => {
      const ta = textareaRef.current;
      if (!ta) {
        // Fallback: append at end
        onChange(value + before + placeholder + after);
        return;
      }
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const r = applyMarkdownInsert(value, start, end, before, after, placeholder);
      onChange(r.value);
      // Wait one frame so React commits the new value, then restore selection
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(r.selectionStart, r.selectionEnd);
      });
    },
    [textareaRef, value, onChange],
  );

  /** Insert raw text at the cursor (no wrapping). */
  const insert = useCallback(
    (text: string) => wrap(text, "", ""),
    [wrap],
  );

  /** Insert a markdown table with N rows × M cols. */
  const insertTable = useCallback(
    (rows: number, cols: number) => {
      const safeRows = Math.max(2, rows);
      const safeCols = Math.max(2, cols);
      const headerRow = `| ${Array.from({ length: safeCols }, () => "列名").join(" | ")} |`;
      const sepRow = `| ${Array.from({ length: safeCols }, () => "---").join(" | ")} |`;
      const bodyRows = Array.from(
        { length: safeRows - 1 },
        () => `| ${Array.from({ length: safeCols }, () => "内容").join(" | ")} |`,
      ).join("\n");
      insert(`\n${headerRow}\n${sepRow}\n${bodyRows}\n`);
    },
    [insert],
  );

  /** Insert a fenced code block of the given language. */
  const insertCodeBlock = useCallback(
    (lang: string) => {
      insert("\n```" + lang + "\n\n```\n");
    },
    [insert],
  );

  /** Insert a heading prefix on the current line (e.g. "## "). */
  const insertHeading = useCallback(
    (level: 1 | 2 | 3 | 4 | 5 | 6) => {
      wrap("#".repeat(level) + " ", "", "标题");
    },
    [wrap],
  );

  return { wrap, insert, insertTable, insertCodeBlock, insertHeading };
}
