import { NextRequest, NextResponse } from "next/server";
import { getAboutProfile, saveAboutProfile } from "../../../lib/about";
import type { AboutProfile } from "../../../types/about";

// 后台保存后立即生效：禁止 GET 被静态缓存成旧值。
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getAboutProfile());
}

const ALLOWED_KEYS: (keyof AboutProfile)[] = [
  "name", "avatar", "bio", "bio2", "email", "github", "skills", "techStack",
];

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    // Only allow known keys to prevent prototype pollution
    const updates: Partial<AboutProfile> = {};
    for (const key of ALLOWED_KEYS) {
      if (key in body) {
        updates[key] = body[key] as never;
      }
    }

    const current = getAboutProfile();
    const profile = { ...current, ...updates } as AboutProfile;
    saveAboutProfile(profile);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("更新关于页失败:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
