// components/admin/MarkdownEditor/utils.ts

/**
 * Insert/wrap markdown around the textarea's current selection.
 * Returns the new value AND the new selection bounds, so callers can
 * restore focus + selection after a controlled re-render.
 *
 * Toggle 语义：若选区（或选区紧邻的外侧）已经带有同样的 before/after
 * 标记，则本次点击为「取消」——移除标记而不是再套一层。
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

  // 取消（外侧）：选区紧邻的左右文本恰好是 before/after，去掉这对标记。
  // 覆盖「点按钮包裹后选区仍是内文」与「光标停在标记之间」两种状态。
  if (
    before.length > 0 &&
    selectionStart >= before.length &&
    current.slice(selectionStart - before.length, selectionStart) === before &&
    current.slice(selectionEnd, selectionEnd + after.length) === after
  ) {
    const value =
      current.slice(0, selectionStart - before.length) +
      selected +
      current.slice(selectionEnd + after.length);
    const newStart = selectionStart - before.length;
    return { value, selectionStart: newStart, selectionEnd: newStart + selected.length };
  }

  // 取消（内侧）：用户连同标记一起选中（如选中 "**加粗**"），剥掉标记。
  if (
    before.length > 0 &&
    selected.length >= before.length + after.length &&
    selected.startsWith(before) &&
    selected.endsWith(after) &&
    // after 为空时 endsWith("") 恒真，需保证真的有内容可剥
    (after.length > 0 || selected.length > before.length)
  ) {
    const inner = selected.slice(before.length, selected.length - after.length);
    const value = current.slice(0, selectionStart) + inner + current.slice(selectionEnd);
    return { value, selectionStart, selectionEnd: selectionStart + inner.length };
  }

  // 默认：包裹/插入
  const middle = selected || placeholder;
  const inserted = before + middle + after;
  const value = current.slice(0, selectionStart) + inserted + current.slice(selectionEnd);
  // Place caret/selection over the middle (or just after `before` if empty)
  const newStart = selectionStart + before.length;
  const newEnd = newStart + middle.length;
  return { value, selectionStart: newStart, selectionEnd: newEnd };
}
