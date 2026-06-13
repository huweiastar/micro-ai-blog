import { LoginForm } from "./LoginForm.client";

// 关键：强制动态渲染，避免登录页被预渲染并以 s-maxage=31536000 缓存一年。
// 一旦缓存，重新部署后 build id 变化、JS chunk 文件名改变，旧 HTML 仍指向已失效的
// /_next/static/chunks/*.js → 页面白屏“打不开”。force-dynamic 让每次请求实时返回，
// HTML 始终引用当前部署的 chunk。
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return <LoginForm />;
}
