export type WriteRequest = {
  topic: string;
  style?: string;
  tags?: string;
  wordCount?: string;
};

export type SourceType = "blog" | "project" | "code" | "site" | "doc";

export type KnowledgeChunk = {
  id: string;
  sourceType: SourceType;
  title: string;
  content: string;
  summary?: string;
  url?: string;
  filePath?: string;
  slug?: string;
  projectSlug?: string;
  category?: string;
  tags?: string[];
  language?: string;
  symbolName?: string;
  startLine?: number;
  endLine?: number;
  updatedAt?: string;
};

export type ChatRequest = {
  message: string;
  mode?: "all" | "blog" | "project" | "code";
  pageContext?: {
    pathname: string;
    postSlug?: string;
    projectSlug?: string;
    category?: string;
    tag?: string;
  };
  conversationId?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
};

export type SourceReference = {
  title: string;
  sourceType: SourceType;
  url?: string;
  filePath?: string;
  startLine?: number;
  endLine?: number;
  snippet?: string;
  slug?: string;
  projectSlug?: string;
  category?: string;
  tags?: string[];
};

export type ChatResponse = {
  answer: string;
  sources: SourceReference[];
  followUps: string[];
  confidence: "high" | "medium" | "low";
};

export type KnowledgeIndex = {
  version: number;
  updatedAt: string;
  chunks: KnowledgeChunk[];
  stats: {
    blogCount: number;
    projectCount: number;
    codeCount: number;
    totalChunks: number;
  };
};
