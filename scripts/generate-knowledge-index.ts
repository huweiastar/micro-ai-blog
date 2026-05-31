#!/usr/bin/env tsx
import { saveKnowledgeIndex } from "../lib/assistant/indexer";

try {
  const outputPath = saveKnowledgeIndex();
  const fs = require("fs");
  const index = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
  console.log(`✅ Knowledge index saved to ${outputPath}`);
  console.log(`   Blog chunks: ${index.stats.blogCount}`);
  console.log(`   Project chunks: ${index.stats.projectCount}`);
  console.log(`   Code chunks: ${index.stats.codeCount}`);
  console.log(`   Total chunks: ${index.stats.totalChunks}`);
} catch (error) {
  console.error("❌ Failed to build knowledge index:", error);
  process.exit(1);
}
