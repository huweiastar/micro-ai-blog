import path from "path";

/**
 * 内容目录：默认 <cwd>/content，可用环境变量 CONTENT_DIR 覆盖。
 * monorepo 下博客运行于 apps/blog，将 CONTENT_DIR 指向仓库根的共享 content/。
 */
export function contentDir(): string {
  return process.env.CONTENT_DIR || path.join(process.cwd(), "content");
}

/**
 * 数据目录：默认 <cwd>/data，可用环境变量 DATA_DIR 覆盖（共享 SQLite/修订）。
 */
export function dataDir(): string {
  return process.env.DATA_DIR || path.join(process.cwd(), "data");
}
