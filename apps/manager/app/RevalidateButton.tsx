"use client";

import { useState } from "react";

export default function RevalidateButton() {
  const [state, setState] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [msg, setMsg] = useState<string>("");

  const trigger = async () => {
    setState("loading");
    setMsg("");
    try {
      const res = await fetch("/api/revalidate-ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paths: ["/"] }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setState("ok");
        setMsg(`已触发 blog 失效：${JSON.stringify(data.blog?.revalidated ?? data.blog)}`);
      } else {
        setState("err");
        setMsg(data.error || `失败（HTTP ${data.status ?? res.status}）`);
      }
    } catch (e) {
      setState("err");
      setMsg(e instanceof Error ? e.message : "网络错误");
    }
  };

  return (
    <div>
      <button
        onClick={trigger}
        disabled={state === "loading"}
        className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
      >
        {state === "loading" ? "触发中…" : "触发 blog 首页 revalidate"}
      </button>
      {msg && (
        <p
          className={`mt-3 text-sm ${state === "ok" ? "text-green-400" : "text-red-400"}`}
        >
          {msg}
        </p>
      )}
    </div>
  );
}
