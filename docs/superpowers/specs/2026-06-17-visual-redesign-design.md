# 视觉改版设计方案 ——「折中·精致科技」

> 日期: 2026-06-17 · 分支: `feat/visual-redesign`(自 `main` 切出)
> 方向: 折中·精致科技 —— 克制 editorial 骨架为主,少数焦点保留克制的科技点缀。

## 背景与诊断

现状是一套成熟、特性丰富的博客(Next.js 14 + Tailwind + CSS 变量主题 + 暗色),
底子不差:editorial 卡片系统、暗色模式、令牌定义都在。核心矛盾在两处:

1. **动效层过载(最大冗余)**:全站同时挂 3 套全局装饰动效,首页再叠 1 套——
   - `MouseFollow`(自定义光标 + 8 点拖尾,`mousemove` 持续 setState 重渲染) `layout.tsx:101`
   - `ClickRipple`(每次点击生成 6–11 个墨花 DOM) `layout.tsx:102`
   - `AnimatedBackground`(4 个 30–38rem、`blur(110px)` 极光团,合成昂贵)
   - `ParticleNetwork`(196 行 canvas,仅首页 Hero,与极光叠加)
   这些均非功能性动效,互相抢注意力且有真实性能代价。
2. **排版没投入(最大可提升)**:正文仅系统字体栈;`prose-custom` 无行宽上限(`maxWidth:none`),
   大屏长行超 100 字符;h2/h3 固定字号断点跳变;渐变文字滥用(Hero/logo/计数/标题多处)。

次要问题:各页 `max-w-*` 不统一;圆角/阴影令牌定义了却被硬编码绕过;`ui/Card`(glass)
未并入已统一的 editorial 实心卡范式;文章页右栏空置导致空间浪费 + 行宽过长;
可视化几乎空白;`BackToTop` 与 `AssistantLauncher` 右下角可能堆叠。

## 已确认的关键决策

- **方向**: 折中·精致科技。
- **字体**: 系统中文栈 + 自托管 Inter(拉丁/UI/标题)+ 自托管 JetBrains Mono(代码/数字)。
- **背景动效**: **保留粒子网(首页 Hero)、删除极光层(aurora)**;全局保留背景图 + 可读性蒙层 + 暗角。
- **点击特效**: 默认关闭(`effectStyle` 默认 `none`),后台仍可开启,作为彩蛋。
- **范围**: Phase 1 + 2 + 3 全做。

## 非目标(YAGNI)

- 不更换品牌主色(紫→紫罗兰保留)。
- 不引入中文 webfont(体积/自托管成本,已决策用系统中文)。
- 不重构内容数据流 / MDX 管线。
- 不耦合进 `chore/next16-upgrade`(本分支自 main 切出,独立推进;`next/font/local` 在 14/16 均可用)。

---

## Phase 1 — 设计系统地基(受益全站、风险低)

### 1.1 字体系统
- `next/font/local` 自托管 **Inter**(可变字重 woff2,`display:"swap"`,`preload`,`variable:"--font-sans"`)。
- `next/font/local` 自托管 **JetBrains Mono**(`variable:"--font-mono"`)。字体文件放 `app/fonts/`。
- `:root` 暴露:
  - `--font-sans: var(--font-inter), "PingFang SC","HarmonyOS Sans SC","Microsoft YaHei",sans-serif;`
  - `--font-mono: var(--font-jbmono), "SF Mono",Monaco,Consolas,monospace;`
- `tailwind.config.ts` 的 `fontFamily.sans/mono` 引用上述变量;`body` 用 `--font-sans`。
- 中英混排靠 fallback 链:Inter 仅命中拉丁字符,中文自然回落到系统中文字。
- 代码块、inline code、统计数字(`tabular-nums`)统一 `--font-mono`,替换散落的 `"SF Mono"…` 栈。

### 1.2 字阶与阅读节奏
- 模块化字阶(≈1.25 比例)落到 Tailwind `fontSize` 或 CSS clamp:
  `xs .75 / sm .875 / base 1 / lg 1.125 / xl 1.25 / 2xl 1.5 / 3xl 1.875 / 4xl 2.5`。
- `prose-custom h2/h3` 改 `clamp()`,与现有 h1 写法对齐,消除断点跳变。
- **正文行宽上限**:`prose-custom { max-width: 72ch }`(配合 2.4 文章三栏)。
- 正文 `line-height` 统一(正文 ~1.85),li/blockquote/callout 节奏对齐。

### 1.3 令牌收敛
- **圆角**:全站收敛到 `--radius`(12px,普通卡/按钮)、`--radius-lg`(16px,大卡/代码块)、`rounded-full`(胶囊)。
  组件内硬编码的 `rounded-xl/2xl` 改引用令牌(逐一替换,grep 校验)。
- **阴影**:统一 `--shadow-sm/md/lg` + 新增 `--shadow-glow`(hover 主题辉光)。
  删除 `shadow-2xl shadow-[var(--primary)]/20` 等硬编码,`card-interactive` / `glass-hover` 同步。
- **宽度**:`Container` 作为唯一宽度源,提供 size 变体(`prose`≈`max-w-3xl` / `default`≈`max-w-5xl` / `wide`≈`max-w-6xl`)。
  `page.client.tsx` 中散落的 `max-w-3xl/4xl/5xl` 全部并入 Container 变体。

### 1.4 配色微调
- 新增中性「纸/墨」基调:亮色 `--background` 从 `#f8fafc` 微调到带极轻暖灰的纸色;正文 ink 略加深以保对比。暗色维持。
- **渐变文字收敛到单一焦点**:仅 Hero 主名字保留渐变,且去掉无限循环 `animate-gradient`(改静态或仅入场一次)。
  Header logo、`PageHeader` 计数、各页标题改实色(`--foreground` / `--primary`)。

### 1.5 动效做减法
- **移除** `MouseFollow`(组件 + `layout.tsx` 挂载 + 相关 keyframes)。
- **删除极光层**:`AnimatedBackground` 移除 4 个 aurora/blob `<div>`,保留背景图 + 可读性蒙层 + 暗角。
- **保留** `ParticleNetwork` 于首页 Hero(可微调密度/性能,但保留)。
- `ClickRipple` 默认 `effectStyle: "none"`(改 `config/theme.json` 默认 + 后台保留开关);组件逻辑保留。
- 清理 `globals.css` 中确认无引用的 keyframes(先 `grep` 验证:`float-particle-*`、`bounce-slow`、
  `spin-slow`、`aurora-drift`(若仅极光用)、`shimmer` 等),逐个删除。
- 新增动效统一纳入既有 `prefers-reduced-motion` 降级。

**Phase 1 验证**: `npm run type-check && npm run lint && npm run build`,本地 `dev -p 3001` 抽查首页/文章/列表。

---

## Phase 2 — 核心页面 / 组件

### 2.1 Hero 重构(`app/page.client.tsx`)
- 高度 `min-h-[70vh]` → `min-h-[58vh]`,首屏透出「最新文章」首行,提升信息密度。
- 名字保留(静态渐变);tagline / 社交胶囊 / 技术标签按新字阶重排间距。
- Stats 条复用现有发丝线网格(`gap-px + bg-card-border`);数字改 `--font-mono` + `tabular-nums`;hover 态保留。

### 2.2 卡片范式归一
- `ui/Card`(glass)并入 editorial 实心卡:`bg-card` + border + `--radius-lg` + 统一 hover(`-translate-y-1` + `--shadow-glow`)。
- `glass` 仅保留给真正「悬浮于内容之上」的场景(Header、浮层、命令面板)。
- `BlogCard`/`ProjectCard`/专栏卡:硬编码圆角/阴影换令牌,视觉不变。
- 排查并迁移仍在用 `ui/Card` 的页面(about/profile 等)。

### 2.3 文章页三栏(`components/ArticleLayout.tsx`)
- 布局:**左 TOC(可折叠)· 居中正文(capped 72ch)· 右元信息栏**。
- 右栏(仅 `lg+`):阅读进度环 + 元信息(日期/字数/阅读时长)+ 本文标签 + 精简「相关文章」。
- 小屏回落:现有 `MobileToc` + 顶部 `ReadingProgress` 条。
- 代码块视觉保留,仅换 `--font-mono` + 令牌化阴影。

### 2.4 列表/索引页
- 统一 `PageHeader` + `Container`;`/blog` 网格间距/密度按新令牌;`Pagination` 样式令牌化。

### 2.5 浮层堆叠规范
- 定义右下角浮层堆叠:`AssistantLauncher` 与 `BackToTop` 用统一 z-index 与 `bottom` 偏移变量,避免重叠。

**Phase 2 验证**: 同 Phase 1,并重点抽查文章页三栏在 `lg`/移动端的回落。

---

## Phase 3 — 轻量可视化(用满空间、不冗余)

按性价比实现(纯 CSS、零/极少依赖):
1. **标签权重云**(`/tags`):标签按文章数映射字号/透明度。
2. **归档时间线**(`/archive`):按年份分组竖向时间轴,左侧年份刻度 + 节点。
3. **足迹热力图**(`/footprint`):GitHub 贡献墙风格发布热力,CSS grid。
4. **分类占比**(首页或 `/categories`):一条极简水平占比条,复用发丝线思路。

**Phase 3 验证**: 同上,抽查各可视化页空数据兜底与暗色表现。

---

## 组件/文件影响清单(预估)

- 新增: `app/fonts/*`(字体文件)、`app/fonts.ts`(next/font 定义,可选)。
- 改: `app/globals.css`(令牌/字阶/keyframes 清理)、`tailwind.config.ts`(fontFamily/fontSize)、
  `app/layout.tsx`(挂载字体变量 / 移除 MouseFollow)、`components/ui/AnimatedBackground.tsx`(删极光)、
  `components/ui/MouseFollow.tsx`(删除)、`components/ui/ClickEffect.tsx`(默认关,逻辑保留)、
  `config/theme.json`(effectStyle 默认)、`app/page.client.tsx`(Hero)、`components/ui/Card.tsx`、
  `components/ui/Container.tsx`(size 变体)、`components/ArticleLayout.tsx`(三栏)、
  `components/ui/PageHeader.tsx`、`components/BlogCard.tsx`/`ProjectCard.tsx`(令牌化)、
  `app/tags`/`app/archive`/`app/footprint`/`app/categories`(可视化)。

## 风险与回滚

- 字体自托管首屏:`display:swap` + `preload` 控制,中文不受影响(系统字)。
- 删极光后暗色背景偏平:依赖背景图 + 蒙层托底,必要时给背景图 dark 滤镜微调。
- 分阶段 commit,每 Phase 独立验证,便于二分回滚。
- 与 `chore/next16-upgrade` 并行:本分支基于 main,合并顺序由用户决定;两者改动域基本不重叠。
