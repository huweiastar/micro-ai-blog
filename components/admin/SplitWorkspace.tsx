"use client";

import { useMemo, useState } from "react";
import { Search, Plus } from "lucide-react";

export interface SplitWorkspaceProps<T extends { id: string }> {
  items: T[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  renderRow: (item: T, isActive: boolean) => React.ReactNode;
  searchPredicate?: (item: T, q: string) => boolean;
  filters?: Array<{ key: string; label: string; predicate: (i: T) => boolean }>;
  newButtonLabel?: string;
  onNew?: () => void;
  emptyState?: React.ReactNode;
  children: React.ReactNode;
}

export function SplitWorkspace<T extends { id: string }>({
  items,
  selectedId,
  onSelect,
  renderRow,
  searchPredicate,
  filters,
  newButtonLabel = "新建",
  onNew,
  emptyState,
  children,
}: SplitWorkspaceProps<T>) {
  const [q, setQ] = useState("");
  const [filterKey, setFilterKey] = useState<string>("all");

  const filtered = useMemo(() => {
    let out = items;
    if (filterKey !== "all" && filters) {
      const f = filters.find((x) => x.key === filterKey);
      if (f) out = out.filter(f.predicate);
    }
    if (q.trim() && searchPredicate) out = out.filter((i) => searchPredicate(i, q.trim().toLowerCase()));
    return out;
  }, [items, filterKey, filters, q, searchPredicate]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Left: list */}
      <div className="w-80 shrink-0 border-r border-[var(--card-border)] flex flex-col">
        <div className="p-3 space-y-2 border-b border-[var(--card-border)]">
          {onNew && (
            <button
              onClick={onNew}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
              {newButtonLabel}
            </button>
          )}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索…"
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
          </div>
          {filters && filters.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {[{ key: "all", label: "全部" }, ...filters].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilterKey(f.key)}
                  className={`px-2 py-1 text-xs rounded ${
                    filterKey === f.key
                      ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                      : "text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <ul className="flex-1 overflow-y-auto">
          {filtered.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className={`w-full text-left px-3 py-3 border-b border-[var(--card-border)]/40 hover:bg-[var(--card)]/40 transition-colors ${
                  selectedId === item.id ? "bg-[var(--primary)]/5" : ""
                }`}
              >
                {renderRow(item, selectedId === item.id)}
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="p-6 text-center text-sm text-[var(--muted)]">无匹配项</li>
          )}
        </ul>
      </div>

      {/* Right: editor / detail */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {selectedId === null && !children
          ? emptyState ?? (
              <div className="h-full flex items-center justify-center text-[var(--muted)]">
                从左侧选择一项，或点「新建」
              </div>
            )
          : children}
      </div>
    </div>
  );
}
