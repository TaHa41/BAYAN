import { describe, expect, it } from "vitest";
import { newsAiDailyLimit, paidAiEnabled } from "../src/services/ai";

describe("conservative free-first news AI budget", () => {
  it("defaults to ten attempts per UTC day unless a valid configured limit is supplied", () => {
    expect(newsAiDailyLimit({} as any)).toBe(10);
    expect(newsAiDailyLimit({ NEWS_AI_DAILY_LIMIT: "10" } as any)).toBe(10);
    expect(newsAiDailyLimit({ NEWS_AI_DAILY_LIMIT: "150" } as any)).toBe(150);
  });
});

describe("paid AI cost guard", () => {
  it("keeps paid API calls disabled when no explicit opt-in is configured", () => {
    expect(paidAiEnabled({})).toBe(false);
    expect(paidAiEnabled({ OPENAI_ENABLED: "" })).toBe(false);
    expect(paidAiEnabled({ OPENAI_ENABLED: "false" })).toBe(false);
    const legacyOnly = { OPENAI_ENABLED: "false", BAYAN_ALLOW_PAID_AI: "true" };
    expect(paidAiEnabled(legacyOnly)).toBe(false);
  });

  it("only enables paid API calls after an explicit true opt-in", () => {
    expect(paidAiEnabled({ OPENAI_ENABLED: "true" })).toBe(true);
    expect(paidAiEnabled({ OPENAI_ENABLED: "TRUE" })).toBe(true);
    expect(paidAiEnabled({ OPENAI_ENABLED: "yes" })).toBe(false);
  });
});
