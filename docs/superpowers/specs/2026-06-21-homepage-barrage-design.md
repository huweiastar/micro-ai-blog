# 首页弹幕 Hero + 后台文案管理 设计文档

> 日期：2026-06-21 ｜ 分支：`feat/homepage-barrage`（基于 main）

## 目标

去掉首页 Hero 区的「动态粒子线条」(ParticleNetwork)，替换为类似弹幕（barrage）的动态横向飘字效果；弹幕文案在后台单独维护（增删改 + 总开关）。

## 范围

**范围内**
- 新弹幕组件替换 Hero 区粒子背景。
- 弹幕文案存储（JSON 文件）+ 服务端读取。
- 后台 `/admin/barrage` 页面：文案列表增删改 + 弹幕总开关。
- `/api/barrage`（GET/PUT，admin 保护，PUT 后 revalidate 首页）。
- 删除无他处引用的 `ParticleNetwork.tsx`。

**范围外（YAGNI）**
- 速度/密度/透明度等参数后台化（用代码内默认值）。
- 弹幕来源复用「杂谈/说说」（明确选了独立文案列表）。
- 整屏飘字（仅限 Hero 区）。
- 访客侧互动（发弹幕、点赞等）。

## 架构

### 数据流（符合 CLAUDE.md「构建/SSR 时读，无运行时依赖」）

```
config/barrage.json ──(lib/barrage.ts 服务端读)──> app/page.tsx (server)
   ──> app/page.client.tsx ──> <BarrageHero items enabled />（client，CSS 动画）

后台保存：/admin/barrage (client 表单) ──PUT──> /api/barrage
   ──> atomicWriteFile(config/barrage.json) + revalidatePath("/")
```

### 数据格式

`config/barrage.json`：
```json
{
  "enabled": true,
  "items": ["第一条弹幕", "第二条弹幕", "..."]
}
```
- `enabled`：总开关。false 时 Hero 区不渲染弹幕（干净背景）。
- `items`：弹幕文案数组，每条一句短文本。空数组等价于不渲染。

### 组件 / 模块边界

| 单元 | 职责 | 依赖 |
|------|------|------|
| `lib/barrage.ts` | 读 `config/barrage.json`，返回 `{enabled, items}`，文件缺失/损坏时回退 `{enabled:false, items:[]}` | fs、`process.cwd()/config` |
| `components/ui/BarrageHero.tsx` | client 组件，输入 `items: string[]`，纯 CSS 动画渲染多轨道飘字；`enabled` 由父层决定是否挂载 | 无（自带 keyframes 样式） |
| `app/api/barrage/route.ts` | GET 返回当前配置；PUT 校验+原子写+`revalidatePath("/")` | `atomic-file`、`next/cache` |
| `app/admin/barrage/page.tsx` | 后台表单：开关 + 文案多行编辑 + 保存 | fetch `/api/barrage` |

## 弹幕渲染细节（BarrageHero）

- **轨道**：约 5–6 行，纵向均分 Hero 高度。每条文案随机分配轨道、随机时长（8–16s）、随机起始延迟，`animation-iteration-count: infinite` 循环。
- **动画**：CSS `@keyframes barrage-scroll { from { transform: translateX(100vw) } to { transform: translateX(-100%) } }`，纯 transform（GPU 友好）。
- **样式**：半透明文字/胶囊，颜色用 `--primary`/`--accent`/`--muted` 混合，**亮暗自适应**（走 CSS 变量，不硬编码）。
- **可读性**：保留原 Hero 的放射状遮罩（中央 `--background` 浓、周缘渐隐），护住居中标题/头像；弹幕处于标题下层（`z` 低于 `z-10` 内容）。
- **降级**：`prefers-reduced-motion: reduce` 下停动（站点 globals.css 已有全局 reduce 规则会把 animation-duration 压到 ~0；BarrageHero 额外在 reduce 时只显示少量静态文字或不显示，避免一堆文字堆在右边）。
- **空/关**：`enabled=false` 或 `items` 为空 → 父层不挂载 BarrageHero，Hero 区为纯背景。

## 首页改动（app/page.client.tsx）

- 移除 `import ParticleNetwork` 及 `<ParticleNetwork mousePos={mousePos} />`。
- 移除仅服务于粒子的 `mousePos` state、`handleMouseMove`、`handleMouseLeave`，以及 `<section>` 上的对应事件绑定（确认无其它消费者）。
- 在原粒子位置渲染 `enabled && items.length > 0 ? <BarrageHero items={items}/> : null`。
- `items`/`enabled` 由 `app/page.tsx`（server）经 `lib/barrage.ts` 读出后透传。
- 删除 `components/ui/ParticleNetwork.tsx`（grep 确认仅首页引用）。

## 后台

- `/admin/barrage`：复用现有 admin 页面风格（参照 `/admin/theme`、`/admin/notes`）。
  - 一个总开关（启用/停用弹幕）。
  - 文案编辑：一个 `<textarea>`，每行一条；保存时按换行拆分、去空行、trim。
  - 保存按钮 → PUT `/api/barrage`，成功提示。
- 在 admin 首页/导航加入「弹幕」入口（与 theme/notes 同级）。

### `/api/barrage`

- `GET`：返回 `readBarrage()`。`dynamic = "force-dynamic"`（避免被构建期静态缓存，和 theme API 一致）。
- `PUT`：
  - 校验 body：`enabled` 转 boolean；`items` 必须是字符串数组，逐条 trim 并丢弃空串，限制单条长度（如 ≤ 120 字）与条数上限（如 ≤ 200）防滥用。
  - `atomicWriteFile(config/barrage.json, ...)`。
  - `revalidatePath("/")` 让首页立即生效（修正历史上「admin 写接口漏 revalidate」的坑）。
  - 鉴权：依赖现有 admin middleware 对 `/api/*`、`/admin/*` 的保护（与其它 admin 写接口同机制，不另造轮子）。

## 测试

- `lib/barrage.test.ts`（vitest，沿用现有测试风格）：
  - 文件缺失 → 回退 `{enabled:false, items:[]}`。
  - 正常 JSON → 正确解析。
  - 损坏 JSON → 回退而非抛错。
- `/api/barrage` PUT 输入清洗逻辑可抽成纯函数 `sanitizeBarrageInput(body)` 便于单测（空行剔除、长度/条数上限、enabled 布尔化）。
- 视觉验证：Playwright 在亮/暗两种模式截图 Hero，确认弹幕飘动、标题可读、关闭后干净、颜色随主题。

## 验证流程（CLAUDE.md 要求）

`npm run type-check` → `npm run lint` → 隔离构建（`NEXT_DIST_DIR=.next.verify`，构建后删）→ `npm test`（blog 全测）→ dev(3001) Playwright 双模式视觉确认。

## 回滚

纯新增 + 局部替换，失败 `git reset` 到分支起点即可，不碰生产（本功能本地开发，部署另议）。
