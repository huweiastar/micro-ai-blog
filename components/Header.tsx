"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Search } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { navConfig } from "../config/nav";
import { useProfile } from "./ProfileProvider.client";
import { Container } from "./ui/Container";
import { openCommandPalette } from "./command-palette-bus";

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const profile = useProfile();

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--card-border)] glass">
      <Container as="nav" className="h-16 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-bold transition-transform duration-300 hover:scale-105 active:scale-95 inline-flex items-baseline"
        >
          <span className="text-[var(--foreground)]">
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
                    ? "bg-[var(--primary)]/10"
                    : "bg-[var(--card)]/0 hover:bg-[var(--card)]/60"
                }`}
              />
            </Link>
            );
          })}
          <button
            onClick={openCommandPalette}
            aria-label="搜索 (⌘K)"
            className="group ml-2 inline-flex items-center gap-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)]/40 py-1.5 pl-2.5 pr-2 text-[var(--muted)] transition-all duration-300 hover:border-[var(--primary)]/50 hover:text-[var(--primary)]"
          >
            <Search className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
            <span className="text-sm">搜索</span>
            <kbd className="rounded border border-[var(--card-border)] px-1.5 py-0.5 text-[10px] leading-none text-[var(--muted)]">
              ⌘K
            </kbd>
          </button>
          <div className="p-1">
            <ThemeToggle />
          </div>
        </div>

        <div className="flex items-center gap-1 lg:hidden">
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
