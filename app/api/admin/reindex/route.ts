import { NextResponse } from "next/server";
import { saveKnowledgeIndex } from "../../../../lib/assistant/indexer";

export async function POST() {
  try {
    const outputPath = saveKnowledgeIndex();
    const fs = require("fs");
    const index = JSON.parse(fs.readFileSync(outputPath, "utf-8"));

    return NextResponse.json({
      success: true,
      message: "知识库索引已重建",
      stats: index.stats,
      updatedAt: index.updatedAt,
    });
  } catch (error) {
    console.error("Reindex error:", error);
    return NextResponse.json(
      { error: "重建索引失败" },
      { status: 500 }
    );
  }
}
