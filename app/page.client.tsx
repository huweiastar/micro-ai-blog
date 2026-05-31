"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { ParticleNetwork } from "../components/ui/ParticleNetwork";
import { AvatarDisplay } from "../components/ui/AvatarDisplay";
import { useProfile } from "../components/ProfileProvider.client";
import { Github, Mail, ArrowRight, Database, Brain, Code2, Globe, Sparkles, Zap, Cpu, Layers, FileText, BookOpen, FolderGit2, Eye, Users } from "lucide-react";
import { getGradientClass, getBackgroundImage } from "../lib/gradient-styles";

type StatsData = {
  postCount: number;
  totalWords: number;
  projectCount: number;
  columnCount: number;
};

const iconMap: Record<string, typeof Database> = {
  "大数据开发工程": Database,
  "大模型数据工程": Brain,
  "大模型基础架构": Cpu,
  "大模型应用工程": Globe,
};

type ColumnTheme = {
  name: string;
  desc: string;
  background?: string;
  bgOpacity?: number;
};

interface HomeClientProps {
  stats: StatsData;
}

export function HomeClient({ stats }: HomeClientProps) {
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const profile = useProfile();
  const [columns, setColumns] = useState<ColumnTheme[]>([]);
  const socialLinks = {
    github: profile?.github || "https://github.com/huweiastar",
    email: profile?.email ? `mailto:${profile.email}` : "mailto:your-email@example.com",
  };
  const [visitStats, setVisitStats] = useState<{ pv: number; uv: number }>({ pv: 0, uv: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMousePos({ x: -1000, y: -1000 });
  }, []);

  // Load columns from API
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data: any[]) => {
        setColumns(data.map((c) => ({
          name: c.name,
          desc: c.description || "",
          background: c.background,
          bgOpacity: c.bgOpacity,
        })));
      })
      .catch(() => {
        // Fallback to hardcoded
        setColumns([
          { name: "大数据开发工程", desc: "Spark / Hive / SQL 性能优化与数据管道" },
          { name: "大模型数据工程", desc: "训练数据清洗、质量控制与 SFT 数据处理" },
          { name: "大模型基础架构", desc: "LLM 架构、训练流程与模型优化" },
          { name: "大模型应用工程", desc: "RAG 知识库、Agent 与多模态应用" },
        ]);
      });
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

  const techTags = [
    { name: "Python", icon: Code2 },
    { name: "SQL", icon: Database },
    { name: "Spark", icon: Zap },
    { name: "LLM", icon: Brain },
    { name: "RAG", icon: Layers },
    { name: "多模态", icon: Sparkles },
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

        {/* Subtle gradient overlay for readability */}
        <div className="absolute inset-0 bg-[var(--background)]/50 pointer-events-none" />

        <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto">
          {/* Avatar */}
          <AvatarDisplay />

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 animate-fade-in-up">
            <span className="bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--primary)] bg-clip-text text-transparent animate-gradient bg-[length:200%_200%]">
              {profile?.name ?? "微观AI"}
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[var(--muted)] max-w-2xl mx-auto leading-relaxed mb-8 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            大数据研发工程师 · 探索大数据与大模型技术
          </p>

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
          <div className="flex flex-wrap justify-center gap-3 mb-12 animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
            {techTags.map((tag) => (
              <div
                key={tag.name}
                className="glass inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm hover:border-[var(--primary)]/50 hover:shadow-lg hover:shadow-[var(--glow-primary)]/20 hover:-translate-y-0.5 transition-all duration-300 cursor-default"
              >
                <tag.icon className="w-4 h-4 text-[var(--primary)]" />
                <span className="text-[var(--foreground)]">{tag.name}</span>
              </div>
            ))}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.8s" }}>
            <div className="glass rounded-xl p-4 text-center hover:border-[var(--primary)]/50 hover:-translate-y-1 transition-all duration-300">
              <FileText className="w-5 h-5 text-[var(--primary)] mx-auto mb-2" />
              <div className="text-2xl font-bold bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] bg-clip-text text-transparent">
                {stats.postCount}
              </div>
              <div className="text-xs text-[var(--muted)] mt-1">篇文章</div>
            </div>
            <div className="glass rounded-xl p-4 text-center hover:border-[var(--primary)]/50 hover:-translate-y-1 transition-all duration-300">
              <BookOpen className="w-5 h-5 text-[var(--accent)] mx-auto mb-2" />
              <div className="text-2xl font-bold bg-gradient-to-r from-[var(--accent)] to-[var(--primary)] bg-clip-text text-transparent">
                {stats.totalWords > 10000 ? `${(stats.totalWords / 10000).toFixed(1)}万` : stats.totalWords}
              </div>
              <div className="text-xs text-[var(--muted)] mt-1">总字数</div>
            </div>
            <div className="glass rounded-xl p-4 text-center hover:border-[var(--primary)]/50 hover:-translate-y-1 transition-all duration-300">
              <Layers className="w-5 h-5 text-[var(--primary)] mx-auto mb-2" />
              <div className="text-2xl font-bold bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] bg-clip-text text-transparent">
                {stats.columnCount}
              </div>
              <div className="text-xs text-[var(--muted)] mt-1">个专栏</div>
            </div>
            <div className="glass rounded-xl p-4 text-center hover:border-[var(--primary)]/50 hover:-translate-y-1 transition-all duration-300">
              <FolderGit2 className="w-5 h-5 text-[var(--primary)] mx-auto mb-2" />
              <div className="text-2xl font-bold bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] bg-clip-text text-transparent">
                {stats.projectCount}
              </div>
              <div className="text-xs text-[var(--muted)] mt-1">个项目</div>
            </div>
            <div className="glass rounded-xl p-4 text-center hover:border-[var(--primary)]/50 hover:-translate-y-1 transition-all duration-300">
              <Eye className="w-5 h-5 text-[var(--primary)] mx-auto mb-2" />
              <div className="text-2xl font-bold bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] bg-clip-text text-transparent">
                {visitStats.pv.toLocaleString()}
              </div>
              <div className="text-xs text-[var(--muted)] mt-1">访问量</div>
            </div>
            <div className="glass rounded-xl p-4 text-center hover:border-[var(--primary)]/50 hover:-translate-y-1 transition-all duration-300">
              <Users className="w-5 h-5 text-[var(--accent)] mx-auto mb-2" />
              <div className="text-2xl font-bold bg-gradient-to-r from-[var(--accent)] to-[var(--primary)] bg-clip-text text-transparent">
                {visitStats.uv.toLocaleString()}
              </div>
              <div className="text-xs text-[var(--muted)] mt-1">访问人数</div>
            </div>
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
          {columns.slice(0, 8).map((theme, index) => {
            const Icon = iconMap[theme.name] || Database;
            const gradientClass = getGradientClass(theme.background);
            const bgImage = getBackgroundImage(theme.background);
            const opacity = theme.bgOpacity !== undefined ? (100 - theme.bgOpacity) / 100 : 0.85;

            return (
              <Link
                key={theme.name}
                href={`/categories/${encodeURIComponent(theme.name)}`}
                className={`rounded-xl p-5 border border-[var(--card-border)] hover:-translate-y-1 hover:shadow-lg transition-all duration-300 overflow-hidden relative group ${gradientClass}`}
              >
                {/* Background overlay */}
                {bgImage ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${bgImage})`, opacity: 0.2 }}
                  />
                ) : null}
                <div className="absolute inset-0 bg-[var(--card)]" style={{ opacity }} />

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/20 group-hover:from-[var(--primary)]/30 group-hover:to-[var(--accent)]/30 transition-all duration-300">
                      <Icon className="w-5 h-5 text-[var(--primary)]" />
                    </div>
                    <h3 className="font-semibold group-hover:text-[var(--primary)] transition-colors">
                      {theme.name}
                    </h3>
                  </div>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">
                    {theme.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
