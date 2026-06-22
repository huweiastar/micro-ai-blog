export interface Barrage {
  id: number;
  content: string;
  nick: string | null;
  color: string;
  approved: boolean;
  createdAt: string;
}

export interface BarrageCreate {
  content: string;
  nick?: string;
  color?: string;
}

export interface SearchResult {
  slug: string;
  title: string;
  kind: string;
  summary: string | null;
  rank: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

export interface ApiResponse<T> {
  ok: boolean;
  data: T;
}

export interface ApiError {
  ok: false;
  error: string;
}
