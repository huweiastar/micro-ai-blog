"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Container } from "../components/ui/Container";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 仅在客户端记录，便于排障；不上报第三方。
    console.error(error);
  }, [error]);

  return (
    <Container>
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">页面出错了</h1>
        <p className="text-[var(--muted)]">抱歉，加载这个页面时出现了问题。</p>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-white transition hover:opacity-90"
          >
            重试
          </button>
          <Link
            href="/"
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-[var(--foreground)] transition hover:bg-[var(--muted)]/10"
          >
            返回首页
          </Link>
        </div>
      </div>
    </Container>
  );
}
