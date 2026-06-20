import fs from "fs";
import path from "path";
import { atomicWriteFile } from "../lib/atomic-file";
import { generateSearchIndex } from "../lib/posts";

const searchIndex = generateSearchIndex();
const outputPath = path.join(process.cwd(), "public/search-index.json");

atomicWriteFile(outputPath, JSON.stringify(searchIndex, null, 2));

console.log(`Search index generated: ${outputPath} (${searchIndex.length} items)`);
