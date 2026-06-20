export type CommentProvider = "giscus";

export interface GiscusConfig {
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
}

export interface CommentConfig {
  provider: CommentProvider;
  giscus: GiscusConfig;
}

export const commentConfig: CommentConfig = {
  provider: "giscus",
  giscus: {
    repo: process.env.NEXT_PUBLIC_GISCUS_REPO || "",
    repoId: process.env.NEXT_PUBLIC_GISCUS_REPO_ID || "",
    category: process.env.NEXT_PUBLIC_GISCUS_CATEGORY || "General",
    categoryId: process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID || "",
  },
};

/** giscus 是否已正确配置（用于决定是否渲染评论）。 */
export function isGiscusConfigured(g: GiscusConfig = commentConfig.giscus): boolean {
  return (
    !!g.repo && !!g.repoId && !g.repo.includes("your-") && !g.repoId.includes("your-")
  );
}
