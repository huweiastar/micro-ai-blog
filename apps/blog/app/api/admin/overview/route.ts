import { NextResponse } from "next/server";
import { getAllPostsForAdmin } from "../../../../lib/posts";
import { analyzeContentHealth } from "../../../../lib/content-health";

// 后台侧栏徽标用：草稿/定时/体检待修复计数。实时统计，不缓存。
export const dynamic = "force-dynamic";

export async function GET() {
  const posts = getAllPostsForAdmin();
  const health = analyzeContentHealth();
  return NextResponse.json({
    drafts: posts.filter((p) => p.draft).length,
    scheduled: posts.filter((p) => p.scheduled).length,
    healthIssues: health.totals.errors + health.totals.warnings,
  });
}
