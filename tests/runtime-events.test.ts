import { afterEach, describe, expect, it, vi } from "vitest";
import { recordRuntimeEventLimited } from "../src/runtime-events";

afterEach(() => vi.useRealTimers());

describe("rate-limited runtime event logging", () => {
  it("writes at most once per kind per minute without extra reads", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-16T06:00:00.000Z"));
    const writes: unknown[][] = [];
    const env = {
      DB: {
        prepare(sql: string) {
          expect(sql).toContain("INSERT INTO runtime_events");
          expect(sql).toContain("WHERE NOT EXISTS");
          return {
            bind(...args: unknown[]) {
              return { run: async () => { writes.push(args); return { meta: { changes: 1 } }; } };
            }
          };
        }
      }
    } as any;

    expect(await recordRuntimeEventLimited(env, "test_rate_limit_kind", "first_failure", "one")).toBe(true);
    expect(await recordRuntimeEventLimited(env, "test_rate_limit_kind", "second_failure", "two")).toBe(false);
    expect(await recordRuntimeEventLimited(env, "test_rate_limit_other_kind", "other_failure")).toBe(true);
    expect(writes).toHaveLength(2);
    expect(writes[0][2]).toBe("first_failure: one");

    vi.advanceTimersByTime(60_001);
    expect(await recordRuntimeEventLimited(env, "test_rate_limit_kind", "third_failure")).toBe(true);
    expect(writes).toHaveLength(3);
  });

  it("does not throw or recursively log when the telemetry write itself fails", async () => {
    const env = {
      DB: {
        prepare() {
          return { bind() { return { run: async () => { throw new Error("D1 unavailable"); } }; } };
        }
      }
    } as any;
    await expect(recordRuntimeEventLimited(env, "test_logger_failure_kind", "source_timeout")).resolves.toBe(false);
  });

  it("redacts URLs and common API credential shapes and caps messages at 350 characters", async () => {
    let savedMessage = "";
    const env = {
      DB: {
        prepare() {
          return {
            bind(_level: unknown, _kind: unknown, message: string) {
              savedMessage = message;
              return { run: async () => ({ meta: { changes: 1 } }) };
            }
          };
        }
      }
    } as any;
    await recordRuntimeEventLimited(env, "test_sanitization_kind", "provider_failed", "https://private.example/path sk-12345678901234567890 " + "x".repeat(500));
    expect(savedMessage).not.toContain("private.example");
    expect(savedMessage).not.toContain("sk-12345678901234567890");
    expect(savedMessage).toContain("[url]");
    expect(savedMessage).toContain("[redacted]");
    expect(savedMessage.length).toBeLessThanOrEqual(350);
  });
});
