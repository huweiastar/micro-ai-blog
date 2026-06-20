import type { LucideIcon } from "lucide-react";

interface GeneratedCoverProps {
  /** Deterministic seed — same seed always yields the same artwork (e.g. slug). */
  seed: string;
  /** Text shown as the large monogram. First meaningful glyph is used. */
  label: string;
  /** Optional foreground glyph; overrides the monogram when provided. */
  icon?: LucideIcon;
  className?: string;
}

// Curated, harmonious 3-stop palettes. Index chosen deterministically from the seed.
const PALETTES: [string, string, string][] = [
  ["#6366f1", "#8b5cf6", "#a855f7"], // indigo → violet
  ["#3b82f6", "#0ea5e9", "#06b6d4"], // blue → cyan
  ["#ec4899", "#d946ef", "#a855f7"], // pink → fuchsia
  ["#10b981", "#14b8a6", "#06b6d4"], // emerald → teal
  ["#ec4899", "#f43f5e", "#ef4444"], // pink → rose
  ["#8b5cf6", "#6366f1", "#3b82f6"], // violet → blue
  ["#f43f5e", "#ec4899", "#8b5cf6"], // rose → violet
  ["#0ea5e9", "#6366f1", "#8b5cf6"], // sky → indigo
];

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function monogram(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return "#";
  // Prefer the first CJK char, else first latin char, uppercased.
  const first = Array.from(trimmed)[0];
  return /[a-z]/i.test(first) ? first.toUpperCase() : first;
}

/**
 * 确定性生成的封面艺术：根据 seed 选取调色板，叠加渐变 + 光斑 + 点阵网格 + 字形。
 * 用于无真实封面图时，避免裂图与单调的图标占位。纯展示组件，可在服务端/客户端使用。
 */
export function GeneratedCover({ seed, label, icon: Icon, className = "" }: GeneratedCoverProps) {
  const h = hashSeed(seed);
  const [c0, c1, c2] = PALETTES[h % PALETTES.length];
  const angle = 110 + (h % 7) * 12; // 110–182deg, varies the diagonal
  const blobX = 20 + (h % 50); // 20–70%
  const blobY = 12 + ((h >> 3) % 40); // 12–52%

  return (
    <div
      aria-hidden
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{ background: `linear-gradient(${angle}deg, ${c0}, ${c1})` }}
    >
      {/* Soft radial highlight blob */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(60% 80% at ${blobX}% ${blobY}%, ${c2}cc 0%, transparent 60%)`,
        }}
      />
      {/* Dot-grid overlay for texture */}
      <div
        className="absolute inset-0 opacity-25 mix-blend-soft-light"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1.4px)",
          backgroundSize: "16px 16px",
        }}
      />
      {/* Diagonal sheen */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black/15 via-transparent to-white/15" />
      {/* Foreground glyph / monogram */}
      <div className="absolute inset-0 flex items-center justify-center">
        {Icon ? (
          <Icon className="w-16 h-16 text-white/85 drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]" strokeWidth={1.5} />
        ) : (
          <span className="text-6xl font-black text-white/85 drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)] select-none">
            {monogram(label)}
          </span>
        )}
      </div>
    </div>
  );
}
