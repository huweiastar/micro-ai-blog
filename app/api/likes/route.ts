import { NextRequest, NextResponse } from "next/server";
import { getLikes, toggleLike } from "../../../lib/likes";

// 单 IP 级限流，抑制脚本刷赞（与 analytics 接口一致的思路）。
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(req: NextRequest): boolean {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 60;

  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count++;
  return entry.count <= maxRequests;
}

// 校验同源，拒绝跨站脚本伪造点赞。
function isSameOrigin(req: NextRequest): boolean {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!host) return true;
  const source = req.headers.get("origin") ?? req.headers.get("referer");
  if (!source) return false;
  try {
    return new URL(source).host === host;
  } catch {
    return false;
  }
}

// 规范化文章 slug：站内单段标识，禁止斜杠/路径穿越，允许中文。
function sanitizeSlug(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const s = input.trim();
  if (!s || s.length > 256) return null;
  if (s.includes("/") || s.includes("\\") || s.includes("..")) return null;
  if (!/^[\w\-%.一-鿿]+$/.test(s)) return null;
  return s;
}

function getVisitorId(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const id = input.trim();
  if (!id || id.length > 64) return null;
  return id;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const slug = sanitizeSlug(url.searchParams.get("slug"));
  if (!slug) return NextResponse.json({ error: "缺少有效 slug" }, { status: 400 });
  const visitorId = getVisitorId(url.searchParams.get("visitorId")) ?? undefined;
  return NextResponse.json(getLikes(slug, visitorId));
}

export async function POST(req: NextRequest) {
  try {
    if (!isSameOrigin(req)) {
      return NextResponse.json({ error: "来源校验失败" }, { status: 403 });
    }
    if (!checkRateLimit(req)) {
      return NextResponse.json({ error: "操作过于频繁" }, { status: 429 });
    }

    const body = await req.json();
    const slug = sanitizeSlug(body.slug);
    const visitorId = getVisitorId(body.visitorId);
    if (!slug) return NextResponse.json({ error: "缺少有效 slug" }, { status: 400 });
    if (!visitorId) return NextResponse.json({ error: "缺少有效 visitorId" }, { status: 400 });

    return NextResponse.json(toggleLike(slug, visitorId));
  } catch (error) {
    console.error("点赞操作失败:", error);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}
