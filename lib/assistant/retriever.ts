import fs from "fs";
import path from "path";
import Fuse, { type FuseResult } from "fuse.js";
import type { KnowledgeChunk, KnowledgeIndex, SourceType, SourceReference } from "./types";

const INDEX_PATH = path.join(process.cwd(), "public/knowledge-index.json");

function loadIndex(): KnowledgeIndex | null {
  if (!fs.existsSync(INDEX_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(INDEX_PATH, "utf-8")) as KnowledgeIndex;
  } catch {
    return null;
  }
}

function createFuseIndex(chunks: KnowledgeChunk[]): Fuse<KnowledgeChunk> {
  return new Fuse(chunks, {
    keys: [
      { name: "title", weight: 0.4 },
      { name: "content", weight: 0.3 },
      { name: "summary", weight: 0.2 },
      { name: "tags", weight: 0.1 },
    ],
    threshold: 0.3,
    minMatchCharLength: 2,
    includeScore: true,
    includeMatches: true,
  });
}

export interface RetrieveOptions {
  mode?: "all" | "blog" | "project" | "code";
  pageContext?: {
    pathname: string;
    postSlug?: string;
    projectSlug?: string;
    category?: string;
    tag?: string;
  };
  limit?: number;
}

export function retrieve(
  query: string,
  options: RetrieveOptions = {}
): { chunks: KnowledgeChunk[]; sources: SourceReference[] } {
  const index = loadIndex();
  if (!index || index.chunks.length === 0) {
    return { chunks: [], sources: [] };
  }

  let chunks = [...index.chunks];

  // Filter by mode
  const mode = options.mode || "all";
  if (mode === "blog") {
    chunks = chunks.filter((c) => c.sourceType === "blog");
  } else if (mode === "project") {
    chunks = chunks.filter((c) => c.sourceType === "project");
  } else if (mode === "code") {
    chunks = chunks.filter((c) => c.sourceType === "code");
  }

  // Filter by page context
  const ctx = options.pageContext;
  if (ctx?.postSlug) {
    // Prioritize current article
    const currentArticleChunks = chunks.filter((c) => c.slug === ctx.postSlug);
    const otherChunks = chunks.filter((c) => c.slug !== ctx.postSlug);
    chunks = [...currentArticleChunks, ...otherChunks];
  }
  if (ctx?.projectSlug) {
    const currentProjectChunks = chunks.filter((c) => c.projectSlug === ctx.projectSlug);
    const otherChunks = chunks.filter((c) => c.projectSlug !== ctx.projectSlug);
    chunks = [...currentProjectChunks, ...otherChunks];
  }
  if (ctx?.category) {
    const catChunks = chunks.filter((c) => c.category === ctx.category);
    const otherChunks = chunks.filter((c) => c.category !== ctx.category);
    chunks = [...catChunks, ...otherChunks];
  }
  if (ctx?.tag) {
    const tagChunks = chunks.filter((c) => c.tags?.includes(ctx.tag!));
    const otherChunks = chunks.filter((c) => !c.tags?.includes(ctx.tag!));
    chunks = [...tagChunks, ...otherChunks];
  }

  // Create Fuse index and search
  const fuse = createFuseIndex(chunks);
  const results = fuse.search(query, { limit: options.limit || 8 });

  const matchedChunks = results.map((r: FuseResult<KnowledgeChunk>) => r.item);

  // Generate source references
  const sources: SourceReference[] = matchedChunks.map((chunk: KnowledgeChunk) => ({
    title: chunk.title,
    sourceType: chunk.sourceType,
    url: chunk.url,
    filePath: chunk.filePath,
    slug: chunk.slug,
    projectSlug: chunk.projectSlug,
    category: chunk.category,
    tags: chunk.tags,
    snippet: chunk.content.slice(0, 300),
  }));

  return { chunks: matchedChunks, sources };
}

export function getIndexStatus(): { loaded: boolean; stats: KnowledgeIndex["stats"] | null; updatedAt: string | null } {
  const index = loadIndex();
  if (!index) {
    return { loaded: false, stats: null, updatedAt: null };
  }
  return { loaded: true, stats: index.stats, updatedAt: index.updatedAt };
}
