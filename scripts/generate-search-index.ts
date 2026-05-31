import fs from "fs";
import path from "path";
import { generateSearchIndex } from "../lib/posts";

const searchIndex = generateSearchIndex();
const outputPath = path.join(process.cwd(), "public/search-index.json");

fs.writeFileSync(outputPath, JSON.stringify(searchIndex, null, 2), "utf-8");

console.log(`Search index generated: ${outputPath} (${searchIndex.length} items)`);
