import { getDb } from "./db";

const GLOBAL_KEY = "__global__";
const PER_IP_FREE_ATTEMPTS = 4; // 第 5 次失败开始锁定
const BASE_LOCK_MS = 60_000;
const MAX_LOCK_MS = 3_600_000;
const GLOBAL_WINDOW_MS = 3_600_000;
const GLOBAL_THRESHOLD = 50;
const GLOBAL_LOCK_MS = 600_000;

type AttemptRow = {
  ip: string;
  fail_count: number;
  locked_until: number;
  window_start: number;
};

function getRow(ip: string): AttemptRow | undefined {
  return getDb()
    .prepare("SELECT * FROM login_attempts WHERE ip = ?")
    .get(ip) as AttemptRow | undefined;
}

function upsertRow(row: AttemptRow): void {
  getDb()
    .prepare(
      `INSERT INTO login_attempts (ip, fail_count, locked_until, window_start)
       VALUES (@ip, @fail_count, @locked_until, @window_start)
       ON CONFLICT(ip) DO UPDATE SET
         fail_count = excluded.fail_count,
         locked_until = excluded.locked_until,
         window_start = excluded.window_start`
    )
    .run(row);
}

export function checkLoginAllowed(
  ip: string,
  now = Date.now()
): { allowed: boolean; retryAfterSec: number } {
  for (const key of [ip, GLOBAL_KEY]) {
    const row = getRow(key);
    if (row && row.locked_until > now) {
      return {
        allowed: false,
        retryAfterSec: Math.ceil((row.locked_until - now) / 1000),
      };
    }
  }
  return { allowed: true, retryAfterSec: 0 };
}

export function recordLoginFailure(ip: string, now = Date.now()): void {
  // 单 IP：超过免费次数后指数退避
  const row = getRow(ip);
  const failCount = (row?.fail_count ?? 0) + 1;
  let lockedUntil = row?.locked_until ?? 0;
  if (failCount > PER_IP_FREE_ATTEMPTS) {
    const lockMs = Math.min(
      BASE_LOCK_MS * 2 ** (failCount - PER_IP_FREE_ATTEMPTS - 1),
      MAX_LOCK_MS
    );
    lockedUntil = now + lockMs;
  }
  upsertRow({
    ip,
    fail_count: failCount,
    locked_until: lockedUntil,
    window_start: row?.window_start ?? now,
  });

  // 全局：滑动小时窗，防止换 IP 低速爆破
  const g = getRow(GLOBAL_KEY);
  const windowExpired = !g || now - g.window_start > GLOBAL_WINDOW_MS;
  const gCount = windowExpired ? 1 : g.fail_count + 1;
  upsertRow({
    ip: GLOBAL_KEY,
    fail_count: gCount,
    locked_until: gCount >= GLOBAL_THRESHOLD ? now + GLOBAL_LOCK_MS : (g?.locked_until ?? 0),
    window_start: windowExpired ? now : g.window_start,
  });
}

export function recordLoginSuccess(ip: string): void {
  getDb().prepare("DELETE FROM login_attempts WHERE ip = ?").run(ip);
}
