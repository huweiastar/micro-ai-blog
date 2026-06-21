import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { signToken, verifyToken, SESSION_MAX_AGE } from "@pkg/auth";

beforeEach(() => {
  process.env.SESSION_SECRET = "a".repeat(48);
});

afterEach(() => {
  delete process.env.SESSION_SECRET;
  delete process.env.ADMIN_PASSWORD;
});

describe("signToken / verifyToken", () => {
  it("签发的 token 验证通过且带回版本号", () => {
    const token = signToken(3);
    expect(verifyToken(token)).toEqual({ valid: true, version: 3 });
  });

  it("篡改任一段都验证失败", () => {
    const token = signToken(1);
    const parts = token.split(".");
    for (let i = 0; i < 4; i++) {
      const tampered = [...parts];
      tampered[i] = i === 3 ? "0".repeat(64) : "zz" + tampered[i];
      expect(verifyToken(tampered.join(".")).valid).toBe(false);
    }
  });

  it("过期 token 验证失败", () => {
    const issued = Date.now() - (SESSION_MAX_AGE * 1000 + 1000);
    const token = signToken(1, issued);
    expect(verifyToken(token).valid).toBe(false);
  });

  it("换密钥后旧 token 失效", () => {
    const token = signToken(1);
    process.env.SESSION_SECRET = "b".repeat(48);
    expect(verifyToken(token).valid).toBe(false);
  });

  it("旧三段式 token 一律拒绝", () => {
    expect(verifyToken("abc.def.ghi").valid).toBe(false);
  });

  it("未配置 SESSION_SECRET 时回退到密码派生密钥", () => {
    delete process.env.SESSION_SECRET;
    process.env.ADMIN_PASSWORD = "pw";
    const token = signToken(1);
    expect(verifyToken(token).valid).toBe(true);
  });
});
