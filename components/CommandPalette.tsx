"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import Fuse from "fuse.js";
import {
  Search,
  FileText,
  FolderGit2,
  Compass,
  Sun,
  Moon,
  Bookmark,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { navConfig } from "../config/nav";
import type { SearchItem } from "../lib/posts";
import { COMMAND_PALETTE_OPEN_EVENT } from "./command-palette-bus";

type Command = {
  id: string;
  title: string;
  subtitle?: string;
  badge: string;
  icon: LucideIcon;
  href?: string;
  run?: () => void;
};

export function CommandPalette({ autoOpen = false }: { autoOpen?: boolean }) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [items, setItems] = useState<SearchItem[]>([]);
  const loadedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys: ["title", "summary", "tags", "category", "content"],
        threshold: 0.3,
        includeScore: true,
      }),
    [items]
  );

  // Lazy-load the search index the first time the palette opens.
  const ensureIndex = useCallback(async () => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    try {
      const res = await fetch("/search-index.json");
      if (res.ok) setItems(await res.json());
    } catch {
      /* index unavailable — palette still works for pages/actions */
    }
  }, []);

  const close = useCallback(() => setOpen(false), []);

  const openPalette = useCallback(() => {
    setQuery("");
    setActive(0);
    setOpen(true);
    void ensureIndex();
  }, [ensureIndex]);

  // Global ⌘K / Ctrl+K and custom open event.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        setQuery("");
        setActive(0);
        void ensureIndex();
      }
    };
    const onOpen = () => openPalette();
    window.addEventListener("keydown", onKey);
    window.addEventListener(COMMAND_PALETTE_OPEN_EVENT, onOpen as EventListener);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(COMMAND_PALETTE_OPEN_EVENT, onOpen as EventListener);
    };
  }, [ensureIndex, openPalette]);

  // 当被懒加载门控按需挂载时，组件加载完成后自行打开，
  // 避免依赖"挂载后补发事件"与异步 chunk 加载之间的竞态。
  useEffect(() => {
    if (autoOpen) openPalette();
    // 仅在首次挂载时根据 autoOpen 触发一次。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Focus input + lock scroll while open.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 20);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const commands = useMemo<Command[]>(() => {
    const q = query.trim();

    const pageCmds: Command[] = navConfig
      .filter((n) => !q || n.title.toLowerCase().includes(q.toLowerCase()))
      .map((n) => ({
        id: `page:${n.href}`,
        title: n.title,
        badge: "页面",
        icon: Compass,
        href: n.href,
      }));

    const actionCmds: Command[] = [
      {
        id: "action:theme",
        title: resolvedTheme === "dark" ? "切换到亮色模式" : "切换到暗色模式",
        badge: "操作",
        icon: resolvedTheme === "dark" ? Sun : Moon,
        run: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
      },
      {
        id: "action:bookmarks",
        title: "我的收藏",
        badge: "页面",
        icon: Bookmark,
        href: "/bookmarks",
      },
    ].filter((c) => !q || c.title.toLowerCase().includes(q.toLowerCase()));

    if (!q) {
      return [...pageCmds, ...actionCmds];
    }

    const contentCmds: Command[] = fuse
      .search(q)
      .filter((r) => r.score === undefined || r.score < 0.45)
      .slice(0, 8)
      .map((r) => {
        const it = r.item;
        const isProject = it.type === "project";
        return {
          id: `${it.type}:${it.slug}`,
          title: it.title,
          subtitle: it.summary,
          badge: isProject ? "项目" : "文章",
          icon: isProject ? FolderGit2 : FileText,
          href: isProject ? `/projects/${it.slug}` : `/blog/${it.slug}`,
        };
      });

    return [...contentCmds, ...pageCmds, ...actionCmds];
  }, [query, fuse, resolvedTheme, setTheme]);

  // Keep active index in range as results change.
  useEffect(() => {
    setActive((a) => Math.min(a, Math.max(0, commands.length - 1)));
  }, [commands.length]);

  const execute = useCallback(
    (cmd: Command | undefined) => {
      if (!cmd) return;
      close();
      if (cmd.run) cmd.run();
      else if (cmd.href) router.push(cmd.href);
    },
    [close, router]
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (commands.length ? (a + 1) % commands.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (commands.length ? (a - 1 + commands.length) % commands.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      execute(commands[active]);
    }
  };

  // Scroll the active item into view.
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh] sm:pt-[15vh]"
      role="dialog"
      aria-modal="true"
      aria-label="命令面板"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={close}
      />
      <div
        className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card)] shadow-2xl animate-slide-up"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-[var(--card-border)] px-4">
          <Search className="h-5 w-5 shrink-0 text-[var(--muted)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="搜索文章、项目，或跳转页面…"
            className="w-full bg-transparent py-4 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none"
          />
          <kbd className="hidden shrink-0 rounded border border-[var(--card-border)] px-1.5 py-0.5 text-[10px] text-[var(--muted)] sm:block">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[55vh] overflow-y-auto p-2">
          {commands.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-[var(--muted)]">未找到相关结果</p>
          ) : (
            commands.map((cmd, i) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  data-idx={i}
                  onClick={() => execute(cmd)}
                  onMouseMove={() => setActive(i)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    i === active ? "bg-[var(--primary)]/10" : "hover:bg-[var(--card-border)]/40"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      i === active
                        ? "bg-[var(--primary)]/15 text-[var(--primary)]"
                        : "bg-[var(--card-border)]/40 text-[var(--muted)]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[var(--foreground)]">
                      {cmd.title}
                    </span>
                    {cmd.subtitle && (
                      <span className="block truncate text-xs text-[var(--muted)]">
                        {cmd.subtitle}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 rounded-md bg-[var(--card-border)]/50 px-1.5 py-0.5 text-[10px] text-[var(--muted)]">
                    {cmd.badge}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-[var(--card-border)] px-4 py-2 text-[10px] text-[var(--muted)]">
          <span className="inline-flex items-center gap-1">
            <ArrowUp className="h-3 w-3" />
            <ArrowDown className="h-3 w-3" />
            导航
          </span>
          <span className="inline-flex items-center gap-1">
            <CornerDownLeft className="h-3 w-3" />
            打开
          </span>
          <span className="ml-auto inline-flex items-center gap-1">
            <kbd className="rounded border border-[var(--card-border)] px-1">⌘K</kbd>
            随时唤起
          </span>
        </div>
      </div>
    </div>
  );
}
