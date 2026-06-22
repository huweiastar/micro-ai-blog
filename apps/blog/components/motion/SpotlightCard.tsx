"use client";

import { useRef, useEffect, useState } from "react";
import { clsx } from "clsx";
import { useReducedMotion } from "./constants";

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  /** 光斑颜色，默认 var(--primary)。 */
  spotlightColor?: string;
  /** 光斑半径（px）。 */
  size?: number;
  /** 光斑最大不透明度（0~1）。 */
  opacity?: number;
}

/**
 * Aceternity Spotlight 风格：鼠标跟随光斑。
 *
 * 实现细节：
 * - 用绝对定位的叠加 div（pointer-events: none），不替换现有背景/hover 效果。
 * - mousemove 直接操作 DOM style（CSS 变量 --spotlight-x/y），不触发 React rerender。
 * - mouseleave 保留最后位置（光斑停住，不跳回左上角）。
 * - 触摸设备 / reduced-motion 自动禁用 spotlight，仅保留容器。
 */
export function SpotlightCard({
  children,
  className,
  spotlightColor = "var(--primary)",
  size = 300,
  opacity = 0.15,
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced || isTouch) return;
    const el = ref.current;
    const overlay = overlayRef.current;
    if (!el || !overlay) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    overlay.style.setProperty("--spotlight-x", `${x}px`);
    overlay.style.setProperty("--spotlight-y", `${y}px`);
    overlay.style.opacity = String(opacity);
  };

  const disabled = reduced || isTouch;

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={clsx("relative overflow-hidden", className)}
    >
      {/* 子内容：相对定位 + z-index 确保在光斑叠加层之上 */}
      <div className="relative z-10 h-full w-full">{children}</div>
      {/* 光斑叠加层：绝对定位 + pointer-events 穿透 */}
      {!disabled && (
        <div
          ref={overlayRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={
            {
              "--spotlight-x": "50%",
              "--spotlight-y": "50%",
              "--spotlight-color": spotlightColor,
              "--spotlight-size": `${size}px`,
              background:
                "radial-gradient(var(--spotlight-size) circle at var(--spotlight-x) var(--spotlight-y), color-mix(in srgb, var(--spotlight-color) 25%, transparent), transparent 60%)",
              opacity: 0,
              zIndex: 1,
            } as React.CSSProperties
          }
        />
      )}
    </div>
  );
}
