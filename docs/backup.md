# 数据库备份

站点的运行时数据（PV/UV、独立访客、点赞、登录态）都在 SQLite `data/blog.db`。
`deploy.sh` 不会动 `data/`，所以部署安全；但**服务器磁盘损坏会丢数据**，需异地备份补齐。

## 手动备份

```bash
npm run backup:db
```

会在 `data/backups/` 生成一致性快照（自动合并 WAL，不阻塞读写），并按 `BACKUP_KEEP`（默认 14）轮转。

## 异地推送（推荐）

配置 [rclone](https://rclone.org/)（如七牛/S3/对象存储）后，设环境变量启用：

```bash
# 一次性配置 rclone 远端（交互式）
rclone config        # 假设建好名为 qiniu 的远端

# 备份并推送异地
BACKUP_RCLONE_REMOTE=qiniu:my-bucket/blog-db npm run backup:db
```

## 定时任务（cron，每天 03:00）

`crontab -e` 加入（用 `bash -lc` 以加载 node/npm 的 PATH）：

```cron
0 3 * * * bash -lc 'cd /home/ubuntu/projects/micro-ai-blog && BACKUP_RCLONE_REMOTE=qiniu:my-bucket/blog-db npm run backup:db' >> /home/ubuntu/blog-backup.log 2>&1
```

## 恢复

```bash
sudo systemctl stop micro-ai-blog
cp data/backups/blog-<时间戳>.db data/blog.db
rm -f data/blog.db-wal data/blog.db-shm   # 清掉旧 WAL，避免与快照不一致
sudo systemctl start micro-ai-blog
```

## 环境变量

| 变量 | 默认 | 说明 |
|---|---|---|
| `BLOG_DB_PATH` | `data/blog.db` | 数据库路径 |
| `BACKUP_DIR` | `data/backups` | 本地快照目录 |
| `BACKUP_KEEP` | `14` | 本地保留份数 |
| `BACKUP_RCLONE_REMOTE` | （空） | rclone 远端；不设则只做本地快照 |
