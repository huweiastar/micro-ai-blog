import localFont from "next/font/local";

/**
 * 自托管字体（Phase 1 §1.1）。仅拉丁子集的可变字重 woff2：
 * 中英混排时 Inter / JetBrains Mono 只命中拉丁字符，中文经 CSS fallback 链
 * 自然回落到系统中文字（见 globals.css 的 --font-sans / --font-mono）。
 * 选用本地自托管而非 next/font/google，是为了让构建不依赖 Google Fonts 可达性。
 */

// 拉丁正文 / UI / 标题
export const fontSans = localFont({
  src: "./fonts/inter-latin-variable.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-inter",
  preload: true,
  // 可见的中文回落由 CSS 链负责，关闭自动 Arial 度量回落以免干扰 CJK 排版
  adjustFontFallback: false,
});

// 代码 / 数字（tabular-nums）
export const fontMono = localFont({
  src: "./fonts/jetbrains-mono-latin-variable.woff2",
  weight: "100 800",
  style: "normal",
  display: "swap",
  variable: "--font-jbmono",
  preload: true,
  adjustFontFallback: false,
});
