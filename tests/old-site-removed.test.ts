import { describe, expect, it } from "vitest";
import type { Env } from "../src/types";
import { staticAsset } from "../src/index";
import { serveV2, unavailablePage } from "../src/v2-bridge";

const get = (p: string, headers: Record<string, string> = {}) => new Request("https://bayan.test" + p, { headers });
function db() {
  const statements: { sql: string; binds: unknown[] }[] = [];
  const DB = { prepare: (sql: string) => ({ bind: (...binds: unknown[]) => ({ run: async () => { statements.push({ sql, binds }); return {}; }, first: async () => null, all: async () => ({ results: [] }) }), run: async () => ({}), first: async () => null, all: async () => ({ results: [] }) }) };
  return { DB, statements };
}
const ctxWith = () => { const p: Promise<unknown>[] = []; return { ctx: { waitUntil: (x: Promise<unknown>) => { p.push(x); }, passThroughOnException() {} } as unknown as ExecutionContext, settle: () => Promise.all(p.splice(0)) }; };

describe("the old site is gone", () => {
  it("static files are served from /public, and anything else (including the old single-page fallback) is a 404", async () => {
    const ok = new Response("<svg/>", { headers: { "content-type": "image/svg+xml" } });
    const res = await staticAsset(get("/og-bayan.svg"), { ASSETS: { fetch: async () => ok } } as unknown as Env);
    expect(res.status).toBe(200); expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    const spa = await staticAsset(get("/anything.png"), { ASSETS: { fetch: async () => new Response("<html></html>", { headers: { "content-type": "text/html" } }) } } as unknown as Env);
    expect(spa.status).toBe(404);
    const missing = await staticAsset(get("/sections/news.svg"), { ASSETS: { fetch: async () => new Response("nope", { status: 404 }) } } as unknown as Env);
    expect(missing.status).toBe(200); expect(missing.headers.get("content-type")).toContain("image/svg+xml");
  });
  it("a page that cannot render shows a plain notice in the new design, never the old shell", async () => {
    const res = unavailablePage(get("/economy?lang=en")); const html = await res.text();
    expect(res.status).toBe(503); expect(res.headers.get("retry-after")).toBe("30"); expect(res.headers.get("cache-control")).toBe("no-store");
    expect(html).toContain("<!doctype html>"); expect(html).toContain("momentarily unavailable"); expect(html).toContain('href="/?lang=en"'); expect(html).toContain("noindex");
  });
});

describe("visit counting on the new site", () => {
  it("counts one page event for a served HTML page, with its language", async () => {
    const { DB, statements } = db(); const { ctx, settle } = ctxWith();
    const res = await serveV2(get("/about?lang=en"), { DB } as unknown as Env, ctx); await settle();
    expect(res!.status).toBe(200);
    const row = statements.find((s) => s.sql.includes("INSERT INTO analytics"));
    expect(row).toBeDefined(); expect(row!.binds.slice(1, 4)).toEqual(["page", "/about", "en"]);
  });
  it("never counts the owner (cookie), the admin, or non-page responses, and marks the owner's browser", async () => {
    let { DB, statements } = db(); let { ctx, settle } = ctxWith();
    await serveV2(get("/about", { cookie: "bayan_exclude_analytics=1" }), { DB } as unknown as Env, ctx); await settle();
    expect(statements.some((s) => s.sql.includes("INSERT INTO analytics"))).toBe(false);
    ({ DB, statements } = db()); ({ ctx, settle } = ctxWith());
    const admin = await serveV2(get("/admin"), { DB } as unknown as Env, ctx); await settle();
    expect(statements.some((s) => s.sql.includes("INSERT INTO analytics"))).toBe(false);
    expect(admin!.headers.get("set-cookie")).toContain("bayan_exclude_analytics=1");
    ({ DB, statements } = db()); ({ ctx, settle } = ctxWith());
    const json = await serveV2(get("/api/health/v2"), { DB } as unknown as Env, ctx); await settle();
    expect(statements.length).toBe(0); expect(json!.headers.get("set-cookie")).toBeNull();
  });
  it("?bayan_owner=1 removes this browser's earlier visits and marks it; ?bayan_owner=0 clears the mark; cookies never reach the page cache", async () => {
    let { DB, statements } = db(); let { ctx, settle } = ctxWith();
    const on = await serveV2(get("/about?bayan_owner=1"), { DB } as unknown as Env, ctx); await settle();
    expect(statements.some((s) => s.sql.startsWith("DELETE FROM analytics"))).toBe(true); expect(statements.some((s) => s.sql.includes("INSERT INTO analytics"))).toBe(false);
    expect(on!.headers.get("set-cookie")).toContain("bayan_exclude_analytics=1");
    ({ DB, statements } = db()); ({ ctx, settle } = ctxWith());
    const off = await serveV2(get("/about?bayan_owner=0"), { DB } as unknown as Env, ctx); await settle();
    expect(off!.headers.get("set-cookie")).toContain("Max-Age=0"); expect(statements.some((s) => s.sql.includes("INSERT INTO analytics"))).toBe(false);
    const plain = await serveV2(get("/about?x=1"), { DB } as unknown as Env, ctx); await settle();
    expect(plain!.headers.get("set-cookie")).toBeNull();
  });
});
