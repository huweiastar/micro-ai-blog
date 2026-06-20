"use client";

import { useMemo, useRef, useState } from "react";
import { ExternalLink, X } from "lucide-react";
import type { CSSProperties, PointerEvent } from "react";
import type { Friend } from "../../lib/friends";
import { MessageBottle } from "./MessageBottle";

interface FriendsDriftProps {
  friends: Friend[];
}

type ScatterPoint = {
  x: number;
  y: number;
  rotation: number;
  scale: number;
};

type DragState = {
  key: string;
  startX: number;
  startY: number;
  startDx: number;
  startDy: number;
  moved: boolean;
};

function hashString(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function jitter(seed: number, salt: number) {
  const x = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function buildScatter(friends: Friend[]): ScatterPoint[] {
  const count = friends.length;
  const cols = Math.max(1, Math.ceil(Math.sqrt(count * 1.6)));
  const rows = Math.max(1, Math.ceil(count / cols));

  return friends.map((friend, index) => {
    const seed = hashString(friend.url || friend.name);
    const col = index % cols;
    const row = Math.floor(index / cols);
    const baseX = ((col + 0.5) / cols) * 100;
    const baseY = ((row + 0.5) / rows) * 100;

    return {
      x: Math.max(
        8,
        Math.min(92, baseX + (jitter(seed, 1) - 0.5) * (72 / cols))
      ),
      y: Math.max(
        10,
        Math.min(90, baseY + (jitter(seed, 2) - 0.5) * (52 / rows))
      ),
      rotation: (jitter(seed, 3) - 0.5) * 88,
      scale: 0.86 + jitter(seed, 4) * 0.3,
    };
  });
}

function getInitial(name: string) {
  return name.trim().slice(0, 1).toUpperCase();
}

export function FriendsDrift({ friends }: FriendsDriftProps) {
  const positions = useMemo(() => buildScatter(friends), [friends]);
  const [active, setActive] = useState<Friend | null>(null);
  const [offsets, setOffsets] = useState<
    Record<string, { dx: number; dy: number }>
  >({});
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const wasDragged = useRef(false);

  const startDrag = (
    event: PointerEvent<HTMLButtonElement>,
    friend: Friend
  ) => {
    const current = offsets[friend.url] ?? { dx: 0, dy: 0 };
    dragRef.current = {
      key: friend.url,
      startX: event.clientX,
      startY: event.clientY,
      startDx: current.dx,
      startDy: current.dy,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const container = containerRef.current;
    if (!drag || !container) return;

    const rect = container.getBoundingClientRect();
    const movedX = event.clientX - drag.startX;
    const movedY = event.clientY - drag.startY;
    if (Math.abs(movedX) > 4 || Math.abs(movedY) > 4) drag.moved = true;

    setOffsets((current) => ({
      ...current,
      [drag.key]: {
        dx: drag.startDx + (movedX / rect.width) * 100,
        dy: drag.startDy + (movedY / rect.height) * 100,
      },
    }));
  };

  const endDrag = () => {
    wasDragged.current = dragRef.current?.moved ?? false;
    dragRef.current = null;
    window.setTimeout(() => {
      wasDragged.current = false;
    }, 0);
  };

  return (
    <>
      <div
        ref={containerRef}
        className="bg-[var(--card)]/45 shadow-[var(--primary)]/5 relative min-h-[420px] select-none overflow-hidden rounded-2xl border border-[var(--card-border)] p-4 shadow-lg backdrop-blur sm:min-h-[560px]"
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(56,189,248,0.16),transparent_28%),radial-gradient(circle_at_82%_78%,rgba(168,85,247,0.14),transparent_30%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-sky-500/10 to-transparent"
        />

        {friends.map((friend, index) => {
          const position = positions[index];
          const offset = offsets[friend.url] ?? { dx: 0, dy: 0 };
          const size = Math.round(56 * position.scale);
          const style = {
            left: String(position.x + offset.dx) + "%",
            top: String(position.y + offset.dy) + "%",
            "--friend-rotation": String(position.rotation) + "deg",
            "--friend-delay": String(index * 110) + "ms",
            "--friend-duration": String(3.1 + (index % 5) * 0.45) + "s",
          } as CSSProperties;

          return (
            <button
              key={friend.url}
              type="button"
              className="friend-bottle group absolute -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none rounded-full outline-none transition-transform duration-200 hover:scale-110 focus-visible:ring-2 focus-visible:ring-[var(--primary)] active:cursor-grabbing"
              style={style}
              onPointerDown={(event) => startDrag(event, friend)}
              onClick={() => {
                if (!wasDragged.current) setActive(friend);
              }}
              aria-label={"查看 " + friend.name + " 的友链信息"}
            >
              <MessageBottle size={size} className="drop-shadow-xl" />
              <span className="bg-[var(--card)]/85 pointer-events-none absolute -bottom-4 left-1/2 max-w-28 -translate-x-1/2 truncate rounded-full border border-[var(--card-border)] px-2 py-0.5 text-xs font-medium text-[var(--foreground)] opacity-0 shadow-lg backdrop-blur transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                {friend.name}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-center text-xs text-[var(--muted)]">
        点击漂流瓶查看朋友详情，拖动瓶子整理这片海面。
      </p>

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="friend-dialog-title"
        >
          <button
            type="button"
            aria-label="关闭友链详情"
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            onClick={() => setActive(null)}
          />
          <div className="bg-[var(--card)]/90 relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/30 p-6 text-center shadow-2xl backdrop-blur-xl dark:border-white/10">
            <button
              type="button"
              onClick={() => setActive(null)}
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--card-border)] text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
              aria-label="关闭"
            >
              <X className="h-4 w-4" />
            </button>
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-transparent"
              style={
                active.themeColor
                  ? { background: active.themeColor }
                  : undefined
              }
            />
            <div className="bg-[var(--primary)]/10 mx-auto mb-4 mt-2 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-[var(--card-border)] text-2xl font-bold text-[var(--primary)] shadow-xl">
              {active.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={active.avatar}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                getInitial(active.name)
              )}
            </div>
            <h2 id="friend-dialog-title" className="text-lg font-semibold">
              {active.name}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              {active.description}
            </p>
            <a
              href={active.url}
              target="_blank"
              rel="noopener noreferrer"
              className="shadow-[var(--primary)]/20 mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-[var(--primary-hover)]"
            >
              <ExternalLink className="h-4 w-4" />
              访问主页
            </a>
          </div>
        </div>
      )}
    </>
  );
}
