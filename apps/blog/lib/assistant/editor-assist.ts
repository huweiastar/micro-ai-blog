import { streamLLM } from "./generator";
import { retrieve } from "./retriever";
import type { KnowledgeChunk } from "./types";

/** 编辑器 AI 辅助动作：选区润色/扩写/通俗化 + 全文摘要。 */
export type AssistAction = "polish" | "expand" | "simplify" | "summarize";

const ASSIST_ACTIONS: AssistAction[] = ["polish", "expand", "simplify", "summarize"];

export function isAssistAction(value: unknown): value is AssistAction {
  return typeof value === "string" && (ASSIST_ACTIONS as string[]).includes(value);
}

// 选区类动作输入上限（字符）；摘要要看全文，放宽到 16000。
const SELECTION_INPUT_LIMIT = 6000;
const SUMMARIZE_INPUT_LIMIT = 16000;

export function clampAssistInput(action: AssistAction, text: string): string {
  const limit = action === "summarize" ? SUMMARIZE_INPUT_LIMIT : SELECTION_INPUT_LIMIT;
  return text.length > limit ? text.slice(0, limit) : text;
}

const SHARED_RULES = `通用规则：
- 输出语言与原文一致（中文原文输出中文）。
- 保留原文中的 Markdown 结构（标题层级、列表、代码块、链接）与代码内容，不要破坏语法。
- 直接输出结果，不要任何解释、前言或"好的"之类的客套话。
- 不要用引号或代码块包裹整体输出。`;

const PROMPTS: Record<AssistAction, { system: string; instruction: string }> = {
  polish: {
    system: `你是一位资深技术博客编辑，擅长在不改变原意的前提下让文字更通顺、精炼、专业。\n${SHARED_RULES}`,
    instruction: "请润色以下文字：保持原意和信息量不变，修正语病、冗余和不通顺的表达。",
  },
  expand: {
    system: `你是一位资深技术博客作者，擅长把简略的要点扩写成内容充实的段落。\n${SHARED_RULES}`,
    instruction:
      "请扩写以下文字：补充必要的背景、原理说明或具体示例，使内容更充实（约为原文的 1.5-2 倍），但不要偏离主题或编造事实。",
  },
  simplify: {
    system: `你是一位优秀的技术科普作者，擅长把艰深的技术内容讲得通俗易懂。\n${SHARED_RULES}`,
    instruction:
      "请把以下文字改写得更通俗易懂：面向初学者，避免堆砌术语，必要时用类比或日常例子解释概念，但保持技术上的准确。",
  },
  summarize: {
    system: `你是一位技术博客编辑，擅长为文章提炼简洁有力的摘要。\n${SHARED_RULES}`,
    instruction:
      "请为以下文章生成一段 50-120 字的中文摘要：概括核心内容与读者收获，纯文本、单段落，不要换行、引号或 Markdown 标记。",
  },
};

export function buildAssistMessages(
  action: AssistAction,
  text: string,
  articleTitle?: string
): { system: string; user: string } {
  const { system, instruction } = PROMPTS[action];
  const titleLine = articleTitle ? `文章标题：${articleTitle}\n\n` : "";
  const user = `${titleLine}${instruction}\n\n---\n\n${clampAssistInput(action, text)}`;
  return { system, user };
}

/** 调用 LLM 执行辅助动作，返回文本增量流。未配置 AI key 时抛错。 */
export async function generateAssistStream(
  action: AssistAction,
  text: string,
  articleTitle?: string
): Promise<ReadableStream<string>> {
  const { system, user } = buildAssistMessages(action, text, articleTitle);
  return streamLLM({ system, user, maxTokens: action === "summarize" ? 300 : 2000 });
}

export type LinkSuggestion = {
  slug: string;
  title: string;
  url: string;
};

/** 从检索结果中挑选可用的内链建议：blog 类型、有 url+slug、去重、排除当前文章。 */
export function pickLinkSuggestions(
  chunks: KnowledgeChunk[],
  currentSlug?: string,
  limit = 5
): LinkSuggestion[] {
  const seen = new Set<string>();
  const links: LinkSuggestion[] = [];
  for (const chunk of chunks) {
    if (chunk.sourceType !== "blog") continue;
    if (!chunk.url || !chunk.slug) continue;
    if (currentSlug && chunk.slug === currentSlug) continue;
    if (seen.has(chunk.slug)) continue;
    seen.add(chunk.slug);
    links.push({ slug: chunk.slug, title: chunk.title, url: chunk.url });
    if (links.length >= limit) break;
  }
  return links;
}

/** 基于正文内容检索站内相关文章，生成内链建议。 */
export function suggestRelatedLinks(text: string, currentSlug?: string): LinkSuggestion[] {
  const query = text.slice(0, 300);
  if (!query.trim()) return [];
  const { chunks } = retrieve(query, { mode: "blog", limit: 12 });
  return pickLinkSuggestions(chunks, currentSlug);
}
