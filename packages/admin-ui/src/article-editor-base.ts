/**
 * ArticleEditor 共享基础：类型、常量、辅助函数。
 *
 * blog 与 manager 两端 ArticleEditor 共享这部分定义；差异（AI 摘要 / 内链建议 /
 * 飞书导入等 blog 特化功能）保留在各自的 ArticleEditor.tsx 中。
 *
 * 抽取动机：两端 ArticleEditor 的前 60+ 行（imports 之后的类型 / 常量 / 日期 helpers）
 * 完全一致，集中到本文件避免分叉漂移。
 */

/** 专栏条目：编辑器下拉选单用。 */
export type CategoryConfig = { name: string; description: string };

/** 文章修订历史行（后台 revisions 面板展示）。 */
export type RevisionRow = { id: string; savedAt: number; size: number; title: string };

/** ArticleEditor 通用 props。 */
export interface ArticleEditorProps {
  slug: string | null;
  isNew: boolean;
  categories: CategoryConfig[];
  onSaved: (savedSlug: string) => void;
  onDeleted: (slug: string) => void;
  /** 全屏编辑页用：返回列表。 */
  onBack?: () => void;
}

// —— 写作反馈阈值（与后台「内容体检」保持一致）——
export const ARTICLE_TITLE_MAX = 60;
export const ARTICLE_SUMMARY_MIN = 20;
export const ARTICLE_SUMMARY_MAX = 160;
export const ARTICLE_CONTENT_MIN = 150;

/** 今日日期 YYYY-MM-DD（本地时区）。 */
export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** datetime-local 输入框格式 YYYY-MM-DDTHH:mm（本地时区）。 */
export function toDatetimeLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** 默认定发布时间：次日同一时刻。 */
export function defaultScheduleStr(): string {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return toDatetimeLocal(d);
}
