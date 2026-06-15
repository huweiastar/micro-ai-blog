"use client";

import { useThemeConfig } from "../ThemeContext";

export function AnimatedBackground() {
  const { theme } = useThemeConfig();

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Background image layer */}
      {theme.backgroundImage && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${theme.backgroundImage})`,
            opacity: theme.backgroundOpacity / 100,
          }}
        />
      )}

      {/* Light-mode readability wash: the user's background photo is bright in light
          mode, so bare text rendered directly over it (page headers, archive timeline,
          tag pills, intro copy) loses contrast. This lifts the photo toward --background
          much like dark mode's navy does, keeping it visible while restoring WCAG contrast.
          Disabled in dark mode (opacity-0) so the richer dark look is untouched. */}
      <div className="absolute inset-0 bg-[var(--background)] opacity-50 dark:opacity-0" />

      {/* Aurora mesh — 暗色下 3 色极光团 */}
      <div className="absolute inset-0 opacity-60 dark:opacity-100">
        <div className="animate-aurora absolute -top-1/4 left-1/5 h-[38rem] w-[38rem] rounded-full bg-[var(--primary)]/[0.06] blur-[110px] dark:bg-[var(--primary)]/30" />
        <div className="animate-aurora-slow absolute top-1/4 right-1/6 h-[34rem] w-[34rem] rounded-full bg-[var(--accent)]/[0.06] blur-[110px] dark:bg-[var(--accent)]/25" />
        <div className="animate-blob animation-delay-4000 absolute bottom-0 left-1/3 h-[30rem] w-[30rem] rounded-full bg-fuchsia-500/[0.04] blur-[110px] dark:bg-fuchsia-500/15" />
        {/* 新增：青色极光（仅暗色下可见） */}
        <div className="animate-aurora absolute bottom-1/4 right-1/4 h-[28rem] w-[28rem] rounded-full opacity-0 blur-[90px] dark:opacity-100 dark:bg-[var(--neon-cyan)]/15" />
      </div>

      {/* Edge vignette to settle content against the background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, color-mix(in srgb, var(--background) 55%, transparent) 100%)",
        }}
      />

      {/* 赛博网格遮罩（仅暗色下显示） */}
      <div className="absolute inset-0 opacity-0 dark:opacity-100 cyber-grid pointer-events-none" />
    </div>
  );
}
