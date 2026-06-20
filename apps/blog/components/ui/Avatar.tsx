"use client";

import { useState, useEffect } from "react";
import { useProfile } from "../ProfileProvider.client";

/* eslint-disable @next/next/no-img-element */

export function Avatar() {
  const profile = useProfile();
  const [avatarUrl, setAvatarUrl] = useState("");
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Try localStorage first (uploaded avatar), fall back to profile.yaml
    const saved = localStorage.getItem("blog-avatar");
    setAvatarUrl(saved || profile?.avatar || "");
  }, [profile?.avatar]);

  const handleImageError = () => {
    setHasError(true);
  };

  const firstChar = profile?.name?.charAt(0) || "AI";

  return (
    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mx-auto mb-6 relative group">
      {/* Animated glow rings */}
      <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--primary)] opacity-0 group-hover:opacity-100 blur-lg transition-all duration-500 animate-spin-slow" />

      {/* Pulsing ring */}
      <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] opacity-60 group-hover:opacity-80 transition-all duration-300 group-hover:animate-pulse-glow" />

      {/* Avatar container */}
      <div className="absolute inset-1 rounded-full overflow-hidden bg-[var(--card)] flex items-center justify-center transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-[var(--primary)]/50">
        {!hasError && avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="w-full h-full object-cover relative z-10 transition-transform duration-500 group-hover:scale-110"
            onError={handleImageError}
          />
        ) : (
          <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] bg-clip-text text-transparent relative z-10">
            {firstChar}
          </span>
        )}
      </div>
    </div>
  );
}
