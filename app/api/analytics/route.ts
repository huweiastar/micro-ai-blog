import { NextRequest, NextResponse } from "next/server";
import { getAnalytics, recordPageView } from "../../../lib/analytics";

export async function GET() {
  const stats = getAnalytics();
  return NextResponse.json(stats);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { visitorId } = body;

    if (!visitorId) {
      return NextResponse.json({ error: "缺少 visitorId" }, { status: 400 });
    }

    const stats = recordPageView(visitorId);
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: "记录失败" }, { status: 500 });
  }
}
