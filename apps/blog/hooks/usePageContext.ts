"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";

export interface PageContext {
  pathname: string;
  postSlug?: string;
  projectSlug?: string;
  category?: string;
  tag?: string;
}

export function usePageContext(): PageContext {
  const pathname = usePathname();

  return useMemo(() => {
    const ctx: PageContext = { pathname };

    // Blog post page: /blog/[slug]
    const blogMatch = pathname.match(/^\/blog\/([^/]+)/);
    if (blogMatch) {
      ctx.postSlug = blogMatch[1];
    }

    // Project page: /projects/[slug]
    const projectMatch = pathname.match(/^\/projects\/([^/]+)/);
    if (projectMatch) {
      ctx.projectSlug = projectMatch[1];
    }

    // Category page: /categories/[category]
    const categoryMatch = pathname.match(/^\/categories\/([^/]+)/);
    if (categoryMatch) {
      ctx.category = decodeURIComponent(categoryMatch[1]);
    }

    // Tag page: /tags/[tag]
    const tagMatch = pathname.match(/^\/tags\/([^/]+)/);
    if (tagMatch) {
      ctx.tag = decodeURIComponent(tagMatch[1]);
    }

    return ctx;
  }, [pathname]);
}

export function getPageContextHint(ctx: PageContext): string {
  if (ctx.postSlug) return `当前文章：${ctx.postSlug}`;
  if (ctx.projectSlug) return `当前项目：${ctx.projectSlug}`;
  if (ctx.category) return `当前专栏：${ctx.category}`;
  if (ctx.tag) return `当前标签：${ctx.tag}`;
  return "全站范围";
}
