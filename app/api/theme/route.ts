import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { atomicWriteFile } from "../../../lib/atomic-file";

const themePath = path.join(process.cwd(), "config/theme.json");

// 主题保存后需立即生效：禁止把 GET 静态缓存成构建期的旧值。
export const dynamic = "force-dynamic";

function readTheme() {
  try {
    const content = fs.readFileSync(themePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return { backgroundImage: "", backgroundOpacity: 8, effectStyle: "ink", colorScheme: "purple" };
  }
}

export async function GET() {
  return NextResponse.json(readTheme());
}

const ALLOWED_THEME_KEYS = ["backgroundImage", "backgroundOpacity", "effectStyle", "colorScheme"];

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const current = readTheme();
    // Only allow known theme keys to prevent prototype pollution
    const sanitized: Record<string, unknown> = {};
    for (const key of ALLOWED_THEME_KEYS) {
      if (key in body) {
        sanitized[key] = body[key];
      }
    }
    const updated = { ...current, ...sanitized };
    atomicWriteFile(themePath, JSON.stringify(updated, null, 2));
    return NextResponse.json({ success: true, message: "主题已更新" });
  } catch {
    return NextResponse.json({ success: false, message: "更新失败" }, { status: 500 });
  }
}
