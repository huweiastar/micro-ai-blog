# Giscus 评论配置

评论基于 [giscus](https://giscus.app)（GitHub Discussions）。需在 **GitHub 端**完成 3 步，再填 4 个环境变量。

## GitHub 端（一次性）
1. 仓库 Settings → General → Features → 勾选 **Discussions**。
2. 安装并授权 [giscus App](https://github.com/apps/giscus) 到该仓库。
3. 在 Discussions 下确保存在一个 category（如 `Announcements`），用于承载评论。

## 获取变量
打开 https://giscus.app ，填入仓库后页面会生成 `data-repo-id` 与 `data-category-id`。

## 环境变量（`.env.local`）

```
NEXT_PUBLIC_GISCUS_REPO="owner/repo"
NEXT_PUBLIC_GISCUS_REPO_ID="R_xxx"
NEXT_PUBLIC_GISCUS_CATEGORY="Announcements"
NEXT_PUBLIC_GISCUS_CATEGORY_ID="DIC_xxx"
```

> 注意：`NEXT_PUBLIC_*` 在 **构建期** 内联。修改后必须重新 `npm run build`（或重启 `npm run dev`）才会生效。未配置时评论区显示占位提示而非空白。
