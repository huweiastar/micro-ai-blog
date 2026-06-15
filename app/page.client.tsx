"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { ParticleNetwork } from "../components/ui/ParticleNetwork";
import { AvatarDisplay } from "../components/ui/AvatarDisplay";
import { useProfile } from "../components/ProfileProvider.client";
import { Github, Mail, ArrowRight, Layers, FileText, BookOpen, FolderGit2, Eye, Users } from "lucide-react";
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
}

export function HomeClient({ stats, columns, initialVisits }: HomeClientProps) {
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const profile = useProfile();
  const socialLinks = {
    github: profile?.github || "https://github.com/huweiastar",
    email: profile?.email ? `mailto:${profile.email}` : "mailto:your-email@example.com",
  };
  const [visitStats, setVisitStats] = useState<{ pv: number; uv: number }>(initialVisits);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMousePos({ x: -1000, y: -1000 });
  }, []);

  // Load visit stats — POST to record and get updated count atomically
  useEffect(() => {
    const visitorId = (() => {
      let id = localStorage.getItem("_blog_visitor_id");
      if (!id) {
        id = "v_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
        localStorage.setItem("_blog_visitor_id", id);
      }
      return id;
    })();

    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId }),
    })
      .then((res) => res.json())
      .then((data) => {
        // API response changed to { global: { pv, uv }, path: { ... } }
        const stats = data.global || data;
        setVisitStats({ pv: stats.pv ?? 0, uv: stats.uv ?? 0 });
      })
      .catch(() => {});
  }, []);

  // 首页技术栈标签由后台「关于我」配置（content/about/profile.yaml），通过 ProfileProvider 注入
  const techTags = profile?.techStack ?? [];
  // 名字下方的一句话标语，同样在后台「关于我」可配置
  const tagline = profile?.tagline ?? "";

  const wordsDisplay =
    stats.totalWords > 10000 ? `${(stats.totalWords / 10000).toFixed(1)}万` : `${stats.totalWords}`;

  const statItems = [
    { icon: FileText, value: `${stats.postCount}`, label: "文章" },
    { icon: Layers, value: `${stats.columnCount}`, label: "专栏" },
    { icon: FolderGit2, value: `${stats.projectCount}`, label: "项目" },
    { icon: BookOpen, value: wordsDisplay, label: "字数" },
    { icon: Eye, value: visitStats.pv.toLocaleString(), label: "访问量" },
    { icon: Users, value: visitStats.uv.toLocaleString(), label: "访客" },
  ];

  return (
    <>
      {/* Hero Section with Particle Background */}
      <section
        className="relative min-h-[70vh] flex items-center justify-center overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <ParticleNetwork mousePos={mousePos} />

        {/* 渐变遮罩：保证文字可读性 */}
        <div className="absolute inset-0 bg-[var(--background)]/50 pointer-events-none" />

        <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto">
          {/* Avatar */}
          <AvatarDisplay />

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 mt-6 animate-fade-in-up">
            <span className="bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--primary)] bg-clip-text text-transparent animate-gradient bg-[length:200%_200%]">
              {profile?.name ?? "微观AI"}
            </span>
          </h1>

          {tagline && (
            <p className="text-base sm:text-lg text-[var(--muted)] max-w-2xl mx-auto mb-8 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              {tagline}
            </p>
          )}

          <div className="flex justify-center gap-3 mb-10 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <a
              href={socialLinks.github}
              target="_blank"
              rel="noopener noreferrer"
              className="glass inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/50 transition-all duration-300"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
            <a
              href={socialLinks.email}
              className="glass inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/50 transition-all duration-300"
            >
              <Mail className="w-4 h-4" />
              Email
            </a>
          </div>

          {/* Tech Tags */}
          {techTags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mb-12 animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
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
            style={{ animationDelay: "0.8s" }}
          >
            {statItems.map((item) => (
              <div
                key={item.label}
                className="group/stat relative flex flex-col items-center bg-[var(--card)] px-2 py-5 text-center transition-colors hover:bg-[var(--primary)]/[0.06]"
              >
                <item.icon className="mb-2 h-4 w-4 text-[var(--muted)] transition-colors group-hover/stat:text-[var(--primary)]" />
                <div className="text-xl font-bold tabular-nums text-[var(--foreground)] transition-colors group-hover/stat:text-[var(--primary)] sm:text-2xl">
                  {item.value}
                </div>
                <div className="mt-1 text-[11px] text-[var(--muted)]">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Column Themes */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">专栏主题</h2>
          <Link
            href="/categories"
            className="inline-flex items-center gap-1 text-sm text-[var(--primary)] hover:underline"
          >
            查看全部 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.slice(0, 8).map((theme) => {
            const style = getCategoryStyle(theme.name);
            const Icon = style.icon;
            const grad = `linear-gradient(135deg, ${style.gradient[0]}, ${style.gradient[1]})`;

            return (
              <Link
                key={theme.name}
                href={`/categories/${encodeURIComponent(theme.name)}`}
                style={{ "--cat": style.accent } as React.CSSProperties}
                className="group relative overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--cat)] hover:shadow-[0_14px_32px_-14px_var(--cat)]"
              >
                {/* Top accent bar */}
                <div className="absolute inset-x-0 top-0 h-1 opacity-90" style={{ background: grad }} />
                {/* Corner glow on hover */}
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-30"
                  style={{ background: style.accent }}
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
                  <p className="text-sm leading-relaxed text-[var(--muted)]">{theme.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
