import { afterEach, describe, expect, it, vi } from "vitest";
import { d1Blocked, isD1QuotaError, markD1Blocked, nextUtcMidnight, resetD1GuardForTests } from "./d1-guard";

afterEach(() => resetD1GuardForTests());
describe("D1 quota guard", () => {
 it("recognizes Cloudflare D1 quota errors", () => { expect(isD1QuotaError(new Error("D1_ERROR: 7500: free tier daily row read limit exceeded"))).toBe(true); expect(isD1QuotaError("free tier daily row write limit")).toBe(true); expect(isD1QuotaError("database is busy")).toBe(false); });
 it("calculates the next UTC midnight", () => { expect(new Date(nextUtcMidnight(Date.parse("2026-10-20T06:30:00Z"))).toISOString()).toBe("2026-10-21T00:00:00.000Z"); });
 it("blocks until the next UTC midnight after quota exhaustion", () => { const now = Date.parse("2026-10-20T06:30:00Z"); markD1Blocked(now); expect(d1Blocked(now)).toBe(true); expect(d1Blocked(Date.parse("2026-10-20T23:59:59Z"))).toBe(true); expect(d1Blocked(Date.parse("2026-10-21T00:00:00Z"))).toBe(false); });
});
