import { NextResponse } from "next/server";

/**
 * 健康检查端点 —— 供 systemd watchdog / 外部 uptime 监控（UptimeRobot 等）探活。
 * 仅返回 { ok: true }，不读数据库、不调外部服务，确保探活本身不成为瓶颈。
 */
export const runtime = "edge";
export const dynamic = "force-static";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(
    { ok: true, status: "healthy", timestamp: new Date().toISOString() },
    {
      headers: {
        // 监控平台通常 30s 一探测，给 10s 缓存即可
        "Cache-Control": "public, max-age=10",
      },
    }
  );
}
