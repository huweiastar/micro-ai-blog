import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "crypto";
import { signToken, SESSION_MAX_AGE } from "@pkg/auth";

export const COOKIE_NAME = "admin_session";

function hash(p: string): string {
  return createHash("sha256").update(p).digest("hex");
}

/** 常量时间比对管理员密码（sha256 后比对，避免时序泄露）。 */
export function passwordMatches(input: string, expected: string): boolean {
  const a = hash(input);
  const b = hash(expected);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

/** 写入会话 cookie（与 blog 同名 admin_session、同属性）。 */
export async function createManagerSession(version = 1, domain?: string): Promise<void> {
  const token = signToken(version);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: new Date(Date.now() + SESSION_MAX_AGE * 1000),
    path: "/",
    ...(domain ? { domain } : {}),
  });
}
