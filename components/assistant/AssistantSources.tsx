"use client";

import { BookOpen, FolderOpen, Code2, ExternalLink } from "lucide-react";
import type { SourceReference } from "../../lib/assistant/types";

interface AssistantSourcesProps {
  sources: SourceReference[];
}

const iconMap: Record<string, typeof BookOpen> = {
  blog: BookOpen,
  project: FolderOpen,
  code: Code2,
  site: BookOpen,
  doc: BookOpen,
};

const labelMap: Record<string, string> = {
  blog: "文章",
  project: "项目",
  code: "代码",
  site: "站点",
  doc: "文档",
};

export function AssistantSources({ sources }: AssistantSourcesProps) {
  if (sources.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs text-[var(--muted)] font-medium">参考来源 ({sources.length})</p>
      <div className="space-y-1.5">
        {sources.slice(0, 3).map((source, i) => {
          const Icon = iconMap[source.sourceType] || BookOpen;
          const label = labelMap[source.sourceType] || "资料";

          return (
            <div
              key={i}
              className="flex items-center gap-2 p-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)]/50 text-xs hover:border-[var(--primary)]/30 transition-colors"
            >
              <Icon className="w-3 h-3 text-[var(--primary)] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-[var(--foreground)] truncate block">{source.title}</span>
                <span className="text-[var(--muted)]">{label}</span>
              </div>
              {source.url && (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 text-[var(--muted)] hover:text-[var(--primary)]"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
