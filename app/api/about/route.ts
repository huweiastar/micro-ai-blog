import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAboutProfile, saveAboutProfile } from "../../../lib/about";
import type { AboutProfile } from "../../../types/about";

// 后台保存后立即生效：禁止 GET 被静态缓存成旧值。
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getAboutProfile());
}

const ALLOWED_KEYS: (keyof AboutProfile)[] = [
  "name", "avatar", "bio", "bio2", "email", "github", "tagline", "skills", "techStack",
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

    // profile（站名/头像/标语/技术栈/简介）经根布局 ProfileProvider 全站直出，
    // 且首页 tagline、/about 均为静态预渲染。保存后必须让根布局按需失效重建，
    // 否则改了不生效（静态 HTML 仍是构建期旧值）。'layout' 覆盖全站所有页面。
    revalidatePath("/", "layout");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("更新关于页失败:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
