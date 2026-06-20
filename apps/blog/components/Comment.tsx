"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { MessageSquare } from "lucide-react";

interface CommentProps {
  slug: string;
  title: string;
}

const GISCUS_ORIGIN = "https://giscus.app";

function giscusTheme(theme: string | undefined): string {
  return theme === "dark" ? "transparent_dark" : "light";
}

export function Comment({ slug }: CommentProps) {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const repo = process.env.NEXT_PUBLIC_GISCUS_REPO || "";
  const repoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID || "";
  const category = process.env.NEXT_PUBLIC_GISCUS_CATEGORY || "General";
  const categoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID || "";

  const isConfigured =
    !!repo && !!repoId && !repo.includes("your-") && !repoId.includes("your-");

  // 懒加载：滚动到评论区附近才挂载
  useEffect(() => {
    if (!isConfigured) return;
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [isConfigured]);

  // 注入 giscus 脚本（仅一次）
  useEffect(() => {
    if (!isConfigured || !visible || loaded) return;
    const el = containerRef.current;
    if (!el) return;

    const script = document.createElement("script");
    script.src = `${GISCUS_ORIGIN}/client.js`;
    script.setAttribute("data-repo", repo);
    script.setAttribute("data-repo-id", repoId);
    script.setAttribute("data-category", category);
    script.setAttribute("data-category-id", categoryId);
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "bottom");
    script.setAttribute("data-theme", giscusTheme(resolvedTheme));
    script.setAttribute("data-lang", "zh-CN");
    script.setAttribute("crossorigin", "anonymous");
    script.async = true;
    script.onload = () => setLoaded(true);
    el.appendChild(script);
    // resolvedTheme 故意不入依赖：主题切换走 postMessage（下一个 effect）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfigured, visible, loaded, repo, repoId, category, categoryId]);

  // 主题切换：用 postMessage 通知已存在的 iframe，避免重建
  useEffect(() => {
    if (!loaded) return;
    const iframe = containerRef.current?.querySelector<HTMLIFrameElement>(
      "iframe.giscus-frame"
    );
    iframe?.contentWindow?.postMessage(
      { giscus: { setConfig: { theme: giscusTheme(resolvedTheme) } } },
      GISCUS_ORIGIN
    );
  }, [resolvedTheme, loaded]);

  if (!isConfigured) {
    return (
      <section className="glass rounded-xl p-6 mt-12">
        <div className="flex items-center gap-2 mb-2 text-[var(--foreground)] font-semibold">
          <MessageSquare className="w-4 h-4" /> 评论
        </div>
        <p className="text-sm text-[var(--muted)]">
          评论系统尚未配置。请在环境变量中设置 giscus（见 docs/giscus-setup.md）。
        </p>
      </section>
    );
  }

  return (
    <section className="glass rounded-xl p-6 mt-12">
      <div className="flex items-center gap-2 mb-4 text-[var(--foreground)] font-semibold">
        <MessageSquare className="w-4 h-4" /> 评论
      </div>
      <div ref={containerRef} className="min-h-[6rem]">
        {visible && !loaded && (
          <div className="space-y-3 animate-pulse" aria-hidden>
            <div className="h-4 w-1/3 rounded bg-[var(--card-border)]" />
            <div className="h-24 w-full rounded bg-[var(--card-border)]" />
          </div>
        )}
      </div>
    </section>
  );
}
