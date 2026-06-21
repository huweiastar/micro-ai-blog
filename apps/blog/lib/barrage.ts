import fs from "fs";
import path from "path";

export interface BarrageConfig {
  enabled: boolean;
  items: string[];
}

const MAX_LEN = 120;
const MAX_ITEMS = 200;

const barragePath = path.join(process.cwd(), "config/barrage.json");

/** 清洗任意外部输入为合法 BarrageConfig：布尔化 enabled、过滤非字符串、trim、去空、限长限量。 */
export function sanitizeBarrageInput(body: unknown): BarrageConfig {
  const obj = (body ?? {}) as Record<string, unknown>;
  const enabled = Boolean(obj.enabled);
  const raw = Array.isArray(obj.items) ? obj.items : [];
  const items = raw
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => (s.length > MAX_LEN ? s.slice(0, MAX_LEN) : s))
    .slice(0, MAX_ITEMS);
  return { enabled, items };
}

/** 服务端读取 config/barrage.json；缺失/损坏时回退为关闭+空列表，绝不抛错拖垮首页。 */
export function readBarrage(): BarrageConfig {
  try {
    const content = fs.readFileSync(barragePath, "utf-8");
    return sanitizeBarrageInput(JSON.parse(content));
  } catch {
    return { enabled: false, items: [] };
  }
}
