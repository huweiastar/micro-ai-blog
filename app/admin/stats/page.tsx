"use client";

import { useEffect, useState } from "react";
import { BarChart3, FileText, Rocket, Type, Eye, Users } from "lucide-react";

interface Stats {
  postCount: number;
  totalWords: number;
  projectCount: number;
}

interface VisitSummary {
  pv: number;
  uv: number;
  updatedAt: string;
  paths: Array<{ path: string; pv: number; uv: number; updatedAt: string }>;
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [visits, setVisits] = useState<VisitSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data: Stats) => setStats(data))
      .catch(() => setError("加载统计失败"));

    fetch("/api/analytics?scope=admin")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: VisitSummary | null) => data && setVisits(data))
      .catch(() => {});
  }, []);

  const cards: Array<{ label: string; value: number; Icon: typeof BarChart3 }> = [
    ...(visits
      ? [
          { label: "总浏览量 (PV)", value: visits.pv, Icon: Eye },
          { label: "总访客数 (UV)", value: visits.uv, Icon: Users },
        ]
      : []),
    ...(stats
      ? [
          { label: "文章数", value: stats.postCount, Icon: FileText },
          { label: "总字数", value: stats.totalWords, Icon: Type },
          { label: "项目数", value: stats.projectCount, Icon: Rocket },
        ]
      : []),
  ];

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

      {cards.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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

      {visits && visits.paths.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3">页面访问排行</h2>
          <div className="overflow-x-auto rounded-xl border border-[var(--card-border)] bg-[var(--card)]/30">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--card-border)] text-[var(--muted)] text-left">
                  <th className="px-4 py-3 font-medium">页面</th>
                  <th className="px-4 py-3 font-medium text-right whitespace-nowrap">PV</th>
                  <th className="px-4 py-3 font-medium text-right whitespace-nowrap">UV</th>
                </tr>
              </thead>
              <tbody>
                {visits.paths.slice(0, 50).map((p) => (
                  <tr
                    key={p.path}
                    className="border-b border-[var(--card-border)]/50 last:border-0"
                  >
                    <td className="px-4 py-2.5">
                      <a
                        href={p.path}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--primary)] hover:underline break-all"
                      >
                        {p.path}
                      </a>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{p.pv.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{p.uv.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
