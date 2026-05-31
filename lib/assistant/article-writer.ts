import { retrieve } from "./retriever";
import { resolveAIConfig } from "./generator";
import type { KnowledgeChunk } from "./types";

const ARTICLE_SYSTEM_PROMPT = `你是一位专业的技术博客作者，擅长撰写高质量的技术文章。请根据用户提供的主题，撰写一篇结构清晰、内容充实的技术博客。

输出格式要求：使用以下分隔符标记各个字段，不要输出任何额外说明。

---TITLE---
文章标题（简洁、有吸引力，不含特殊符号）
---SUMMARY---
一句话摘要（50字以内）
---TAGS---
逗号分隔的标签（3-5个，用中文或英文均可）
---CATEGORY---
最匹配的分类名称（如：大数据开发、大模型数据工程、大模型基础架构、大模型应用工程、AI工程实践等）
---CONTENT---
完整的 Markdown 正文...

正文要求：
- 使用 ## 作为一级小节标题，### 作为二级小节
- 包含具体的代码示例、实操步骤或案例分析
- 代码块必须标注语言（如 \`\`\`python）
- 语言风格专业但不枯燥，面向有一定技术基础的读者
- 文章长度适中（800-2000字），结构清晰
- 不要包含 YAML frontmatter，只输出 Markdown 正文
- 如果检索到了参考资料，请合理引用其中的观点和数据，但不要直接复制`;

export interface ArticleWriteRequest {
  topic: string;
  style?: string;
  tags?: string;
}

export interface ParsedArticle {
  title: string;
  summary: string;
  tags: string;
  category: string;
  content: string;
}

const STYLE_GUIDES: Record<string, string> = {
  technical: "以技术深度为主，包含原理分析和代码实现",
  tutorial: "以教程形式为主，包含详细的步骤说明",
  opinion: "以观点评论为主，包含论证和案例分析",
};

/**
 * Build the user prompt for article generation.
 * Includes the topic, optional style guide, and retrieved knowledge context.
 */
export function buildArticlePrompt(
  request: ArticleWriteRequest,
  contextChunks: KnowledgeChunk[]
): string {
  let contextSection = "";

  if (contextChunks.length > 0) {
    const formatted = contextChunks
      .map((chunk, i) => {
        const source =
          chunk.sourceType === "blog"
            ? `[文章] ${chunk.title}${chunk.url ? ` (${chunk.url})` : ""}`
            : chunk.sourceType === "project"
            ? `[项目] ${chunk.title}`
            : `[代码] ${chunk.title}${chunk.filePath ? ` (${chunk.filePath})` : ""}`;

        return `【参考资料 ${i + 1}】${source}\n${chunk.content.slice(0, 800)}`;
      })
      .join("\n\n---\n\n");

    contextSection = `\n## 参考资料\n\n以下是博客中已有的相关内容，请合理引用，保持一致性：\n\n${formatted}`;
  }

  const styleGuide = request.style && STYLE_GUIDES[request.style]
    ? `\n写作风格：${STYLE_GUIDES[request.style]}`
    : "";

  const tagsHint = request.tags
    ? `\n建议标签：${request.tags}`
    : "";

  return `# 指令

${ARTICLE_SYSTEM_PROMPT}

## 用户主题

${request.topic}${styleGuide}${tagsHint}

${contextSection}

请根据上述主题撰写一篇技术博客文章。`;
}

/**
 * Parse the AI's raw output into structured article fields.
 * Uses delimiter-based extraction with fallback defaults.
 */
export function parseArticleOutput(raw: string): ParsedArticle {
  const extract = (startMarker: string, endMarker: string): string => {
    const startIdx = raw.indexOf(startMarker);
    if (startIdx === -1) return "";
    const contentStart = startIdx + startMarker.length;
    const endIdx = endMarker ? raw.indexOf(endMarker, contentStart) : -1;
    return raw
      .substring(contentStart, endIdx === -1 ? undefined : endIdx)
      .trim();
  };

  const title = extract("---TITLE---", "---SUMMARY---") || "";
  const summary = extract("---SUMMARY---", "---TAGS---") || "";
  const tags = extract("---TAGS---", "---CATEGORY---") || "";
  const category = extract("---CATEGORY---", "---CONTENT---") || "";
  const content = extract("---CONTENT---", "") || "";

  return { title, summary, tags, category, content };
}

/**
 * Stream AI article generation via SSE.
 * Returns the text stream — the client is responsible for parsing via parseArticleOutput().
 */
export async function generateArticleStream(
  request: ArticleWriteRequest
): Promise<{ stream: ReadableStream<string>; contextChunks: KnowledgeChunk[] }> {
  // Retrieve relevant knowledge chunks for context
  const { chunks: contextChunks } = retrieve(request.topic, { limit: 6 });

  const config = resolveAIConfig();

  if (!config) {
    // Fallback: return a placeholder article
    const fallback = generateLocalArticle(request);
    return {
      stream: new ReadableStream({
        start(controller) {
          controller.enqueue(fallback);
          controller.close();
        },
      }),
      contextChunks,
    };
  }

  const prompt = buildArticlePrompt(request, contextChunks);

  let response: Response;

  if (config.provider === "anthropic") {
    response = await fetch(`${config.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": config.apiKey,
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 4096,
        system: ARTICLE_SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
        stream: true,
      }),
    });
  } else {
    response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 4096,
        stream: true,
        messages: [
          { role: "system", content: ARTICLE_SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
      }),
    });
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`AI API error: ${response.status} ${errText}`);
  }

  // Parse SSE stream (same logic as generator.ts)
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:")) continue;

            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") continue;

            try {
              const json = JSON.parse(data);
              if (config.provider === "anthropic") {
                const delta = json.delta?.text;
                if (delta) controller.enqueue(delta);
              } else {
                const delta = json.choices?.[0]?.delta?.content;
                if (delta) controller.enqueue(delta);
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      } catch (error) {
        console.error("Article stream error:", error);
        controller.error(error);
      }
    },
  });

  return { stream, contextChunks };
}

/**
 * Generate a local fallback article when no AI API is configured.
 */
function generateLocalArticle(request: ArticleWriteRequest): string {
  const styleGuide = request.style && STYLE_GUIDES[request.style]
    ? `\n\n写作风格：${STYLE_GUIDES[request.style]}`
    : "";

  return `---TITLE---
${request.topic}
---SUMMARY---
关于"${request.topic}"的技术分享${styleGuide}
---TAGS---
技术, AI, 开发
---CATEGORY---
未分类
---CONTENT---
## 引言

${request.topic}是当前技术社区中备受关注的话题。本文将从多个角度进行深入分析。

## 核心概念

> 请配置 \`AI_API_KEY\` 环境变量以获得完整的 AI 生成能力。

## 总结

本文介绍了"${request.topic}"的相关技术要点。`;
}
