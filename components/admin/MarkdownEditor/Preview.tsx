"use client";

import { useMemo } from "react";

export interface PreviewProps {
  markdown: string;
  /** Optional renderer override; if not provided, uses the built-in. */
  render?: (md: string) => { __html: string };
  className?: string;
}

function defaultRender(md: string): { __html: string } {
  if (!md.trim()) return { __html: '<span class="text-[var(--muted)] text-sm">暂无内容</span>' };
  const codeBlocks: string[] = [];
  let pmd = md.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const idx = codeBlocks.length;
    codeBlocks.push(`<pre class="bg-[var(--code-bg)] text-[var(--code-text)] rounded-lg p-4 my-4 overflow-x-auto text-sm font-mono"><code class="language-${lang}">${code.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`);
    return `\x00CODEBLOCK_${idx}\x00`;
  });
  pmd = pmd.replace(/\|(.+)\|\n\|[-\s|:]+\|\n((?:\|.+\|\n?)*)/g, (_, hr, br) => {
    const hs = hr.split("|").filter((c: string) => c.trim()).map((c: string) => `<th class="px-4 py-3 text-left font-semibold bg-[var(--card)] border-b border-[var(--card-border)]">${c.trim()}</th>`).join("");
    const rs = br.trim().split("\n").map((row: string) => `<tr>${row.split("|").filter((c: string) => c.trim()).map((c: string) => `<td class="px-4 py-3 border-b border-[var(--card-border)]">${c.trim()}</td>`).join("")}</tr>`).join("");
    return `<table class="w-full border-collapse my-4 rounded-lg overflow-hidden border border-[var(--card-border)]"><thead><tr>${hs}</tr></thead><tbody>${rs}</tbody></table>`;
  });
  let html = pmd
    .replace(/<figure[^>]*class="([^"]*image-block[^"]*)"[^>]*>([\s\S]*?)<\/figure>/gi, (_, cls, inner) => {
      const isSingle = !cls.includes("flex-1");
      const imgMatch = inner.match(/<img[^>]*>/i);
      const imgHtml = imgMatch ? imgMatch[0] : "";
      const capMatch = inner.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i);
      const caption = capMatch ? capMatch[1] : "";
      return `<div class="${isSingle ? "my-6 text-center" : "flex-1 text-center"}">${imgHtml.replace(/class="([^"]*)"/, `class="$1 rounded-lg shadow-sm"`)}${caption ? `<p class="text-xs text-[var(--muted)] mt-2 italic">${caption}</p>` : ""}</div>`;
    })
    .replace(/<div\s+class="flex\s+gap-4">([\s\S]*?)<\/div>/gi, (_, inner) => `<div class="flex gap-4 my-6">${inner}</div>`)
    .replace(/^###### (.+)$/gm, "<h6 class='text-sm font-semibold mt-4 mb-2'>$1</h6>")
    .replace(/^##### (.+)$/gm, "<h5 class='text-base font-semibold mt-5 mb-2'>$1</h5>")
    .replace(/^#### (.+)$/gm, "<h4 class='text-lg font-semibold mt-6 mb-3'>$1</h4>")
    .replace(/^### (.+)$/gm, "<h3 class='text-lg font-semibold mt-6 mb-3'>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2 class='text-xl font-bold mt-8 mb-4'>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1 class='text-2xl font-bold mt-8 mb-4'>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/~~(.+?)~~/g, "<del>$1</del>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/==(.+?)==/g, "<mark class='bg-yellow-200 dark:bg-yellow-800 px-1 rounded'>$1</mark>")
    .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-lg my-4"/>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-[var(--link)] hover:text-[var(--link-hover)] underline underline-offset-2">$1</a>')
    .replace(/`([^`]+?)`/g, '<code class="px-2 py-0.5 rounded bg-[var(--card)] text-[var(--primary)] text-sm font-mono">$1</code>')
    .replace(/^- \[ \] (.+)$/gm, '<li class="flex items-center gap-2 my-1"><input type="checkbox" disabled class="accent-[var(--primary)]"><span>$1</span></li>')
    .replace(/^- \[x\] (.+)$/gm, '<li class="flex items-center gap-2 my-1"><input type="checkbox" checked disabled class="accent-[var(--primary)]"><span class="line-through text-[var(--muted)]">$1</span></li>')
    .replace(/^- (.+)$/gm, "<li class='ml-4 list-disc my-1'>$1</li>")
    .replace(/^\d+\. (.+)$/gm, "<li class='ml-4 list-decimal my-1'>$1</li>")
    .replace(/^> (.+)$/gm, "<blockquote class='border-l-4 border-[var(--primary)] pl-4 my-4 text-[var(--muted)] italic bg-[var(--card)]/50 py-3 pr-4 rounded-r-lg'>$1</blockquote>")
    .replace(/\$\$(.+?)\$\$/g, '<div class="text-center my-4 p-3 bg-[var(--card)] rounded-lg font-mono">$1</div>')
    .replace(/\$(.+?)\$/g, '<span class="font-mono text-[var(--primary)]">$1</span>')
    .replace(/^---$/gm, '<hr class="border-[var(--card-border)] my-6"/>');
  html = html.replace(/\x00CODEBLOCK_(\d+)\x00/g, (_, idx) => codeBlocks[parseInt(idx)] || "");
  html = html.replace(/\n\n/g, "<br/><br/>");
  const footnotes: Record<string, string> = {};
  html = html.replace(/\[\^(\d+)\]:\s*(.+?)(?=\n\n|\[\^|$)/g, (_, num, content) => { footnotes[num] = content; return ""; });
  html = html.replace(/\[\^(\d+)\]/g, (_, num) => `<sup class="text-[var(--primary)] font-semibold cursor-pointer hover:underline">${num}</sup>`);
  if (Object.keys(footnotes).length > 0) html += `<hr class="border-[var(--card-border)] my-6"/><div class="mt-4 pt-4 border-t border-[var(--card-border)]"><h4 class="text-sm font-semibold text-[var(--muted)] mb-2">脚注</h4>${Object.entries(footnotes).map(([num, content]) => `<div class="flex gap-2 my-1 text-xs text-[var(--muted)]"><sup class="text-[var(--primary)] font-semibold">${num}.</sup><span>${content}</span></div>`).join("")}</div>`;
  return { __html: html };
}

export function Preview({ markdown, render, className }: PreviewProps) {
  const html = useMemo(() => (render ?? defaultRender)(markdown), [markdown, render]);
  return (
    <div
      className={`prose-custom prose prose-invert max-w-none px-4 py-3 ${className ?? ""}`}
      dangerouslySetInnerHTML={html}
    />
  );
}
