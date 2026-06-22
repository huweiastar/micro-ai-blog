"use client";

import { useReducedMotion as useFMRReducedMotion } from "framer-motion";

/**
 * 动效基础设施：全局常量 + 公共 hooks。
 *
 * 业务组件统一从 `@/components/motion` 导入，不直接碰 framer-motion，
 * 便于未来整体替换或扩展（例如切换到 motion/react 或内部实现）。
 */

// —— Easing 曲线 ——
// 与 globals.css 现有 fade-in-up / page-enter 的 cubic-bezier(0.22, 1, 0.36, 1) 保持同源，
// 保证 framer-motion 动画与原生 CSS 动画视觉风格一致。
export const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const EASE_IN_OUT: [number, number, number, number] = [0.65, 0, 0.35, 1];

// —— 时长（秒，framer-motion 单位）——
export const DURATION_FAST = 0.3;
export const DURATION_NORMAL = 0.55;
export const DURATION_SLOW = 0.9;

// —— Stagger（列表子元素间隔）——
export const STAGGER_CHILD = 0.08;
export const STAGGER_TIGHT = 0.05;

// —— Spring 预设 ——
// 柔和：适合卡片入场、页面元素过渡
export const SPRING_GENTLE = { type: "spring" as const, stiffness: 120, damping: 20 };
// 弹性：适合需要"pop"感的元素（数字、徽章）
export const SPRING_BOUNCY = { type: "spring" as const, stiffness: 260, damping: 22 };
// 紧绷：适合 hover 微交互
export const SPRING_SNAPPY = { type: "spring" as const, stiffness: 400, damping: 28 };

// —— Reduced Motion 封装 ——
/**
 * 统一 reduced-motion 判定。
 * 当前直接转发 framer-motion 内置 hook（它会同时读取 OS 偏好 + 手动开关），
 * 未来若要加"外观面板"里的动画开关，只需在此处扩展。
 */
export function useReducedMotion() {
  return useFMRReducedMotion();
}
