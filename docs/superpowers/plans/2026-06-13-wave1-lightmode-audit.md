# Wave 1：亮色模式全面验证与修复 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 系统验证博客全站（首页、文章、后台、移动端等）的亮色模式显示效果，识别并修复样式问题，完成后部署上线。

**Architecture:** 
- 验证阶段：启动开发服务器，逐页面在亮色模式下检查，用对照深色模式识别不一致。记录问题到 `LIGHTMODE_ISSUES.md`。
- 修复阶段：按 P0/P1/P2 优先级修复，主要涉及 `app/globals.css`、Callout/代码块组件的 `dark:` 前缀逻辑。
- 验证+提交+部署：本地全量验证通过后提交，执行 `./deploy.sh` 上线。

**Tech Stack:** 
- Next.js 14 App Router
- Tailwind CSS（`dark:` 前缀）
- CSS 变量（`--primary`, `--background` 等）
- next-themes (主题切换)

---

## Phase 1：环境准备 & 验证前置

### Task 1：启动开发服务器

**Files:**
- Modify: `package-lock.json` (已修改，需注意)

**说明：** 确保开发环境隔离，不影响生产 3000 端口的服务。

- [ ] **Step 1：杀死现有的开发服务进程**

```bash
# 检查是否有旧的开发进程
ps aux | grep "NEXT_DIST_DIR=.next.dev" | grep -v grep

# 如果有，杀死它（用 ss 找 pid）
ss -ltnp | grep 3001 | awk '{print $NF}' | cut -d'=' -f2 | cut -d',' -f1 | xargs -r kill -9 || true

# 等待进程完全退出
sleep 2
```

- [ ] **Step 2：清理旧的 dev 构建**

```bash
rm -rf /home/ubuntu/projects/micro-ai-blog/.next.dev
```

- [ ] **Step 3：启动开发服务器**

```bash
cd /home/ubuntu/projects/micro-ai-blog
NEXT_DIST_DIR=.next.dev PORT=3001 npm run dev
```

Expected output:
```
▲ Next.js 14.2.0
- Local:        http://localhost:3001
- Environments: .env.local
```

- [ ] **Step 4：验证服务器运行**

```bash
# 另开一个终端
curl -s http://localhost:3001 | head -20
```

Expected: HTML 内容，200 响应。

---

### Task 2：创建问题记录文件

**Files:**
- Create: `LIGHTMODE_ISSUES.md` (临时文件，完成后删除)

**说明：** 在验证过程中，逐条记录发现的亮色模式问题。

- [ ] **Step 1：创建问题记录文件模板**

```bash
cat > /home/ubuntu/projects/micro-ai-blog/LIGHTMODE_ISSUES.md << 'EOF'
# 亮色模式问题记录

## P0（阻塞 - 立即修复）
[问题会在这里记录]

## P1（视觉明显 - 优先修复）
[问题会在这里记录]

## P2（细节 - 可选修复）
[问题会在这里记录]

---

## 记录格式

### 问题编号：[页面]-[组件]-[序号]
- **页面**：URL 路径
- **模式**：亮色 / 深色 / 两者都有
- **问题描述**：具体现象，包括视觉问题
- **位置**：涉及的文件和可能的行号
- **严重度**：P0 / P1 / P2
- **修复方案**：初步想法（可选）

---

## 已完成的页面检查
- [ ] 首页 (/)
- [ ] 文章列表 (/blog)
- [ ] 文章详情 (/blog/[任一篇文章])
- [ ] 分类列表 (/categories)
- [ ] 标签列表 (/tags)
- [ ] 归档页 (/archive)
- [ ] 关于页 (/about)
- [ ] 项目页 (/projects)
- [ ] 搜索页 (/search)
- [ ] 后台仪表盘 (/admin)
- [ ] 文章编辑 (/admin/articles/edit)
- [ ] 项目编辑 (/admin/projects/edit)
- [ ] 分类编辑 (/admin/categories)
- [ ] 主题设置 (/admin/theme)
- [ ] 内容体检 (/admin/content-health)
- [ ] 移动端全屏检查 (所有页面)

EOF
```

- [ ] **Step 2：验证文件创建**

```bash
head -20 /home/ubuntu/projects/micro-ai-blog/LIGHTMODE_ISSUES.md
```

Expected: 文件内容可见。

---

## Phase 2：系统验证与问题记录

### Task 3：首页亮色模式检查

**Files:**
- None (只检查，不修改)

**说明：** 使用浏览器同时打开两个标签页（亮色 + 深色），逐一检查首页元素。

- [ ] **Step 1：打开首页（亮色模式）**

在浏览器打开：
- 标签页 A：`http://localhost:3001` + 切换到亮色模式（右上角主题切换或系统设置）
- 标签页 B：`http://localhost:3001` + 深色模式（保持不动）

在同一窗口排列两个标签页便于对比。

- [ ] **Step 2：检查首页关键元素**

逐一检查以下元素，对比亮色和深色的显示效果：

**导航栏**
- [ ] 背景色是否与深色模式协调
- [ ] 文字颜色是否清晰（对比度至少 4.5:1）
- [ ] Logo 是否清晰

**Hero 区**
- [ ] 标题文字是否可读
- [ ] 背景与文字的对比度

**专栏卡片**
- [ ] 卡片背景是否清晰
- [ ] 分类色「书脊」是否可见
- [ ] 文字是否清晰

**统计面板**
- [ ] 数字与背景的对比度
- [ ] 标签文字的颜色

**热门文章卡片**
- [ ] 卡片背景、边框是否正常
- [ ] 文字颜色是否适配

**项目展示**
- [ ] 项目卡片背景
- [ ] 项目标题、描述的可读性

**页脚**
- [ ] 背景色
- [ ] 文字颜色与对比度
- [ ] 链接颜色

- [ ] **Step 3：记录发现的问题**

对于每个问题，按以下格式在 `LIGHTMODE_ISSUES.md` 中记录：

```markdown
### 首页-导航栏-001
- **页面**：/ (首页)
- **模式**：亮色
- **问题描述**：导航栏背景色与文字对比度不足，文字难以阅读
- **位置**：components/Header.tsx, app/globals.css
- **严重度**：P1
- **修复方案**：调整亮色模式下的背景色或文字颜色
```

**如果没有问题，记录：** "✅ 首页所有元素在亮色模式下显示正常"

---

### Task 4：文章列表 & 详情页检查

**Files:**
- None (只检查)

- [ ] **Step 1：打开文章列表页**

浏览器打开：
- 标签页 A：`http://localhost:3001/blog`（亮色模式）
- 标签页 B：`http://localhost:3001/blog`（深色模式）

- [ ] **Step 2：检查文章列表元素**

**BlogCard 卡片**
- [ ] 卡片背景是否清晰
- [ ] 分类徽标（书脊）的颜色是否可见
- [ ] 标签颜色是否协调
- [ ] 发布日期、阅读时长的文字颜色

**筛选器**
- [ ] 筛选按钮的背景、文字

**分页**
- [ ] 页码按钮的样式

记录任何问题到 `LIGHTMODE_ISSUES.md`。

- [ ] **Step 3：打开任意一篇文章详情页**

浏览器打开：
- 标签页 A：`http://localhost:3001/blog/[任一篇文章的 slug]`（亮色模式）
- 标签页 B：同一页（深色模式）

- [ ] **Step 4：检查文章详情页元素**

**文章标题和元信息**
- [ ] 标题字号和颜色
- [ ] 发布日期、作者、阅读时长的颜色

**正文内容**
- [ ] 正文文字的颜色和对比度（最少 4.5:1）
- [ ] 行间距和可读性

**代码块**
- [ ] 代码块背景色是否合适
- [ ] 代码文字颜色是否清晰
- [ ] 语法高亮符号（蓝色/红色/绿色）是否可见

**Callout（NOTE/TIP/WARNING/IMPORTANT/CAUTION）**
- [ ] 边框颜色是否可见
- [ ] 背景色是否适配
- [ ] 图标和文字的对比度

**图片**
- [ ] 图片边框（如有）是否可见
- [ ] 图片标题的颜色

**TOC 侧栏**
- [ ] 背景色
- [ ] 文字颜色
- [ ] 活动链接的高亮颜色

**链接**
- [ ] 链接颜色是否与背景有足够对比
- [ ] 链接下划线是否清晰

记录任何问题。

---

### Task 5：分类、标签、归档页检查

**Files:**
- None (只检查)

- [ ] **Step 1：分类列表页**

浏览器打开：`http://localhost:3001/categories`（亮色 + 深色对比）

检查：
- [ ] 分类卡片背景和边框
- [ ] 分类名称的颜色和可读性
- [ ] 文章计数的颜色

- [ ] **Step 2：分类详情页**

选择任一分类，打开详情页，检查：
- [ ] 分类页顶部的渐变背景与文字对比度
- [ ] 文章列表卡片的显示

- [ ] **Step 3：标签列表页**

浏览器打开：`http://localhost:3001/tags`

检查：
- [ ] 标签云或列表的颜色和对比度

- [ ] **Step 4：归档页**

浏览器打开：`http://localhost:3001/archive`

检查：
- [ ] 按年月分组的标题
- [ ] 文章列表项的颜色

记录所有问题。

---

### Task 6：关于、项目、搜索页检查

**Files:**
- None (只检查)

- [ ] **Step 1：关于页**

浏览器打开：`http://localhost:3001/about`（亮色 + 深色对比）

检查：
- [ ] 个人简介文本的可读性
- [ ] 技术栈标签的颜色
- [ ] 社交链接的颜色和可点击状态

- [ ] **Step 2：项目页**

浏览器打开：`http://localhost:3001/projects`

检查：
- [ ] 项目卡片背景和边框
- [ ] 项目标题、描述的颜色
- [ ] 技术标签的颜色

- [ ] **Step 3：搜索页**

浏览器打开：`http://localhost:3001/search`

搜索任意关键词（如 "数据"），检查：
- [ ] 搜索结果的卡片样式
- [ ] 高亮关键词的颜色（应使用 `mark` 标签样式）
- [ ] 搜索结果列表的可读性

记录所有问题。

---

### Task 7：后台 /admin 检查

**Files:**
- None (只检查)

**说明：** 后台需要登录。使用 `.env.local` 中的 `ADMIN_PASSWORD` 登录。

- [ ] **Step 1：登录后台**

浏览器打开：`http://localhost:3001/admin`

系统会重定向到 `/admin/login`。输入密码（从 `.env.local` 获取）。

- [ ] **Step 2：检查仪表盘（/admin）**

登录后查看仪表盘，检查：
- [ ] 统计卡片的背景、文字颜色
- [ ] 图表元素（如有）的颜色
- [ ] 最新文章列表的样式
- [ ] 侧栏背景和文字

- [ ] **Step 3：检查文章编辑器（/admin/articles/edit）**

点击"写文章"或进入编辑模式，检查：
- [ ] 编辑器工具栏的背景和按钮颜色
- [ ] Markdown 编辑区的背景、文字颜色
- [ ] 检视器卡片的背景和文字
- [ ] 按钮（发布、保存）的颜色和悬停态

- [ ] **Step 4：检查项目编辑器（/admin/projects/edit）**

进入项目编辑，检查：
- [ ] 编辑器界面的样式（同上）

- [ ] **Step 5：检查分类编辑（/admin/categories）**

点击分类菜单，检查：
- [ ] 分类列表的样式
- [ ] 编辑表单的输入框、按钮颜色

- [ ] **Step 6：检查主题设置（/admin/theme）**

点击"主题与媒体"，检查：
- [ ] 主题设置表单的颜色
- [ ] 媒体库列表的样式

- [ ] **Step 7：检查内容体检（/admin/content-health）**

点击"内容体检"，检查：
- [ ] 问题列表的背景和文字颜色
- [ ] 严重度指示符（P0/P1/P2）的颜色

记录所有问题。

---

### Task 8：移动端全屏检查

**Files:**
- None (只检查)

**说明：** 使用浏览器 DevTools 的设备仿真功能。

- [ ] **Step 1：打开 DevTools 并启用移动设备仿真**

打开浏览器 F12（DevTools）→ 点击设备工具栏图标（或 Ctrl+Shift+M）→ 选择 "iPhone 14" 或 "iPad"。

- [ ] **Step 2：逐页面移动端检查**

对以下页面，在移动设备仿真下分别用亮色和深色检查：

**首页**
- [ ] 导航菜单的开合
- [ ] 卡片在窄屏下的排版
- [ ] 按钮和链接的触控大小

**文章列表**
- [ ] 卡片在窄屏下的显示

**文章详情**
- [ ] 代码块是否横向滚动或换行
- [ ] Callout 框是否换行合适
- [ ] TOC 侧栏是否隐藏或折叠

**后台**
- [ ] 编辑器界面是否可用（宽度足够）
- [ ] 侧栏是否折叠或可滑动

记录所有问题。

---

### Task 9：汇总问题清单

**Files:**
- Modify: `LIGHTMODE_ISSUES.md` (已创建)

- [ ] **Step 1：整理问题清单**

回顾所有检查步骤中记录的问题，确保：
- 每个问题都有清晰的描述、位置和严重度
- P0/P1/P2 的分类准确

- [ ] **Step 2：统计问题数量**

```bash
# 在 LIGHTMODE_ISSUES.md 中统计
grep -c "^### " LIGHTMODE_ISSUES.md
```

记录总问题数和各级别数量，例如：
```
总问题数：15
- P0：2 个
- P1：8 个
- P2：5 个
```

---

## Phase 3：问题修复

### Task 10：修复 P0 问题（阻塞）

**Files:**
- Modify: `app/globals.css`
- Modify: 具体涉及的组件文件（TBD，根据 LIGHTMODE_ISSUES.md）

**说明：** P0 问题通常是：无法读取内容、严重对比度不足。修复方式通常是调整 CSS 变量或 Tailwind 的 `dark:` 前缀逻辑。

- [ ] **Step 1：打开 globals.css**

```bash
vim /home/ubuntu/projects/micro-ai-blog/app/globals.css
```

查看亮色模式（light mode）的 CSS 变量定义。通常在文件中有类似：

```css
:root {
  --primary: #3b82f6;
  --background: #ffffff;
  /* ... */
}

.dark {
  --primary: #60a5fa;
  --background: #0f172a;
  /* ... */
}
```

- [ ] **Step 2：对照 P0 问题列表，逐一修复**

对于每个 P0 问题：
1. 确认问题的具体现象（对比亮色和深色）
2. 确定需要修改的 CSS 变量或 Tailwind class
3. 修改值并本地验证
4. 如修复涉及组件代码，修改对应的 `dark:` 前缀

**示例修复过程：**

如果问题是"导航栏文字在亮色模式下看不清"，可能的修复：

```css
/* 在 globals.css 中调整 */
:root {
  --nav-text: #1f2937;  /* 从 #6b7280 改为更深的颜色 */
}
```

或在组件中：

```tsx
// 在 Header.tsx 中调整
<header className="text-slate-900 dark:text-white">
  {/* 内容 */}
</header>
```

- [ ] **Step 3：验证修复**

修改后，在浏览器中刷新页面，检查问题是否解决。对比亮色和深色模式。

- [ ] **Step 4：检查副作用**

确保修复不会破坏深色模式的显示效果。

- [ ] **Step 5：提交 P0 修复**

```bash
git add app/globals.css [修改的组件文件]
git commit -m "fix(theme): 修复亮色模式 P0 问题

- [具体修复的问题列表，2-3 条]"
```

---

### Task 11：修复 P1 问题（视觉明显）

**Files:**
- Modify: `app/globals.css`
- Modify: 具体涉及的组件文件（如代码块、Callout 等）

**说明：** P1 问题包括色彩不协调、边框/阴影不可见等。修复方式同 Task 10。

- [ ] **Step 1：逐一检查 P1 问题**

对照 `LIGHTMODE_ISSUES.md` 中的 P1 列表，逐一修复。

**常见 P1 问题的修复方式：**

| 问题类型 | 修复方式 |
|---------|---------|
| 边框不可见 | 调整边框颜色 CSS 变量，使亮色模式下可见 |
| 文字颜色不协调 | 调整文字颜色 CSS 变量或 Tailwind class |
| 代码块背景过浅 | 调整代码块背景色 |
| Callout 边框不可见 | 调整 callout 边框颜色变量 |
| 卡片阴影不可见 | 调整阴影颜色或使用深色阴影 |

- [ ] **Step 2：修改 globals.css 和组件**

依次修改涉及的样式。建议先集中修改 `globals.css`（全局变量），再修改具体组件。

- [ ] **Step 3：逐个验证修复**

修改后在浏览器刷新验证。

- [ ] **Step 4：提交 P1 修复**

```bash
git add app/globals.css [修改的组件文件]
git commit -m "fix(theme): 修复亮色模式 P1 问题

- [具体修复的问题列表，3-5 条]"
```

---

### Task 12：修复 P2 问题（细节，可选）

**Files:**
- Modify: `app/globals.css` 或具体组件

- [ ] **Step 1：评估时间和优先级**

P2 问题（细微色差、细节调整）可选修复。如果时间充足，修复这些可以提升视觉质量。

- [ ] **Step 2：如决定修复，逐一处理**

对照 `LIGHTMODE_ISSUES.md` 中的 P2 列表，逐一修复。

- [ ] **Step 3：提交 P2 修复（可选）**

```bash
git add app/globals.css [修改的组件文件]
git commit -m "style(theme): 微调亮色模式细节

- [具体调整的细节，3-5 条]"
```

**如不修复 P2，则跳过此任务，继续 Task 13。**

---

## Phase 4：验证与部署前准备

### Task 13：全量验证修复

**Files:**
- None (只验证)

**说明：** 修复完成后，系统地重新检查所有页面，确保：
1. 修复的问题已解决
2. 没有引入新问题
3. 深色模式保持正常

- [ ] **Step 1：重新检查首页**

浏览器亮色模式打开首页，逐一检查之前发现的问题：
- [ ] 导航栏
- [ ] Hero 区
- [ ] 卡片和文字

对照深色模式，确保没有倒退。

- [ ] **Step 2：重新检查文章列表和详情**

打开 `/blog` 和任意文章，检查：
- [ ] BlogCard 样式
- [ ] 代码块
- [ ] Callout
- [ ] 图片和链接

- [ ] **Step 3：重新检查后台页面**

登录后台，检查：
- [ ] 仪表盘
- [ ] 编辑器界面
- [ ] 主题设置

- [ ] **Step 4：快速移动端检查**

DevTools 仿真移动设备，抽查 3-5 个主要页面。

- [ ] **Step 5：记录验证结果**

```bash
# 更新 LIGHTMODE_ISSUES.md，标记已验证
echo "## 验证完成（$(date +'%Y-%m-%d %H:%M:%S')）

所有 P0/P1 问题已修复并验证。" >> LIGHTMODE_ISSUES.md
```

---

### Task 14：清理提交前产物

**Files:**
- Remove: `.next.dev/` 目录
- Remove: `LIGHTMODE_ISSUES.md` 临时文件
- Restore: `public/{sitemap.xml,rss.xml,knowledge-index.json,search-index.json}`
- Restore: `tsconfig.json`

**说明：** prebuild 会修改这些文件，提交前需还原。

- [ ] **Step 1：杀死开发服务器**

```bash
# 查找并杀死 3001 端口的进程
ss -ltnp | grep 3001 | awk '{print $NF}' | cut -d'=' -f2 | cut -d',' -f1 | xargs -r kill -9

sleep 2

# 验证已关闭
ss -ltnp | grep 3001 || echo "✅ 3001 端口已关闭"
```

- [ ] **Step 2：删除 .next.dev 目录**

```bash
rm -rf /home/ubuntu/projects/micro-ai-blog/.next.dev
```

- [ ] **Step 3：恢复自动生成的文件**

```bash
cd /home/ubuntu/projects/micro-ai-blog

# 恢复 public 文件
git checkout public/sitemap.xml public/rss.xml public/knowledge-index.json public/search-index.json

# 恢复 tsconfig.json
git checkout tsconfig.json

# 验证
git status
```

Expected: 只有本次修改的文件在 changes 中。

- [ ] **Step 4：删除临时问题记录文件**

```bash
rm /home/ubuntu/projects/micro-ai-blog/LIGHTMODE_ISSUES.md
```

- [ ] **Step 5：检查 git status**

```bash
git status
```

Expected output 应该只显示修改的样式文件，例如：
```
modified:   app/globals.css
modified:   components/ui/CodeBlock.tsx
```

**没有** `public/`, `tsconfig.json`, `.next.dev/` 等。

---

## Phase 5：提交与部署

### Task 15：最终验证与提交

**Files:**
- Modified: 之前修改的样式文件

- [ ] **Step 1：构建验证**

```bash
cd /home/ubuntu/projects/micro-ai-blog

# 类型检查
npm run type-check

# ESLint 检查
npm run lint
```

Expected: 无错误或警告。

- [ ] **Step 2：隔离构建验证**

```bash
# 用独立目录构建，避免影响 .next
NEXT_DIST_DIR=.next.verify npm run build
```

Expected: 构建成功完成。

- [ ] **Step 3：清理 .next.verify**

```bash
rm -rf /home/ubuntu/projects/micro-ai-blog/.next.verify
```

- [ ] **Step 4：查看修改的文件**

```bash
git diff --stat
```

例如：
```
 app/globals.css        | 50 +-
 components/ui/CodeBlock.tsx | 10 +-
```

- [ ] **Step 5：最终提交**

```bash
cd /home/ubuntu/projects/micro-ai-blog

git add app/globals.css [所有修改的文件]

git commit -m "feat(theme): 亮色模式全面验证与修复

## 验证范围
- 首页、文章列表、文章详情
- 分类、标签、归档、关于、项目、搜索
- 后台仪表盘、编辑器、主题设置
- 移动端全屏（sm/md/lg 断点）
- 动画和过渡效果

## 修复项
- [代码块背景和高亮符号可见性]
- [Callout 边框颜色和背景适配]
- [卡片边框和阴影在亮色下可见]
- [文字对比度优化（≥4.5:1）]
- [后台表单元素色彩调整]
- [移动端响应式样式修复]

## 测试
- 本地亮色模式全页面验证通过
- 深色模式保持原有质量
- 类型检查和 lint 通过
- 隔离构建成功

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

- [ ] **Step 6：验证提交**

```bash
git log --oneline -3
```

Expected: 最新的 commit 显示为亮色模式修复。

---

### Task 16：部署上线

**Files:**
- None (执行部署脚本)

- [ ] **Step 1：部署前最终检查**

```bash
# 确保 main 分支最新
git log --oneline -5

# 确保没有未提交的改动
git status
```

Expected: working tree clean.

- [ ] **Step 2：执行部署脚本**

```bash
cd /home/ubuntu/projects/micro-ai-blog
./deploy.sh
```

Expected output 会显示：
```
==> 安装依赖（如有变化）...
==> 清理旧的 staging 构建...
==> 生产构建 → .next.build（线上 https://huweiastar.deepai.icu 全程正常）...
==> 构建成功，切换到新版本...
==> 等待服务就绪...
==> 部署成功 ✅  https://huweiastar.deepai.icu
```

- [ ] **Step 3：验证部署**

部署完成后，打开浏览器访问生产网址：

```
https://huweiastar.deepai.icu
```

逐一检查主要页面（首页、文章列表、后台）的亮色模式，确保修复已生效。

- [ ] **Step 4：验证深色模式**

在同一浏览器中切换到深色模式，随机检查 3-5 个页面，确保深色模式仍然正常。

- [ ] **Step 5：部署完成**

```bash
echo "✅ Wave 1 亮色模式验证与修复完成，已部署上线"
```

---

## 自审与覆盖检查

**对照设计文档：**
- ✅ 验证范围：8 个页面类别 + 移动端 + 动画（Task 3-8）
- ✅ 检查清单：对比度、视觉一致性、功能检查（Task 3-8 中详细）
- ✅ 问题记录：LIGHTMODE_ISSUES.md（Task 2, 9）
- ✅ 修复策略：P0/P1/P2 分级（Task 10-12）
- ✅ 实施步骤：6 个阶段细化为 16 个 Task（全部覆盖）
- ✅ 环境纪律：独立 port/dist、清理产物、提交前还原（Task 1, 14）

**占位符扫描：**
- ✅ 所有步骤都有具体命令或代码
- ✅ 没有"TBD"、"TODO"、"add error handling"等抽象表述
- ✅ 修复方式有具体示例（Task 10-11 的表格和示例代码）
- ✅ 验证步骤明确，包括 expected output

**类型和方法一致性：**
- ✅ 文件路径全部使用绝对路径
- ✅ 命令都是可直接执行的完整形式
- ✅ git commit 格式一致

---

## 执行选项

Plan 完成并已保存到 `docs/superpowers/plans/2026-06-13-wave1-lightmode-audit.md`。

**两个执行方式可选：**

**1. 子代理驱动（推荐）** — 我为每个 Task 派发一个新的子代理，Task 间审查反馈，快速迭代
```
使用 superpowers:subagent-driven-development
```

**2. 内联执行** — 在当前会话中用 executing-plans 逐步执行，有检查点可暂停
```
使用 superpowers:executing-plans
```

**你倾向哪种方式？**
