import { describe, expect, it } from "vitest";
import { buildBlock, replaceBlock, START, END } from "../scripts/update-live-status.mjs";

const info = { now: "2026-11-08T00:00:00Z", build: "2026-11-08.1", deploy: { conclusion: "success", status: "completed", sha: "abc12345", url: "https://x/run/1" }, jobs: [{ name: "deploy", conclusion: "success" }, { name: "verify-production", conclusion: "failure" }],
  ai: '{"gemini":{"configured":true}}', pages: [{ p: "/", s: 200, c: 90, w: 30, k: "HIT", rd: "v2" }, { p: "/economy", s: 200, c: 300, w: 200, k: "-", rd: "-", e: "1102" }], commits: ["abc1234 2026-11-08 Fix things"], fallbacks: "/api/health/v2 {\"count\":0}" };

describe("automatic live status block of the main reference", () => {
  it("builds a readable block with the build, deploy result, jobs, AI status, page timings and commits", () => {
    const b = buildBlock(info);
    for (const x of ["2026-11-08.1", "abc12345", "deploy=success", "verify-production=failure", "gemini", "`/economy`", "خطأ 1102", "abc1234 2026-11-08 Fix things", "/api/health/v2"]) expect(b).toContain(x);
  });
  it("inserts the block once when the markers are missing, then only rewrites between the markers (idempotent)", () => {
    const doc = "# عنوان\n\nمقدمة\n\n## 1) قسم\nنص\n";
    const once = replaceBlock(doc, buildBlock(info));
    expect(once.split(START).length).toBe(2); expect(once).toContain("## 1) قسم"); expect(once.indexOf(START)).toBeLessThan(once.indexOf("## 1) قسم"));
    const twice = replaceBlock(once, buildBlock({ ...info, build: "2026-11-09.1" }));
    expect(twice.split(START).length).toBe(2); expect(twice).toContain("2026-11-09.1"); expect(twice).not.toContain("2026-11-08.1"); expect(twice).toContain("نص");
    expect(replaceBlock(twice, buildBlock({ ...info, build: "2026-11-09.1" }))).toBe(twice);
    expect(twice.indexOf(END)).toBeGreaterThan(twice.indexOf(START));
  });
});
