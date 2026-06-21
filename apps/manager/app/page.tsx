import RevalidateButton from "./RevalidateButton";

export default function ManagerHome() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-bold">微观AI · 管理端</h1>
      <p className="mt-3 text-[var(--muted)]">
        内容管理控制台脚手架（A2）。下方按钮验证「manager 触发 → blog 失效缓存」控制链路。
      </p>
      <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <p className="text-sm text-[var(--muted)]">控制链路自检</p>
        <div className="mt-4">
          <RevalidateButton />
        </div>
      </div>
    </main>
  );
}
