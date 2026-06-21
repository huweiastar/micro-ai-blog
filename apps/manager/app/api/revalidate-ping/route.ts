import { NextRequest, NextResponse } from "next/server";

/**
 * 受登录保护（middleware 已校验 admin_session）。
 * 向 blog 的 /api/revalidate 转发一次缓存失效请求，证明跨 app 控制链路通畅。
 */
export async function POST(req: NextRequest) {
  const origin = process.env.BLOG_ORIGIN;
  const token = process.env.REVALIDATE_TOKEN;
  if (!origin || !token) {
    return NextResponse.json(
      { error: "BLOG_ORIGIN 或 REVALIDATE_TOKEN 未配置" },
      { status: 500 },
    );
  }

  let paths: string[] = ["/"];
  try {
    const body = await req.json();
    if (Array.isArray(body?.paths)) {
      const valid = body.paths.filter(
        (p: unknown): p is string => typeof p === "string" && p.startsWith("/"),
      );
      if (valid.length > 0) paths = valid;
    }
  } catch {
    // 用默认 paths
  }

  try {
    const res = await fetch(`${origin}/api/revalidate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-revalidate-token": token,
      },
      body: JSON.stringify({ paths }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({ ok: res.ok, status: res.status, blog: data });
  } catch (e) {
    return NextResponse.json(
      { error: `请求 blog 失败：${e instanceof Error ? e.message : String(e)}` },
      { status: 502 },
    );
  }
}
