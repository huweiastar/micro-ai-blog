"use client";

import { useCallback, useState } from "react";

export interface UploadedImage {
  url: string;
}

interface UploadResponse {
  success?: boolean;
  url?: string;
  error?: string;
}

export function useImageUpload(endpoint: string = "/api/upload") {
  const [uploading, setUploading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const upload = useCallback(
    async (
      file: File,
      meta: { type?: string; category?: string; articleTitle?: string } = {},
    ): Promise<UploadedImage | null> => {
      setUploading(true);
      setLastError(null);
      try {
        const fd = new FormData();
        fd.append("file", file);
        if (meta.type) fd.append("type", meta.type);
        if (meta.category) fd.append("category", meta.category);
        if (meta.articleTitle) fd.append("articleTitle", meta.articleTitle);
        const res = await fetch(endpoint, { method: "POST", body: fd });
        const raw: unknown = await res.json().catch(() => ({}));
        const data: UploadResponse = (raw && typeof raw === "object" ? raw : {}) as UploadResponse;
        if (data.success && data.url) return { url: data.url };
        const errMsg = data.error || `上传失败 (HTTP ${res.status})`;
        console.warn("[image upload] server error:", errMsg);
        setLastError(errMsg);
        return null;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "网络错误";
        console.warn("[image upload] failed:", err);
        setLastError(errMsg);
        return null;
      } finally {
        setUploading(false);
      }
    },
    [endpoint],
  );

  return { upload, uploading, lastError };
}
