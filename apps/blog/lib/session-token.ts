import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";

export const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // seconds

/**
 * 会话签名密钥：优先用独立的 SESSION_SECRET（≥32 字符）。
 * 未配置时回退到旧的 sha256(ADMIN_PASSWORD) 派生方式以兼容存量部署——
 * 但那样密码强度直接决定 token 可伪造性，应尽快配置独立密钥。
 */
export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (secret) {
    console.warn("[auth] SESSION_SECRET 过短（<32 字符），已回退到密码派生密钥");
  }
  return createHash("sha256").update(process.env.ADMIN_PASSWORD || "").digest("hex");
}

/** token 格式 v2：`版本36.随机payload.签发时间36.HMAC签名`，签名覆盖前三段 */
export function signToken(version: number, now = Date.now()): string {
  const head = `${version.toString(36)}.${randomBytes(32).toString("hex")}.${now.toString(36)}`;
  const sig = createHmac("sha256", getSessionSecret()).update(head).digest("hex");
  return `${head}.${sig}`;
}

export function verifyToken(
  token: string,
  now = Date.now()
): { valid: boolean; version: number } {
  const invalid = { valid: false, version: 0 };
  const parts = token.split(".");
  if (parts.length !== 4) return invalid;

  const [v36, payload, ts36, sig] = parts;
  const expected = createHmac("sha256", getSessionSecret())
    .update(`${v36}.${payload}.${ts36}`)
    .digest("hex");
  if (sig.length !== expected.length) return invalid;
  try {
    if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) {
      return invalid;
    }
  } catch {
    return invalid;
  }

  const issuedAt = parseInt(ts36, 36);
  if (isNaN(issuedAt) || now - issuedAt > SESSION_MAX_AGE * 1000) return invalid;

  const version = parseInt(v36, 36);
  if (isNaN(version)) return invalid;

  return { valid: true, version };
}
