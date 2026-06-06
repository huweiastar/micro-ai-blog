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

  if (pathname === "/admin/login") return <>{children}</>;
  return <AdminShell theme={theme}>{children}</AdminShell>;
}
