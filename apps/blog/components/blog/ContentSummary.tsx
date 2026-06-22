import { BookOpen } from "lucide-react";

interface ContentSummaryProps {
  summary: string;
}

/**
 * 内容概览卡片：带渐变装饰条、图标与柔和背景的摘要展示。
 */
export function ContentSummary({ summary }: ContentSummaryProps) {
  return (
    <section
      className="relative mt-6 overflow-hidden rounded-xl border border-[var(--primary)]/15 shadow-sm"
      style={{
        background: `linear-gradient(135deg,
          color-mix(in srgb, var(--primary) 6%, transparent),
          color-mix(in srgb, var(--accent) 3%, transparent) 60%,
          transparent)`,
      }}
    >
      {/* 左侧渐变装饰条 */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[var(--primary)] to-[var(--accent)]" />

      {/* 右上装饰光斑 */}
      <div
        className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-20 blur-2xl"
        style={{ background: "var(--primary)" }}
      />

      <div className="relative px-4 py-3 pl-5">
        {/* 标题行 */}
        <div className="mb-2 flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--primary)]/15 text-[var(--primary)]">
            <BookOpen className="h-3 w-3" />
          </span>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
            内容概览
          </h2>
        </div>

        {/* 正文 */}
        <p className="text-sm leading-relaxed text-[var(--muted)]">
          {summary}
        </p>
      </div>
    </section>
  );
}
