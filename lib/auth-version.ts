import { getDb } from "./db";

/**
 * 会话版本号：签发 token 时嵌入当前版本，校验时要求一致。
 * 「退出所有设备」= 版本 +1，所有旧 token 立即失效（middleware 侧有 ≤60s 缓存延迟）。
 */
export function getSessionVersion(): number {
  const row = getDb()
    .prepare("SELECT value FROM auth_kv WHERE key = 'session_version'")
    .get() as { value: string } | undefined;
  return row ? parseInt(row.value, 10) : 1;
}

export function bumpSessionVersion(): number {
  const next = getSessionVersion() + 1;
  getDb()
    .prepare(
      `INSERT INTO auth_kv (key, value) VALUES ('session_version', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    )
    .run(String(next));
  return next;
}
