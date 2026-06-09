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

      {/* Aurora mesh — soft drifting color fields. Subtle in light mode, richer in dark. */}
      <div className="absolute inset-0 opacity-60 dark:opacity-90">
        <div className="animate-aurora absolute -top-1/4 left-1/5 h-[38rem] w-[38rem] rounded-full bg-[var(--primary)]/[0.06] blur-[110px] dark:bg-[var(--primary)]/20" />
        <div className="animate-aurora-slow absolute top-1/4 right-1/6 h-[34rem] w-[34rem] rounded-full bg-[var(--accent)]/[0.06] blur-[110px] dark:bg-[var(--accent)]/20" />
        <div className="animate-blob animation-delay-4000 absolute bottom-0 left-1/3 h-[30rem] w-[30rem] rounded-full bg-fuchsia-500/[0.04] blur-[110px] dark:bg-fuchsia-500/10" />
      </div>

      {/* Edge vignette to settle content against the background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, color-mix(in srgb, var(--background) 55%, transparent) 100%)",
        }}
      />
    </div>
  );
}
