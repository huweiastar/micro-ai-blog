// components/admin/MarkdownEditor/utils.ts

/**
 * Insert/wrap markdown around the textarea's current selection.
 * Returns the new value AND the new selection bounds, so callers can
 * restore focus + selection after a controlled re-render.
 */
export interface InsertResult {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

export function applyMarkdownInsert(
  current: string,
  selectionStart: number,
  selectionEnd: number,
  before: string,
  after: string = "",
  /** If selection is empty, insert this placeholder text between before/after. */
  placeholder: string = "",
): InsertResult {
  const selected = current.slice(selectionStart, selectionEnd);
  const middle = selected || placeholder;
  const inserted = before + middle + after;
  const value = current.slice(0, selectionStart) + inserted + current.slice(selectionEnd);
  // Place caret/selection over the middle (or just after `before` if empty)
  const newStart = selectionStart + before.length;
  const newEnd = newStart + middle.length;
  return { value, selectionStart: newStart, selectionEnd: newEnd };
}
