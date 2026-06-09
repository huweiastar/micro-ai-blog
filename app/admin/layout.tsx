"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AdminShell } from "../../components/admin/AdminShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<{ backgroundImage: string; backgroundOpacity: number } | null>(null);

  useEffect(() => {
    fetch("/api/theme")
      .then((r) => r.json())
      .then((d) => setTheme({ backgroundImage: d.backgroundImage, backgroundOpacity: d.backgroundOpacity }))
      .catch(() => {});
  }, []);

  // 登录页与全屏编辑页（/admin/*/edit）脱离后台外壳，独占整屏。
  const bare = pathname === "/admin/login" || (pathname?.endsWith("/edit") ?? false);
  if (bare) return <>{children}</>;
  return <AdminShell theme={theme}>{children}</AdminShell>;
}
