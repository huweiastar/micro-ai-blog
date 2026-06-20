"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AdminShell } from "../../components/admin/AdminShell";
import { ToastProvider } from "../../components/admin/Toast";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<{ backgroundImage: string; backgroundOpacity: number } | null>(null);

  useEffect(() => {
    fetch("/api/theme")
      .then((r) => r.json())
      .then((d) => setTheme({ backgroundImage: d.backgroundImage, backgroundOpacity: d.backgroundOpacity }))
      .catch(() => {});
  }, []);

  if (pathname === "/admin/login") return <>{children}</>;

  // 全屏编辑页（/admin/*/edit）脱离后台侧栏，独占整屏，
  // 但仍需 ToastProvider（编辑器用 useToast 提示保存结果）。
  if (pathname?.endsWith("/edit")) {
    return <ToastProvider>{children}</ToastProvider>;
  }

  return <AdminShell theme={theme}>{children}</AdminShell>;
}
