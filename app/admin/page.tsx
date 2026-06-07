import { redirect } from "next/navigation";

// 鉴权后台的入口跳转必须每次实时执行，不能被预渲染成静态缓存的 307
// （缓存的重定向会丢失 Location，导致登录后停在 /admin 打不开）。
export const dynamic = "force-dynamic";

export default function AdminIndex() {
  redirect("/admin/articles");
}
