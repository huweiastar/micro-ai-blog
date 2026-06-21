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

      {/* Theme wash keeps custom background images readable while preserving atmosphere. */}
      <div className="absolute inset-0 bg-[var(--background)] opacity-75 dark:opacity-[0.62]" />

      <div
        className="absolute inset-0 opacity-[0.45] dark:opacity-[0.55]"
        style={{
          backgroundImage:
            "linear-gradient(180deg, color-mix(in srgb, var(--foreground) 5%, transparent) 0, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--foreground) 4%, transparent) 0, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "linear-gradient(180deg, transparent 0%, black 18%, black 72%, transparent 100%)",
        }}
      />

      <div
        className="absolute inset-0 opacity-20 dark:opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--foreground) 24%, transparent) 1px, transparent 0)",
          backgroundSize: "34px 34px",
        }}
      />

      {/* Edge vignette to settle content against the background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--background) 72%, transparent), transparent 16rem), radial-gradient(ellipse at center, transparent 48%, color-mix(in srgb, var(--background) 72%, transparent) 100%)",
        }}
      />
    </div>
  );
}
