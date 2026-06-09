import Link from "next/link";
import {
  AlertTriangle,
  Info,
  XCircle,
  CheckCircle2,
  FileText,
  Clock,
  PenLine,
  Tags,
} from "lucide-react";
import { analyzeContentHealth, type IssueSeverity } from "../../../lib/content-health";

// 每次进入实时扫描内容文件，避免被静态缓存成旧报告。
export const dynamic = "force-dynamic";

const SEVERITY_STYLE: Record<
  IssueSeverity,
  { chip: string; label: string }
> = {
  error: {
    chip: "bg-red-500/10 text-red-400 border border-red-500/20",
    label: "严重",
  },
  warning: {
    chip: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    label: "提醒",
  },
  info: {
    chip: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
    label: "建议",
  },
};

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4">
      <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
        {icon}
        {label}
      </div>
      <div className={`mt-1 text-2xl font-bold ${tone ?? "text-[var(--foreground)]"}`}>
        {value}
      </div>
    </div>
  );
}

export default function ContentHealthPage() {
  const report = analyzeContentHealth();
  const { totals } = report;
  const needsFix = totals.errors + totals.warnings;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-[var(--primary)]" />
          内容体检
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          扫描全部文章（含草稿与定时）的元数据与正文，列出可改进项。共 {totals.posts} 篇 ·
          {report.posts.length} 篇有待改进。
        </p>
      </header>

      {/* 概览卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <StatCard icon={<FileText className="w-3.5 h-3.5" />} label="文章总数" value={totals.posts} />
        <StatCard
          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          label="已上线"
          value={totals.live}
          tone="text-emerald-400"
        />
        <StatCard icon={<PenLine className="w-3.5 h-3.5" />} label="草稿" value={totals.drafts} tone="text-amber-400" />
        <StatCard icon={<Clock className="w-3.5 h-3.5" />} label="定时待发" value={totals.scheduled} tone="text-sky-400" />
        <StatCard
          icon={<AlertTriangle className="w-3.5 h-3.5" />}
          label="待修复项"
          value={needsFix}
          tone={needsFix > 0 ? "text-red-400" : "text-emerald-400"}
        />
        <StatCard
          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          label="健康文章"
          value={totals.healthy}
          tone="text-emerald-400"
        />
      </div>

      {/* 严重度图例 */}
      <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${SEVERITY_STYLE.error.chip}`}>
          <XCircle className="w-3 h-3" />严重 {totals.errors}
        </span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${SEVERITY_STYLE.warning.chip}`}>
          <AlertTriangle className="w-3 h-3" />提醒 {totals.warnings}
        </span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${SEVERITY_STYLE.info.chip}`}>
          <Info className="w-3 h-3" />建议 {totals.infos}
        </span>
      </div>

      {/* 问题列表 */}
      {report.posts.length === 0 ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <p className="text-[var(--foreground)] font-medium">所有文章都很健康 🎉</p>
          <p className="text-sm text-[var(--muted)] mt-1">没有发现需要改进的内容项。</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {report.posts.map((post) => (
            <li
              key={post.slug}
              className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <Link
                    href={`/admin/articles?id=${post.slug}`}
                    className="font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors line-clamp-1"
                  >
                    {post.title || "（无标题）"}
                  </Link>
                  <div className="text-xs text-[var(--muted)] mt-0.5 flex flex-wrap items-center gap-2">
                    <span>{post.date || "无日期"}</span>
                    <span>·</span>
                    <span>{post.category || "未分类"}</span>
                    <span>·</span>
                    <span>{post.wordCount} 字</span>
                    {post.draft && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">草稿</span>
                    )}
                    {post.scheduled && (
                      <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400">定时待发</span>
                    )}
                  </div>
                </div>
                <span className="shrink-0 text-xs text-[var(--muted)]">{post.issues.length} 项</span>
              </div>
              <ul className="flex flex-wrap gap-2">
                {post.issues.map((issue) => (
                  <li
                    key={issue.code}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs ${SEVERITY_STYLE[issue.severity].chip}`}
                  >
                    {issue.severity === "error" && <XCircle className="w-3 h-3" />}
                    {issue.severity === "warning" && <AlertTriangle className="w-3 h-3" />}
                    {issue.severity === "info" && <Info className="w-3 h-3" />}
                    {issue.message}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      {/* 孤立标签 */}
      {report.orphanTags.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <Tags className="w-4 h-4 text-[var(--muted)]" />
            孤立标签
            <span className="text-xs font-normal text-[var(--muted)]">
              （仅被 1 篇引用，可考虑合并或复用）
            </span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {report.orphanTags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-full text-xs border border-[var(--card-border)] bg-[var(--card)] text-[var(--muted)]"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
