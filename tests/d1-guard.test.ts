import { describe, expect, it, vi } from "vitest";
import { d1Blocked, d1BlockedPersisted, nextUtcMidnight, persistD1Block, resetD1GuardForTests } from "../src/services/d1-guard";

function fakeCache() {
  const values = new Map<string, Response>();
  return {
    async match(request: Request) {
      const response = values.get(request.url);
      return response ? response.clone() : undefined;
    },
    async put(request: Request, response: Response) {
      values.set(request.url, response.clone());
    },
  };
}

describe("persistent D1 quota guard", () => {
  it("restores the block in a fresh isolate without querying D1", async () => {
    resetD1GuardForTests();
    const cache = fakeCache();
    const now = Date.UTC(2026, 9, 20, 23, 59, 0);
    await persistD1Block(now, cache);
    expect(d1Blocked(now)).toBe(true);
    resetD1GuardForTests();
    expect(d1Blocked(now + 1000)).toBe(false);
    expect(await d1BlockedPersisted(now + 1000, cache)).toBe(true);
    expect(await d1BlockedPersisted(nextUtcMidnight(now) + 1000, cache)).toBe(false);
  });

  it("keeps the local block if cache persistence is unavailable", async () => {
    resetD1GuardForTests();
    const cache = {
      match: vi.fn(async () => { throw new Error("cache unavailable"); }),
      put: vi.fn(async () => { throw new Error("cache unavailable"); }),
    };
    const now = Date.UTC(2026, 9, 20, 12, 0, 0);
    await persistD1Block(now, cache);
    expect(d1Blocked(now + 1000)).toBe(true);
    expect(await d1BlockedPersisted(now + 1000, cache)).toBe(true);
  });
});
