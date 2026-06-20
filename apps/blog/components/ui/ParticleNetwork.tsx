"use client";

import { useEffect, useRef, useState } from "react";

interface ParticleNetworkProps {
  className?: string;
  mousePos: { x: number; y: number };
}

interface Particle {
  x: number;
  y: number;
  // 当前速度（含鼠标扰动），每帧在阻尼下平滑回归到“流场基速”
  vx: number;
  vy: number;
  // 固有速度大小：朝向不再固定，而是逐帧从流场采样 → 自然汇聚/发散/绕流，告别匀速直线
  speed: number;
  // 虚拟景深 z∈(0,1]：近大近快近亮，远小远慢远暗，叠加鼠标视差形成层次
  z: number;
  // 明暗呼吸：粒子亮度随时间微弱起伏，增添“活着”的层次
  twinklePhase: number;
  twinkleSpeed: number;
  radius: number;
}

// —— 值噪声（Perlin 风格）：为流场提供平滑连续的角度场 ——
// 模块级初始化一次，避免每次挂载重建排列表
const PERM = new Uint8Array(512);
(() => {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const tmp = p[i];
    p[i] = p[j];
    p[j] = tmp;
  }
  for (let i = 0; i < 512; i++) PERM[i] = p[i & 255];
})();

function fade(t: number) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function grad(hash: number, x: number, y: number) {
  switch (hash & 3) {
    case 0:
      return x + y;
    case 1:
      return -x + y;
    case 2:
      return x - y;
    default:
      return -x - y;
  }
}
// 返回约 [-1, 1] 的平滑噪声
function noise2(x: number, y: number) {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  x -= Math.floor(x);
  y -= Math.floor(y);
  const u = fade(x);
  const v = fade(y);
  const aa = PERM[PERM[X] + Y];
  const ab = PERM[PERM[X] + Y + 1];
  const ba = PERM[PERM[X + 1] + Y];
  const bb = PERM[PERM[X + 1] + Y + 1];
  return lerp(
    lerp(grad(aa, x, y), grad(ba, x - 1, y), u),
    lerp(grad(ab, x, y - 1), grad(bb, x - 1, y - 1), u),
    v
  );
}

export function ParticleNetwork({ className, mousePos }: ParticleNetworkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef(mousePos);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    setEnabled(!reduce && !coarse);
  }, []);

  useEffect(() => {
    mouseRef.current = mousePos;
  }, [mousePos]);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;

    const el = canvas;
    const c = ctx;

    let animationId: number;
    let particles: Particle[] = [];
    let isDark = false;
    // 帧率无关：以 60fps 为基准换算每帧位移，避免暗色模式辉光降帧导致粒子“变慢”
    let lastTime = performance.now();

    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 50 : 110;
    const connectionDistance = isMobile ? 100 : 150;
    const mouseDistance = isMobile ? 120 : 200;

    // —— 运动参数（以 60fps 单帧为基准单位）——
    const DRIFT = 0.22;          // 基础速度幅度
    const MAX_SPEED = 2.4;       // 速度上限，超过即钳制，杜绝鼠标推力累积造成的乱飞/抖动
    const DAMP = 0.9;            // 每帧阻尼：把鼠标扰动平滑拉回流场基速
    const REPEL = 0.9;           // 鼠标排斥加速度强度：光标如轻推水面，粒子温柔避让后回流
    const WRAP_MARGIN = 24;      // 软环绕边距：出界后从对侧悄然回归，取代生硬的反弹
    const FIELD_SCALE = 0.0018;  // 流场空间频率：越小漩涡越大越舒缓
    const FIELD_DRIFT = 0.00003; // 流场随时间缓慢漂移，避免粒子永远沿同一条流线
    const MOUSE_LERP = 0.12;     // 鼠标坐标平滑系数：消除光标跳变带来的抖动
    const PARALLAX = 14;         // 视差位移幅度（px）：整层粒子随鼠标轻移，形成景深

    // 平滑后的鼠标坐标与是否在区域内
    let smx = -1000;
    let smy = -1000;
    let mouseActive = false;

    function resize() {
      // 用 setTransform 重置变换再缩放，避免多次 resize 时 scale 叠加导致画面变糊
      el.width = el.offsetWidth * window.devicePixelRatio;
      el.height = el.offsetHeight * window.devicePixelRatio;
      c.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    }

    function createParticles() {
      particles = [];
      const width = el.offsetWidth;
      const height = el.offsetHeight;
      for (let i = 0; i < particleCount; i++) {
        const z = 0.3 + Math.random() * 0.7; // 景深
        // 近快远慢；同时整体速度有快有慢，避免步调一致
        const speed = DRIFT * (0.5 + Math.random()) * (0.55 + z * 0.6);
        const angle = noise2(Math.random() * 100, Math.random() * 100) * Math.PI * 2;
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          speed,
          z,
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.001 + Math.random() * 0.0015,
          radius: (0.8 + Math.random() * 1.2) * (0.5 + z),
        });
      }
    }

    function updateColors() {
      isDark = document.documentElement.classList.contains("dark");
    }

    function animate() {
      const width = el.offsetWidth;
      const height = el.offsetHeight;

      const now = performance.now();
      // 归一化到 60fps，并钳制以避免切后台回来时的大跳变
      const dt = Math.min((now - lastTime) / 16.667, 3);
      lastTime = now;

      // —— 鼠标平滑：在区内时 lerp 跟随，离开时直接归位到屏外，避免“幽灵”扫过触发排斥 ——
      const tx = mouseRef.current.x;
      const ty = mouseRef.current.y;
      mouseActive = tx > -500;
      if (mouseActive) {
        const lerpDt = 1 - Math.pow(1 - MOUSE_LERP, dt);
        smx += (tx - smx) * lerpDt;
        smy += (ty - smy) * lerpDt;
      } else {
        smx = tx;
        smy = ty;
      }

      c.clearRect(0, 0, width, height);

      const particleColor = isDark ? "129, 140, 248" : "79, 70, 229";
      const lineColor     = isDark ? "6, 182, 212"   : "99, 102, 241";
      const particleBaseOpacity = isDark ? 0.9 : 0.62;
      const lineOpacityFactor   = isDark ? 0.5 : 0.22;

      // 粒子辉光：暗色更明显，亮色给一点点柔光增加层次又不刺眼
      if (isDark) {
        c.shadowBlur  = 6;
        c.shadowColor = "rgba(129, 140, 248, 0.6)";
      } else {
        c.shadowBlur  = 2;
        c.shadowColor = "rgba(79, 70, 229, 0.35)";
      }

      // 帧率无关阻尼系数
      const dampDt = Math.pow(DAMP, dt);
      const fieldT = now * FIELD_DRIFT;

      // —— 视差：整层粒子随鼠标轻移，连线随之同移以保持一致 ——
      const offX = mouseActive ? ((smx - width / 2) / width) * PARALLAX : 0;
      const offY = mouseActive ? ((smy - height / 2) / height) * PARALLAX : 0;
      c.save();
      c.translate(offX, offY);

      // Update and draw particles
      particles.forEach((p) => {
        // 流场：从噪声采样一个连续变化的朝向，粒子顺流而动 → 有机的汇聚/绕流
        const angle = noise2(p.x * FIELD_SCALE + fieldT, p.y * FIELD_SCALE) * Math.PI * 2;
        const baseVx = Math.cos(angle) * p.speed;
        const baseVy = Math.sin(angle) * p.speed;

        // 鼠标排斥：作用半径内施加背离鼠标的加速度，近景受力更强（视差感），力度随距离 smoothstep 衰减
        if (mouseActive) {
          const dx = p.x - smx;
          const dy = p.y - smy;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < mouseDistance) {
            const t = 1 - dist / mouseDistance;
            const force = t * t * (3 - 2 * t); // smoothstep，越近推力越强又不突兀
            p.vx += (dx / dist) * force * REPEL * (0.5 + p.z) * dt;
            p.vy += (dy / dist) * force * REPEL * (0.5 + p.z) * dt;
          }
        }

        // 阻尼：把当前速度平滑拉回流场基速，鼠标扰动会自然“回流”消散，不会累积乱飞
        p.vx = baseVx + (p.vx - baseVx) * dampDt;
        p.vy = baseVy + (p.vy - baseVy) * dampDt;

        // 速度上限钳制，杜绝抖动
        const sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (sp > MAX_SPEED) {
          p.vx = (p.vx / sp) * MAX_SPEED;
          p.vy = (p.vy / sp) * MAX_SPEED;
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // 软环绕：出界后从对侧悄然回归，取代生硬的边缘反弹
        if (p.x < -WRAP_MARGIN) p.x = width + WRAP_MARGIN;
        else if (p.x > width + WRAP_MARGIN) p.x = -WRAP_MARGIN;
        if (p.y < -WRAP_MARGIN) p.y = height + WRAP_MARGIN;
        else if (p.y > height + WRAP_MARGIN) p.y = -WRAP_MARGIN;

        // 明暗呼吸 + 景深：远处粒子更暗更透，近处更亮
        const twinkle = 0.7 + 0.3 * Math.sin(now * p.twinkleSpeed + p.twinklePhase);
        const depthAlpha = 0.5 + 0.5 * p.z;

        // Draw particle
        c.beginPath();
        c.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        c.fillStyle = `rgba(${particleColor}, ${(particleBaseOpacity * twinkle * depthAlpha).toFixed(3)})`;
        c.fill();
      });

      // Draw connections —— 透明度与线宽均用 smoothstep 在阈值处柔和淡入淡出，消除骤现/骤灭的闪烁
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            const t = 1 - dist / connectionDistance;
            const s = t * t * (3 - 2 * t); // smoothstep
            c.beginPath();
            c.moveTo(particles[i].x, particles[i].y);
            c.lineTo(particles[j].x, particles[j].y);
            c.strokeStyle = `rgba(${lineColor}, ${s * lineOpacityFactor})`;
            c.lineWidth = 0.3 + s * 0.5;
            c.stroke();
          }
        }

        // Mouse connections
        if (mouseActive) {
          const dx = smx - particles[i].x;
          const dy = smy - particles[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouseDistance) {
            const t = 1 - dist / mouseDistance;
            const s = t * t * (3 - 2 * t); // smoothstep 柔和淡入淡出
            c.beginPath();
            c.moveTo(particles[i].x, particles[i].y);
            c.lineTo(smx, smy);
            c.strokeStyle = `rgba(${lineColor}, ${s * lineOpacityFactor * 2})`;
            c.lineWidth = 0.4 + s * 0.6;
            c.stroke();
          }
        }
      }

      c.restore();

      animationId = requestAnimationFrame(animate);
    }

    resize();
    createParticles();
    updateColors();
    animate();

    function handleResize() {
      resize();
      createParticles();
    }
    window.addEventListener("resize", handleResize);

    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className || ""}`}
      style={{ pointerEvents: "none" }}
    />
  );
}
