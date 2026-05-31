"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

interface CommentProps {
  slug: string;
  title: string;
}

export function Comment({ slug, title }: CommentProps) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  const repo = process.env.NEXT_PUBLIC_GISCUS_REPO || "";
  const repoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID || "";

  const isConfigured = repo && repoId && !repo.includes("your-") && !repoId.includes("your-");

  useEffect(() => {
    if (!isConfigured) return;

    const category = process.env.NEXT_PUBLIC_GISCUS_CATEGORY || "General";
    const categoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID || "";

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.setAttribute("data-repo", repo);
    script.setAttribute("data-repo-id", repoId);
    script.setAttribute("data-category", category);
    script.setAttribute("data-category-id", categoryId);
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "bottom");
    script.setAttribute("data-theme", theme === "dark" ? "transparent_dark" : "light");
    script.setAttribute("data-lang", "zh-CN");
    script.setAttribute("crossorigin", "anonymous");
    script.async = true;

    if (containerRef.current) {
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(script);
    }
  }, [theme, slug, isConfigured, repo, repoId]);

  if (!isConfigured) {
    return null;
  }

  return (
    <div className="glass rounded-xl p-6 mt-12">
      <div ref={containerRef} />
    </div>
  );
}
