"use client";

import { useEffect, useState } from "react";

export function MouseFollow() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [trails, setTrails] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    setEnabled(!reduce && !coarse);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let trailId = 0;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });

      // Create trail effect
      const newTrail = { id: trailId++, x: e.clientX, y: e.clientY };
      setTrails((prev) => [...prev.slice(-8), newTrail]);

      // Check if hovering over interactive element
      const target = e.target as HTMLElement;
      const isInteractive = target.closest(
        "a, button, input, [role='button'], .cursor-pointer, [onclick]"
      );
      setIsPointer(!!isInteractive);
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [enabled]);

  // Clear trails after animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setTrails((prev) => prev.slice(-3));
    }, 100);

    return () => clearTimeout(timer);
  }, [trails]);

  if (!enabled) return null;

  return (
    <>
      {/* Mouse trails */}
      {trails.map((trail, index) => (
        <div
          key={trail.id}
          className="fixed pointer-events-none z-[9999]"
          style={{
            left: trail.x,
            top: trail.y,
            transform: "translate(-50%, -50%)",
            opacity: (index / trails.length) * 0.3,
          }}
        >
          <div
            className="w-2 h-2 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]"
            style={{
              transform: `scale(${(index / trails.length) * 0.5})`,
            }}
          />
        </div>
      ))}

      {/* Main cursor glow */}
      <div
        className="fixed pointer-events-none z-[9999] transition-transform duration-150"
        style={{
          left: position.x,
          top: position.y,
          transform: `translate(-50%, -50%) scale(${isPointer ? 1.5 : 1}) ${
            isClicking ? "scale(0.8)" : ""
          }`,
        }}
      >
        {/* Outer glow */}
        <div
          className="w-12 h-12 rounded-full bg-gradient-to-r from-[var(--primary)]/20 to-[var(--accent)]/20 blur-md"
          style={{
            animation: isClicking ? "ripple 0.6s ease-out" : "none",
          }}
        />
      </div>
    </>
  );
}
