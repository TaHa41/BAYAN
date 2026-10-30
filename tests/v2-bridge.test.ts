import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Env } from "../src/types";
import { serveV2, v2Owns } from "../src/v2-bridge";

const req = (path: string, method = "GET") => new Request("https://bayan.test" + path, { method });
const row = { slug: "a1", section: "science", language: "ar", title: "عنوان", summary: "ملخص", body: "نص", sources_json: "[]", image_url: "https://img.example/a.jpg", image_alt: "", updated_at: "2026-10-27" };
const env = (rows: any[] = [row]) => ({ DB: { prepare: () => ({ all: async () => ({ results: rows }), first: async () => rows[0] || null, bind: () => ({ all: async () => ({ results: rows }), first: async () => rows[0] || null }) }) } }) as unknown as Env;

beforeEach(() => { vi.stubGlobal("fetch", async () => { throw new Error("offline in tests"); }); });
afterEach(() => { vi.unstubAllGlobals(); });

describe("v2 bridge", () => {
  it.each([["/", true], ["/science", true], ["/people", true], ["/article/x", true], ["/wiki/Cairo", true], ["/wiki/a/b", false], ["/news", true], ["/news?archive=12", false], ["/news?lang=en", true], ["/trends", false], ["/search", false], ["/admin", false], ["/api/search", false], ["/prices", false], ["/article/a/b", false]])("v2Owns(%s)=%s", (p, owned) => expect(v2Owns(req(p))).toBe(owned));
  it("never takes non-GET requests", () => expect(v2Owns(req("/", "POST"))).toBe(false));
  it("serves the home page from v2 with hardening headers and the credit line", async () => {
    const res = await serveV2(req("/"), env());
    expect(res?.status).toBe(200);
    expect(res?.headers.get("x-bayan-renderer")).toBe("v2"); expect(res?.headers.get("x-bayan-v2-build")).toMatch(/^\d{4}-\d{2}-\d{2}\.\d+$/); expect(res?.headers.get("x-frame-options")).toBe("DENY");
    expect(await res!.text()).toContain("Created by Taha Omar");
  });
  it("returns null for routes it does not own, so v1 keeps serving them", async () => {
    for (const p of ["/search", "/admin", "/trends", "/api/health"]) expect(await serveV2(req(p), env())).toBeNull();
  });
  it("falls back to v1 when an article is unknown to v2 (404) or has no image", async () => {
    expect(await serveV2(req("/article/missing"), env([]))).toBeNull();
    expect(await serveV2(req("/article/a1"), env([{ ...row, image_url: "" }]))).toBeNull();
  });
  it("renders a published article with image and sources from the same row shape v1 uses", async () => {
    const res = await serveV2(req("/article/a1"), env());
    const html = await res!.text();
    expect(res?.status).toBe(200); expect(html).toContain("https://img.example/a.jpg"); expect(html).toContain("/api/article?slug=");
  });
});
