/**
 * API Client for apps/blog
 * 
 * 在 Server Component 中使用：
 *   import { api } from '@/lib/api/client';
 *   const posts = await api.posts.list();
 * 
 * 配置：
 *   NEXT_PUBLIC_API_URL=http://localhost:3010/api  (开发)
 *   NEXT_PUBLIC_API_URL=https://yourdomain.com/api (生产)
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010/api';

interface ApiResponse<T> {
  ok: boolean;
  data: T;
  error?: string;
}

class ApiClientError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      // Server Component 默认 force-cache
      cache: options?.cache ?? 'force-cache',
      next: options?.next ?? { revalidate: 60 },
    });

    if (!res.ok) {
      throw new ApiClientError(
        `API request failed: ${res.status} ${res.statusText}`,
        res.status
      );
    }

    const json: ApiResponse<T> = await res.json();
    
    if (!json.ok) {
      throw new ApiClientError(json.error || 'Unknown API error');
    }

    return json.data;
  } catch (err) {
    if (err instanceof ApiClientError) throw err;
    throw new ApiClientError(
      `Failed to fetch ${path}: ${err instanceof Error ? err.message : 'Unknown error'}`
    );
  }
}

// ── Types ─────────────────────────────────────────────────────────
export interface PostListItem {
  id: number;
  slug: string;
  kind: 'post' | 'note' | 'chatter';
  title: string;
  summary: string | null;
  cover: string | null;
  draft: boolean;
  featured: boolean;
  mood: string | null;
  location: string | null;
  wordCount: number;
  readingMins: number;
  publishedAt: string;
  updatedAt: string;
  category: { slug: string; name: string } | null;
  tags: string[];
}

export interface PostDetail extends PostListItem {
  contentMd: string;
  contentHtml: string | null;
  author: { name: string; avatar: string | null } | null;
  relatedPosts: PostListItem[];
}

export interface CategoryWithCount {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  background: string | null;
  bgOpacity: number;
  sortOrder: number;
  createdAt: string;
  postCount: number;
}

export interface TagWithCount {
  id: number;
  name: string;
  postCount: number;
}

export interface NoteItem {
  id: number;
  slug: string;
  title: string;
  contentMd: string;
  contentHtml: string | null;
  mood: string | null;
  location: string | null;
  images: { src: string; alt: string | null }[];
  tags: string[];
  publishedAt: string;
}

export interface ArchiveYear {
  year: number;
  count: number;
  months: {
    month: number;
    posts: {
      slug: string;
      title: string;
      publishedAt: string;
      category: { slug: string; name: string } | null;
    }[];
  }[];
}

export interface Project {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  techStack: string[];
  githubUrl: string | null;
  demoUrl: string | null;
  highlights: string[];
  background: string | null;
  problem: string | null;
  solution: string | null;
  results: string | null;
  relatedPosts: string[];
  codeIndexEnabled: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Friend {
  id: number;
  name: string;
  url: string;
  description: string | null;
  avatar: string | null;
  themeColor: string;
  sortOrder: number;
  createdAt: string;
}

export interface AboutProfile {
  id: number;
  name: string;
  avatar: string | null;
  bio: string | null;
  bio2: string | null;
  email: string | null;
  github: string | null;
  tagline: string | null;
  skills: Array<{ title: string; items: string[] }>;
  techStack: Array<{ name: string; icon: string }>;
  updatedAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

// ── API Client ────────────────────────────────────────────────────
export const api = {
  posts: {
    list: (params?: {
      page?: number;
      limit?: number;
      kind?: string;
      category?: string;
      tag?: string;
      search?: string;
    }) => {
      const qs = new URLSearchParams();
      if (params?.page) qs.set('page', String(params.page));
      if (params?.limit) qs.set('limit', String(params.limit));
      if (params?.kind) qs.set('kind', params.kind);
      if (params?.category) qs.set('category', params.category);
      if (params?.tag) qs.set('tag', params.tag);
      if (params?.search) qs.set('search', params.search);
      const q = qs.toString();
      return request<Paginated<PostListItem>>(`/posts${q ? `?${q}` : ''}`);
    },

    get: (slug: string) =>
      request<{ post: PostDetail }>(`/posts/${slug}`),

    related: (slug: string, limit = 5) =>
      request<{ items: PostListItem[] }>(`/posts/${slug}/related?limit=${limit}`),
  },

  categories: {
    list: () => request<{ items: CategoryWithCount[] }>('/categories'),
    posts: (slug: string) =>
      request<{ items: PostListItem[]; total: number }>(`/categories/${slug}/posts`),
  },

  tags: {
    list: () => request<{ items: TagWithCount[] }>('/tags'),
    posts: (name: string) =>
      request<{ items: PostListItem[]; total: number }>(`/tags/${encodeURIComponent(name)}/posts`),
  },

  notes: {
    list: (params?: { page?: number; limit?: number; before?: string }) => {
      const qs = new URLSearchParams();
      if (params?.page) qs.set('page', String(params.page));
      if (params?.limit) qs.set('limit', String(params.limit));
      if (params?.before) qs.set('before', params.before);
      const q = qs.toString();
      return request<{ items: NoteItem[]; hasMore: boolean }>(`/notes${q ? `?${q}` : ''}`);
    },
  },

  archive: {
    get: () => request<{ years: ArchiveYear[] }>('/archive'),
  },

  projects: {
    list: () => request<{ items: Project[] }>('/projects'),
    get: (slug: string) => request<{ project: Project }>(`/projects/${slug}`),
  },

  friends: {
    list: () => request<{ items: Friend[] }>('/friends'),
  },

  about: {
    get: () => request<{ profile: AboutProfile }>('/about'),
  },
};
