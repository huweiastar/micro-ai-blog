"use client";

import { useEffect, useState } from "react";
import { Eye, Users } from "lucide-react";

interface ViewCountProps {
  path: string;
  className?: string;
}

export function ViewCount({ path, className = "" }: ViewCountProps) {
  const [stats, setStats] = useState<{ pv: number; uv: number } | null>(null);

  useEffect(() => {
    // Fetch stats on mount
    // We can use the global analytics endpoint or a specific path endpoint if we add one.
    // For now, let's just show a placeholder or fetch from a new endpoint.
    // To keep it simple, I'll add a GET endpoint for path stats later, or just show global stats for now.
    // Actually, let's just implement a simple fetch to a new endpoint or use the existing one.
    // Since I haven't added a GET /api/analytics?path=..., I'll just add it now.
    fetch(`/api/analytics?path=${encodeURIComponent(path)}`)
      .then((res) => res.json())
      .then((data) => {
        setStats({ pv: data.pv || 0, uv: data.uv || 0 });
      })
      .catch(() => {});
  }, [path]);

  if (!stats) {
    return <span className={`inline-flex items-center gap-1 text-xs text-[var(--muted)] ${className}`}>加载中...</span>;
  }

  return (
    <span className={`inline-flex items-center gap-3 text-xs text-[var(--muted)] ${className}`}>
      <span className="inline-flex items-center gap-1" title="浏览量 (PV)">
        <Eye className="w-3.5 h-3.5" />
        {stats.pv}
      </span>
      <span className="inline-flex items-center gap-1" title="访客数 (UV)">
        <Users className="w-3.5 h-3.5" />
        {stats.uv}
      </span>
    </span>
  );
}
