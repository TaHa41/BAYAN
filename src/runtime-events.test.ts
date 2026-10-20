import { afterEach, describe, expect, it, vi } from "vitest";
import { recordRuntimeEventLimited } from "./runtime-events";
import { markD1Blocked, resetD1GuardForTests } from "./services/d1-guard";

afterEach(() => {
  resetD1GuardForTests();
  vi.restoreAllMocks();
});

describe("recordRuntimeEventLimited D1 quota guard", () => {
  it("does not prepare a D1 statement when the isolate is already quota-blocked", async () => {
    markD1Blocked();
    const prepare = vi.fn();
    await expect(
      recordRuntimeEventLimited({ DB: { prepare } as any }, "quota-test-preblocked", "test"),
    ).resolves.toBe(false);
    expect(prepare).not.toHaveBeenCalled();
  });

  it("blocks subsequent telemetry writes after D1 reports a quota error", async () => {
    const run = vi.fn().mockRejectedValue(new Error("D1_ERROR 7500: free tier daily row read limit exceeded"));
    const bind = vi.fn(() => ({ run }));
    const prepare = vi.fn(() => ({ bind }));
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const env = { DB: { prepare } as any };

    await expect(recordRuntimeEventLimited(env, "quota-test-first", "test")).resolves.toBe(false);
    await expect(recordRuntimeEventLimited(env, "quota-test-second", "test")).resolves.toBe(false);

    expect(prepare).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledTimes(1);
  });
});
