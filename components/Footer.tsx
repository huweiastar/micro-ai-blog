import Link from "next/link";
import { Github, Mail } from "lucide-react";
import { navConfig } from "../config/nav";
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
    <footer className="border-t border-[var(--card-border)] glass mt-20">
      <Container className="py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="font-semibold text-[var(--foreground)] mb-3">
              {profile.name}
            </h3>
            <p className="text-xs leading-relaxed text-[var(--muted)]">
              {siteConfig.description}
            </p>
          </div>

          {/* Nav */}
          <div>
            <h3 className="font-semibold text-[var(--foreground)] mb-3">导航</h3>
            <ul className="space-y-1.5">
              {navConfig.slice(1, 5).map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-xs text-[var(--muted)] hover:text-[var(--primary)] transition-colors">
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-[var(--foreground)] mb-3">联系我</h3>
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

          {/* RSS */}
          <div>
            <h3 className="font-semibold text-[var(--foreground)] mb-3">RSS</h3>
            <ul className="space-y-1.5">
              <li>
                <a href="/rss.xml" className="text-xs text-[var(--muted)] hover:text-[var(--primary)] transition-colors">
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
