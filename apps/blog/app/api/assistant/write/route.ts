import { NextRequest } from "next/server";
import { generateArticleStream, parseArticleOutput } from "../../../../lib/assistant/article-writer";
import type { WriteRequest } from "../../../../lib/assistant/types";

// Reuse the same rate-limiting pattern from chat endpoint
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(req: NextRequest): { allowed: boolean; retryAfter?: number } {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 10; // Lower limit for article generation (more expensive)

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
    const body: WriteRequest = await req.json();
    const { topic, style, tags } = body;

    if (!topic || !topic.trim()) {
      return new Response(
        JSON.stringify({ error: "请输入文章主题" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const rateLimitResult = checkRateLimit(req);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: "请求过于频繁，请稍后再试" }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    const { stream } = await generateArticleStream({ topic, style, tags });

    const encoder = new TextEncoder();
    const responseStream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "start" })}\n\n`));

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

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
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
    console.error("Article write API error:", error);
    return new Response(
      JSON.stringify({ error: "文章生成失败，请稍后重试" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
