import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      // 圆角令牌化（§1.3）：把卡片级圆角统一回 CSS 变量，作为唯一来源。
      // 取值与 Tailwind 默认完全一致（lg .5rem / xl .75rem / 2xl 1rem），
      // 故全站 75+ 处 rounded-lg/xl/2xl 零视觉变化即变为令牌驱动，未来改
      // --radius* 即可全站联动。sm/md/full 保持默认（小控件不并入卡片体系）。
      borderRadius: {
        lg: "var(--radius-sm)",
        xl: "var(--radius)",
        "2xl": "var(--radius-lg)",
      },
      // 模块化字阶（§1.2，≈1.25 比例）。多数值与 Tailwind 默认一致，
      // 仅 4xl 收敛到 2.5rem 以拉开标题层级；行高成对锁定，避免散落的 leading 漂移。
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

export default config;
