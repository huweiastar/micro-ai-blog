"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/**
 * 页面顶部滚动进度条
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-50 h-0.5 origin-left bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]"
      style={{ scaleX: smoothProgress }}
    />
  );
}
