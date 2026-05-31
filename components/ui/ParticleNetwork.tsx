"use client";

import { useEffect, useRef } from "react";

interface ParticleNetworkProps {
  className?: string;
  mousePos: { x: number; y: number };
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export function ParticleNetwork({ className, mousePos }: ParticleNetworkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef(mousePos);

  useEffect(() => {
    mouseRef.current = mousePos;
  }, [mousePos]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;

    const el = canvas;
    const c = ctx;

    let animationId: number;
    let particles: Particle[] = [];
    let isDark = false;

    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 40 : 80;
    const connectionDistance = isMobile ? 100 : 150;
    const mouseDistance = isMobile ? 120 : 200;

    function resize() {
      el.width = el.offsetWidth * window.devicePixelRatio;
      el.height = el.offsetHeight * window.devicePixelRatio;
      c.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function createParticles() {
      particles = [];
      const width = el.offsetWidth;
      const height = el.offsetHeight;
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 2 + 1,
        });
      }
    }

    function updateColors() {
      isDark = document.documentElement.classList.contains("dark");
    }

    function animate() {
      const width = el.offsetWidth;
      const height = el.offsetHeight;

      c.clearRect(0, 0, width, height);

      const particleColor = isDark ? "rgba(129, 140, 248, " : "rgba(99, 102, 241, ";
      const lineColor = isDark ? "rgba(129, 140, 248, " : "rgba(99, 102, 241, ";
      const particleOpacity = isDark ? "0.8)" : "0.5)";
      const lineOpacityFactor = isDark ? 0.3 : 0.15;

      // Update and draw particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Mouse interaction
        const dx = mouseRef.current.x - p.x;
        const dy = mouseRef.current.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouseDistance) {
          const force = (mouseDistance - dist) / mouseDistance;
          p.vx -= (dx / dist) * force * 0.02;
          p.vy -= (dy / dist) * force * 0.02;
        }

        // Draw particle
        c.beginPath();
        c.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        c.fillStyle = particleColor + particleOpacity;
        c.fill();
      });

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            const opacity = (1 - dist / connectionDistance) * lineOpacityFactor;
            c.beginPath();
            c.moveTo(particles[i].x, particles[i].y);
            c.lineTo(particles[j].x, particles[j].y);
            c.strokeStyle = lineColor + opacity + ")";
            c.lineWidth = 0.5;
            c.stroke();
          }
        }

        // Mouse connections
        const dx = mouseRef.current.x - particles[i].x;
        const dy = mouseRef.current.y - particles[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouseDistance) {
          const opacity = (1 - dist / mouseDistance) * lineOpacityFactor * 1.5;
          c.beginPath();
          c.moveTo(particles[i].x, particles[i].y);
          c.lineTo(mouseRef.current.x, mouseRef.current.y);
          c.strokeStyle = lineColor + opacity + ")";
          c.lineWidth = 0.8;
          c.stroke();
        }
      }

      animationId = requestAnimationFrame(animate);
    }

    resize();
    createParticles();
    updateColors();
    animate();

    window.addEventListener("resize", () => {
      resize();
      createParticles();
    });

    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className || ""}`}
      style={{ pointerEvents: "none" }}
    />
  );
}
