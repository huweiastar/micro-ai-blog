import { execFile } from "child_process";
import { promisify } from "util";

const run = promisify(execFile);

// 串行队列：并发保存文章时避免 git index.lock 冲突
let queue: Promise<void> = Promise.resolve();

/**
 * 内容变更后异步 git add/commit/push（fire-and-forget）。
 * 失败只记日志，绝不阻断发布主流程。
 * 环境开关：GIT_SYNC_DISABLED=1 完全关闭（本地开发建议开）；
 *          GIT_SYNC_PUSH=1 才推送远程（服务器开）。
 */
export function commitContentChange(message: string): void {
  if (process.env.GIT_SYNC_DISABLED === "1") return;
  queue = queue
    .then(() => doSync(message))
    .catch((err) => {
      console.error("[git-sync] 失败（不影响发布）:", err);
    });
}

async function doSync(message: string): Promise<void> {
  const cwd = process.cwd();
  await run("git", ["add", "content", "public/images"], { cwd });
  const { stdout } = await run(
    "git",
    ["status", "--porcelain", "content", "public/images"],
    { cwd }
  );
  if (!stdout.trim()) return; // 无实际变更（如重复保存）

  await run("git", ["commit", "-m", message], { cwd });

  if (process.env.GIT_SYNC_PUSH !== "1") return;
  try {
    // 先 rebase 远程（笔记本可能直接 push 过），失败则中止 rebase 并跳过本次 push
    await run("git", ["pull", "--rebase", "--autostash", "origin", "main"], { cwd });
  } catch (err) {
    await run("git", ["rebase", "--abort"], { cwd }).catch(() => undefined);
    console.error("[git-sync] rebase 失败，本次跳过 push（commit 已留在本地）:", err);
    return;
  }
  await run("git", ["push", "origin", "main"], { cwd });
}
