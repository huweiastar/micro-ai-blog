/**
 * 统一的字数统计：中文按字、英文按词，先剥离常见 Markdown 标记。
 * 此前 lib/posts、posts API、ArticleEditor 各有一份实现，口径不一。
 * 纯函数、无 Node 依赖，客户端组件可安全引用。
 */
export function countWords(md: string): number {
  const text = md.replace(/[#*`~\-[\]!()>]/g, "").trim();
  const cn = (text.match(/[一-鿿]/g) || []).length;
  const en = (text.replace(/[一-鿿]/g, "").match(/\b\w+\b/g) || []).length;
  return cn + en;
}
