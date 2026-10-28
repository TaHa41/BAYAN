import { afterEach, describe, expect, it, vi } from "vitest";
import { createHandler, type Env } from "../src/worker";
import { classify, geminiGenerate, listGeminiFlashModels, generate } from "../src/ai";
import { analyze, type Signals } from "../src/engineer";
import type { Store } from "../src/store";

const store = (): Store => ({ latest: async () => [], bySection: async () => [], get: async () => null, sitemap: async () => [] });
const db = (rows: any[] = [{ status: "PUBLISHED", n: 4, noimg: 1 }, { status: "ARCHIVE", n: 9, noimg: 9 }]) => ({ prepare: () => ({ all: async () => ({ results: rows }), bind: () => ({ all: async () => ({ results: rows }) }) }) }) as unknown as D1Database;
const handler = createHandler({ providers: () => [], store });
const call = (path: string, env: Partial<Env>, headers: Record<string, string> = {}) => handler(new Request("https://b.test" + path, { headers }), { DB: db(), ...env } as Env);
const gem = (status: number, body: unknown) => vi.fn(async () => new Response(typeof body === "string" ? body : JSON.stringify(body), { status }));
afterEach(() => vi.unstubAllGlobals());

describe("ai error classification", () => {
  it.each([[400, '{"error":{"message":"API key not valid"}}', "invalid_key"], [403, "PERMISSION_DENIED", "invalid_key"], [404, "models/x is not found", "model_not_found"], [429, "RESOURCE_EXHAUSTED", "quota"], [500, "boom", "http_error"]])("%i -> %s", (s, b, k) => expect(classify(s, b)).toBe(k));
});
describe("gemini + fallback", () => {
  const env = { GEMINI_API_KEY: "k-secret", GEMINI_MODEL: "gemini-x" };
  it("reports missing key without calling the network", async () => { const f = gem(200, {}); expect((await geminiGenerate({}, "p", { fetcher: f as any })).error).toBe("missing_key"); expect(f).not.toHaveBeenCalled(); });
  it("sends the key in a header (never in the URL) and returns text", async () => {
    const f = gem(200, { candidates: [{ content: { parts: [{ text: "ok" }] } }] });
    const r = await geminiGenerate(env, "p", { fetcher: f as any });
    expect(r).toMatchObject({ ok: true, text: "ok", model: "gemini-x" });
    const [url, init] = f.mock.calls[0] as any;
    expect(String(url)).not.toContain("k-secret"); expect(init.headers["x-goog-api-key"]).toBe("k-secret");
    expect(JSON.stringify(r)).not.toContain("k-secret");
  });
  it("classifies a wrong model name", async () => expect((await geminiGenerate(env, "p", { fetcher: gem(404, "models/gemini-x is not found") as any })).error).toBe("model_not_found"));
  it("falls back to Workers AI when Gemini fails", async () => {
    const out = await generate({ ...env, AI: { run: async () => ({ response: "fallback" }) } }, "p", { fetcher: gem(400, "API key not valid") as any });
    expect(out.result).toMatchObject({ ok: true, provider: "workers-ai", text: "fallback" }); expect(out.attempts).toHaveLength(2);
  });
  it("lists only Flash models that support generateContent", async () => {
    const f = gem(200, { models: [{ name: "models/gemini-2.5-flash", supportedGenerationMethods: ["generateContent"] }, { name: "models/gemini-pro", supportedGenerationMethods: ["generateContent"] }, { name: "models/flash-embed", supportedGenerationMethods: ["embedContent"] }] });
    expect(await listGeminiFlashModels(env, f as any)).toEqual(["gemini-2.5-flash"]);
  });
});
describe("engineer rules", () => {
  const base: Signals = { d1: { ok: true, published: 5, archive: 2, publishedWithoutImage: 0 }, gemini: { ok: true, provider: "gemini", model: "m", ms: 1 }, workersAi: null, availableFlashModels: [], search: { ok: true, hits: 3 } };
  it("healthy signals give no findings", () => expect(analyze(base)).toEqual([]));
  it("wrong model names the available ones; no AI at all is critical and sorted first", () => {
    const f = analyze({ ...base, gemini: { ok: false, provider: "gemini", model: "gemini-3.8-flash", ms: 1, error: "model_not_found" }, availableFlashModels: ["gemini-2.5-flash"] });
    expect(f[0].id).toBe("no_ai_provider"); expect(f[0].severity).toBe("critical");
    expect(f.find((x) => x.id === "gemini_model_not_found")?.fix).toContain("gemini-2.5-flash");
  });
  it("flags D1 down, no articles, hidden no-image articles and empty search", () => {
    expect(analyze({ ...base, d1: { ok: false, error: "quota" } })[0].id).toBe("d1_unreachable");
    const ids = analyze({ ...base, d1: { ok: true, published: 0, publishedWithoutImage: 2 }, search: { ok: false, hits: 0 } }).map((x) => x.id);
    expect(ids).toEqual(expect.arrayContaining(["no_published_articles", "articles_without_image", "search_probe_empty"]));
  });
});
describe("admin routes", () => {
  it("fail closed: 503 without a configured token, 401 for missing/wrong token", async () => {
    expect((await call("/api/admin/diagnose", {})).status).toBe(503);
    expect((await call("/api/admin/diagnose", { BAYAN_AI_MANAGER_TOKEN: "t" })).status).toBe(401);
    expect((await call("/api/admin/ai-test", { BAYAN_AI_MANAGER_TOKEN: "t" }, { authorization: "Bearer nope" })).status).toBe(401);
  });
  it("diagnose with the right token returns findings from real signals and never leaks keys", async () => {
    vi.stubGlobal("fetch", gem(400, "API key not valid"));
    const res = await call("/api/admin/diagnose", { BAYAN_AI_MANAGER_TOKEN: "t", GEMINI_API_KEY: "k-secret" }, { authorization: "Bearer t" });
    const text = await res.text(); const body = JSON.parse(text);
    expect(res.status).toBe(200); expect(body.signals.d1).toMatchObject({ ok: true, published: 4, archive: 9, publishedWithoutImage: 1 });
    expect(body.findings.map((f: any) => f.id)).toEqual(expect.arrayContaining(["no_ai_provider", "gemini_invalid_key", "articles_without_image"]));
    expect(text).not.toContain("k-secret"); expect(text).not.toContain('"t"');
  });
  it("ai-test lists available Flash models and the configured model", async () => {
    vi.stubGlobal("fetch", vi.fn(async (u: any) => String(u).includes(":generateContent") ? new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "ok" }] } }] })) : new Response(JSON.stringify({ models: [{ name: "models/gemini-2.5-flash", supportedGenerationMethods: ["generateContent"] }] }))));
    const body: any = await (await call("/api/admin/ai-test", { BAYAN_AI_MANAGER_TOKEN: "t", GEMINI_API_KEY: "k", GEMINI_MODEL: "gemini-2.5-flash" }, { authorization: "Bearer t" })).json();
    expect(body.gemini).toMatchObject({ configured: true, model: "gemini-2.5-flash", availableFlashModels: ["gemini-2.5-flash"] });
    expect(body.gemini.result.ok).toBe(true); expect(body.workersAi.configured).toBe(false);
  });
});
