import { describe, it, expect } from "vitest";
import { sanitizeBarrageInput, type BarrageConfig } from "./barrage";

describe("sanitizeBarrageInput", () => {
  it("trim 并丢弃空行/纯空白行", () => {
    const out = sanitizeBarrageInput({ enabled: true, items: ["  你好 ", "", "   ", "世界"] });
    expect(out).toEqual<BarrageConfig>({ enabled: true, items: ["你好", "世界"] });
  });

  it("enabled 转布尔，items 非数组时回退空数组", () => {
    expect(sanitizeBarrageInput({ enabled: "yes", items: "nope" })).toEqual({ enabled: true, items: [] });
    expect(sanitizeBarrageInput({})).toEqual({ enabled: false, items: [] });
  });

  it("单条超过 120 字截断，条数超过 200 截断", () => {
    const long = "a".repeat(200);
    const many = Array.from({ length: 250 }, (_, i) => `x${i}`);
    expect(sanitizeBarrageInput({ enabled: true, items: [long] }).items[0]).toHaveLength(120);
    expect(sanitizeBarrageInput({ enabled: true, items: many }).items).toHaveLength(200);
  });

  it("丢弃非字符串条目", () => {
    expect(sanitizeBarrageInput({ enabled: true, items: ["ok", 1, null, {}] }).items).toEqual(["ok"]);
  });
});
