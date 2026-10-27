import { describe, expect, it, vi } from "vitest";
import type { Env } from "../src/types";
import { aiRepairRequest } from "../src/services/repair";

describe("admin AI repair request", () => {
  it("redacts secrets, retries at most 3 times and never claims success without verified_runtime", async () => {
    const statement = {
      bind() { return statement; },
      all: async () => ({ results: [] as any[] }),
      first: async () => null,
      run: async () => ({ meta: { changes: 0 } }),
    };
    const db = { prepare() { return statement; } };
    const aiRun = vi.fn(async (_model: string, _input: { prompt: string }) => ({ response: "Likely a provider timeout; verify upstream health." }));
    // Every outbound fetch fails, so the runtime can never reach a verified state in this test.
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network disabled in test"));
    vi.useFakeTimers();
    try {
      const env = {
        DB: db,
        AI: { run: aiRun },
        OPENAI_API_KEY: "not-a-real-key",
        OPENAI_ENABLED: "false",
      } as unknown as Env;
      const pending = aiRepairRequest(env, "Search failed; api_key=secret-value Bearer abc123");
      await vi.runAllTimersAsync();
      const result: any = await pending;

      expect(result.problemReceived).toBe(true);
      expect(result.attempts.length).toBeGreaterThanOrEqual(1);
      expect(result.attempts.length).toBeLessThanOrEqual(3);
      if (result.verification !== "verified_runtime" && result.verification !== "healthy") expect(result.ok).toBe(false);
      expect(result).not.toHaveProperty("problem");
      expect(aiRun.mock.calls.length).toBeGreaterThan(0);
      const prompt = String(aiRun.mock.calls[0]?.[1]?.prompt || "");
      expect(prompt).toContain("api_key=[redacted]");
      expect(prompt).toContain("Bearer [redacted]");
      expect(prompt).not.toContain("secret-value");
      expect(prompt).not.toContain("abc123");
    } finally {
      vi.useRealTimers();
      fetchSpy.mockRestore();
    }
  });

  it("rejects an empty problem without attempting a repair", async () => {
    const result = await aiRepairRequest({} as Env, "   ");
    expect(result.ok).toBe(false);
    expect(result.repairPerformed).toBe(false);
  });
});
