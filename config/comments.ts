export const commentConfig = {
  provider: "giscus" as const,
  giscus: {
    repo: process.env.NEXT_PUBLIC_GISCUS_REPO || "",
    repoId: process.env.NEXT_PUBLIC_GISCUS_REPO_ID || "",
    category: process.env.NEXT_PUBLIC_GISCUS_CATEGORY || "General",
    categoryId: process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID || "",
  },
};
