import { NextRequest } from "next/server";
import { retrieve } from "../../../../lib/assistant/retriever";
import { generateAIAnswerStream } from "../../../../lib/assistant/generator";
import type { ChatRequest, KnowledgeChunk } from "../../../../lib/assistant/types";

// 进程内限流：仅在单实例部署下有效。重启即清空；多实例/Serverless 下各实例
// 独立计数，不构成全局配额。若未来横向扩容，需替换为 Redis/Upstash 等共享存储。
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(req: NextRequest): { allowed: boolean; retryAfter?: number } {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 20;

  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  return { allowed: true };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of Array.from(rateLimitMap.entries())) {
    if (now > value.resetAt + 60000) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const { message, mode = "all", pageContext } = body;

    if (!message || !message.trim()) {
      return new Response(
        JSON.stringify({ error: "请输入问题" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Rate limiting
    const rateLimitResult = checkRateLimit(req);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: "请求过于频繁，请稍后再试" }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    // Retrieve relevant chunks
    const { chunks: contextChunks, sources } = retrieve(message, {
      mode,
      pageContext,
      limit: 8,
    });

    // Get streaming response from AI provider
    const { stream } = await generateAIAnswerStream(message, contextChunks, mode);

    // Pipe stream as Server-Sent Events
    const encoder = new TextEncoder();
    const responseStream = new ReadableStream({
      async start(controller) {
        // Send initial metadata
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "start", sources })}\n\n`));

        const reader = stream.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            if (value) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "chunk", content: value })}\n\n`));
            }
          }
        } finally {
          reader.releaseLock();
        }

        // Send completion signal with follow-ups
        const followUps = generateFollowUps(contextChunks);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done", followUps })}\n\n`));
        controller.close();
      },
    });

    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: "回答生成失败，请稍后重试" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Import followUps generator
function generateFollowUps(contextChunks: KnowledgeChunk[]): string[] {
  const followUps: string[] = [];
  if (contextChunks.length > 0) {
    const topChunk = contextChunks[0];
    if (topChunk.sourceType === "blog") {
      followUps.push("这篇文章的核心观点是什么？", "这篇文章适合初学者看吗？", "博客中还有类似主题的文章吗？");
    } else if (topChunk.sourceType === "project") {
      followUps.push("这个项目的代码入口在哪里？", "这个项目的技术栈有什么特点？", "能把相关内容整理成学习路线吗？");
    }
  }
  if (followUps.length === 0) {
    followUps.push("博客里有哪些文章？", "最近发布了什么内容？", "有哪些项目可以学习？");
  }
  return followUps.slice(0, 3);
}
