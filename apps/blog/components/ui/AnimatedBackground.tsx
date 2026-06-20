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
