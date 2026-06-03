"use client";

import { useCallback, useState } from "react";

export interface UploadedImage {
  url: string;
}

export function useImageUpload(endpoint: string = "/api/upload") {
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(
    async (
      file: File,
      meta: { type?: string; category?: string; articleTitle?: string } = {},
    ): Promise<UploadedImage | null> => {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        if (meta.type) fd.append("type", meta.type);
        if (meta.category) fd.append("category", meta.category);
        if (meta.articleTitle) fd.append("articleTitle", meta.articleTitle);
        const res = await fetch(endpoint, { method: "POST", body: fd });
        const data = await res.json().catch(() => ({}));
        if (data.success && data.url) return { url: data.url };
        if (data.error) console.warn("[image upload] server error:", data.error);
        return null;
      } catch (err) {
        console.warn("[image upload] failed:", err);
        return null;
      } finally {
        setUploading(false);
      }
    },
    [endpoint],
  );

  return { upload, uploading };
}
