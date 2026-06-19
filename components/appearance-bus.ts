/**
 * 外观面板的轻量事件总线：Header 的入口按钮触发，全局挂载的 AppearancePanel 监听。
 * 与 command-palette-bus 同模式，避免把抽屉组件拉进 Header bundle。
 */
export const APPEARANCE_OPEN_EVENT = "appearance:open";

export function openAppearancePanel() {
  window.dispatchEvent(new CustomEvent(APPEARANCE_OPEN_EVENT));
}

/** 外观偏好的存储键与可选值（与 public/appearance-init.js 保持一致）。 */
export const APPEARANCE_KEY = "appearance";

export type AccentKey = "violet" | "blue" | "cyan" | "rose" | "green";
export type FontKey = "sans" | "serif";
export type RadiusKey = "standard" | "compact" | "round";

export interface AppearancePrefs {
  accent: AccentKey;
  font: FontKey;
  radius: RadiusKey;
}

export const DEFAULT_APPEARANCE: AppearancePrefs = {
  accent: "violet",
  font: "sans",
  radius: "standard",
};

export const ACCENT_OPTIONS: { key: AccentKey; label: string; swatch: string }[] = [
  { key: "violet", label: "紫罗兰", swatch: "#7c3aed" },
  { key: "blue", label: "靛蓝", swatch: "#3b82f6" },
  { key: "cyan", label: "青", swatch: "#06b6d4" },
  { key: "rose", label: "玫红", swatch: "#e11d48" },
  { key: "green", label: "翠绿", swatch: "#10b981" },
];

export function readAppearance(): AppearancePrefs {
  if (typeof window === "undefined") return DEFAULT_APPEARANCE;
  try {
    const raw = localStorage.getItem(APPEARANCE_KEY);
    if (!raw) return DEFAULT_APPEARANCE;
    return { ...DEFAULT_APPEARANCE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

/** 把偏好写入 <html> 的 data-* 属性（CSS 据此覆盖令牌）+ localStorage。 */
export function applyAppearance(prefs: AppearancePrefs) {
  const el = document.documentElement;
  el.dataset.accent = prefs.accent;
  el.dataset.font = prefs.font;
  el.dataset.radius = prefs.radius;
  localStorage.setItem(APPEARANCE_KEY, JSON.stringify(prefs));
}
