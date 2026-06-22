import Link from "next/link";
import { Github, Mail } from "lucide-react";
import { footerNav, footerExplore } from "../config/nav";
import { getAboutProfile } from "../lib/about";
import { siteConfig } from "../config/site";
import { Container } from "./ui/Container";

export function Footer() {
  const profile = getAboutProfile();
  const socialLinks = [
    { icon: <Github className="w-4 h-4" />, href: profile.github, label: "GitHub" },
    { icon: <Mail className="w-4 h-4" />, href: `mailto:${profile.email}`, label: "Email" },
  ].filter((l) => l.href);

  return (
    <footer className="glass relative mt-24 overflow-hidden">
      {/* 顶部流光渐变边 */}
      <span
        aria-hidden
        className="gradient-flow absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent"
      />
      <Container size="wide" className="py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="mb-3 font-semibold text-[var(--foreground)]">
              {profile.name}
            </h3>
            <p className="text-xs leading-relaxed text-[var(--muted)]">
              {siteConfig.description}
            </p>
          </div>

          {/* Nav */}
          <div>
            <h3 className="mb-3 font-semibold text-[var(--foreground)]">导航</h3>
            <ul className="space-y-1.5">
              {footerNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-xs text-[var(--muted)] transition-colors hover:text-[var(--primary)]">
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-3 font-semibold text-[var(--foreground)]">联系我</h3>
            <div className="flex gap-3">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
                  aria-label={link.label}
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="mb-3 font-semibold text-[var(--foreground)]">探索</h3>
            <ul className="space-y-1.5">
              {footerExplore.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-xs text-[var(--muted)] transition-colors hover:text-[var(--primary)]">
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* RSS */}
          <div>
            <h3 className="mb-3 font-semibold text-[var(--foreground)]">RSS</h3>
            <ul className="space-y-1.5">
              <li>
                <a href="/rss.xml" className="text-xs text-[var(--muted)] transition-colors hover:text-[var(--primary)]">
                  订阅 RSS
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[var(--card-border)] mt-8 pt-6 text-center text-xs text-[var(--muted)]">
          <p>© {new Date().getFullYear()} {profile.name}. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  );
}
