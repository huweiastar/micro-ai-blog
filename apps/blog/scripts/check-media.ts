import fs from "fs";
import path from "path";
import { findMissingPostImages, localImagePath } from "../lib/content-media";

const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".bmp"]);
const TEXT_EXTS = new Set([".md", ".mdx", ".yaml", ".yml", ".json"]);
const SCAN_ROOTS = ["content", "config"];
const imagesRoot = path.join(process.cwd(), "public", "images");

let hasError = false;

function error(msg: string) {
  console.error("ERROR: " + msg);
  hasError = true;
}

function info(msg: string) {
  console.log("- " + msg);
}

function walk(dir: string, predicate: (file: string) => boolean, files: string[] = []): string[] {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, predicate, files);
    else if (predicate(full)) files.push(full);
  }
  return files;
}

function normalizeUrl(url: string): string {
  return url.split("#")[0].split("?")[0];
}

function collectReferencedImages(): Map<string, string[]> {
  const refs = new Map<string, string[]>();
  const files = SCAN_ROOTS.flatMap((root) =>
    walk(path.join(process.cwd(), root), (file) => TEXT_EXTS.has(path.extname(file).toLowerCase()))
  );
  const pattern = /["'\(]((?:\/images\/)[^"'\)\s]+)/g;

  for (const file of files) {
    const rel = path.relative(process.cwd(), file);
    const source = fs.readFileSync(file, "utf-8");
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(source)) !== null) {
      const url = normalizeUrl(match[1]);
      const list = refs.get(url) || [];
      list.push(rel);
      refs.set(url, list);
    }
  }

  return refs;
}

function fileUrl(file: string): string {
  return "/images/" + path.relative(imagesRoot, file).split(path.sep).join("/");
}

const referenced = collectReferencedImages();
const imageFiles = walk(imagesRoot, (file) => IMAGE_EXTS.has(path.extname(file).toLowerCase()));

const missingRefs = Array.from(referenced.entries()).filter(([url]) => {
  const localPath = localImagePath(url);
  return !localPath || !fs.existsSync(localPath);
});
const missingPostImages = findMissingPostImages();
const unused = imageFiles
  .map(fileUrl)
  .filter((url) => !referenced.has(url))
  .sort();

console.log("Media files: " + imageFiles.length);
console.log("Referenced image URLs: " + referenced.size);

if (missingRefs.length > 0) {
  for (const [url, files] of missingRefs) {
    error(url + " is referenced but missing (" + Array.from(new Set(files)).join(", ") + ")");
  }
}

const postOnlyMissing = missingPostImages.filter((item) => !missingRefs.some(([url]) => url === item.url));
for (const item of postOnlyMissing) {
  error(item.url + " is missing in " + item.file);
}

if (unused.length > 0) {
  info("Unused images (" + unused.length + "):");
  for (const url of unused) console.log("  " + url);
} else {
  info("No unused images found");
}

if (hasError) process.exit(1);
console.log("Media checks passed");
