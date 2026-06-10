import { NextRequest, NextResponse } from "next/server";
import { getCategoryConfigs, saveCategoryConfigs } from "../../../lib/categories";

// 后台保存后立即生效：禁止 GET 被静态缓存成旧值。
export const dynamic = "force-dynamic";

export async function GET() {
  const categories = getCategoryConfigs();
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, background, bgOpacity, description_long, cover, draft } = body;

    if (!name) {
      return NextResponse.json({ error: "专栏名称不能为空" }, { status: 400 });
    }

    const categories = getCategoryConfigs();

    if (categories.some((c) => c.name === name)) {
      return NextResponse.json({ error: "该专栏名称已存在" }, { status: 400 });
    }

    categories.push({
      name,
      description: description || "",
      background: background || undefined,
      bgOpacity,
      description_long: description_long || undefined,
      cover: cover || undefined,
      draft: draft || undefined,
    });
    saveCategoryConfigs(categories);

    return NextResponse.json({ success: true, message: "专栏已添加" });
  } catch (error) {
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { oldName, name, description, background, bgOpacity, description_long, cover, draft } = body;

    if (!oldName || !name) {
      return NextResponse.json({ error: "参数不完整" }, { status: 400 });
    }

    const categories = getCategoryConfigs();
    const index = categories.findIndex((c) => c.name === oldName);
    if (index === -1) {
      return NextResponse.json({ error: "专栏不存在" }, { status: 404 });
    }

    categories[index] = {
      name,
      description: description || "",
      background: background || undefined,
      bgOpacity,
      description_long: description_long || undefined,
      cover: cover || undefined,
      draft: draft || undefined,
    };
    saveCategoryConfigs(categories);

    return NextResponse.json({ success: true, message: "专栏已更新" });
  } catch (error) {
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "专栏名称不能为空" }, { status: 400 });
    }

    let categories = getCategoryConfigs();
    categories = categories.filter((c) => c.name !== name);
    saveCategoryConfigs(categories);

    return NextResponse.json({ success: true, message: "专栏已删除" });
  } catch (error) {
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}
