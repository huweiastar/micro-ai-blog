import { clsx } from "clsx";

type Radius = "lg" | "xl" | "2xl";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "article" | "section" | "a" | "li";
  /** 圆角档：lg=rounded-2xl, xl=rounded-3xl, 2xl=rounded-[2rem] */
  radius?: Radius;
  /** hover 抬升+加深阴影 */
  hover?: boolean;
}

const RADIUS: Record<Radius, string> = {
  lg: "rounded-2xl",
  xl: "rounded-3xl",
  "2xl": "rounded-[2rem]",
};

/**
 * 统一毛玻璃卡：浅白/深蓝半透明 + backdrop-blur + 半透明白边 + 阴影。
 * 走站点 CSS 变量，亮暗自适应。参考 xinghuisama 配方。
 */
export function GlassCard({
  children,
  className,
  as: Tag = "div",
  radius = "xl",
  hover = false,
}: GlassCardProps) {
  return (
    <Tag
      className={clsx(
        "border border-white/40 bg-white/60 shadow-lg backdrop-blur-xl",
        "dark:border-white/10 dark:bg-[var(--card)]/55",
        RADIUS[radius],
        hover &&
          "transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl",
        className
      )}
    >
      {children}
    </Tag>
  );
}
