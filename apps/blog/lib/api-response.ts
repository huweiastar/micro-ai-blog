import { NextResponse } from "next/server";

/**
 * Blog API 统一响应 helpers —— 对齐 Hono 的 `{ ok, data }` / `{ ok: false, error }`
 * 约定，方便未来 blog API 全部迁到 Hono 时前端消费代码零改动。
 *
 * 用法：
 *   return ok({ post });                       // 200 + { ok: true, data: { post } }
 *   return created({ slug });                  // 201 + { ok: true, data: { slug } }
 *   return fail("参数错误", 400);              // 400 + { ok: false, error: "参数错误" }
 *   return internal();                         // 500 + { ok: false, error: "..." }
 *
 * 注：旧的 `{ success: true }` 格式仍被部分前端消费，新增路由应优先使用 ok/fail，
 * 老路由按需迁移。完整迁移清单见仓库 issue。
 */

type OkBody<T> = { ok: true; data: T };
type FailBody = { ok: false; error: string };

export function ok<T>(data: T, init?: ResponseInit): NextResponse<OkBody<T>> {
  return NextResponse.json({ ok: true, data }, { ...init, status: init?.status ?? 200 });
}

export function created<T>(data: T): NextResponse<OkBody<T>> {
  return NextResponse.json({ ok: true, data }, { status: 201 });
}

export function fail(error: string, status = 400): NextResponse<FailBody> {
  return NextResponse.json({ ok: false, error }, { status });
}

export function internal(error = "Internal server error"): NextResponse<FailBody> {
  return NextResponse.json({ ok: false, error }, { status: 500 });
}
