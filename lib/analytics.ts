import fs from "fs";
import path from "path";

const analyticsPath = path.join(process.cwd(), "data", "analytics.json");

export type PathAnalytics = {
  pv: number;
  uv: number;
  visitorIds: string[];
  updatedAt: string;
};

export type AnalyticsData = {
  pv: number;
  uv: number;
  visitorIds: string[];
  updatedAt: string;
  paths: Record<string, PathAnalytics>;
};

function ensureDataDir() {
  const dir = path.dirname(analyticsPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readAnalytics(): AnalyticsData {
  ensureDataDir();
  if (!fs.existsSync(analyticsPath)) {
    return { pv: 0, uv: 0, visitorIds: [], updatedAt: new Date().toISOString(), paths: {} };
  }
  const content = fs.readFileSync(analyticsPath, "utf-8");
  const data = JSON.parse(content) as AnalyticsData;
  // Ensure paths object exists for backward compatibility
  if (!data.paths) {
    data.paths = {};
  }
  return data;
}

function writeAnalytics(data: AnalyticsData) {
  ensureDataDir();
  fs.writeFileSync(analyticsPath, JSON.stringify(data, null, 2), "utf-8");
}

function recordPathView(data: AnalyticsData, visitorId: string, pagePath: string): PathAnalytics {
  if (!data.paths[pagePath]) {
    data.paths[pagePath] = { pv: 0, uv: 0, visitorIds: [], updatedAt: new Date().toISOString() };
  }

  const pathData = data.paths[pagePath];
  pathData.pv += 1;

  const isNewVisitor = !pathData.visitorIds.includes(visitorId);
  if (isNewVisitor) {
    pathData.uv += 1;
    pathData.visitorIds.push(visitorId);
    if (pathData.visitorIds.length > 10000) {
      pathData.visitorIds = pathData.visitorIds.slice(-10000);
    }
  }

  pathData.updatedAt = new Date().toISOString();
  return pathData;
}

export function getAnalytics(): { pv: number; uv: number } {
  const data = readAnalytics();
  return { pv: data.pv, uv: data.uv };
}

export function getPathAnalytics(pagePath: string): PathAnalytics {
  const data = readAnalytics();
  return (
    data.paths[pagePath] || { pv: 0, uv: 0, visitorIds: [], updatedAt: new Date().toISOString() }
  );
}

export function recordPageView(
  visitorId: string,
  pagePath: string
): { global: { pv: number; uv: number }; path: PathAnalytics } {
  const data = readAnalytics();

  // Record global PV/UV
  data.pv += 1;
  const isNewGlobalVisitor = !data.visitorIds.includes(visitorId);
  if (isNewGlobalVisitor) {
    data.uv += 1;
    data.visitorIds.push(visitorId);
    if (data.visitorIds.length > 10000) {
      data.visitorIds = data.visitorIds.slice(-10000);
    }
  }

  // Record path-specific PV/UV
  const pathStats = recordPathView(data, visitorId, pagePath);

  data.updatedAt = new Date().toISOString();
  writeAnalytics(data);

  return {
    global: { pv: data.pv, uv: data.uv },
    path: pathStats,
  };
}
