"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Search, Palette } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { navConfig } from "../config/nav";
import { useProfile } from "./ProfileProvider.client";
import { Container } from "./ui/Container";
import { openCommandPalette } from "./command-palette-bus";
import { openAppearancePanel } from "./appearance-bus";

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const profile = useProfile();

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--card-border)] glass supports-[backdrop-filter]:bg-[var(--card)]/75">
      <Container as="nav" size="wide" className="h-16 flex items-center justify-between">
        <Link
          href="/"
          className="group inline-flex items-baseline text-xl font-bold transition-transform duration-300 hover:scale-105 active:scale-95"
        >
          <span className="bg-gradient-to-r from-[var(--foreground)] to-[var(--primary)] bg-clip-text text-transparent">
            {profile?.name ?? "微观AI"}
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {navConfig.map((item) => {
            const active = isActive(item.href);
            return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative px-3.5 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${
                active
                  ? "text-[var(--primary)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <span className="relative z-10">{item.title}</span>
              {/* Active / hover pill */}
              <span
                className={`absolute inset-0 rounded-full transition-all duration-200 ${
                  active
                    ? "bg-[var(--primary)]/12 ring-1 ring-[var(--primary)]/20"
                    : "bg-[var(--card)]/0 hover:bg-[var(--card)]/70"
                }`}
              />
            </Link>
            );
          })}
          <button
            onClick={openCommandPalette}
            aria-label="搜索 (⌘K)"
            className="search-glow group ml-2 inline-flex items-center gap-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)]/70 py-1.5 pl-2.5 pr-2 text-[var(--muted)] shadow-sm transition-all duration-300 hover:border-[var(--primary)]/50 hover:text-[var(--primary)] hover:shadow-[var(--shadow-glow)]"
          >
            <Search className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
            <span className="text-sm">搜索</span>
            <kbd className="rounded border border-[var(--card-border)] px-1.5 py-0.5 text-[10px] leading-none text-[var(--muted)]">
              ⌘K
            </kbd>
          </button>
          <button
            onClick={openAppearancePanel}
            aria-label="外观设置"
            className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:text-[var(--primary)]"
          >
            <Palette className="h-4 w-4" />
          </button>
          <div className="p-1">
            <ThemeToggle />
          </div>
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <button
            onClick={openAppearancePanel}
            aria-label="外观设置"
            className="inline-flex min-h-11 min-w-11 items-center justify-center text-[var(--muted)]"
          >
            <Palette className="w-5 h-5" />
          </button>
          <button
            onClick={openCommandPalette}
            aria-label="搜索"
            className="inline-flex min-h-11 min-w-11 items-center justify-center text-[var(--muted)]"
          >
            <Search className="w-5 h-5" />
          </button>
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center text-[var(--foreground)]"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </Container>

      {mobileOpen && (
        <div className="lg:hidden border-t border-[var(--card-border)] glass px-4 py-4 space-y-1">
          {navConfig.map((item) => {
            const active = isActive(item.href);
            return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              aria-current={active ? "page" : undefined}
              className={`block px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                active
                  ? "text-[var(--primary)] bg-[var(--primary)]/10"
                  : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card)]/50"
              }`}
            >
              {item.title}
            </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
