"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * 正文图片点击放大（lightbox）。零依赖：事件委托监听 `.prose-custom` 与
 * `[data-zoomable]`（如相册）容器内 img 的点击，用一个 fixed 遮罩展示放大图，
 * 点击遮罩 / Esc 关闭。全局挂载一次（layout 内），对文章/预览/相册生效。
 */
export function ImageZoom() {
  const [zoomed, setZoomed] = useState<{ src: string; alt: string } | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || target.tagName !== "IMG") return;
      if (!target.closest(".prose-custom") && !target.closest("[data-zoomable]")) return;
      const img = target as HTMLImageElement;
      setZoomed({ src: img.currentSrc || img.src, alt: img.alt });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const close = useCallback(() => setZoomed(null), []);

  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    // 打开时锁定背景滚动
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [zoomed, close]);

  if (!zoomed) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={zoomed.alt || "图片预览"}
      onClick={close}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in cursor-zoom-out"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={zoomed.src}
        alt={zoomed.alt}
        className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
      />
    </div>
  );
}
