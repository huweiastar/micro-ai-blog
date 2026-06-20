"use client";

import { useState } from "react";
import { GeneratedCover } from "./ui/GeneratedCover";

interface ProjectCoverProps {
  /** Real cover image; when missing or broken, deterministic artwork is shown instead. */
  src?: string;
  alt: string;
  /** Seed for the generated fallback (project slug). */
  seed: string;
}

/**
 * 项目封面：有真实图则用图（加载失败回退），否则渲染确定性生成封面。
 * 用于服务端渲染的项目详情页（需要客户端 onError 处理）。
 */
export function ProjectCover({ src, alt, seed }: ProjectCoverProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <div className="mb-6 -mx-8 -mt-8 h-64 overflow-hidden rounded-t-xl border-b border-[var(--card-border)]">
      {showImage ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <GeneratedCover seed={seed} label={alt} />
      )}
    </div>
  );
}
