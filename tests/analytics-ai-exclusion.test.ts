import { describe, expect, it } from "vitest";
import { analyticsExcluded } from "../src/security";

const req = (ua: string, path = "/", cookie = "") =>
  new Request("https://bayan.example" + path, { headers: { "user-agent": ua, ...(cookie ? { cookie } : {}) } });

describe("analytics exclusion", () => {
  it.each(["GPTBot/1.1", "ChatGPT-User/1.0", "ClaudeBot/1.0", "Claude-User", "PerplexityBot/1.0", "Mozilla/5.0 (compatible; Amazonbot/0.1)"])(
    "excludes AI crawler %s", (ua) => expect(analyticsExcluded(req(ua))).toBe(true));
  it("still excludes the owner cookie and admin routes", () => {
    expect(analyticsExcluded(req("Mozilla/5.0", "/", "bayan_exclude_analytics=1"))).toBe(true);
    expect(analyticsExcluded(req("Mozilla/5.0", "/admin"))).toBe(true);
  });
  it("counts a normal browser visit", () => {
    expect(analyticsExcluded(req("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari"))).toBe(false);
  });
});
