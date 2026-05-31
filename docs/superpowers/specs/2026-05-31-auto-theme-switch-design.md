---
name: auto-theme-switch
description: Automatic day/night theme switching by time period
---

# Auto Theme Switch Design

## Problem

博客在 `layout.tsx` 的初始化脚本中根据当前时间设置主题，但页面运行期间不会自动切换。用户从白天看到晚上，页面会一直保持 light 模式。

## Solution

新建 `useAutoTheme` hook + `AutoThemeSwitcher` 组件，挂载到 `RootLayout` 中。

### 文件变动

1. **新建 `hooks/useAutoTheme.ts`** — hook 核心逻辑
2. **新建 `components/AutoThemeSwitcher.tsx`** — 空壳组件调用 hook
3. **修改 `app/layout.tsx`** — 在 `ThemeProvider` 内挂载 `AutoThemeSwitcher`

### 逻辑

- `useAutoTheme` 内部：
  - `useTheme()` 获取 `theme` 和 `setTheme`
  - `useEffect` 中 `setInterval` 每 60 秒检查一次当前小时
  - `hour >= 6 && hour < 18` → `setTheme("light")`，否则 `setTheme("dark")`
  - 如果当前主题已经匹配目标，不调用 `setTheme` 避免触发不必要的重渲染
  - 清理：组件卸载时 `clearInterval`
- `AutoThemeSwitcher` — 一个返回 `null` 的组件，唯一作用是调用 `useAutoTheme()`
- `layout.tsx` — 在 `ThemeProvider` 内部、`ThemeConfigProvider` 同级添加 `<AutoThemeSwitcher />`

### 常量

- 白天起始小时：6
- 黑夜起始小时：18
- 检查间隔：60000ms (1 分钟)
