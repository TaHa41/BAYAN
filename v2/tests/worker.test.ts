import { describe, expect, it } from "vitest";
import { createHandler } from "../src/worker";

const call = (path: string, env = {}, deps?: Partial<Parameters<typeof createHandler>[0]>) =>
  createHandler({ providers: [], listArticles: async () => [], ...deps })(new Request("https://bayan.test" + path), env);

describe("v2 routes", () => {
  it("health", async () => expect(await (await call("/health")).json()).toEqual({ ok: true, service: "bayan-v2" }));
  it("robots.txt blocks api/admin and links the sitemap", async () => {
    const body = await (await call("/robots.txt")).text();
    expect(body).toContain("Disallow: /api/");
    expect(body).toContain("Sitemap: https://bayan.test/sitemap.xml");
  });
  it("ads.txt: 404 unless configured; serves only valid lines", async () => {
    expect((await call("/ads.txt")).status).toBe(404);
    const res = await call("/ads.txt", { ADS_TXT: "google.com, pub-123, DIRECT, f08c47fec0942fa0\n<script>" });
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("pub-123");
    expect(body).not.toContain("script");
  });
  it("sitemap lists articles and escapes URLs; degrades to a valid homepage-only sitemap when storage fails", async () => {
    const ok = await (await call("/sitemap.xml", {}, { listArticles: async () => [{ slug: "a&b", lang: "ar", updatedAt: "" }] })).text();
    expect(ok).toContain("/article/a%26b?lang=ar");
    const res = await call("/sitemap.xml", {}, { listArticles: async () => { throw new Error("d1"); } });
    expect(res.headers.get("x-bayan-degraded")).toBe("storage");
    expect(await res.text()).toContain("<loc>https://bayan.test/</loc>");
  });
  it("search: 400 on empty query, honest message when nothing is found", async () => {
    expect((await call("/api/search")).status).toBe(400);
    const body: any = await (await call("/api/search?q=hello")).json();
    expect(body.verdict).toBe("insufficient");
    expect(body.message).toMatch(/nothing is shown/);
  });
});
