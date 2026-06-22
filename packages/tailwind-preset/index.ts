import type { Config } from "tailwindcss";

/**
 * blog 与 manager 共享的 Tailwind 主题扩展。
 * 两端 tailwind.config.ts 通过 `presets: [sharedPreset]` 引入，
 * 保证字阶 / 圆角 / 动画 / typography 插件一致。
 *
 * 各端仍可在自己的 `theme.extend` 里追加特化项（如 blog 的 background 渐变）。
 *
 * 注：preset 的 `content: []` 是占位，各端在自己的 config 里指定实际扫描路径，会覆盖此值。
 */
const preset: Config = {
  content: [],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      // 圆角令牌化：改 --radius* 即全站联动。
      borderRadius: {
        lg: "var(--radius-sm)",
        xl: "var(--radius)",
        "2xl": "var(--radius-lg)",
      },
      // 字阶（≈1.25 比例）。4xl 收敛到 2.5rem 拉开标题层级。
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.5rem", { lineHeight: "1.1" }],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(circle, var(--tw-gradient-stops))",
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "none",
            code: {
              backgroundColor: "var(--tw-prose-pre-bg)",
              padding: "0.2em 0.4em",
              borderRadius: "0.25rem",
              fontWeight: "400",
            },
            "code::before": { content: "''" },
            "code::after": { content: "''" },
          },
        },
      },
      keyframes: {
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(10px) scale(0.95)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default preset;
