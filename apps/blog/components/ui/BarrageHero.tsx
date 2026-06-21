"use client";

interface BarrageHeroProps {
  items: string[];
}

const TRACKS = 6; // 轨道数（行数）

// 确定性伪随机：同一 index 在 server/client 得到相同值，避免水合不匹配。
function hash(n: number): number {
  let h = (n + 1) * 2654435761;
  h = (h ^ (h >>> 13)) >>> 0;
  return h;
}

/**
 * 首页 Hero 横向弹幕背景：纯 CSS 动画，多轨道循环飘字。
 * 颜色走 CSS 变量，亮暗自适应；处于标题下层（z 低）。
 * reduced-motion 下全局 globals.css 会把动画时长压到 ~0 → 弹幕滑出视野即不显示。
 */
export function BarrageHero({ items }: BarrageHeroProps) {
  if (items.length === 0) return null;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {items.map((text, i) => {
        const track = i % TRACKS;
        const topPct = 8 + track * (84 / TRACKS); // 8%~92% 纵向均分
        const duration = 18 + (hash(i) % 8); // 18~25s，降低密度，更像逐条飘过
        const delay = Math.floor(i / TRACKS) * 5.5 + track * 1.4;
        const tone = ["var(--primary)", "var(--accent)", "var(--muted)"][hash(i * 3) % 3];
        return (
          <span
            key={i}
            className="absolute whitespace-nowrap text-sm sm:text-base font-medium select-none"
            style={{
              top: `${topPct}%`,
              left: "100%",
              color: tone,
              opacity: 0.55,
              animation: `barrage-scroll ${duration}s linear ${delay}s infinite`,
              willChange: "transform",
            }}
          >
            {text}
          </span>
        );
      })}
    </div>
  );
}
