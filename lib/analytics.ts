import fs from "fs";
import path from "path";

const analyticsPath = path.join(process.cwd(), "data", "analytics.json");

export type AnalyticsData = {
  pv: number;
  uv: number;
  visitorIds: string[];
  updatedAt: string;
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
    return { pv: 0, uv: 0, visitorIds: [], updatedAt: new Date().toISOString() };
  }
  const content = fs.readFileSync(analyticsPath, "utf-8");
  return JSON.parse(content) as AnalyticsData;
}

function writeAnalytics(data: AnalyticsData) {
  ensureDataDir();
  fs.writeFileSync(analyticsPath, JSON.stringify(data, null, 2), "utf-8");
}

export function getAnalytics(): { pv: number; uv: number } {
  const data = readAnalytics();
  return { pv: data.pv, uv: data.uv };
}

export function recordPageView(visitorId: string): { pv: number; uv: number } {
  const data = readAnalytics();
  data.pv += 1;

  const isNewVisitor = !data.visitorIds.includes(visitorId);
  if (isNewVisitor) {
    data.uv += 1;
    data.visitorIds.push(visitorId);
    // Keep only last 10000 visitor IDs to prevent unbounded growth
    if (data.visitorIds.length > 10000) {
      data.visitorIds = data.visitorIds.slice(-10000);
    }
  }

  data.updatedAt = new Date().toISOString();
  writeAnalytics(data);

  return { pv: data.pv, uv: data.uv };
}
