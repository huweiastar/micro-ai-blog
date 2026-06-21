import Link from "next/link";
import {
  FileText,
  PenLine,
  Clock,
  Type,
  ArrowRight,
  ExternalLink,
  Plus,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { getAllPostsForAdmin } from "../../lib/posts";
import { analyzeContentHealth } from "../../lib/content-health";

// 仪表盘实时聚合统计/内容/访问数据，禁止静态缓存。
export const dynamic = "force-dynamic";

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tone?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4">
      <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
        {icon}
        {label}
      </div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${tone ?? "text-[var(--foreground)]"}`}>
        {value}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const posts = getAllPostsForAdmin();
  const health = analyzeContentHealth();

  const live = posts.filter((p) => !p.draft && !p.scheduled);
  const drafts = posts.filter((p) => p.draft);
  const scheduled = posts.filter((p) => p.scheduled);
  const totalWords = live.reduce((sum, p) => sum + p.wordCount, 0);
  const needsFix = health.totals.errors + health.totals.warnings;
  const recent = posts.slice(0, 6);

  const todos = [
    drafts.length > 0
      ? { label: `${drafts.length} 篇草稿待完善`, href: "/admin/articles", tone: "text-fuchsia-400", Icon: PenLine }
      : null,
    scheduled.length > 0
      ? { label: `${scheduled.length} 篇定时待发`, href: "/admin/articles", tone: "text-sky-400", Icon: Clock }
      : null,
    needsFix > 0
      ? { label: `内容体检 ${needsFix} 项待修复`, href: "/admin/content-health", tone: "text-red-400", Icon: AlertTriangle }
      : null,
  ].filter(Boolean) as { label: string; href: string; tone: string; Icon: typeof PenLine }[];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <header className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">概览</h1>
          <p className="text-sm text-[var(--muted)] mt-1">站点内容总览。</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/articles/edit?new=1"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90"
          >
            <Plus className="w-4 h-4" />写文章
          </Link>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-[var(--primary)]"
          >
            <ExternalLink className="w-4 h-4" />查看站点
          </Link>
        </div>
      </header>

      {/* 概览卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard icon={<FileText className="w-3.5 h-3.5" />} label="已发布" value={live.length} tone="text-emerald-400" />
        <StatCard icon={<PenLine className="w-3.5 h-3.5" />} label="草稿" value={drafts.length} tone="text-fuchsia-400" />
        <StatCard icon={<Clock className="w-3.5 h-3.5" />} label="定时待发" value={scheduled.length} tone="text-sky-400" />
        <StatCard icon={<Type className="w-3.5 h-3.5" />} label="总字数" value={totalWords.toLocaleString()} />
      </div>

      {/* 待处理 */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold mb-3">待处理</h2>
        {todos.length === 0 ? (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center gap-2 text-sm text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            一切就绪，没有待处理事项 🎉
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {todos.map((t) => (
              <Link
                key={t.label}
                href={t.href}
                className="group rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4 flex items-center justify-between hover:border-[var(--primary)]/50 transition-colors"
              >
                <span className={`inline-flex items-center gap-2 text-sm ${t.tone}`}>
                  <t.Icon className="w-4 h-4" />
                  {t.label}
                </span>
                <ArrowRight className="w-4 h-4 text-[var(--muted)] group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 最新文章 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">最新文章</h2>
          <Link href="/admin/articles" className="text-xs text-[var(--muted)] hover:text-[var(--primary)]">
            全部 →
          </Link>
        </div>
        <ul className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] divide-y divide-[var(--card-border)]/50">
          {recent.length === 0 && (
            <li className="p-4 text-sm text-[var(--muted)]">还没有文章，去写第一篇吧。</li>
          )}
          {recent.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/admin/articles/edit?id=${p.slug}`}
                className="flex items-center justify-between gap-3 p-3 hover:bg-[var(--card)]/60 transition-colors"
              >
                <span className="min-w-0">
                  <span className="block text-sm text-[var(--foreground)] line-clamp-1">{p.title || "（无标题）"}</span>
                  <span className="block text-xs text-[var(--muted)]">{p.date} · {p.wordCount} 字</span>
                </span>
                <span className="shrink-0 flex items-center gap-1">
                  {p.draft && <span className="text-[10px] px-1.5 py-0.5 rounded bg-fuchsia-500/10 text-fuchsia-400">草稿</span>}
                  {p.scheduled && <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400">定时</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

    </div>
  );
}
