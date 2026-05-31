import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center">
      <h1 className="text-6xl font-bold text-[var(--primary)] mb-4">404</h1>
      <p className="text-xl text-[var(--muted)] mb-8">页面未找到</p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--primary)] text-white text-sm hover:bg-[var(--primary-hover)] transition-colors"
      >
        返回首页
      </Link>
    </div>
  );
}
