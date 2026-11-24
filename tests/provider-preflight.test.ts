import { describe, expect, it } from "vitest";
import { anyAiProviderUsable } from "../src/services/ai";

// admin_settings rows keyed by breaker name: { ai_breaker_gemini: openedUntil, ... }
const dbWith = (open: Record<string, boolean>) => ({
  prepare: () => ({ bind: (key: string) => ({ first: async () => { const name = String(key).replace("ai_breaker_", ""); return name in open ? { value: JSON.stringify({ openedUntil: open[name] ? Date.now() + 3600_000 : 0, consecutive429: 0, code: open[name] ? "quota_exceeded" : "closed" }) } : null; } }) }),
});

describe("pre-flight: skip background drafting when no AI provider is usable", () => {
  it("is false when nothing is configured", async () => { expect(await anyAiProviderUsable({ DB: dbWith({}) } as any)).toBe(false); });
  it("is true when a free compatible provider key exists (its own cooldown handles failures)", async () => { expect(await anyAiProviderUsable({ GROQ_API_KEY: "k", DB: dbWith({ gemini: true, workers_ai: true }) } as any)).toBe(true); });
  it("Workers AI counts only while its breaker is closed (daily neurons used up opens it)", async () => {
    expect(await anyAiProviderUsable({ AI: {}, DB: dbWith({ workers_ai: false }) } as any)).toBe(true);
    expect(await anyAiProviderUsable({ AI: {}, DB: dbWith({ workers_ai: true }) } as any)).toBe(false);
  });
  it("Gemini counts only with a key and a closed breaker; any other usable provider is enough", async () => {
    expect(await anyAiProviderUsable({ GEMINI_API_KEY: "k", DB: dbWith({ gemini: false }) } as any)).toBe(true);
    expect(await anyAiProviderUsable({ GEMINI_API_KEY: "k", DB: dbWith({ gemini: true }) } as any)).toBe(false);
    expect(await anyAiProviderUsable({ GEMINI_API_KEY: "k", AI: {}, DB: dbWith({ gemini: true, workers_ai: false }) } as any)).toBe(true);
  });
});
