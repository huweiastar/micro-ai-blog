export type CodeIndexConfig = {
  enabled: boolean;
  sourceType?: "github" | "local";
  repoUrl?: string;
  branch?: string;
  localPath?: string;
  include?: string[];
  exclude?: string[];
};

export type ProjectDetails = {
  background?: string;
  problem?: string;
  solution?: string;
  results?: string;
};

export type Project = {
  slug: string;
  name: string;
  description: string;
  cover?: string;
  image?: string;
  techStack: string[];
  highlights: string[];
  githubUrl?: string;
  demoUrl?: string;
  relatedPosts?: string[];
  content?: string;          // Markdown body — renders like a blog post
  details?: ProjectDetails;  // Legacy structured fields (kept for backward compatibility)
  codeIndex?: CodeIndexConfig;
  // Legacy fields (backward compatibility)
  background?: string;
  problem?: string;
  solution?: string;
  role?: string;
  difficulties?: string[];
  optimizations?: string[];
};
