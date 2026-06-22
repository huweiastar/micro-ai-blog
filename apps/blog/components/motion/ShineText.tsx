"use client";

import { useId } from "react";
import { clsx } from "clsx";

interface ShineTextProps {
  children: React.ReactNode;
  className?: string;
  /** 渐变起始色，默认 var(--primary)。 */
  from?: string;
  /** 渐变中间色（高光），默认 var(--accent)。 */
  via?: string;
  /** 渐变结束色，默认 var(--primary)。 */
  to?: string;
  /** 动画时长（秒），默认 8s。 */
  duration?: number;
}

/**
 * Magic UI Shimmer Text 风格：文字渐变扫光。
 *
 * 实现：背景渐变 + background-position 动画，模拟高光从左扫到右。
 * 用组件内 <style> 注入 @keyframes，避免污染 globals.css。
 * 每个实例生成唯一 animation-name，多实例不冲突。
 */
export function ShineText({
  children,
  className,
  from = "var(--primary)",
  via = "var(--accent)",
  to = "var(--primary)",
  duration = 8,
}: ShineTextProps) {
  const animName = useId().replace(/:/g, "");

  return (
    <>
      <style>{`
        @keyframes ${animName} {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
      <span
        className={clsx(
          "bg-clip-text text-transparent inline-block",
          className
        )}
        style={{
          backgroundImage: `linear-gradient(90deg, ${from} 0%, ${via} 50%, ${to} 100%)`,
          backgroundSize: "200% 100%",
          animation: `${animName} ${duration}s ease-in-out infinite`,
        }}
      >
        {children}
      </span>
    </>
  );
}
