# 编辑器：图片上传自动增加描述 + 大小/排版控制

## Context

用户上传文章图片时，当前只插入 `![图片](url)`，缺少：
- 图片下方自动插入描述（figcaption）
- 图片大小调整
- 图片排版（如双栏并排）

## 方案

### 1. 图片插入格式 → `<figure>` + `<figcaption>`

上传成功后不再插入 `![图片](url)`，改为插入：

```html
<figure class="image-block">
  <img src="url" alt="图片描述" />
  <figcaption class="image-caption">在此输入图片描述...</figcaption>
</figure>
```

用户在 markdown 编辑器中可以直接编辑 `<figcaption>` 内的文字。

### 2. 图片大小控制

上传后弹出对话框，提供尺寸选项：

| 选项 | 实现 |
|------|------|
| 小（33%） | `<img style="max-width: 33%" ...>` |
| 中（66%） | `<img style="max-width: 66%" ...>` |
| 大（100%） | `<img class="max-w-full" ...>` |
| 自定义宽度 | 输入像素值 |

### 3. 图片双栏排版

对话框中加入"排版"选项：

| 选项 | 实现 |
|------|------|
| 默认（单栏） | 单个 `<figure>` |
| 双栏左 | `<div class="flex gap-4"><div class="flex-1"><figure>...</figure></div>...</div>`，两张图片 |
| 双栏右 | 同上，两张图片 |

双栏排版时，用户需要连续上传两张图片，对话框会提示"再上传一张以完成双栏"。

### 实现步骤

**在 [`app/admin/write/page.tsx`](app/admin/write/page.tsx) 中：**

1. 新增 `showImageDialog` 状态 + `pendingImageUrl` 存储待插入的图片 URL
2. 新增 `imageSize` / `imageLayout` 状态
3. 修改 `uploadImage` 函数：上传成功后弹出图片设置对话框，不再直接插入 markdown
4. 新增图片设置对话框 UI（尺寸选择 + 排版选择 + 确认插入）
5. 修改 `renderPreview` 中的图片渲染：
   - `<img>` 保持 `max-w-full rounded-lg my-4`
   - `<figure>` 和 `<figcaption>` 按样式渲染
   - 双栏容器 `.flex.gap-4` 正常渲染
6. 在 `insertMarkdown` 工具栏按钮后新增一个 `ImageSettingsDialog` 组件区域

### 关键修改

- [`app/admin/write/page.tsx`](app/admin/write/page.tsx) — 唯一需要修改的文件
  - 新增状态：`showImageDialog`, `pendingImageUrl`, `imageSize`, `imageLayout`, `imageCaption`
  - 重写 `uploadImage`：上传后弹出设置对话框
  - 新增 `insertImageWithSettings()` 函数：根据设置生成 markdown/HTML
  - 新增 `ImageSettingsDialog` 对话框 UI
  - 更新 `renderPreview` 处理 `<figure>` / `<figcaption>` / 双栏容器

## 验证

1. `npm run build` 验证编译
2. 管理后台上传一张图片，确认弹出设置对话框
3. 选择尺寸和排版，插入后确认预览正确显示
4. 编辑 `<figcaption>` 中的描述文字，确认预览同步更新
