"use client";

import { useState, useEffect } from "react";
import { useThemeConfig } from "../../../components/ThemeContext";
import {
  Check, Save, Plus,
  Image as ImageIcon, X,
} from "lucide-react";

export default function ThemePage() {
  const { setTheme: setGlobalTheme } = useThemeConfig();

  // Theme state
  const [themeBgImage, setThemeBgImage] = useState("");
  const [themeBgOpacity, setThemeBgOpacity] = useState(50);
  const [themeEffect, setThemeEffect] = useState("ink");
  const [themeSaved, setThemeSaved] = useState(false);
  const [bgImageHistory, setBgImageHistory] = useState<string[]>([]);

  // Load theme
  useEffect(() => {
    fetch("/api/theme")
      .then((res) => res.json())
      .then((data) => {
        setThemeBgImage(data.backgroundImage || "");
        setThemeBgOpacity(data.backgroundOpacity ?? 50);
        setThemeEffect(data.effectStyle || "ink");
      })
      .catch(() => {});

    try {
      const history = localStorage.getItem("bg-image-history");
      if (history) setBgImageHistory(JSON.parse(history));
    } catch {}
  }, []);

  const saveTheme = async () => {
    const themeData = { backgroundImage: themeBgImage, backgroundOpacity: themeBgOpacity, effectStyle: themeEffect };
    const res = await fetch("/api/theme", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(themeData),
    });
    const data = await res.json();
    if (data.success) {
      setGlobalTheme(themeData as any);
      setThemeSaved(true);
      setTimeout(() => setThemeSaved(false), 2000);
    }
  };

  const addToHistory = (url: string) => {
    setBgImageHistory((prev) => {
      const next = [url, ...prev.filter((u) => u !== url)].slice(0, 12);
      localStorage.setItem("bg-image-history", JSON.stringify(next));
      return next;
    });
  };

  const uploadThemeBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "theme-bg");
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (data.success) {
      setThemeBgImage(data.url);
      addToHistory(data.url);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">主题设置</h1>
      <div className="space-y-8">
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">背景设置</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-2">背景图片</label>
              <div className="flex items-center gap-4">
                {themeBgImage ? (
                  <div className="relative w-40 h-24 rounded-lg overflow-hidden border border-[var(--card-border)]">
                    <img src={themeBgImage} alt="背景预览" className="w-full h-full object-cover" /> {/* eslint-disable-line @next/next/no-img-element */}
                    <button onClick={() => setThemeBgImage("")} className="absolute top-1 right-1 p-1 rounded bg-black/50 text-white hover:bg-black/70"><X className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <div className="w-40 h-24 rounded-lg border-2 border-dashed border-[var(--card-border)] flex items-center justify-center text-[var(--muted)] text-xs">
                    暂无背景
                  </div>
                )}
                <div className="space-y-2">
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/50 cursor-pointer transition-colors">
                    <ImageIcon className="w-4 h-4" />上传图片
                    <input type="file" accept="image/*" onChange={uploadThemeBg} className="hidden" />
                  </label>
                  <p className="text-xs text-[var(--muted)]">推荐尺寸 1920x1080，支持 PNG/JPG</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-2">或输入图片链接</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={themeBgImage}
                  onChange={(e) => setThemeBgImage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && themeBgImage.trim()) { addToHistory(themeBgImage.trim()); } }}
                  placeholder="https://example.com/bg.jpg"
                  className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 text-sm"
                />
                <button
                  onClick={() => { if (themeBgImage.trim()) addToHistory(themeBgImage.trim()); }}
                  className="px-3 py-2.5 rounded-lg border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/50 transition-colors"
                  title="添加到历史记录"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Background Image History */}
            {bgImageHistory.length > 0 && (
              <div>
                <label className="block text-sm text-[var(--muted)] mb-2">历史背景</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {bgImageHistory.map((url, i) => (
                    <button
                      key={`${url}-${i}`}
                      onClick={() => setThemeBgImage(url)}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${themeBgImage === url ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/30" : "border-[var(--card-border)]"}`}
                    >
                      <img src={url} alt={`历史背景 ${i + 1}`} className="w-full h-16 object-cover" /> {/* eslint-disable-line @next/next/no-img-element */}
                      {themeBgImage === url && (
                        <div className="absolute inset-0 bg-[var(--primary)]/20 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => { if (confirm("确定清空所有历史背景？")) { setBgImageHistory([]); localStorage.removeItem("bg-image-history"); } }}
                  className="text-xs text-[var(--muted)] hover:text-red-400 mt-2 transition-colors"
                >
                  清空历史
                </button>
              </div>
            )}

            <div>
              <label className="block text-sm text-[var(--muted)] mb-2">背景透明度：{themeBgOpacity}%</label>
              <input type="range" min="1" max="50" value={themeBgOpacity} onChange={(e) => setThemeBgOpacity(Number(e.target.value))} className="w-full accent-[var(--primary)]" />
              <div className="flex justify-between text-xs text-[var(--muted)] mt-1">
                <span>极淡</span>
                <span>较深</span>
              </div>
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">点击特效</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: "ink", name: "墨水溅射", desc: "墨滴四溅" },
              { id: "sparkle", name: "星星闪烁", desc: "星光飞散" },
              { id: "ripple", name: "波纹扩散", desc: "水波涟漪" },
              { id: "none", name: "无特效", desc: "关闭特效" },
            ].map((eff) => (
              <button
                key={eff.id}
                onClick={() => setThemeEffect(eff.id)}
                className={`p-4 rounded-xl border-2 text-center transition-all ${themeEffect === eff.id ? "border-[var(--primary)] bg-[var(--primary)]/5" : "border-[var(--card-border)] hover:border-[var(--primary)]/30"}`}
              >
                <p className="font-medium text-sm">{eff.name}</p>
                <p className="text-xs text-[var(--muted)] mt-1">{eff.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <button onClick={saveTheme} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--primary)] text-white text-sm hover:bg-[var(--primary-hover)] transition-colors">
          {themeSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {themeSaved ? "已保存" : "保存主题"}
        </button>
      </div>
    </div>
  );
}
