"use client";

import { useMemo, useState } from "react";
import { Search, ArrowDownAZ, ArrowUpZA } from "lucide-react";
import { MomentCard, type MomentCardProps } from "./MomentCard";

type Moment = Omit<MomentCardProps, "authorName" | "avatar" | "commentsEnabled"> & {
  plain: string; // 去标签的纯文本，供搜索
};

export function NotesFeed({
  moments,
  authorName,
  avatar,
  commentsEnabled,
}: {
  moments: Moment[];
  authorName: string;
  avatar?: string;
  commentsEnabled: boolean;
}) {
  const [q, setQ] = useState("");
  const [order, setOrder] = useState<"desc" | "asc">("desc");

  const list = useMemo(() => {
    let r = [...moments];
    const query = q.trim().toLowerCase();
    if (query) {
      r = r.filter(
        (m) =>
          m.plain.toLowerCase().includes(query) ||
          (m.location ?? "").toLowerCase().includes(query)
      );
    }
    r.sort((a, b) => {
      const t = new Date(a.date).getTime() - new Date(b.date).getTime();
      return order === "desc" ? -t : t;
    });
    return r;
  }, [moments, q, order]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索说说…"
            className="w-full rounded-full border border-[var(--card-border)] bg-[var(--card)] py-2 pl-9 pr-4 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]/50"
          />
        </div>
        <button
          onClick={() => setOrder((o) => (o === "desc" ? "asc" : "desc"))}
          aria-label="切换时间排序"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--card-border)] text-[var(--muted)] transition-colors hover:text-[var(--primary)]"
        >
          {order === "desc" ? <ArrowDownAZ className="h-4 w-4" /> : <ArrowUpZA className="h-4 w-4" />}
        </button>
      </div>

      {list.length === 0 ? (
        <p className="py-16 text-center text-sm text-[var(--muted)]">没有匹配的说说。</p>
      ) : (
        list.map((m) => (
          <MomentCard
            key={m.slug}
            {...m}
            authorName={authorName}
            avatar={avatar}
            commentsEnabled={commentsEnabled}
          />
        ))
      )}
    </div>
  );
}
