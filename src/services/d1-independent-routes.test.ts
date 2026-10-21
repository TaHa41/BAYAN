import { describe, expect, it } from "vitest";
import { isD1IndependentApiPath } from "./d1-independent-routes";

describe("D1-independent API allowlist", () => {
  it("keeps image lookup and static endpoints available during D1 quota exhaustion", () => {
    expect(isD1IndependentApiPath("/api/image")).toBe(true);
    expect(isD1IndependentApiPath("/api/wisdom")).toBe(true);
    expect(isD1IndependentApiPath("/api/features")).toBe(true);
    for (const path of ["/api/live/weather", "/api/live/prayer", "/api/live/fx", "/api/live/gold"]) {
      expect(isD1IndependentApiPath(path)).toBe(true);
    }
  });

  it("does not bypass D1 protection for data-backed endpoints", () => {
    for (const path of ["/api/search", "/api/article", "/api/section", "/api/health", "/api/news"]) {
      expect(isD1IndependentApiPath(path)).toBe(false);
    }
  });
});
