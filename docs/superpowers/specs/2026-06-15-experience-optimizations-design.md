# 视觉体验优化设计文档

**日期**: 2026-06-15  
**分支**: feat/experience-optimizations  
**状态**: 已批准，待实现

---

## 一、设计方向

**主题**: 赛博终端极光（Cyber Terminal Aurora）

三个参考方向的融合：

| 来源 | 气质关键词 | 具体元素 |
|------|-----------|---------|
| 方向一·赛博朋克 | 深空黑·霓虹·网格 | 粒子背景、网格线、青紫双色光晕、数据仪表盘 stats |
| 方向二·极光杂志 | Aurora·玻璃卡片·杂志布局 | 极光渐变背景、Glassmorphism 卡片、封面图网格、阅读进度条 |
| 方向三·黑客终端 | 等宽字体·终端窗口·代码优先 | macOS 三色点卡片头、monospace 元数据、终端风代码块 |

**动效强度**: 重（粒子流、打字机、视差滚动、悬浮 3D 倾斜、光束扫过）

**优先级**: 首页 → 全站组件 → 文章详情页 → 其他页面

---

## 二、颜色系统

保留现有 CSS 变量体系，在暗色模式下扩展：

```css
/* 新增极光/终端专用 token */
--cyber-grid: rgba(99, 102, 241, 0.10);   /* 网格线颜色 */
--aurora-1: rgba(124, 58, 237, 0.35);      /* 极光紫 */
--aurora-2: rgba(6, 182, 212, 0.25);       /* 极光青 */
--terminal-bg: #161b22;                    /* 终端头背景（GitHub 暗） */
--terminal-border: #30363d;               /* 终端边框 */
--terminal-text: #8b949e;                 /* 终端次要文字 */
--neon-purple: #a78bfa;                   /* 霓虹紫 */
--neon-cyan: #06b6d4;                     /* 霓虹青 */
```

---

## 三、各区域设计规格

### 3.1 全局 Header

- **布局**: sticky top，毛玻璃背景（`backdrop-filter: blur(12px)`）
- **Logo**: `微观AI_` 等宽字体，渐变色（`--primary` → `--neon-cyan`），下划线光标闪烁
- **导航链接**: 路径风格（`~/blog`、`~/notes`），active 态有紫色底色
- **搜索按钮**: `⌘K` 风格，保留现有 CommandPalette 逻辑

### 3.2 首页 Hero 区（最高优先级）

**背景层（从底到顶叠加）**:
1. 深空底色 `#050b18`
2. CSS 网格线（`background-image` 双向线条）
3. Aurora 光晕：两个 `radial-gradient` div，绝对定位，`filter: blur(30px)`
4. 粒子层：用 `tsParticles`（轻量，约 15KB gzip）或纯 CSS `@keyframes` 实现上升粒子

**文字层**:
- Badge：`MICRO-AI BLOG · v3.0`，脉冲圆点 + 紫色边框
- 主标题：两行，渐变文字，末尾打字机光标（CSS `blink` animation）
- 副标题：`$ 深度 · LLM · Agent · 量化 · 工程实践`，等宽字体
- Stats 行：文章数 / 阅读量 / 话题数，等宽大数字

**实现方式**: 纯 CSS + 少量 React state（打字机效果），无需额外动画库

### 3.3 博客卡片（BlogCard 组件）

结构变化：
```
┌─────────────────────────────┐
│ ● ● ●  filename.mdx        │  ← 终端标题栏（三色点 + 文件名）
├─────────────────────────────┤
│  [封面图 / emoji 占位]      │  ← 80px 高度渐变封面
├─────────────────────────────┤
│  [LLM] [Transformer]        │  ← 标签（monospace，紫/青色）
│  文章标题（14px bold）      │
│  8 min · 2.1k · 06-10       │  ← 等宽元数据
└─────────────────────────────┘
```

悬浮效果：
- 边框从 `--card-border` 过渡到 `--primary`/40%
- 底部渐变扫光线（`opacity: 0 → 1`）
- 卡片轻微上移 `translateY(-2px)`

### 3.4 文章详情页

- **顶部阅读进度条**: 固定在页面最顶部，`width` 随滚动百分比变化，渐变色
- **代码块**: 终端窗口风格（三色点 header + 语言 badge + GitHub 暗色背景）
- **文章元数据**: 等宽字体（日期 / 作者 / 阅读时间 / 浏览数）
- **标签**: 与卡片统一，monospace 风格

### 3.5 全站基础组件

- **Tag 组件**: 统一为 monospace 字体 + 紫/青配色边框
- **Pagination**: 等宽数字，hover 加紫色光晕
- **ThemeToggle**: 保持现有逻辑，加过渡动效

---

## 四、动效规格

| 效果 | 触发时机 | 实现方式 | 强度 |
|------|---------|---------|------|
| 粒子上升 | 页面加载 | CSS `@keyframes` 或 tsParticles | 持续 |
| 打字机光标 | Hero 区 | CSS `blink` animation | 持续 |
| 卡片悬浮扫光 | hover | CSS transition + 伪元素 | hover |
| 阅读进度条 | 滚动 | `scroll` event → state → width | 滚动 |
| 元素入场 | 进入视口 | `IntersectionObserver` + CSS class | 一次 |
| Aurora 光晕流动 | 持续 | CSS `@keyframes` position 偏移 | 持续 |

---

## 五、技术依赖

| 包 | 用途 | 是否已有 |
|----|------|---------|
| `framer-motion` | 页面过渡 / 元素入场 | 需新增（可选，优先用 CSS） |
| `tsparticles` / `@tsparticles/react` | Hero 粒子效果 | 需新增（可选，纯 CSS 替代） |
| `lucide-react` | 图标 | ✅ 已有 |
| `next-themes` | 暗色模式 | ✅ 已有 |
| `clsx` | 条件 className | ✅ 已有 |

> 粒子效果优先考虑纯 CSS 实现（`@keyframes`），避免引入过重依赖。若视觉效果不足再引入 tsParticles。

---

## 六、实现范围与顺序

1. **首页 Hero 区** — 背景层、粒子、打字机、Stats
2. **BlogCard 组件** — 终端卡片头、封面、悬浮扫光
3. **全局 Header** — 等宽 Logo、路径导航、毛玻璃
4. **全站 Tag / 基础 UI** — 统一 monospace 风格
5. **文章详情页** — 进度条、代码块终端风、元数据
6. **其他页面** — about、projects、archive 等复用上述组件

---

## 七、不在本次范围内

- 后端 / API 逻辑改动
- 内容结构（MDX frontmatter）变更
- 管理后台（admin）视觉改造
- 生产部署（本次仅开发端口预览）

---

## 八、验收标准

- [ ] `npm run type-check` 通过
- [ ] `npm run lint` 通过
- [ ] `npm run build` 成功
- [ ] 开发端口（`npm run dev`）可正常预览所有改动页面
- [ ] 暗色模式 / 亮色模式均无视觉异常
- [ ] 移动端响应式正常（md 断点以下）
