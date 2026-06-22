import Link from "next/link";
import { Container } from "../components/ui/Container";
import { ArrowLeft, Search, Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <Container className="relative py-16 sm:py-24 text-center overflow-hidden">
      {/* 星点背景 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, color-mix(in srgb, var(--primary) 18%, transparent) 0, transparent 40%), radial-gradient(circle at 80% 70%, color-mix(in srgb, var(--accent) 15%, transparent) 0, transparent 40%), radial-gradient(1px 1px at 15% 20%, var(--foreground) 50%, transparent 50%), radial-gradient(1px 1px at 70% 15%, var(--foreground) 50%, transparent 50%), radial-gradient(1.5px 1.5px at 45% 80%, var(--foreground) 50%, transparent 50%), radial-gradient(1px 1px at 90% 55%, var(--foreground) 50%, transparent 50%), radial-gradient(1px 1px at 30% 60%, var(--foreground) 50%, transparent 50%), radial-gradient(1.5px 1.5px at 85% 30%, var(--foreground) 50%, transparent 50%)",
          backgroundSize: "auto, auto, 120px 120px, 180px 180px, 200px 200px, 140px 140px, 160px 160px, 100px 100px",
        }}
      />

      {/* 太空人 SVG */}
      <div className="mb-8 flex justify-center">
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          fill="none"
          className="animate-float-drift drop-shadow-[0_8px_24px_color-mix(in_srgb,var(--primary)_30%,transparent)]"
          aria-hidden
        >
          <circle cx="60" cy="46" r="26" fill="var(--card)" stroke="var(--card-border)" strokeWidth="2" />
          <ellipse cx="60" cy="46" rx="18" ry="16" fill="url(#astro-visor)" />
          <ellipse cx="54" cy="40" rx="6" ry="3" fill="white" opacity="0.5" />
          <rect x="42" y="70" width="36" height="30" rx="10" fill="var(--primary)" />
          <circle cx="60" cy="82" r="4" fill="var(--accent)" />
          <rect x="26" y="72" width="12" height="22" rx="6" fill="var(--primary)" transform="rotate(-20 32 83)" />
          <rect x="82" y="72" width="12" height="22" rx="6" fill="var(--primary)" transform="rotate(15 88 83)" />
          <rect x="46" y="98" width="11" height="18" rx="5" fill="var(--primary)" />
          <rect x="63" y="98" width="11" height="18" rx="5" fill="var(--primary)" />
          <ellipse cx="51.5" cy="116" rx="7" ry="3" fill="var(--foreground)" opacity="0.7" />
          <ellipse cx="68.5" cy="116" rx="7" ry="3" fill="var(--foreground)" opacity="0.7" />
          <path d="M 92 34 Q 98 30 94 24" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
          <path d="M 98 38 Q 106 32 100 22" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4" />
          <defs>
            <linearGradient id="astro-visor" x1="42" y1="30" x2="78" y2="62">
              <stop offset="0%" stopColor="var(--primary)" />
              <stop offset="100%" stopColor="var(--accent)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <h1 className="hero-title-halo text-7xl sm:text-8xl font-bold mb-3 bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--primary)] bg-clip-text text-transparent title-shimmer">
        404
      </h1>

      <p className="text-lg sm:text-xl text-[var(--muted)] mb-2">
        这颗星球没有你要找的页面
      </p>
      <p className="text-sm text-[var(--muted)]/70 mb-10 max-w-md mx-auto">
        它可能漂流到了星际之间，或者被黑洞悄悄吞掉了。别担心，我们可以回家，或者去别处看看。
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-[var(--glow-primary)]/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--glow-primary)]/50"
        >
          <ArrowLeft className="h-4 w-4" />
          返回首页
        </Link>
        <Link
          href="/search"
          className="glass glass-hover inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium text-[var(--foreground)] transition-all duration-300 hover:border-[var(--primary)]/50 hover:text-[var(--primary)]"
        >
          <Search className="h-4 w-4" />
          搜索文章
        </Link>
      </div>

      <div className="mt-16 flex justify-center items-center gap-2 text-[var(--muted)]/50 text-xs">
        <Sparkles className="h-3 w-3" />
        <span>探索其他角落，也许会发现宝藏</span>
        <Sparkles className="h-3 w-3" />
      </div>
    </Container>
  );
}
