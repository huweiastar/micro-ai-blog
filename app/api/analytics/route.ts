import { NextRequest, NextResponse } from "next/server";
import {
  recordPageView,
  getAnalytics,
  getPathAnalytics,
  getAnalyticsSummary,
} from "../../../lib/analytics";
import { verifySession } from "../../../lib/auth";

// 简单的 IP 级限流，抑制脚本刷量（与助手聊天接口一致的思路）。
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
let lastSweep = 0;

// 惰性清理过期条目：长跑进程下 Map 只增不删会缓慢漏内存。
// 不用 setInterval（避免悬挂定时器拖住事件循环），改为每分钟最多扫一次。
function sweepExpired(now: number): void {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, value] of Array.from(rateLimitMap.entries())) {
    if (now > value.resetAt) rateLimitMap.delete(key);
  }
}

function checkRateLimit(req: NextRequest): boolean {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const now = Date.now();
  sweepExpired(now);
  const windowMs = 60 * 1000;
  const maxRequests = 60; // 单 IP 每分钟最多 60 次上报

  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count++;
  return entry.count <= maxRequests;
}

// 校验同源：浏览器会带 Origin/Referer，跨站脚本伪造上报将被拒绝。
function isSameOrigin(req: NextRequest): boolean {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!host) return true; // 无 host 头（少见）时不阻断，避免误杀
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const source = origin ?? referer;
  if (!source) return false; // 正常浏览器请求至少有 referer
  try {
    return new URL(source).host === host;
  } catch {
    return false;
  }
}

// 规范化并校验上报路径，防止写入任意垃圾路径污染统计。
function sanitizePath(input: unknown): string | null {
  if (typeof input !== "string") return null;
  let p = input.trim();
  if (!p.startsWith("/") || p.startsWith("//")) return null; // 必须是站内绝对路径
  p = p.split("?")[0].split("#")[0]; // 去掉 query / hash
  if (p.length > 256) return null;
  if (!/^\/[\w\-/%.一-鿿]*$/.test(p)) return null; // 限定安全字符集
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1); // 统一去尾斜杠
  return p;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  // 后台仪表盘：需登录，返回全站 + 每页明细（不含 visitorIds）。
  if (url.searchParams.get("scope") === "admin") {
    if (!(await verifySession())) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    return NextResponse.json(getAnalyticsSummary());
  }

  const pagePath = url.searchParams.get("path");
  if (pagePath) {
    const stats = getPathAnalytics(pagePath);
    // 公开接口剥离 visitorIds，仅返回计数。
    return NextResponse.json({
      pv: stats.pv,
      uv: stats.uv,
      updatedAt: stats.updatedAt,
    });
  }

  return NextResponse.json(getAnalytics());
}

export async function POST(req: NextRequest) {
  try {
    if (!isSameOrigin(req)) {
      return NextResponse.json({ error: "来源校验失败" }, { status: 403 });
    }
    if (!checkRateLimit(req)) {
      return NextResponse.json({ error: "上报过于频繁" }, { status: 429 });
    }

    const body = await req.json();
    const { visitorId } = body;

    if (!visitorId || typeof visitorId !== "string" || visitorId.length > 64) {
      return NextResponse.json({ error: "缺少有效 visitorId" }, { status: 400 });
    }

    const pagePath = sanitizePath(body.path) ?? "/";
    const result = recordPageView(visitorId, pagePath);
    // 不回传 visitorIds，只返回计数。
    return NextResponse.json({
      global: result.global,
      path: {
        pv: result.path.pv,
        uv: result.path.uv,
        updatedAt: result.path.updatedAt,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "记录失败" }, { status: 500 });
  }
}
