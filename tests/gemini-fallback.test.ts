import { beforeEach, describe, expect, it } from "vitest";
import { callGemini, resetGeminiFallbacks } from "../src/services/gemini";

const ok = (text: string) => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] }, finishReason: "STOP" }] }), { status: 200 });
const err = (status: number, message: string, st = "RESOURCE_EXHAUSTED") => new Response(JSON.stringify({ error: { message, status: st } }), { status });
const errWith = (status: number, message: string, details: unknown[]) => new Response(JSON.stringify({ error: { message, status: "RESOURCE_EXHAUSTED", details } }), { status });
const perDay = [{ "@type": "type.googleapis.com/google.rpc.QuotaFailure", violations: [{ quotaId: "GenerateRequestsPerDayPerProjectPerModel-FreeTier" }] }];
const perMinute = [{ "@type": "type.googleapis.com/google.rpc.QuotaFailure", violations: [{ quotaId: "GenerateRequestsPerMinutePerProjectPerModel-FreeTier" }] }, { "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: "37s" }];
const modelOf = (url: string) => /models\/([^:]+):/.exec(url)![1];
beforeEach(() => resetGeminiFallbacks());

describe("Gemini falls back to another model when one is out of quota or overloaded", () => {
  it("quota on the configured model -> answers with the next model, and remembers it briefly", async () => {
    const seen: string[] = [];
    const fetchImpl = (async (url: string) => { const m = modelOf(url); seen.push(m); return m === "gemini-3.8-flash" ? err(429, "You exceeded your current quota, please check your plan and billing") : ok("hello"); }) as unknown as typeof fetch;
    const r: any = await callGemini({ GEMINI_API_KEY: "k" }, "hi", { fetchImpl });
    expect(r.ok).toBe(true); expect(r.model).toBe("gemini-2.5-flash"); expect(seen).toEqual(["gemini-3.8-flash", "gemini-2.5-flash"]);
    seen.length = 0; await callGemini({ GEMINI_API_KEY: "k" }, "again", { fetchImpl });
    expect(seen).toEqual(["gemini-2.5-flash"]); // no wasted call on the exhausted model
  });
  it("503 on the first model also falls back", async () => {
    const fetchImpl = (async (url: string) => modelOf(url) === "gemini-3.8-flash" ? err(503, "The model is overloaded", "UNAVAILABLE") : ok("fine")) as unknown as typeof fetch;
    expect(((await callGemini({ GEMINI_API_KEY: "k" }, "hi", { fetchImpl })) as any).ok).toBe(true);
  });
  it("when every model is exhausted it reports the original failure, trying each model once", async () => {
    const seen: string[] = [];
    const fetchImpl = (async (url: string) => { seen.push(modelOf(url)); return errWith(429, "You exceeded your current quota, please check your plan and billing details", perDay); }) as unknown as typeof fetch;
    const r: any = await callGemini({ GEMINI_API_KEY: "k" }, "hi", { fetchImpl });
    expect(r).toMatchObject({ ok: false, kind: "quota", status: 429 }); expect(seen).toEqual(["gemini-3.8-flash", "gemini-2.5-flash", "gemini-2.5-flash-lite"]);
  });
  it("a per-minute 429 is a transient rate limit (not a daily quota) and carries the server's retry delay", async () => {
    const seen: string[] = [];
    // Google words per-minute and per-day 429s identically ("exceeded your current quota ... billing"); only the quota id differs.
    const fetchImpl = (async (url: string) => { seen.push(modelOf(url)); return errWith(429, "You exceeded your current quota, please check your plan and billing details", perMinute); }) as unknown as typeof fetch;
    const r: any = await callGemini({ GEMINI_API_KEY: "k" }, "hi", { fetchImpl });
    expect(r).toMatchObject({ ok: false, kind: "rate_limited", status: 429, retryAfterMs: 37_000 });
    expect(seen).toEqual(["gemini-3.8-flash", "gemini-2.5-flash", "gemini-2.5-flash-lite"]);
  });
  it("a 429 whose message says nothing about a daily limit is not treated as a daily quota just because it mentions billing", async () => {
    const fetchImpl = (async () => err(429, "You exceeded your current quota, please check your plan and billing")) as unknown as typeof fetch;
    const r: any = await callGemini({ GEMINI_API_KEY: "k" }, "hi", { fetchImpl });
    expect(r.kind).toBe("rate_limited");
  });
  it("limit: 0 (model not available on this tier) is permanent, so it counts as quota", async () => {
    const fetchImpl = (async () => err(429, "Quota exceeded for metric generate_content_free_tier_requests, limit: 0, model: x")) as unknown as typeof fetch;
    const r: any = await callGemini({ GEMINI_API_KEY: "k" }, "hi", { fetchImpl });
    expect(r.kind).toBe("quota");
  });
  it("auth errors never trigger a fallback", async () => {
    let calls = 0; const fetchImpl = (async () => { calls++; return err(403, "API key not valid", "PERMISSION_DENIED"); }) as unknown as typeof fetch;
    expect(((await callGemini({ GEMINI_API_KEY: "k" }, "hi", { fetchImpl })) as any).kind).toBe("auth"); expect(calls).toBe(1);
  });
});
