import { NextRequest, NextResponse } from "next/server";
import { recordPageView, getPathAnalytics } from "../../../lib/analytics";

export async function GET(req: NextRequest) {
  const { getAnalytics, getPathAnalytics } = await import("../../../lib/analytics");
  const url = new URL(req.url);
  const pagePath = url.searchParams.get("path");

  if (pagePath) {
    const stats = getPathAnalytics(pagePath);
    return NextResponse.json(stats);
  }

  const stats = getAnalytics();
  return NextResponse.json(stats);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { visitorId, path: pagePath } = body;

    if (!visitorId) {
      return NextResponse.json({ error: "缺少 visitorId" }, { status: 400 });
    }

    const result = recordPageView(visitorId, pagePath || "/");
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "记录失败" }, { status: 500 });
  }
}
