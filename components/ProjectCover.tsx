"use client";

import { useState } from "react";

interface ProjectCoverProps {
  src: string;
  alt: string;
}

/**
 * 项目封面图，加载失败时自动隐藏，避免裂图。
 * 用于服务端渲染的项目详情页（需要客户端 onError 处理）。
 */
export function ProjectCover({ src, alt }: ProjectCoverProps) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <div className="mb-6 -mx-8 -mt-8 overflow-hidden rounded-t-xl border-b border-[var(--card-border)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onError={() => setFailed(true)}
        className="w-full h-64 object-cover"
      />
    </div>
  );
}
