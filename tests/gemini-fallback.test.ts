import { beforeEach, describe, expect, it } from "vitest";
import { callGemini, resetGeminiFallbacks } from "../src/services/gemini";

const ok = (text: string) => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] }, finishReason: "STOP" }] }), { status: 200 });
const err = (status: number, message: string, st = "RESOURCE_EXHAUSTED") => new Response(JSON.stringify({ error: { message, status: st } }), { status });
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
    const fetchImpl = (async (url: string) => { seen.push(modelOf(url)); return err(429, "quota exceeded for this project"); }) as unknown as typeof fetch;
    const r: any = await callGemini({ GEMINI_API_KEY: "k" }, "hi", { fetchImpl });
    expect(r).toMatchObject({ ok: false, kind: "quota", status: 429 }); expect(seen).toEqual(["gemini-3.8-flash", "gemini-2.5-flash", "gemini-2.5-flash-lite"]);
  });
  it("auth errors never trigger a fallback", async () => {
    let calls = 0; const fetchImpl = (async () => { calls++; return err(403, "API key not valid", "PERMISSION_DENIED"); }) as unknown as typeof fetch;
    expect(((await callGemini({ GEMINI_API_KEY: "k" }, "hi", { fetchImpl })) as any).kind).toBe("auth"); expect(calls).toBe(1);
  });
});
