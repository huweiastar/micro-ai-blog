/**
 * Edge Runtime 下的 token 校验（WebCrypto，无 node:crypto）。
 * middleware.ts 运行于 edge，必须用此实现而非 session-token.ts 的 Node 版本。
 *
 * 两端 middleware 共享此实现，避免 HMAC 校验逻辑重复分叉。
 */

const encoder = new TextEncoder();

function bytesToHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, "0");
  return hex;
}

async function sha256Hex(input: string): Promise<string> {
  return bytesToHex(await crypto.subtle.digest("SHA-256", encoder.encode(input)));
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return bytesToHex(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

/** 派生签名密钥：与 session-token.ts 的 Node 版本同算法。 */
export async function getSessionSecretEdge(): Promise<string> {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  return sha256Hex(process.env.ADMIN_PASSWORD || "");
}

export interface EdgeVerifyOptions {
  /** 会话最大年龄（毫秒）。默认 7 天。 */
  sessionMaxAgeMs?: number;
  /**
   * 返回当前会话版本号。缺省时跳过版本校验（仅验签名 + 过期）。
   * 返回 null 表示"版本服务暂不可用"，此时也跳过版本校验（fail-open，避免把管理员锁在门外）。
   */
  getCurrentVersion?: () => Promise<number | null>;
}

/**
 * Edge 环境下的 token 校验。
 * token 格式：`版本36.随机payload.签发时间36.HMAC签名`
 */
export async function verifyTokenEdge(
  token: string,
  options: EdgeVerifyOptions = {}
): Promise<boolean> {
  const { sessionMaxAgeMs = 7 * 24 * 60 * 60 * 1000, getCurrentVersion } = options;

  if (!process.env.SESSION_SECRET && !process.env.ADMIN_PASSWORD) return false;

  const parts = token.split(".");
  if (parts.length !== 4) return false;

  const [v36, payload, ts36, sig] = parts;
  const secret = await getSessionSecretEdge();
  const expected = await hmacSha256Hex(secret, `${v36}.${payload}.${ts36}`);
  if (!timingSafeEqualHex(sig, expected)) return false;

  const issuedAt = parseInt(ts36, 36);
  if (isNaN(issuedAt) || Date.now() - issuedAt > sessionMaxAgeMs) return false;

  // 会话版本校验（可选，用于「退出所有设备」后立即失效旧 token）
  if (getCurrentVersion) {
    const tokenVersion = parseInt(v36, 36);
    if (isNaN(tokenVersion)) return false;
    const currentVersion = await getCurrentVersion();
    if (currentVersion !== null && tokenVersion !== currentVersion) return false;
  }

  return true;
}
