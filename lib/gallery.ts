import fs from "fs";
import path from "path";
import yaml from "js-yaml";

const galleryPath = path.join(process.cwd(), "content/gallery.yaml");

export interface GalleryPhoto {
  src: string;
  title?: string;
  date?: string;
  location?: string;
}

/** 读取相册照片，按日期倒序（无日期的排最后）。文件缺失/为空时返回 []。 */
export function getGalleryPhotos(): GalleryPhoto[] {
  if (!fs.existsSync(galleryPath)) return [];
  const raw = fs.readFileSync(galleryPath, "utf-8");
  const data = yaml.load(raw) as { photos?: GalleryPhoto[] } | null;
  const photos = data?.photos ?? [];
  return photos
    .filter((p) => p && typeof p.src === "string" && p.src.length > 0)
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}
