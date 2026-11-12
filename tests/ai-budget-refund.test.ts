import { describe, expect, it } from "vitest";
import { refundDailyNewsAiCall } from "../src/services/ai";

describe("daily news AI budget refund", () => {
  it("gives one unit back for today's counter only, never below zero in SQL, and never throws", async () => {
    const calls: { sql: string; binds: unknown[] }[] = [];
    const DB = { prepare: (sql: string) => ({ bind: (...binds: unknown[]) => ({ run: async () => { calls.push({ sql, binds }); return {}; } }) }) };
    expect(await refundDailyNewsAiCall({ DB } as any)).toBe(true);
    expect(calls[0].sql).toContain("UPDATE admin_settings"); expect(calls[0].sql).toContain("MAX(0,"); expect(calls[0].sql).toContain("key='news_ai_budget_daily'");
    expect(calls[0].binds).toEqual([new Date().toISOString().slice(0, 10)]);
    expect(await refundDailyNewsAiCall({ DB: { prepare: () => { throw new Error("D1_ERROR: quota"); } } } as any)).toBe(false);
  });
});
