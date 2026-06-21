import { clsx } from "clsx";

type ContainerSize = "prose" | "default" | "wide";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "main" | "header" | "footer" | "nav";
  /**
   * 宽度变体——全站唯一宽度来源（§1.3）：
   * prose 长文/表单(≈max-w-4xl) · default 列表/常规页(≈max-w-6xl) · wide 宽布局(≈max-w-screen-2xl)。
   */
  size?: ContainerSize;
}

const SIZE_MAX_WIDTH: Record<ContainerSize, string> = {
  prose: "max-w-4xl",
  default: "max-w-6xl",
  wide: "max-w-screen-2xl",
};

export function Container({
  children,
  className,
  as: Tag = "div",
  size = "default",
}: ContainerProps) {
  return (
    <Tag
      className={clsx(
        "mx-auto w-full px-4 sm:px-6",
        SIZE_MAX_WIDTH[size],
        className
      )}
    >
      {children}
    </Tag>
  );
}
