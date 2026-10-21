import { describe, expect, it, vi } from "vitest";
import type { Env } from "../src/types";
import { aiRepairRequest } from "../src/services/repair";

describe("admin AI diagnosis is read-only", () => {
  it("does not invoke self-healing or write incident text to D1", async () => {
    const statements: string[] = [];
    const statement = {
      bind() { return statement; },
      all: async () => ({ results: [] as any[] }),
      first: async () => null,
      run: async () => ({ meta: { changes: 0 } }),
    };
    const db = {
      prepare(sql: string) {
        statements.push(sql);
        return statement;
      },
    };
    const aiRun = vi.fn(async (_model: string, input: { prompt: string }) => ({ response: "Likely a provider timeout; verify upstream health." }));
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("paid OpenAI fetch must not run"));
    try {
      const env = {
        DB: db,
        AI: { run: aiRun },
        OPENAI_API_KEY: "not-a-real-key",
        OPENAI_ENABLED: "false",
      } as unknown as Env;
      const result = await aiRepairRequest(env, "Search failed; api_key=secret-value Bearer abc123");

      expect(result.repairPerformed).toBe(false);
      expect(result.verification).toBe("diagnostic_only");
      expect(result.actions).toEqual([]);
      expect(result).not.toHaveProperty("problem");
      expect(statements.length).toBeGreaterThan(0);
      expect(statements.every((sql) => /^\s*SELECT\b/i.test(sql))).toBe(true);
      expect(statements.some((sql) => /\b(INSERT|UPDATE|DELETE|REPLACE|CREATE|DROP)\b/i.test(sql))).toBe(false);
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(aiRun).toHaveBeenCalledTimes(1);
      const prompt = String(aiRun.mock.calls[0]?.[1]?.prompt || "");
      expect(prompt).toContain("api_key=[redacted]");
      expect(prompt).toContain("Bearer [redacted]");
      expect(prompt).not.toContain("secret-value");
      expect(prompt).not.toContain("abc123");
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it("rejects an empty problem without attempting a repair", async () => {
    const result = await aiRepairRequest({} as Env, "   ");
    expect(result.ok).toBe(false);
    expect(result.repairPerformed).toBe(false);
  });
});
