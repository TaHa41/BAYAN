import { describe, expect, it } from "vitest";
import { analyticsExcluded } from "./security";

describe("analytics exclusions", () => {
  it("excludes the owner browser cookie", () => {
    const request = new Request("https://bayan.tahaomar411.workers.dev/", {
      headers: { cookie: "theme=dark; bayan_exclude_analytics=1" }
    });
    expect(analyticsExcluded(request)).toBe(true);
  });

  it.each([
    "Googlebot/2.1 (+http://www.google.com/bot.html)",
    "BAYAN-Production-Smoke/1.0",
    "Mozilla/5.0 Lighthouse"
  ])("excludes known automated user agent: %s", (userAgent) => {
    const request = new Request("https://bayan.tahaomar411.workers.dev/", {
      headers: { "user-agent": userAgent }
    });
    expect(analyticsExcluded(request)).toBe(true);
  });

  it.each(["/admin", "/admin/content", "/review", "/api/admin/repair"])("excludes private control-center route from analytics: %s", (path) => {
    const request = new Request("https://bayan.tahaomar411.workers.dev" + path, {
      headers: { "user-agent": "Mozilla/5.0 (Android 13; Mobile) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36" }
    });
    expect(analyticsExcluded(request)).toBe(true);
  });

  it("keeps ordinary browser traffic eligible for analytics", () => {
    const request = new Request("https://bayan.tahaomar411.workers.dev/", {
      headers: { "user-agent": "Mozilla/5.0 (Android 13; Mobile) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36" }
    });
    expect(analyticsExcluded(request)).toBe(false);
  });
});
