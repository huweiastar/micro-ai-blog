import type {
  PostListItem,
  PostDetail,
  NoteItem,
  ChatterItem,
  CategoryWithCount,
  TagWithCount,
  Project,
  Friend,
  GalleryPhoto,
  AlbumGroup,
  AboutProfile,
  PathStats,
  AnalyticsOverview,
  PageViewPayload,
  ArchiveTree,
  Barrage,
  BarrageCreate,
  SearchResult,
  Paginated,
} from '../types/index.js';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    cache: init?.cache ?? 'force-cache',
    next: init?.next ?? { revalidate: 60 },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(
      body?.error || res.statusText,
      res.status,
      body
    );
  }

  const json = await res.json();
  if (!json.ok) {
    throw new ApiError(json.error, res.status, json);
  }
  return json.data as T;
}

function qs(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  }
  const str = searchParams.toString();
  return str ? `?${str}` : '';
}

// Public API client
export const api = {
  posts: {
    list: (q?: {
      page?: number;
      limit?: number;
      kind?: string;
      category?: string;
      tag?: string;
      search?: string;
    }) => request<Paginated<PostListItem>>(`/posts${qs(q || {})}`),

    get: (slug: string) =>
      request<{ post: PostDetail }>(`/posts/${slug}`),

    related: (slug: string, limit = 5) =>
      request<{ items: PostListItem[] }>(
        `/posts/${slug}/related?limit=${limit}`
      ),
  },

  notes: {
    list: (q?: { page?: number; limit?: number; before?: string }) =>
      request<{ items: NoteItem[]; hasMore: boolean }>(
        `/notes${qs(q || {})}`
      ),
  },

  chatters: {
    list: (q?: { page?: number; limit?: number }) =>
      request<{ items: ChatterItem[] }>(`/chatters${qs(q || {})}`),

    get: (slug: string) =>
      request<{ chatter: ChatterItem }>(`/chatters/${slug}`),
  },

  categories: {
    list: () => request<{ items: CategoryWithCount[] }>('/categories'),
  },

  tags: {
    list: () => request<{ items: TagWithCount[] }>('/tags'),
  },

  projects: {
    list: () => request<{ items: Project[] }>('/projects'),

    get: (slug: string) =>
      request<{ project: Project }>(`/projects/${slug}`),
  },

  friends: {
    list: () => request<{ items: Friend[] }>('/friends'),
  },

  gallery: {
    list: (q?: { album?: string; page?: number; limit?: number }) =>
      request<{ items: GalleryPhoto[]; albums: AlbumGroup[] }>(
        `/gallery${qs(q || {})}`
      ),
  },

  about: {
    get: () => request<{ profile: AboutProfile }>('/about'),
  },

  archive: {
    get: () => request<{ years: ArchiveTree }>('/archive'),
  },

  search: {
    query: (q: string, limit = 20) =>
      request<{ items: SearchResult[]; total: number }>(
        `/search?q=${encodeURIComponent(q)}&limit=${limit}`
      ),
  },

  analytics: {
    recordPageView: (payload: PageViewPayload) =>
      request('/analytics/pageview', {
        method: 'POST',
        body: JSON.stringify(payload),
        cache: 'no-store',
      }),

    stats: (paths: string[]) =>
      request<{ stats: PathStats[] }>(
        `/analytics/stats?paths=${paths.join(',')}`
      ),

    overview: (days = 30) =>
      request<AnalyticsOverview>(`/analytics/overview?days=${days}`),
  },

  likes: {
    toggle: (slug: string, visitorId: string) =>
      request<{ count: number; liked: boolean }>('/likes/toggle', {
        method: 'POST',
        body: JSON.stringify({ slug, visitorId }),
        cache: 'no-store',
      }),

    count: (slug: string) =>
      request<{ count: number }>(`/likes/${slug}`),
  },

  barrage: {
    list: (limit = 50) =>
      request<{ items: Barrage[] }>(`/barrage?limit=${limit}`),

    post: (payload: BarrageCreate) =>
      request<{ barrage: Barrage }>('/barrage', {
        method: 'POST',
        body: JSON.stringify(payload),
        cache: 'no-store',
      }),
  },
};

// Admin API client (requires auth header)
export const adminApi = {
  posts: {
    list: (token: string, q?: { page?: number; limit?: number; draft?: boolean }) =>
      request<Paginated<PostListItem>>(`/admin/posts${qs(q || {})}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),

    create: (token: string, data: Partial<PostDetail>) =>
      request<{ post: PostDetail }>('/admin/posts', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),

    update: (token: string, id: number, data: Partial<PostDetail>) =>
      request<{ post: PostDetail }>(`/admin/posts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),

    delete: (token: string, id: number) =>
      request('/admin/posts/${id}', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),
  },

  auth: {
    login: (password: string) =>
      request<{ token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
        cache: 'no-store',
      }),
  },
};

export { ApiError, request };
