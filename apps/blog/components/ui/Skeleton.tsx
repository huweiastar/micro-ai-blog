import { clsx } from "clsx";

/** 通用骨架块：用 Tailwind animate-pulse + 主题变量配色，暗/亮色自适应。 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "animate-pulse rounded-md bg-[var(--muted)]/15",
        className,
      )}
    />
  );
}

/** 文章卡片骨架，匹配 BlogCard 的大致版式。 */
export function BlogCardSkeleton() {
  return (
    <div className="glass rounded-xl p-6 pl-7">
      <Skeleton className="mb-4 h-6 w-3/4" />
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="mb-4 h-4 w-5/6" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}
