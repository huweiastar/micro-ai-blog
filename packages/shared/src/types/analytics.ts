export interface PathStats {
  path: string;
  pv: number;
  uv: number;
  updatedAt: string;
}

export interface AnalyticsOverview {
  totalPv: number;
  totalUv: number;
  topPaths: PathStats[];
  dailyTrend: Array<{ date: string; pv: number; uv: number }>;
}

export interface PageViewPayload {
  path: string;
  visitorId: string;
  referrer?: string;
  userAgent?: string;
}
