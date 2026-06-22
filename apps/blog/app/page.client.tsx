"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { BarrageHero } from "../components/ui/BarrageHero";
import type { BarrageConfig } from "../lib/barrage";
import { Container } from "../components/ui/Container";
import { AvatarDisplay } from "../components/ui/AvatarDisplay";
import { CountUp } from "../components/ui/CountUp";
import { useProfile } from "../components/ProfileProvider.client";
import { Github, Mail, ArrowRight, Layers, FileText, BookOpen, FolderGit2, Eye, Users, ChevronDown } from "lucide-react";
import { getCategoryStyle } from "../lib/category-style";
import { TechIcon } from "../lib/tech-icons";

type StatsData = {
  postCount: number;
  totalWords: number;
  projectCount: number;
  columnCount: number;
};

type ColumnTheme = {
  name: string;
  desc: string;
  background?: string;
  bgOpacity?: number;
};

interface HomeClientProps {
  stats: StatsData;
  columns: ColumnTheme[];
  initialVisits: { pv: number; uv: number };
  barrage: BarrageConfig;
}

export function HomeClient({ stats, columns, initialVisits, barrage }: HomeClientProps) {
  const profile = useProfile();
  const socialLinks = {
    github: profile?.github || "https://github.com/huweiastar",
    email: profile?.email ? `mailto:${profile.email}` : "mailto:your-email@example.com",
  };
  // PV 计数保持 SSR 注入的值，不再在客户端 setState 回写 ——
  // 消除"服务端直出 → 客户端 effect 又刷新"的数字闪变。
  const visitStats = initialVisits;
  const beaconSentRef = useRef(false);

  // PV 上报改为 sendBeacon（页面隐藏时触发）：
  //   1. 不阻塞首屏渲染（不再 fetch + setState）
  //   2. 页面关闭时也能送达（navigator.sendBeacon 在 unload 阶段仍工作）
  //   3. 同一次访问只上报一次（ref 去重，StrictMode 双调用也无影响）
  useEffect(() => {
    if (beaconSentRef.current) return;
    const sendPV = () => {
      if (beaconSentRef.current) return;
      beaconSentRef.current = true;
      const visitorId = (() => {
        let id = localStorage.getItem("_blog_visitor_id");
        if (!id) {
          id = "v_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
          localStorage.setItem("_blog_visitor_id", id);
        }
        return id;
      })();
      const blob = new Blob([JSON.stringify({ visitorId })], { type: "application/json" });
      // sendBeacon 优先；不支持时回退到 fetch keepalive
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon("/api/analytics", blob);
      } else {
        fetch("/api/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitorId }),
          keepalive: true,
        }).catch(() => {});
      }
    };

    // 用户切走 / 最小化 / 关闭标签页时上报（不阻塞主线程）
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") sendPV();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    // 兜底：页面卸载时也上报一次
    window.addEventListener("pagehide", sendPV);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", sendPV);
    };
  }, []);

  // 首页技术栈标签由后台「关于我」配置（content/about/profile.yaml），通过 ProfileProvider 注入
  const techTags = profile?.techStack ?? [];
  // 名字下方的一句话标语，同样在后台「关于我」可配置
  const tagline = profile?.tagline ?? "";

  const intFormat = (n: number) => Math.round(n).toLocaleString();
  const wordsFormat = (n: number) =>
    n > 10000 ? `${(n / 10000).toFixed(1)}万` : `${Math.round(n)}`;

  const statItems = [
    { icon: FileText, value: stats.postCount, format: intFormat, label: "文章" },
    { icon: Layers, value: stats.columnCount, format: intFormat, label: "专栏" },
    { icon: FolderGit2, value: stats.projectCount, format: intFormat, label: "项目" },
    { icon: BookOpen, value: stats.totalWords, format: wordsFormat, label: "字数" },
    { icon: Eye, value: visitStats.pv, format: intFormat, label: "访问量" },
    { icon: Users, value: visitStats.uv, format: intFormat, label: "访客" },
  ];

  return (
    <>
      {/* Hero Section with Barrage Background */}
      <section
        className="relative min-h-[58vh] flex items-center justify-center overflow-hidden py-16"
      >
        {barrage.enabled && barrage.items.length > 0 && (
          <BarrageHero items={barrage.items} />
        )}

        {/* 放射状遮罩：中央偏浓护住文字可读性，周缘渐隐让弹幕在外圈尽情呼吸，避免整片平板灰蒙 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 45%, var(--background) 0%, color-mix(in srgb, var(--background) 55%, transparent) 45%, transparent 80%)",
          }}
        />

        <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto">
          {/* Avatar */}
          <div className="animate-fade-in-scale">
            <AvatarDisplay />
          </div>

          <h1 className="hero-title-halo text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 mt-6 animate-fade-in-up" style={{ animationDelay: "0.08s" }}>
            <span className="bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--primary)] bg-clip-text text-transparent">
              {profile?.name ?? "微观AI"}
            </span>
          </h1>

          {tagline && (
            <p className="text-base sm:text-lg text-[var(--muted)] max-w-2xl mx-auto mb-8 animate-fade-in-up" style={{ animationDelay: "0.16s" }}>
              {tagline}
            </p>
          )}

          <div className="flex flex-wrap justify-center gap-3 mb-10 animate-fade-in-up" style={{ animationDelay: "0.24s" }}>
            <Link
              href="/blog"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-[var(--glow-primary)]/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--glow-primary)]/50"
            >
              <BookOpen className="w-4 h-4" />
              阅读文章
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href={socialLinks.github}
              target="_blank"
              rel="noopener noreferrer"
              className="glass glass-hover inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm text-[var(--foreground)] transition-all duration-300 hover:border-[var(--primary)]/50 hover:text-[var(--primary)]"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
            <a
              href={socialLinks.email}
              className="glass glass-hover inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm text-[var(--foreground)] transition-all duration-300 hover:border-[var(--primary)]/50 hover:text-[var(--primary)]"
            >
              <Mail className="w-4 h-4" />
              Email
            </a>
          </div>

          {/* Tech Tags */}
          {techTags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mb-12 animate-fade-in-up" style={{ animationDelay: "0.32s" }}>
              {techTags.map((tag, i) => (
                <div
                  key={tag.name + i}
                  className="glass inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm hover:border-[var(--primary)]/50 hover:shadow-lg hover:shadow-[var(--glow-primary)]/20 hover:-translate-y-0.5 transition-all duration-300 cursor-default"
                >
                  <TechIcon icon={tag.icon} className="w-4 h-4 text-[var(--primary)]" />
                  <span className="text-[var(--foreground)]">{tag.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Stats — 数据概览面板 */}
          <div
            className="glass mx-auto grid max-w-3xl grid-cols-3 gap-px overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-border)] sm:grid-cols-6 animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            {statItems.map((item) => (
              <div
                key={item.label}
                className="group/stat relative flex flex-col items-center bg-[var(--card)] px-2 py-5 text-center transition-colors hover:bg-[var(--primary)]/[0.06]"
              >
                <item.icon className="mb-2 h-4 w-4 text-[var(--muted)] transition-colors group-hover/stat:text-[var(--primary)]" />
                <div className="font-mono text-xl font-bold tabular-nums text-[var(--foreground)] transition-colors group-hover/stat:text-[var(--primary)] sm:text-2xl">
                  <CountUp value={item.value} format={item.format} />
                </div>
                <div className="mt-1 text-[11px] text-[var(--muted)]">
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          {/* 底部滚动提示 */}
          <div className="mt-10 flex justify-center">
            <ChevronDown
              className="animate-scroll-bounce h-6 w-6 text-[var(--muted)]"
              aria-hidden
            />
          </div>
        </div>
      </section>

      {/* Column Themes */}
      <Container as="section" size="wide" className="mt-10 mb-20 sm:mt-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">专栏主题</h2>
          <Link
            href="/categories"
            className="inline-flex items-center gap-1 text-sm text-[var(--primary)] hover:underline"
          >
            查看全部 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {columns.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--card)] px-6 py-12 text-center">
            <Layers className="mx-auto mb-3 h-8 w-8 text-[var(--muted)]/60" />
            <p className="text-sm text-[var(--muted)]">暂无专栏主题，敬请期待。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 [grid-auto-rows:minmax(180px,1fr)]">
            {columns.slice(0, 8).map((theme) => {
              const style = getCategoryStyle(theme.name);
              const Icon = style.icon;
              const grad = `linear-gradient(135deg, ${style.gradient[0]}, ${style.gradient[1]})`;

              return (
                <Link
                  key={theme.name}
                  href={`/categories/${encodeURIComponent(theme.name)}`}
                  style={{ "--cat": style.gradient[0] } as React.CSSProperties}
                  className="surface-card group relative flex flex-col h-full overflow-hidden rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--cat)] hover:shadow-[0_18px_40px_-18px_var(--cat)]"
                >
                  {/* Top accent bar */}
                  <div className="absolute inset-x-0 top-0 h-1 opacity-90" style={{ background: grad }} />
                  {/* Corner glow on hover — 与顶栏取同一起始色，避免色彩割裂 */}
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-16 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-20"
                    style={{ background: style.gradient[0] }}
                  />
                  <div className="relative z-10">
                    <div className="mb-3 flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-105"
                        style={{ background: grad }}
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="font-semibold transition-colors group-hover:text-[var(--cat)]">
                        {theme.name}
                      </h3>
                    </div>
                    <p className="text-sm leading-relaxed text-[var(--muted)] line-clamp-3">{theme.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Container>
    </>
  );
}
