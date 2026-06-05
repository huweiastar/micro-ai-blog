"use client";

import { useEffect, useState } from "react";
import { BarChart3, FileText, Rocket, Type } from "lucide-react";

interface Stats {
  postCount: number;
  totalWords: number;
  projectCount: number;
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data: Stats) => setStats(data))
      .catch(() => setError("加载统计失败"));
  }, []);

  const cards: Array<{ label: string; value: number; Icon: typeof BarChart3 }> = stats
    ? [
        { label: "文章数", value: stats.postCount, Icon: FileText },
        { label: "总字数", value: stats.totalWords, Icon: Type },
        { label: "项目数", value: stats.projectCount, Icon: Rocket },
      ]
    : [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">访问统计</h1>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-400 mb-4">
          {error}
        </div>
      )}

      {!stats && !error && (
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)]/30 p-12 flex flex-col items-center text-[var(--muted)]">
          <BarChart3 className="w-10 h-10 mb-3 opacity-50 animate-pulse" />
          <p>加载中…</p>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {cards.map((c) => (
            <div
              key={c.label}
              className="rounded-xl border border-[var(--card-border)] bg-[var(--card)]/30 p-6"
            >
              <div className="flex items-center justify-between mb-3 text-[var(--muted)]">
                <span className="text-sm">{c.label}</span>
                <c.Icon className="w-4 h-4" />
              </div>
              <div className="text-3xl font-bold">{c.value.toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
