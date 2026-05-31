import fs from "fs";
import path from "path";
import Fuse, { type FuseResult } from "fuse.js";
import type { KnowledgeChunk, KnowledgeIndex, SourceReference } from "./types";

const INDEX_PATH = path.join(process.cwd(), "public/knowledge-index.json");

function loadIndex(): KnowledgeIndex | null {
  if (!fs.existsSync(INDEX_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(INDEX_PATH, "utf-8")) as KnowledgeIndex;
  } catch {
    return null;
  }
}

function createFuseIndex(chunks: KnowledgeChunk[], threshold: number = 0.3): Fuse<KnowledgeChunk> {
  return new Fuse(chunks, {
    keys: [
      { name: "title", weight: 0.4 },
      { name: "content", weight: 0.3 },
      { name: "summary", weight: 0.2 },
      { name: "tags", weight: 0.1 },
    ],
    threshold,
    minMatchCharLength: 1,
    includeScore: true,
    includeMatches: true,
  });
}

/**
 * Remove common Chinese stop words and extract meaningful keywords from a query.
 * Returns an array of keyword terms sorted by specificity (longer terms first).
 */
function extractKeywords(query: string): string[] {
  // Only remove particles/function words that carry no semantic meaning.
  // Domain words like 博客/文章/项目 are intentionally preserved.
  const stopWords = [
    "有哪些", "有什么", "是什么", "在哪里", "怎么样", "怎么办",
    "怎么做", "好不好", "能不能", "是不是", "会不会", "可不可以",
    "里", "的", "了", "呢", "吗", "吧", "啊", "呀", "嘛",
    "哪些", "什么", "多少", "几个", "一下", "一个", "一些",
    "请", "问", "帮", "我", "你", "他", "她", "它", "咱们",
    "能", "会", "可以", "应该", "需要", "想",
    "和", "与", "或", "但", "而", "如果", "因为", "所以",
    "这", "那", "这些", "那些",
  ];

  let filtered = query;
  for (const word of stopWords) {
    filtered = filtered.replace(new RegExp(word, "g"), " ");
  }

  // Extract meaningful tokens: consecutive Chinese characters or alphanumeric words
  const tokens = filtered
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 1);

  // Sort by length descending (longer/more specific terms first)
  return tokens.sort((a, b) => b.length - a.length);
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

/**
 * Search with a single query string using Fuse.js.
 * Returns matched chunks deduplicated by id.
 */
function searchWithQuery(
  fuse: Fuse<KnowledgeChunk>,
  query: string,
  limit: number
): KnowledgeChunk[] {
  const results = fuse.search(query, { limit });
  return results.map((r: FuseResult<KnowledgeChunk>) => r.item);
}

/**
 * Create a Fuse index optimized for keyword-based search (higher threshold).
 */
function createKeywordFuseIndex(chunks: KnowledgeChunk[]): Fuse<KnowledgeChunk> {
  return createFuseIndex(chunks, 0.5);
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

  const fuse = createFuseIndex(chunks);
  const keywordFuse = createKeywordFuseIndex(chunks);
  const limit = options.limit || 8;

  // Strategy: try full query first, then fall back to keyword-based search.
  // For Chinese natural-language queries, the full query often contains too many
  // stop words that prevent Fuse.js from finding any matches.
  let matchedChunks = searchWithQuery(fuse, query, limit);

  if (matchedChunks.length === 0) {
    const keywords = extractKeywords(query);
    if (keywords.length > 0) {
      const seenIds = new Set<string>();
      const keywordResults: KnowledgeChunk[] = [];
      const keywordLimit = Math.ceil(limit / Math.max(keywords.length, 1));

      for (const kw of keywords) {
        const results = searchWithQuery(keywordFuse, kw, keywordLimit);
        for (const chunk of results) {
          if (!seenIds.has(chunk.id)) {
            seenIds.add(chunk.id);
            keywordResults.push(chunk);
          }
        }
        if (keywordResults.length >= limit) break;
      }

      matchedChunks = keywordResults;
    }
  }

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
