"use client";

import { useEffect, useState } from "react";

export default function AdminBarragePage() {
  const [enabled, setEnabled] = useState(true);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/barrage")
      .then((r) => r.json())
      .then((d: { enabled: boolean; items: string[] }) => {
        setEnabled(Boolean(d.enabled));
        setText((d.items ?? []).join("\n"));
      })
      .catch(() => setMsg("加载失败"))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    const items = text.split("\n").map((s) => s.trim()).filter(Boolean);
    try {
      const res = await fetch("/api/barrage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, items }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setText((data.data?.items ?? items).join("\n"));
        setMsg("已保存，首页即时生效");
      } else {
        setMsg(data.message || "保存失败");
      }
    } catch {
      setMsg("网络错误");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-[var(--muted)]">加载中…</div>;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-bold">首页弹幕</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">每行一条文案，飘过首页顶部 Hero 区。</p>

      <label className="mt-6 flex items-center gap-3">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        <span className="text-sm">启用弹幕</span>
      </label>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={12}
        placeholder="每行一条弹幕…"
        className="mt-4 w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] p-3 text-sm outline-none focus:border-[var(--primary)]"
      />

      <div className="mt-4 flex items-center gap-4">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "保存中…" : "保存"}
        </button>
        {msg && <span className="text-sm text-[var(--muted)]">{msg}</span>}
      </div>
    </div>
  );
}
