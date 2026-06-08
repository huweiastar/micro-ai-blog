"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Search } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { navConfig } from "../config/nav";
import { useProfile } from "./ProfileProvider.client";
import { Container } from "./ui/Container";

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
          className="text-xl font-bold bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] bg-clip-text text-transparent hover:from-[var(--accent)] hover:to-[var(--primary)] transition-all duration-500 hover:scale-105 active:scale-95"
        >
          {profile?.name ?? "微观AI"}
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navConfig.map((item) => {
            const active = isActive(item.href);
            return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 group ${
                active
                  ? "text-[var(--primary)] bg-[var(--primary)]/10"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <span className="relative z-10">{item.title}</span>
              {/* Hover background */}
              <div className="absolute inset-0 bg-[var(--card)]/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {/* Bottom indicator */}
              <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] rounded-full transition-all duration-300 ${
                active ? 'w-4' : 'w-0 group-hover:w-3'
              }`} />
            </Link>
            );
          })}
          <Link
            href="/search"
            className="ml-2 p-2 rounded-lg text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--card)]/50 transition-all duration-300 hover:scale-110 active:scale-95 group"
          >
            <Search className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
          </Link>
          <div className="p-1">
            <ThemeToggle />
          </div>
        </div>

        <div className="flex items-center gap-3 md:hidden">
          <Link href="/search" className="text-[var(--muted)]">
            <Search className="w-5 h-5" />
          </Link>
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-[var(--foreground)] p-1"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </Container>

      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--card-border)] glass px-4 py-4 space-y-1">
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
