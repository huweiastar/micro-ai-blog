"use client";

import { usePathname } from "next/navigation";

interface SiteChromeProps {
  background: React.ReactNode;
  header: React.ReactNode;
  footer: React.ReactNode;
  backToTop: React.ReactNode;
  launcher: React.ReactNode;
  commandPalette: React.ReactNode;
  children: React.ReactNode;
}

/**
 * 根据路由决定是否渲染前台外壳（Header/Footer/背景/返回顶部/AI助手浮窗）。
 * 后台 `/admin/*`（含登录页）使用独立全屏布局，不显示前台外壳。
 */
export function SiteChrome({
  background,
  header,
  footer,
  backToTop,
  launcher,
  commandPalette,
  children,
}: SiteChromeProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  return (
    <>
      <div className="min-h-screen flex flex-col relative">
        {!isAdmin && background}
        {!isAdmin && header}
        <main id="main-content" className="flex-1 relative z-10">
          {children}
        </main>
        {!isAdmin && footer}
        {!isAdmin && backToTop}
      </div>
      {!isAdmin && launcher}
      {!isAdmin && commandPalette}
    </>
  );
}
