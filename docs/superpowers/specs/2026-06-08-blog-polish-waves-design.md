# 博客优化路线图（Wave 设计）— 2026-06-08

> 在已成熟、已上线的个人技术博客上做「精修升级」（保留紫色玻璃/粒子风），分波次推进。
> 每个 Wave 自成可发布批次：完成后跑 `type-check` + `lint` + 隔离 `build`（`NEXT_DIST_DIR=.next.dev`，绝不碰生产 `.next`），再 commit。

## 现状（不重复造轮子）
已存在：玻璃拟态、粒子网络 Hero、渐变动画文字、鼠标跟随/点击特效、阅读进度、AI 助手(RAG)、
完整后台 CMS（Markdown 编辑器+自动保存）、统计仪表盘、跨文章/项目搜索、sitemap/RSS/结构化数据。
代码块**已有**：头部/语言标签/行号/行高亮/复制按钮。TOC **已有** IntersectionObserver 滚动高亮。

## Wave 0 — 正确性与清理（先做）
- W0.1 删除首页专栏网格里泄漏的测试分类 **"sssss"**（`content/categories.yaml`）。
- W0.2 修掉 3 个项目封面 404（`/images/projects/*.png` 目录不存在）：
  - 新增 `components/ui/GeneratedCover.tsx`：按 slug 确定性生成渐变+网格+图标的封面艺术。
  - `ProjectCard` / `ProjectCover` 在无真实封面时渲染生成封面（不再裂图/不再回退成单图标）。
  - 清空 `projects.yaml` 中指向不存在 png 的 `cover` 字段 → 彻底消除 404 与 console error。

## Wave 1 — 访客视觉与阅读（最大「高级感」提升）
- W1.1 **卡片质感差异化**（建立焦点层级，不再千篇一律紫玻璃）：
  - `lib/category-style.ts`：每个分类映射独立 accent 色 + 图标。
  - 首页专栏卡 / 分类页 / 分类徽章应用 accent（图标色、顶部 2px 渐变条、图标底色）。
  - 首页统计条改为更克制的「遥测」质感。
- W1.2 **Hero 纵深**：粒子网络之后叠一层极光/网格渐变 mesh（`prefers-reduced-motion` 下静态）。
- W1.3 **MDX 提示框 callouts**：解析 GitHub 风格 `> [!NOTE|TIP|WARNING|IMPORTANT|CAUTION]` →
  样式化提示框（remark/rehype 后处理 + CSS）。
- W1.4 **阅读页排版精修**：首段 lead 样式、标题锚点 hover 精修、暗色代码与正文对比微调。
- W1.5 暗色模式打磨 + `prefers-reduced-motion` 全局复核。

## 后续（已规划，未在本批）
Wave 2 访客功能（⌘K 命令面板、系列连载、点赞收藏、阅读位置记忆）；
Wave 3 作者后台（内容健康检查、OG 自动图、草稿定时发布、SEO 助手）；
Wave 4 技术级（View Transitions、OG 生成、Lighthouse/结构化数据）。

## 验证与部署纪律
- 预览：`NEXT_DIST_DIR=.next.dev PORT=3001 npm run dev`（3000 是生产 systemd 实例，勿动）。
- 每 Wave：`npm run type-check && npm run lint`，必要时隔离 build。
- 上线由用户决定时机，用 `./deploy.sh` 蓝绿部署。
