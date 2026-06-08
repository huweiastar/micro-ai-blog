"use client";

import { useEffect, useState } from "react";
import { useThemeConfig, EffectStyle } from "../ThemeContext";

interface Particle {
  id: number;
  x: number;
  y: number;
  style: EffectStyle;
  splashes?: { angle: number; distance: number; size: number; delay: number }[];
  sparkles?: { angle: number; distance: number; size: number; rotation: number; delay: number }[];
}

export function ClickRipple() {
  const { theme } = useThemeConfig();
  const [particles, setParticles] = useState<Particle[]>([]);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    setEnabled(!reduce && !coarse);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let pid = 0;

    const handleClick = (e: MouseEvent) => {
      if (theme.effectStyle === "none") return;

      const particle: Particle = {
        id: pid++,
        x: e.clientX,
        y: e.clientY,
        style: theme.effectStyle,
      };

      if (theme.effectStyle === "ink") {
        const count = 6 + Math.floor(Math.random() * 5);
        particle.splashes = Array.from({ length: count }, () => ({
          angle: Math.random() * 360,
          distance: 20 + Math.random() * 40,
          size: 3 + Math.random() * 6,
          delay: Math.random() * 80,
        }));
      } else if (theme.effectStyle === "sparkle") {
        const count = 5 + Math.floor(Math.random() * 4);
        particle.sparkles = Array.from({ length: count }, () => ({
          angle: Math.random() * 360,
          distance: 15 + Math.random() * 35,
          size: 6 + Math.random() * 10,
          rotation: Math.random() * 360,
          delay: Math.random() * 100,
        }));
      }

      setParticles((prev) => [...prev, particle]);

      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id !== particle.id));
      }, 900);
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [theme.effectStyle, enabled]);

  if (!enabled) return null;

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          className="fixed pointer-events-none z-[9998]"
          style={{ left: p.x, top: p.y, transform: "translate(-50%, -50%)" }}
        >
          {p.style === "ink" && (
            <>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="ink-center" />
              </div>
              {p.splashes?.map((s, i) => (
                <div
                  key={i}
                  className="ink-splash"
                  style={{
                    "--angle": `${s.angle}deg`,
                    "--distance": `${s.distance}px`,
                    "--size": `${s.size}px`,
                    "--delay": `${s.delay}ms`,
                  } as React.CSSProperties}
                />
              ))}
            </>
          )}

          {p.style === "sparkle" && (
            <>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="sparkle-center" />
              </div>
              {p.sparkles?.map((s, i) => (
                <svg
                  key={i}
                  className="sparkle-star"
                  style={{
                    "--angle": `${s.angle}deg`,
                    "--distance": `${s.distance}px`,
                    "--size": `${s.size}px`,
                    "--rotation": `${s.rotation}deg`,
                    "--delay": `${s.delay}ms`,
                  } as React.CSSProperties}
                  width={s.size}
                  height={s.size}
                  viewBox="0 0 24 24"
                  fill="var(--primary)"
                >
                  <path d="M12 0L14.59 8.41L23 12L14.59 15.59L12 24L9.41 15.59L1 12L9.41 8.41Z" />
                </svg>
              ))}
            </>
          )}

          {p.style === "ripple" && (
            <>
              <div className="ripple-ring ripple-ring-1" />
              <div className="ripple-ring ripple-ring-2" />
              <div className="ripple-ring ripple-ring-3" />
            </>
          )}
        </div>
      ))}
    </>
  );
}
