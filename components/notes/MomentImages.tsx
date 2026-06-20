/**
 * 说说配图：1 张居中 / 多张九宫格（最多 9，超出显示 +N）。
 * 外层带 data-zoomable，复用全局 ImageZoom 灯箱。
 */
export function MomentImages({ images }: { images?: string[] }) {
  if (!images || images.length === 0) return null;
  const count = images.length;
  const shown = images.slice(0, 9);
  const cols = count === 1 ? 1 : count <= 4 ? 2 : 3;

  return (
    <div
      data-zoomable
      className="mt-4 grid gap-2"
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        maxWidth: count === 1 ? 320 : cols === 2 ? 320 : 360,
      }}
    >
      {shown.map((src, i) => {
        const more = i === 8 && count > 9;
        return (
          <div
            key={src + i}
            className="relative aspect-square overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt="说说配图"
              loading="lazy"
              className="absolute inset-0 h-full w-full cursor-zoom-in object-cover transition-transform duration-500 hover:scale-105"
            />
            {more && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/60 text-lg font-black text-white backdrop-blur-[2px]">
                +{count - 9}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
