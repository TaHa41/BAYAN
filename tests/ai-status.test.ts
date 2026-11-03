import { afterEach, describe, expect, it, vi } from "vitest";
import type { Env } from "../src/types";
import { aiStatus, resetAiStatusCache, v2Owns } from "../src/v2-bridge";
import { resetGeminiDiscovery } from "../src/services/gemini";

afterEach(() => { vi.unstubAllGlobals(); resetAiStatusCache(); resetGeminiDiscovery(); });
const gem = (status: number, body: unknown) => vi.fn(async () => new Response(JSON.stringify(body), { status }));

describe("public AI status (no secrets)", () => {
  it("is owned by the bridge as a GET route", () => expect(v2Owns(new Request("https://b.test/api/health/ai"))).toBe(true));
  it("reports a working Gemini with the model actually used", async () => {
    vi.stubGlobal("fetch", gem(200, { candidates: [{ content: { parts: [{ text: "ok" }] } }] }));
    const v: any = await aiStatus({ GEMINI_API_KEY: "k-secret", GEMINI_MODEL: "gemini-2.5-flash" } as unknown as Env);
    expect(v.gemini).toMatchObject({ configured: true, ok: true, model: "gemini-2.5-flash" }); expect(v.workersAi.configured).toBe(false);
    expect(JSON.stringify(v)).not.toContain("k-secret");
  });
  it("classifies failures without exposing provider messages or keys, and caches for 10 minutes", async () => {
    const f = gem(400, { error: { message: "API key not valid. Please pass a valid API key. k-secret", status: "INVALID_ARGUMENT" } });
    vi.stubGlobal("fetch", f);
    const env = { GEMINI_API_KEY: "k-secret" } as unknown as Env, t0 = Date.now();
    const a: any = await aiStatus(env, t0), b: any = await aiStatus(env, t0 + 5 * 60 * 1000);
    expect(a.gemini.ok).toBe(false); expect(typeof a.gemini.error).toBe("string"); expect(JSON.stringify(a)).not.toContain("k-secret"); expect(JSON.stringify(a)).not.toContain("Please pass");
    expect(b).toBe(a); expect(f).toHaveBeenCalledTimes(1);
    resetAiStatusCache(); await aiStatus(env, t0 + 11 * 60 * 1000); expect(f).toHaveBeenCalledTimes(2);
  });
  it("a missing key is reported without any network call", async () => {
    const f = gem(200, {}); vi.stubGlobal("fetch", f);
    const v: any = await aiStatus({} as unknown as Env);
    expect(v.gemini).toMatchObject({ configured: false, ok: false, error: "missing_key" }); expect(f).not.toHaveBeenCalled();
  });
});
