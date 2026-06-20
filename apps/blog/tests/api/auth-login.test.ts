import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

// 隔离路由分支逻辑：登录闸门默认放行、会话创建打桩，专注校验 HTTP 行为。
type Gate = { allowed: boolean; retryAfterSec?: number };
const guard = vi.hoisted(() => ({
  checkLoginAllowed: vi.fn<(ip: string) => Gate>(() => ({ allowed: true })),
  recordLoginFailure: vi.fn(),
  recordLoginSuccess: vi.fn(),
}));
const createSession = vi.hoisted(() => vi.fn(async () => true));

vi.mock("../../lib/login-guard", () => guard);
vi.mock("../../lib/auth", async () => {
  const actual = await vi.importActual<typeof import("../../lib/auth")>("../../lib/auth");
  return { ...actual, createSession };
});

import { POST } from "../../app/api/auth/login/route";

function makeReq(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

const ORIGINAL_PW = process.env.ADMIN_PASSWORD;

beforeEach(() => {
  vi.clearAllMocks();
  guard.checkLoginAllowed.mockReturnValue({ allowed: true });
  process.env.ADMIN_PASSWORD = "s3cret";
});

afterEach(() => {
  if (ORIGINAL_PW === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = ORIGINAL_PW;
});

describe("POST /api/auth/login", () => {
  it("rejects empty password with 400 and no session", async () => {
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
    expect(createSession).not.toHaveBeenCalled();
  });

  it("returns 500 when ADMIN_PASSWORD is not configured", async () => {
    delete process.env.ADMIN_PASSWORD;
    const res = await POST(makeReq({ password: "anything" }));
    expect(res.status).toBe(500);
    expect(createSession).not.toHaveBeenCalled();
  });

  it("rejects wrong password with 401 and records failure", async () => {
    const res = await POST(makeReq({ password: "wrong" }));
    expect(res.status).toBe(401);
    expect(guard.recordLoginFailure).toHaveBeenCalledTimes(1);
    expect(createSession).not.toHaveBeenCalled();
  });

  it("accepts correct password: creates session, records success", async () => {
    const res = await POST(makeReq({ password: "s3cret" }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true });
    expect(createSession).toHaveBeenCalledTimes(1);
    expect(guard.recordLoginSuccess).toHaveBeenCalledTimes(1);
  });

  it("blocks with 429 when login gate is closed", async () => {
    guard.checkLoginAllowed.mockReturnValue({ allowed: false, retryAfterSec: 42 });
    const res = await POST(makeReq({ password: "s3cret" }));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("42");
    expect(createSession).not.toHaveBeenCalled();
  });
});
