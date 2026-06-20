import { clsx } from "clsx";

interface PublishHeatmapProps {
  /** 发布日期列表（任意可被 Date 解析的字符串；仅取前 10 位 yyyy-mm-dd）。 */
  dates: string[];
  /** 回溯周数，默认 53（约一年）。 */
  weeks?: number;
}

const WEEKDAY_MS = 24 * 60 * 60 * 1000;

/** 本地时区下格式化为 yyyy-mm-dd，避免 UTC 午夜解析导致的日期漂移。 */
function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * 发布热力图（§Phase3.3）：GitHub 贡献墙风格，按天统计文章/随手记/项目发布密度。
 * 纯 CSS grid，服务端渲染，悬浮 title 提示。空数据时整墙留白（仍显示网格骨架）。
 */
export function PublishHeatmap({ dates, weeks = 53 }: PublishHeatmapProps) {
  // 统计每日发布数
  const counts = new Map<string, number>();
  for (const raw of dates) {
    const key = raw.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  // 以本周周日为终点，向前回溯 weeks 周，列对齐到周日—周六
  const today = new Date();
  const end = new Date(today);
  end.setHours(0, 0, 0, 0);
  end.setDate(end.getDate() + (6 - end.getDay())); // 本周周六
  const totalDays = weeks * 7;
  const start = new Date(end.getTime() - (totalDays - 1) * WEEKDAY_MS);

  const columns: { key: string; count: number; future: boolean; month: number }[][] = [];
  let cursor = new Date(start);
  for (let w = 0; w < weeks; w++) {
    const col: { key: string; count: number; future: boolean; month: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const key = toKey(cursor);
      col.push({
        key,
        count: counts.get(key) ?? 0,
        future: cursor.getTime() > today.getTime(),
        month: cursor.getMonth(),
      });
      cursor = new Date(cursor.getTime() + WEEKDAY_MS);
    }
    columns.push(col);
  }

  const level = (c: number) => (c <= 0 ? 0 : c === 1 ? 1 : c === 2 ? 2 : c <= 4 ? 3 : 4);
  const cellBg = [
    "color-mix(in srgb, var(--card-border) 55%, transparent)",
    "color-mix(in srgb, var(--primary) 28%, transparent)",
    "color-mix(in srgb, var(--primary) 50%, transparent)",
    "color-mix(in srgb, var(--primary) 72%, transparent)",
    "var(--primary)",
  ];

  const total = dates.length;

  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--foreground)]">
          发布热力
        </span>
        <span className="text-xs text-[var(--muted)]">
          近一年 <span className="tabular-nums">{total}</span> 次更新
        </span>
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-1">
          {columns.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-1">
              {col.map((cell) => (
                <div
                  key={cell.key}
                  title={cell.future ? undefined : `${cell.key} · ${cell.count} 次更新`}
                  className={clsx(
                    "h-[11px] w-[11px] rounded-[3px]",
                    cell.future && "opacity-0"
                  )}
                  style={{ background: cellBg[level(cell.count)] }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      {/* 图例 */}
      <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-[var(--muted)]">
        <span>少</span>
        {cellBg.map((bg, i) => (
          <span
            key={i}
            className="h-[11px] w-[11px] rounded-[3px]"
            style={{ background: bg }}
          />
        ))}
        <span>多</span>
      </div>
    </div>
  );
}
