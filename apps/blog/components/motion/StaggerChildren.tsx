"use client";

import { motion } from "framer-motion";
import { clsx } from "clsx";
import React from "react";
import {
  EASE_OUT_EXPO,
  DURATION_NORMAL,
  STAGGER_CHILD,
  useReducedMotion,
} from "./constants";

interface StaggerChildrenProps {
  children: React.ReactNode;
  /** 子元素间隔（秒）。 */
  stagger?: number;
  /** 容器进入时的延迟（秒）。 */
  delay?: number;
  /** 子元素垂直偏移（px）。 */
  y?: number;
  /** 子元素时长（秒）。 */
  duration?: number;
  /** 仅在进入视口时触发一次。 */
  once?: boolean;
  /** 触发阈值。 */
  amount?: number;
  as?: "div" | "ul" | "ol" | "section";
  className?: string;
}

/**
 * 列表容器：自动 stagger 子元素入场。
 *
 * 内部为每个子元素套一层 motion.div（或 li），子元素本身无需是 motion 组件，
 * 业务代码可继续使用普通 React 组件。
 *
 * 若子元素本身需要更精细控制（如自定义 variant），请使用 FadeIn 直接包裹。
 */
export function StaggerChildren({
  children,
  stagger = STAGGER_CHILD,
  delay = 0,
  y = 14,
  duration = DURATION_NORMAL,
  once = true,
  amount = 0.15,
  as: Component = "div",
  className,
}: StaggerChildrenProps) {
  const reduced = useReducedMotion();

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration, ease: EASE_OUT_EXPO },
    },
  };

  // reduced-motion：直接渲染，不包裹 motion。
  if (reduced) {
    const Tag = Component;
    return <Tag className={className}>{children}</Tag>;
  }

  const MotionComponent = motion[Component] as typeof motion.div;

  return (
    <MotionComponent
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      className={clsx(className)}
    >
      {React.Children.map(children, (child, i) => {
        if (child === null || child === undefined) return null;
        return (
          <motion.div key={(child as React.ReactElement)?.key ?? i} variants={childVariants}>
            {child}
          </motion.div>
        );
      })}
    </MotionComponent>
  );
}
