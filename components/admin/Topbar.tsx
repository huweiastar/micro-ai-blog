// components/admin/Topbar.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu } from "lucide-react";

const labels: Record<string, string> = {
  "/admin": "概览",
  "/admin/articles": "文章管理",
  "/admin/categories": "专栏管理",
  "/admin/projects": "项目管理",
  "/admin/about": "关于我",
  "/admin/theme": "主题设置",
  "/admin/stats": "访问统计",
};

export function Topbar({ onMenu }: { onMenu?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const segments = ["/admin", pathname].filter((p, i, arr) => arr.indexOf(p) === i);
  const crumbs = segments
    .map((p) => labels[p])
    .filter(Boolean);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  return (
    <header className="h-14 px-4 sm:px-6 flex items-center justify-between border-b border-[var(--card-border)] bg-[var(--card)]/30 backdrop-blur">
      <div className="flex items-center gap-3">
        {onMenu && (
          <button onClick={onMenu} aria-label="打开菜单" className="md:hidden p-1 -ml-1 text-[var(--muted)] hover:text-[var(--foreground)]">
            <Menu className="w-5 h-5" />
          </button>
        )}
        <nav className="text-sm text-[var(--muted)]">
          {crumbs.map((c, i) => (
            <span key={i}>
              {i > 0 && <span className="mx-2">/</span>}
              <span className={i === crumbs.length - 1 ? "text-[var(--foreground)]" : ""}>{c}</span>
            </span>
          ))}
        </nav>
      </div>
      <button
        onClick={handleLogout}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-red-400 hover:border-red-500/30 transition-colors"
      >
        <LogOut className="w-4 h-4" /> 退出
      </button>
    </header>
  );
}
