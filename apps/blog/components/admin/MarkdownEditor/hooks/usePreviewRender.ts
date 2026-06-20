import { useEffect, useRef, useState } from "react";

const cache = new Map<string, string>();
const MAX_CACHE = 30;

/** 防抖调用服务端预览接口，返回渲染后的 HTML。相同输入命中内存缓存。 */
export function usePreviewRender(markdown: string, enabled: boolean, delay = 400) {
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const reqId = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const cached = cache.get(markdown);
    if (cached !== undefined) {
      setHtml(cached);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = ++reqId.current;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/admin/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ markdown }),
        });
        const data = await res.json();
        if (id !== reqId.current) return; // 已有更新请求，丢弃过期结果
        const rendered = typeof data.html === "string" ? data.html : "";
        cache.set(markdown, rendered);
        if (cache.size > MAX_CACHE) {
          const oldest = cache.keys().next().value;
          if (oldest !== undefined) cache.delete(oldest);
        }
        setHtml(rendered);
      } catch {
        if (id === reqId.current) {
          setHtml('<p class="text-[var(--muted)] text-sm">预览渲染失败</p>');
        }
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [markdown, enabled, delay]);

  return { html, loading };
}
