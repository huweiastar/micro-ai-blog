import { revalidatePath } from "next/cache";

/**
 * 集中封装 revalidatePath：统一错误处理 + 日志，避免各 API 路由各自 try/catch。
 *
 * 用法：
 *   revalidateByKind("home")              → 刷新首页
 *   revalidateByKind("home", "layout")    → 刷新首页布局（含 about 等全站元素）
 *   revalidateByKind("post", "my-slug")   → 刷新首页 + 该文章详情
 *   revalidateByKind("path", "/custom")   → 刷新指定路径
 */
export function revalidateByKind(
  kind: "home" | "post" | "path",
  arg?: string,
  type?: Parameters<typeof revalidatePath>[1]
): void {
  try {
    if (kind === "home") {
      revalidatePath("/", type);
    } else if (kind === "post" && arg) {
      revalidatePath("/");
      revalidatePath(`/blog/${arg}`);
    } else if (kind === "path" && arg) {
      revalidatePath(arg, type);
    }
  } catch (err) {
    // revalidatePath 失败不应该阻断响应 —— ISR 缓存最多延迟到下一次访问自动刷新
    console.warn(`[revalidate] ${kind}${arg ? `(${arg})` : ""} 失败:`, err);
  }
}
