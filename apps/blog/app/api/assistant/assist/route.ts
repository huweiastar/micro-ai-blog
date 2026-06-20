import { NextRequest, NextResponse } from "next/server";
import {
  isAssistAction,
  generateAssistStream,
  suggestRelatedLinks,
} from "../../../../lib/assistant/editor-assist";
import { resolveAIConfig } from "../../../../lib/assistant/generator";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(req: NextRequest): boolean {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 20;

  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count++;
  return entry.count <= maxRequests;
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
    const body = await req.json();
    const action: unknown = body.action;
    const text = typeof body.text === "string" ? body.text : "";
    const title = typeof body.title === "string" ? body.title : undefined;
    const slug = typeof body.slug === "string" ? body.slug : undefined;

    if (!text.trim()) {
      return NextResponse.json({ error: "文本不能为空" }, { status: 400 });
    }
    if (!checkRateLimit(req)) {
      return NextResponse.json({ error: "请求过于频繁，请稍后再试" }, { status: 429 });
    }

    // 内链建议：本地 RAG 检索，无需 AI key，直接返回 JSON。
    if (action === "links") {
      const links = suggestRelatedLinks(`${title ? `${title}\n` : ""}${text}`, slug);
      return NextResponse.json({ links });
    }

    if (!isAssistAction(action)) {
      return NextResponse.json({ error: "不支持的动作" }, { status: 400 });
    }
    if (!resolveAIConfig()) {
      return NextResponse.json(
        { error: "未配置 AI_API_KEY，无法使用 AI 辅助功能" },
        { status: 503 }
      );
    }

    const stream = await generateAssistStream(action, text, title);

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
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "chunk", content: value })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
        } catch (error) {
          console.error("Assist stream error:", error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", error: "生成中断，请重试" })}\n\n`)
          );
        } finally {
          reader.releaseLock();
          controller.close();
        }
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
    console.error("Assist API error:", error);
    return NextResponse.json({ error: "AI 辅助失败，请稍后重试" }, { status: 500 });
  }
}
