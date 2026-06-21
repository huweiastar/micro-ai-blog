const DEFAULT_NOTE_TITLE = "随手记";

/** 剥离行内 Markdown 标记，得到适合做标题的纯文本。 */
function stripMarkdownInline(line: string): string {
  return line
    .replace(/^#{1,6}\s+/, "")
    .replace(/^[-*+]\s+/, "")
    .replace(/^>\s+/, "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/~~(.*?)~~/g, "$1")
    .trim();
}

/**
 * 从随手记正文派生标题：取第一个非空行，剥离 Markdown 标记，
 * 超过 maxLength 时截断并以省略号结尾；空内容回退默认标题。
 */
export function deriveNoteTitle(content: string, maxLength = 40): string {
  const firstLine = content
    .split("\n")
    .map((line) => stripMarkdownInline(line))
    .find((line) => line.length > 0);

  if (!firstLine) return DEFAULT_NOTE_TITLE;
  if (firstLine.length <= maxLength) return firstLine;
  return `${firstLine.slice(0, maxLength - 1)}…`;
}

/**
 * 随手记 slug：note-<36进制时间戳>。
 * 中文标题无法派生英文 slug，必须显式提供，且需匹配
 * posts API 的 CUSTOM_SLUG_PATTERN（小写字母数字 + 连字符）。
 */
export function deriveNoteSlug(now: number = Date.now()): string {
  return `note-${now.toString(36)}`;
}
