import { describe, expect, it } from "vitest";
import { chargeDailyNewsAiCall, dailyNewsAiBudgetAvailable } from "../src/services/ai";

const today = new Date().toISOString().slice(0, 10);
const dbReturning = (value: string | null, log: string[] = []) => ({ prepare: (sql: string) => { log.push(sql); return { first: async () => (value === null ? null : { value }), bind: (...b: unknown[]) => ({ run: async () => { log.push("BIND " + b.join("|")); return {}; } }), run: async () => ({}) }; } });

describe("daily news AI budget counts answered generations only", () => {
  it("is available when nothing was used today or the counter is from another day", async () => {
    expect(await dailyNewsAiBudgetAvailable({ DB: dbReturning(null) } as any)).toBe(true);
    expect(await dailyNewsAiBudgetAvailable({ DB: dbReturning("2020-01-01:40") } as any)).toBe(true);
  });
  it("is available below the limit and exhausted at it (the limit comes from NEWS_AI_DAILY_LIMIT, minimum 10)", async () => {
    expect(await dailyNewsAiBudgetAvailable({ NEWS_AI_DAILY_LIMIT: "40", DB: dbReturning(today + ":39") } as any)).toBe(true);
    expect(await dailyNewsAiBudgetAvailable({ NEWS_AI_DAILY_LIMIT: "40", DB: dbReturning(today + ":40"), } as any)).toBe(false);
    expect(await dailyNewsAiBudgetAvailable({ NEWS_AI_DAILY_LIMIT: "12", DB: dbReturning(today + ":11") } as any)).toBe(true);
  });
  it("checking never writes; charging adds exactly one unit for today and never throws", async () => {
    const log: string[] = [];
    await dailyNewsAiBudgetAvailable({ DB: dbReturning(today + ":3", log) } as any);
    expect(log.every((l) => !/INSERT|UPDATE/i.test(l))).toBe(true);
    const log2: string[] = [];
    expect(await chargeDailyNewsAiCall({ DB: dbReturning(null, log2) } as any)).toBe(true);
    expect(log2[0]).toContain("INSERT INTO admin_settings"); expect(log2[0]).toContain("+1"); expect(log2[1]).toContain(today + ":1");
    expect(await chargeDailyNewsAiCall({ DB: { prepare: () => { throw new Error("D1_ERROR: quota"); } } } as any)).toBe(false);
  });
  it("is closed (fail safe) when the counter cannot be read", async () => {
    expect(await dailyNewsAiBudgetAvailable({ DB: { prepare: () => { throw new Error("D1_ERROR"); } } } as any)).toBe(false);
  });
});
