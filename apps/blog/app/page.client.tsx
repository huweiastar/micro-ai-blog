"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Container } from "../components/ui/Container";
import { AvatarDisplay } from "../components/ui/AvatarDisplay";
import { CountUp } from "../components/ui/CountUp";
import { useProfile } from "../components/ProfileProvider.client";
import { Github, Mail, ArrowRight, FileText, Layers, FolderGit2, BookOpen, Eye, Users } from "lucide-react";

type StatsData = {
  postCount: number;
  totalWords: number;
  projectCount: number;
  columnCount: number;
};

interface HomeClientProps {
  stats: StatsData;
  initialVisits: { pv: number; uv: number };
}

export function HomeClient({ stats, initialVisits }: HomeClientProps) {
  const profile = useProfile();
  const socialLinks = {
    github: profile?.github || "https://github.com/huweiastar",
    email: profile?.email ? `mailto:${profile.email}` : undefined,
  };
  const visitStats = initialVisits;
  const beaconSentRef = useRef(false);

  // PV 上报（sendBeacon，不阻塞渲染）
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

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") sendPV();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", sendPV);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", sendPV);
    };
  }, []);

  const tagline = profile?.tagline ?? "";

  const intFormat = (n: number) => Math.round(n).toLocaleString();
  const wordsFormat = (n: number) =>
    n > 10000 ? `${(n / 10000).toFixed(1)}万` : `${Math.round(n)}`;

  const statItems = [
    { icon: FileText, value: stats.postCount, format: intFormat, label: "文章" },
    { icon: Layers, value: stats.columnCount, format: intFormat, label: "专栏" },
    { icon: FolderGit2, value: stats.projectCount, format: intFormat, label: "项目" },
    { icon: BookOpen, value: stats.totalWords, format: wordsFormat, label: "字数" },
    { icon: Eye, value: visitStats.pv, format: intFormat, label: "访问" },
    { icon: Users, value: visitStats.uv, format: intFormat, label: "访客" },
  ];

  return (
    <section className="relative overflow-hidden">
      {/* 背景氛围光晕 — 柔和浮动效果 */}
      <div
        aria-hidden
        className="animate-float-orb pointer-events-none absolute -top-32 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, color-mix(in srgb, var(--primary) 18%, transparent), color-mix(in srgb, var(--accent) 10%, transparent) 50%, transparent 75%)",
        }}
      />
      <div
        aria-hidden
        className="animate-float-orb-slow pointer-events-none absolute -top-20 left-1/4 h-72 w-72 rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--accent), transparent 70%)" }}
      />
      <div
        aria-hidden
        className="animate-float-orb pointer-events-none absolute -top-10 right-1/4 h-56 w-56 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--primary), transparent 70%)", animationDelay: "-6s" }}
      />

      <Container className="relative py-16 sm:py-24">
        <div className="flex flex-col items-center text-center">
          {/* 头像 */}
          <div className="animate-fade-in-scale">
            <AvatarDisplay />
          </div>

          {/* 名字 */}
          <h1
            className="hero-title-halo mt-6 text-4xl font-bold tracking-tight sm:text-5xl animate-fade-in-up"
            style={{ animationDelay: "0.08s" }}
          >
            <span className="title-shimmer bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--primary)] bg-clip-text text-transparent">
              {profile?.name ?? "微观AI"}
            </span>
          </h1>

          {/* 标语 */}
          {tagline && (
            <p
              className="mt-4 max-w-xl text-base text-[var(--muted)] leading-relaxed sm:text-lg animate-fade-in-up"
              style={{ animationDelay: "0.16s" }}
            >
              {tagline}
            </p>
          )}

          {/* CTA 按钮 */}
          <div
            className="mt-8 flex flex-wrap justify-center gap-3 animate-fade-in-up"
            style={{ animationDelay: "0.24s" }}
          >
            <Link
              href="/blog"
              className="btn-interactive group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-[var(--glow-primary)]/25"
            >
              <BookOpen className="h-4 w-4" />
              开始阅读
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href={socialLinks.github}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-interactive inline-flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--card)]/60 px-6 py-2.5 text-sm text-[var(--foreground)] backdrop-blur-sm hover:border-[var(--primary)]/40 hover:text-[var(--primary)]"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
            {socialLinks.email && (
              <a
                href={socialLinks.email}
                className="btn-interactive inline-flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--card)]/60 px-6 py-2.5 text-sm text-[var(--foreground)] backdrop-blur-sm hover:border-[var(--primary)]/40 hover:text-[var(--primary)]"
              >
                <Mail className="h-4 w-4" />
                联系
              </a>
            )}
          </div>

          {/* 数据概览 */}
          <div
            className="mt-12 grid w-full max-w-2xl grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-4 animate-fade-in-up"
            style={{ animationDelay: "0.32s" }}
          >
            {statItems.map((item) => (
              <div
                key={item.label}
                className="group flex flex-col items-center rounded-xl border border-[var(--card-border)] bg-[var(--card)]/50 px-3 py-4 backdrop-blur-sm transition-all duration-300 hover:border-[var(--primary)]/30 hover:bg-[var(--primary)]/[0.04] hover:-translate-y-0.5"
              >
                <item.icon className="mb-1.5 h-4 w-4 text-[var(--muted)] transition-colors group-hover:text-[var(--primary)]" />
                <div className="font-mono text-lg font-bold tabular-nums text-[var(--foreground)] sm:text-xl">
                  <CountUp value={item.value} format={item.format} />
                </div>
                <div className="mt-0.5 text-[11px] text-[var(--muted)]">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
