import { describe, expect, it } from "vitest";
import { paidAiEnabled } from "../src/services/ai";

describe("paid AI cost guard", () => {
  it("keeps paid API calls disabled when no explicit opt-in is configured", () => {
    expect(paidAiEnabled({})).toBe(false);
    expect(paidAiEnabled({ OPENAI_ENABLED: "" })).toBe(false);
    expect(paidAiEnabled({ OPENAI_ENABLED: "false" })).toBe(false);
  });

  it("only enables paid API calls after an explicit true opt-in", () => {
    expect(paidAiEnabled({ OPENAI_ENABLED: "true" })).toBe(true);
    expect(paidAiEnabled({ OPENAI_ENABLED: "TRUE" })).toBe(true);
    expect(paidAiEnabled({ OPENAI_ENABLED: "yes" })).toBe(false);
  });
});
