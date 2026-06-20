import { Container } from "./Container";

interface PageHeaderProps {
  title: string;
  description?: string;
  count?: number;
  countLabel?: string;
  children?: React.ReactNode;
}

/**
 * 全站列表页统一页头：渐变题签线 + 标题 + 计数胶囊，
 * 配淡淡的主题色氛围光晕，与首页/卡片的 primary→accent 语言一致。
 */
export function PageHeader({
  title,
  description,
  count,
  countLabel = "篇",
  children,
}: PageHeaderProps) {
  return (
    <div className="relative overflow-hidden">
      {/* 氛围光晕：极淡的主题色渐变，撑起页面开头的空间感 */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/4 h-64 w-64 rounded-full bg-gradient-radial from-[var(--primary)]/10 to-transparent blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 right-1/4 h-48 w-48 rounded-full bg-gradient-radial from-[var(--accent)]/10 to-transparent blur-3xl"
      />
      <Container className="relative py-10 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            {/* 渐变题签线 */}
            <span
              aria-hidden
              className="mb-3 block h-1 w-10 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]"
            />
            <h1 className="flex flex-wrap items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
              {title}
              {typeof count === "number" && (
                <span className="glass inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium text-[var(--muted)]">
                  <span className="font-semibold tabular-nums text-[var(--primary)]">
                    {count}
                  </span>
                  {countLabel}
                </span>
              )}
            </h1>
            {description && (
              <p className="mt-3 max-w-xl text-[var(--muted)]">{description}</p>
            )}
          </div>
          {children}
        </div>
      </Container>
    </div>
  );
}
