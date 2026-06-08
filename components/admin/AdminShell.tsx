"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { ToastProvider } from "./Toast";

export function AdminShell({ children, theme }: {
  children: React.ReactNode;
  theme?: { backgroundImage: string; backgroundOpacity: number } | null;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <ToastProvider>
    <div className="min-h-screen flex bg-transparent text-[var(--foreground)] relative">
      {theme?.backgroundImage && (
        <div className="fixed inset-0 -z-10">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${theme.backgroundImage})` }}
          />
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "var(--background)", opacity: (theme.backgroundOpacity ?? 40) / 100 }}
          />
        </div>
      )}
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-64 shrink-0">
        <Sidebar />
      </div>
      {/* Mobile slide-in sidebar */}
      <div
        aria-hidden={!mobileOpen}
        className={`md:hidden fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 ease-out ${mobileOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"}`}
      >
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </div>
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
      </div>
    </div>
    </ToastProvider>
  );
}
