import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

/**
 * 只读控制面：管理端写完内容文件后调用本接口失效对应页面缓存。
 * 仅按路径 revalidate，不写任何内容。用 REVALIDATE_TOKEN 鉴权（与登录会话解耦）。
 */
export async function POST(req: NextRequest) {
  const expected = process.env.REVALIDATE_TOKEN;
  if (!expected) {
    return NextResponse.json({ error: "REVALIDATE_TOKEN 未配置" }, { status: 500 });
  }
  if (req.headers.get("x-revalidate-token") !== expected) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  let paths: string[] = [];
  try {
    const body = await req.json();
    if (Array.isArray(body?.paths)) {
      paths = body.paths.filter((p: unknown): p is string => typeof p === "string" && p.startsWith("/"));
    }
  } catch {
    // 忽略解析错误，下方回退
  }
  if (paths.length === 0) paths = ["/"];

  for (const p of paths) revalidatePath(p);
  return NextResponse.json({ revalidated: paths });
}
