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

      {/* Subtle animated blobs — barely visible for a clean light mode */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-[var(--primary)]/2 blur-3xl animate-blob" />
      <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-[var(--accent)]/2 blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute bottom-1/4 left-1/3 w-72 h-72 rounded-full bg-[var(--primary)]/2 blur-3xl animate-blob animation-delay-4000" />
    </div>
  );
}
