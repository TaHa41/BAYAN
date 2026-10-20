import { describe, expect, it } from "vitest";
import { paidAiEnabled } from "../src/services/ai";

describe("paid AI cost guard", () => {
  it("keeps paid API calls disabled when no explicit opt-in is configured", () => {
    expect(paidAiEnabled({})).toBe(false);
    expect(paidAiEnabled({ BAYAN_ALLOW_PAID_AI: "" })).toBe(false);
    expect(paidAiEnabled({ BAYAN_ALLOW_PAID_AI: "false" })).toBe(false);
  });

  it("only enables paid API calls after an explicit true opt-in", () => {
    expect(paidAiEnabled({ BAYAN_ALLOW_PAID_AI: "true" })).toBe(true);
    expect(paidAiEnabled({ BAYAN_ALLOW_PAID_AI: "TRUE" })).toBe(true);
    expect(paidAiEnabled({ BAYAN_ALLOW_PAID_AI: "yes" })).toBe(false);
  });
});
