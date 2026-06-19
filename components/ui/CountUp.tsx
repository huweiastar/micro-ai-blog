"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  /** 目标数值；变化时会从当前显示值平滑过渡到新值（用于访问量异步加载后避免数字突跳）。 */
  value: number;
  /** 数值格式化（如千分位、「万」换算）。默认四舍五入 + 千分位。 */
  format?: (n: number) => string;
  /** 动画时长（ms）。 */
  duration?: number;
  className?: string;
}

const defaultFormat = (n: number) => Math.round(n).toLocaleString();

/**
 * 数字滚动：进场时从 0 累加到目标值；目标值后续变化（如 PV/UV fetch 回填）时
 * 从「当前显示值」平滑过渡到新值，而不是从 0 重来或直接跳变。
 * 尊重 prefers-reduced-motion：直接落定终值。
 */
export function CountUp({ value, format = defaultFormat, duration = 1200, className }: CountUpProps) {
  const [display, setDisplay] = useState(0);
  const displayRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      displayRef.current = value;
      setDisplay(value);
      return;
    }

    const from = displayRef.current;
    const to = value;
    if (from === to) return;

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const current = from + (to - from) * eased;
      displayRef.current = current;
      setDisplay(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        displayRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return <span className={className}>{format(display)}</span>;
}
