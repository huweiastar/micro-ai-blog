"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { Calendar } from "lucide-react";

interface ArchivePost {
  slug: string;
  title: string;
  publishedAt: string;
  category: { slug: string; name: string } | null;
}

interface ArchiveYear {
  year: number;
  count: number;
  months: { month: number; posts: ArchivePost[] }[];
}

interface TimeRiverProps {
  years: ArchiveYear[];
}

// Flatten all posts sorted by date
function flattenPosts(years: ArchiveYear[]): ArchivePost[] {
  const all: ArchivePost[] = [];
  for (const year of years) {
    for (const month of year.months) {
      all.push(...month.posts);
    }
  }
  return all.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

// Build sinusoidal river path
function buildRiverPath(
  totalWidth: number,
  riverY: number,
  amplitude: number
): string {
  const points: string[] = [];
  const wavelength = totalWidth / 4;
  for (let x = 0; x <= totalWidth; x += 2) {
    const y =
      riverY +
      amplitude * 0.5 * Math.sin((x / wavelength) * 2 * Math.PI) +
      amplitude * 0.3 * Math.sin((x / (wavelength * 0.6)) * 2 * Math.PI + 1) +
      amplitude * 0.2 * Math.sin((x / (wavelength * 1.5)) * 2 * Math.PI + 2.5);
    points.push(`${x},${y}`);
  }
  return `M ${points[0]} ` + points.slice(1).map((p) => `L ${p}`).join(" ");
}

// Get river Y at a given X
function getRiverY(
  x: number,
  totalWidth: number,
  riverY: number,
  amplitude: number
): number {
  const wavelength = totalWidth / 4;
  return (
    riverY +
    amplitude * 0.5 * Math.sin((x / wavelength) * 2 * Math.PI) +
    amplitude * 0.3 * Math.sin((x / (wavelength * 0.6)) * 2 * Math.PI + 1) +
    amplitude * 0.2 * Math.sin((x / (wavelength * 1.5)) * 2 * Math.PI + 2.5)
  );
}

export function TimeRiver({ years }: TimeRiverProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewWidth, setViewWidth] = useState(800);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      for (const e of entries) setViewWidth(e.contentRect.width);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const posts = flattenPosts(years);
  const CARD_W = 180;
  const CARD_H = 200;
  const STEP = CARD_W + 40;
  const totalWidth = Math.max(posts.length * STEP + 200, viewWidth);
  const svgHeight = 500;
  const riverY = svgHeight / 2;
  const amplitude = 60;

  const riverPath = buildRiverPath(totalWidth, riverY, amplitude);

  // Drag scroll
  const dragX = useMotionValue(0);
  const smoothDragX = useSpring(dragX, { stiffness: 100, damping: 30 });

  const [visibleRange, setVisibleRange] = useState<[number, number]>([0, 20]);

  const updateVisibleRange = useCallback(
    (x: number) => {
      const start = Math.max(0, Math.floor(-x / STEP) - 2);
      const end = Math.min(posts.length, start + Math.ceil(viewWidth / STEP) + 4);
      setVisibleRange([start, end]);
    },
    [posts.length, STEP, viewWidth]
  );

  useEffect(() => {
    const unsub = smoothDragX.on("change", updateVisibleRange);
    updateVisibleRange(0);
    return unsub;
  }, [smoothDragX, updateVisibleRange]);

  // Fallback for mobile: vertical timeline
  if (viewWidth < 768) {
    return <VerticalTimeline years={years} />;
  }

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden">
      <motion.div
        drag="x"
        dragMomentum
        dragElastic={0.1}
        dragConstraints={{
          left: -(totalWidth - viewWidth),
          right: 0,
        }}
        style={{ x: smoothDragX }}
        className="relative"
      >
        <svg
          width={totalWidth}
          height={svgHeight}
          className="block"
        >
          <defs>
            <linearGradient id="river-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* River path */}
          <motion.path
            d={riverPath}
            fill="none"
            stroke="url(#river-grad)"
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#glow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.8, ease: "easeInOut" }}
          />

          {/* Flowing particles */}
          {[0, 0.3, 0.6].map((offset, i) => (
            <circle key={i} r="3" fill="#38bdf8" opacity="0.7">
              <animateMotion
                dur={`${8 + i * 1.5}s`}
                repeatCount="indefinite"
                begin={`${offset * 8}s`}
              >
                <mpath href="#river-flow-path" />
              </animateMotion>
            </circle>
          ))}
          <path id="river-flow-path" d={riverPath} fill="none" stroke="none" />

          {/* Post cards */}
          {posts
            .slice(visibleRange[0], visibleRange[1])
            .map((post, idx) => {
              const i = visibleRange[0] + idx;
              const cx = 100 + i * STEP;
              const waveY = getRiverY(cx, totalWidth, riverY, amplitude);
              const isAbove = i % 2 === 0;
              const cardY = isAbove ? waveY - CARD_H - 30 : waveY + 30;

              return (
                <g key={post.slug}>
                  {/* Dashed connector line */}
                  <line
                    x1={cx + CARD_W / 2}
                    y1={cardY + (isAbove ? CARD_H : 0)}
                    x2={cx + CARD_W / 2}
                    y2={waveY}
                    stroke={post.category ? "var(--primary)" : "#94a3b8"}
                    strokeWidth="1"
                    strokeDasharray="4 3"
                    opacity="0.6"
                  />

                  {/* River node */}
                  <circle
                    cx={cx + CARD_W / 2}
                    cy={waveY}
                    r="6"
                    fill="white"
                    stroke={post.category ? "var(--primary)" : "#94a3b8"}
                    strokeWidth="2"
                  />

                  {/* Card */}
                  <foreignObject
                    x={cx}
                    y={cardY}
                    width={CARD_W}
                    height={CARD_H}
                  >
                    <motion.a
                      href={`/blog/${post.slug}`}
                      initial={{ opacity: 0, y: isAbove ? -20 : 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.03 }}
                      className="block h-full rounded-lg border border-[var(--card-border)] bg-white/80 p-3 shadow-md backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:bg-[var(--card)]/80"
                    >
                      {post.category && (
                        <span className="mb-1 inline-block rounded-full bg-[var(--primary)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--primary)]">
                          {post.category.name}
                        </span>
                      )}
                      <h3 className="line-clamp-2 text-sm font-bold leading-tight text-[var(--foreground)]">
                        {post.title}
                      </h3>
                      <p className="mt-2 text-xs text-[var(--muted)]">
                        {new Date(post.publishedAt).toLocaleDateString("zh-CN")}
                      </p>
                    </motion.a>
                  </foreignObject>
                </g>
              );
            })}
        </svg>
      </motion.div>

      {/* Drag hint */}
      <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/10 px-4 py-1.5 text-xs text-[var(--muted)] backdrop-blur-sm dark:bg-white/10">
        ← 拖拽浏览时间线 →
      </div>
    </div>
  );
}

// ── Mobile fallback: vertical timeline ────────────────────────────
function VerticalTimeline({ years }: { years: ArchiveYear[] }) {
  return (
    <div className="space-y-8 px-4">
      {years.map((year) => (
        <div key={year.year}>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-sm font-bold text-white shadow-md">
              {String(year.year).slice(2)}
            </div>
            <h2 className="text-lg font-bold">{year.year} 年</h2>
            <span className="text-sm text-[var(--muted)]">{year.count} 篇</span>
          </div>
          <div className="ml-5 space-y-4 border-l-2 border-[var(--card-border)] pl-6">
            {year.months.map((month) => (
              <div key={month.month}>
                <h3 className="mb-2 text-sm font-medium text-[var(--muted)]">
                  {month.month} 月
                </h3>
                <ul className="space-y-2">
                  {month.posts.map((post) => (
                    <li key={post.slug} className="group relative">
                      <span className="absolute -left-[29px] top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--card-border)] ring-4 ring-[var(--background)] transition-colors group-hover:bg-[var(--primary)]" />
                      <a
                        href={`/blog/${post.slug}`}
                        className="flex items-center justify-between gap-2 text-sm transition-colors hover:text-[var(--primary)]"
                      >
                        <span className="truncate">{post.title}</span>
                        <span className="shrink-0 text-xs text-[var(--muted)]">
                          {new Date(post.publishedAt).toLocaleDateString("zh-CN")}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
