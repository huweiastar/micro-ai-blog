import { getAllPostsForAdmin } from "./posts";

export type IssueSeverity = "error" | "warning" | "info";

export type ContentIssue = {
  code: string;
  severity: IssueSeverity;
  message: string;
};

export type PostHealth = {
  slug: string;
  title: string;
  date: string;
  category: string;
  draft: boolean;
  scheduled: boolean;
  wordCount: number;
  issues: ContentIssue[];
};

export type HealthReport = {
  generatedAt: string;
  totals: {
    posts: number; // 全部（含草稿/定时）
    live: number; // 已上线对访客可见
    drafts: number;
    scheduled: number;
    errors: number;
    warnings: number;
    infos: number;
    healthy: number; // 无 error/warning 的文章数
  };
  /** 仅包含存在问题的文章，按严重度（error→warning→info）降序。 */
  posts: PostHealth[];
  /** 全站仅被 1 篇文章引用的标签。 */
  orphanTags: string[];
};

// —— 体检阈值（命名常量，便于统一调整）——
const TITLE_MAX = 60;
const SUMMARY_MIN = 20;
const SUMMARY_MAX = 160;
const TAGS_MAX = 6;
const CONTENT_MIN = 150;

const SEVERITY_RANK: Record<IssueSeverity, number> = {
  error: 0,
  warning: 1,
  info: 2,
};

function isValidDate(value: string): boolean {
  if (!value) return false;
  return !Number.isNaN(new Date(value).getTime());
}

/**
 * 扫描全部文章（含草稿与定时），产出内容健康报告。
 * 纯服务端使用：依赖文件系统读取，且会暴露未发布文章信息。
 */
export function analyzeContentHealth(): HealthReport {
  const posts = getAllPostsForAdmin();

  // 统计标签全站引用次数，用于识别孤立标签。
  const tagFreq = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.tags) {
      tagFreq.set(tag, (tagFreq.get(tag) || 0) + 1);
    }
  }
  const orphanTags = Array.from(tagFreq.entries())
    .filter(([, count]) => count === 1)
    .map(([tag]) => tag)
    .sort((a, b) => a.localeCompare(b, "zh-CN"));
  const orphanSet = new Set(orphanTags);

  let errors = 0;
  let warnings = 0;
  let infos = 0;
  let healthy = 0;

  const analyzed: PostHealth[] = posts.map((post) => {
    const issues: ContentIssue[] = [];

    if (!post.title.trim()) {
      issues.push({ code: "title-missing", severity: "error", message: "缺少标题" });
    } else if (post.title.length > TITLE_MAX) {
      issues.push({
        code: "title-long",
        severity: "info",
        message: `标题偏长（${post.title.length} 字，建议 ≤ ${TITLE_MAX}）`,
      });
    }

    const summaryLen = post.summary.trim().length;
    if (summaryLen === 0) {
      issues.push({ code: "summary-missing", severity: "error", message: "缺少摘要" });
    } else if (summaryLen < SUMMARY_MIN) {
      issues.push({
        code: "summary-short",
        severity: "warning",
        message: `摘要过短（${summaryLen} 字，建议 ≥ ${SUMMARY_MIN}）`,
      });
    } else if (summaryLen > SUMMARY_MAX) {
      issues.push({
        code: "summary-long",
        severity: "info",
        message: `摘要偏长（${summaryLen} 字，建议 ≤ ${SUMMARY_MAX}）`,
      });
    }

    if (!isValidDate(post.date)) {
      issues.push({
        code: "date-invalid",
        severity: "error",
        message: post.date ? `日期格式无效（${post.date}）` : "缺少日期",
      });
    }

    if (!post.category.trim()) {
      issues.push({ code: "category-missing", severity: "warning", message: "未归入专栏 / 分类" });
    }

    if (post.tags.length === 0) {
      issues.push({ code: "tags-missing", severity: "warning", message: "缺少标签" });
    } else if (post.tags.length > TAGS_MAX) {
      issues.push({
        code: "tags-many",
        severity: "info",
        message: `标签偏多（${post.tags.length} 个，建议 ≤ ${TAGS_MAX}）`,
      });
    }

    if (!post.cover) {
      issues.push({ code: "cover-missing", severity: "info", message: "缺少封面图" });
    }

    if (post.wordCount < CONTENT_MIN) {
      issues.push({
        code: "content-short",
        severity: "warning",
        message: `正文过短（${post.wordCount} 字，建议 ≥ ${CONTENT_MIN}）`,
      });
    }

    const postOrphans = post.tags.filter((tag) => orphanSet.has(tag));
    if (postOrphans.length > 0) {
      issues.push({
        code: "tags-orphan",
        severity: "info",
        message: `含孤立标签：${postOrphans.join("、")}`,
      });
    }

    for (const issue of issues) {
      if (issue.severity === "error") errors += 1;
      else if (issue.severity === "warning") warnings += 1;
      else infos += 1;
    }

    const hasBlocking = issues.some(
      (i) => i.severity === "error" || i.severity === "warning"
    );
    if (!hasBlocking) healthy += 1;

    return {
      slug: post.slug,
      title: post.title,
      date: post.date,
      category: post.category,
      draft: post.draft,
      scheduled: post.scheduled,
      wordCount: post.wordCount,
      issues: issues.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]),
    };
  });

  const withIssues = analyzed
    .filter((p) => p.issues.length > 0)
    .sort((a, b) => {
      // 先按最严重问题排序，再按问题数量。
      const aTop = a.issues.length ? SEVERITY_RANK[a.issues[0].severity] : 99;
      const bTop = b.issues.length ? SEVERITY_RANK[b.issues[0].severity] : 99;
      if (aTop !== bTop) return aTop - bTop;
      return b.issues.length - a.issues.length;
    });

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      posts: posts.length,
      live: posts.filter((p) => !p.draft && !p.scheduled).length,
      drafts: posts.filter((p) => p.draft).length,
      scheduled: posts.filter((p) => p.scheduled).length,
      errors,
      warnings,
      infos,
      healthy,
    },
    posts: withIssues,
    orphanTags,
  };
}
