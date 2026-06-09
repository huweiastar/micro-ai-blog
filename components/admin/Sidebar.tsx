// components/admin/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, FolderOpen, Rocket, User, Palette, BarChart3, Stethoscope } from "lucide-react";
import { NewMenu } from "./NewMenu";

const groups = [
  {
    label: "内容",
    items: [
      { href: "/admin/articles", label: "文章", Icon: FileText },
      { href: "/admin/content-health", label: "内容体检", Icon: Stethoscope },
      { href: "/admin/categories", label: "专栏", Icon: FolderOpen },
      { href: "/admin/projects", label: "项目", Icon: Rocket },
    ],
  },
  {
    label: "站点",
    items: [
      { href: "/admin/about", label: "关于我", Icon: User },
      { href: "/admin/theme", label: "主题", Icon: Palette },
      { href: "/admin/stats", label: "统计", Icon: BarChart3 },
    ],
  },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <aside className="w-full h-full border-r border-[var(--card-border)] bg-[var(--card)]/30 backdrop-blur flex flex-col">
      <div className="p-4 border-b border-[var(--card-border)]">
        <Link href="/admin" className="text-lg font-bold text-[var(--foreground)] hover:text-[var(--primary)]" onClick={onNavigate}>
          后台管理
        </Link>
      </div>
      <div className="p-3 border-b border-[var(--card-border)]">
        <NewMenu onPicked={onNavigate} />
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-6">
        {groups.map((g) => (
          <div key={g.label}>
            <div className="px-2 mb-2 text-xs uppercase tracking-wider text-[var(--muted)]">{g.label}</div>
            <ul className="space-y-1">
              {g.items.map(({ href, label, Icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        active
                          ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                          : "text-[var(--foreground)] hover:bg-[var(--card)]/60"
                      }`}
                    >
                      {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-[var(--primary)]" />}
                      <Icon className="w-4 h-4" />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
