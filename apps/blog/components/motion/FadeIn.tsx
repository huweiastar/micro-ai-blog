"use client";

import { motion, type Variants } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import { clsx } from "clsx";
import {
  EASE_OUT_EXPO,
  DURATION_NORMAL,
  SPRING_GENTLE,
  useReducedMotion,
} from "./constants";

interface FadeInProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: React.ReactNode;
  /** 垂直偏移（px），0 表示纯淡入。 */
  y?: number;
  /** 缩放起始值，1 表示无缩放。 */
  scale?: number;
  /** 延迟（秒）。 */
  delay?: number;
  /** 时长（秒）。 */
  duration?: number;
  /** 是否仅在进入视口时触发一次。 */
  once?: boolean;
  /** 触发阈值（0~1），0 表示任意像素，1 表示完全可见。 */
  amount?: number;
  className?: string;
}

/**
 * 通用淡入组件：进入视口时从 (opacity:0, y, scale) 过渡到终态。
 *
 * 内置 reduced-motion 适配：用户偏好减弱动画时直接显示终态。
 * 定义 variants 以便作为 StaggerChildren 子元素时被父级接管。
 */
export function FadeIn({
  children,
  y = 12,
  scale = 1,
  delay,
  duration = DURATION_NORMAL,
  once = true,
  amount = 0.2,
  className,
  style,
  ...rest
}: FadeInProps) {
  const reduced = useReducedMotion();

  const variants: Variants = {
    hidden: { opacity: 0, y, scale },
    visible: { opacity: 1, y: 0, scale: 1 },
  };

  // reduced-motion：直接输出终态，跳过一切动画。
  if (reduced) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      transition={{
        duration,
        delay,
        ease: EASE_OUT_EXPO,
        // 有 scale 变化时用 spring，否则用 ease 曲线
        ...(scale !== 1 ? SPRING_GENTLE : {}),
      }}
      className={clsx(className)}
      style={style}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
