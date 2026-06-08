"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Fuse from "fuse.js";
import type { SearchItem } from "../lib/posts";
import { formatDate } from "../lib/utils";
import { Search, X } from "lucide-react";

interface SearchBoxProps {
  index: SearchItem[];
}

export function SearchBox({ index }: SearchBoxProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const fuseRef = useRef<Fuse<SearchItem> | null>(null);

  useEffect(() => {
    fuseRef.current = new Fuse(index, {
      keys: ["title", "summary", "tags", "category", "content"],
      threshold: 0.3,
      includeScore: true,
    });
  }, [index]);

  useEffect(() => {
    if (!query.trim() || !fuseRef.current) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const searchResults = fuseRef.current
      .search(query)
      .filter((result) => result.score && result.score < 0.4)
      .slice(0, 10)
      .map((result) => result.item);

    setResults(searchResults);
    setIsSearching(false);
  }, [query]);

  return (
    <div className="w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索文章、项目..."
          className="w-full pl-10 pr-10 py-3 rounded-xl border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {query && (
        <div className="mt-4 space-y-3">
          {isSearching ? (
            <p className="text-center text-[var(--muted)] text-sm">搜索中...</p>
          ) : results.length > 0 ? (
            <>
              <p className="text-sm text-[var(--muted)]">
                找到 {results.length} 条相关结果
              </p>
              {results.map((item) => {
                const isProject = item.type === "project";
                return (
                  <Link
                    key={`${item.type}-${item.slug}`}
                    href={isProject ? `/projects/${item.slug}` : `/blog/${item.slug}`}
                    className="block p-4 rounded-lg border border-[var(--card-border)] bg-[var(--card)] hover:border-[var(--primary)]/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${
                          isProject
                            ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                            : "bg-[var(--primary)]/10 text-[var(--primary)]"
                        }`}
                      >
                        {isProject ? "项目" : "文章"}
                      </span>
                      <h3 className="font-medium text-[var(--foreground)]">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-sm text-[var(--muted)] line-clamp-2">
                      {item.summary}
                    </p>
                    <div className="flex gap-2 mt-2">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded bg-[var(--primary)]/10 text-[var(--primary)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </Link>
                );
              })}
            </>
          ) : (
            <p className="text-center text-[var(--muted)] text-sm">
              未找到相关结果
            </p>
          )}
        </div>
      )}
    </div>
  );
}
