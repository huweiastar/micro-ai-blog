/** 获取或创建本地访客 ID（与页面浏览统计共用同一标识）。仅在浏览器可用。 */
export function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("_blog_visitor_id");
  if (!id) {
    id = "v_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
    localStorage.setItem("_blog_visitor_id", id);
  }
  return id;
}
