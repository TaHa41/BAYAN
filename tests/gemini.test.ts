import { describe, expect, it, vi } from "vitest";
import { callGemini, pickFlashModel, resetGeminiDiscovery, resolveGeminiModel } from "../src/services/gemini";
import { classifyGeminiFailure } from "../src/services/ai-provider-resilience";

describe("Gemini REST client", () => {
  it("does not make a request when the secret is absent", async () => {
    const fetchImpl = vi.fn();
    const result = await callGemini({}, "hello", { fetchImpl: fetchImpl as typeof fetch });
    expect(result).toMatchObject({ ok: false, kind: "no_key" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("uses the official generateContent endpoint and extracts candidate text", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent");
      expect(new Headers(init?.headers).get("x-goog-api-key")).toBe("test-key-not-real");
      const body = JSON.parse(String(init?.body));
      expect(body.generationConfig.responseMimeType).toBe("application/json");
      return new Response(JSON.stringify({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: '{"sections":[]}' }] } }] }), { status: 200 });
    });
    const result = await callGemini({ GEMINI_API_KEY: "test-key-not-real" }, "write JSON", { json: true, fetchImpl: fetchImpl as typeof fetch });
    expect(result).toMatchObject({ ok: true, text: '{"sections":[]}', model: "gemini-3.8-flash" });
  });

  it("classifies quota errors without retaining the API key in details", async () => {
    const key = "AIza0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ error: { status: "RESOURCE_EXHAUSTED", message: "daily quota exceeded " + key } }), { status: 429 }));
    const result = await callGemini({ GEMINI_API_KEY: key }, "hello", { fetchImpl: fetchImpl as typeof fetch });
    expect(result).toMatchObject({ ok: false, kind: "quota", status: 429 });
    if (!result.ok) expect(result.detail).not.toContain(key);
    expect(classifyGeminiFailure("quota", 429, "daily quota exceeded").code).toBe("quota_exceeded");
  });

  it("uses the supported fixed Gemini default and rejects unstable latest aliases", () => {
    expect(resolveGeminiModel("gemini-3.8-flash-latest")).toBe("gemini-3.8-flash");
    expect(resolveGeminiModel("bad model")).toBe("gemini-3.8-flash");
    expect(resolveGeminiModel("gemini-3.8-flash")).toBe("gemini-3.8-flash");
  });
});

describe("Gemini model self-healing", () => {
  const models = { models: [
    { name: "models/gemini-2.0-flash-exp", supportedGenerationMethods: ["generateContent"] },
    { name: "models/gemini-2.5-flash-preview-09-2025", supportedGenerationMethods: ["generateContent"] },
    { name: "models/gemini-2.5-flash", supportedGenerationMethods: ["generateContent"] },
    { name: "models/gemini-2.5-flash-image", supportedGenerationMethods: ["generateContent"] },
    { name: "models/gemini-1.5-flash", supportedGenerationMethods: ["generateContent"] },
    { name: "models/text-embedding-flash", supportedGenerationMethods: ["embedContent"] }] };
  it("prefers the newest stable Flash text model and skips experimental, image and embedding models", () => {
    expect(pickFlashModel(models.models)).toBe("gemini-2.5-flash");
    expect(pickFlashModel([])).toBeNull(); expect(pickFlashModel(undefined)).toBeNull();
  });
  it("recovers from a wrong model name: lists models, retries once with a real one, and remembers it", async () => {
    resetGeminiDiscovery();
    const urls: string[] = [];
    const fetchImpl = vi.fn(async (input: any) => {
      const url = String(input); urls.push(url);
      if (url.includes("/models?pageSize")) return new Response(JSON.stringify(models), { status: 200 });
      if (url.includes("gemini-3.8-flash:generateContent")) return new Response(JSON.stringify({ error: { message: "models/gemini-3.8-flash is not found for API version v1beta", status: "NOT_FOUND" } }), { status: 404 });
      return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "ok" }] } }] }), { status: 200 });
    });
    const first = await callGemini({ GEMINI_API_KEY: "k-secret" }, "hi", { fetchImpl: fetchImpl as typeof fetch });
    expect(first).toMatchObject({ ok: true, text: "ok", model: "gemini-2.5-flash" });
    const second = await callGemini({ GEMINI_API_KEY: "k-secret" }, "hi again", { fetchImpl: fetchImpl as typeof fetch });
    expect(second).toMatchObject({ ok: true, model: "gemini-2.5-flash" });
    expect(urls.filter((u) => u.includes("gemini-3.8-flash:generateContent")).length).toBe(1);
    expect(urls.filter((u) => u.includes("/models?pageSize")).length).toBe(1);
    expect(urls.join(" ")).not.toContain("k-secret"); resetGeminiDiscovery();
  });
  it("does not loop or hide real errors: no usable model, or an auth error, stays a clear failure", async () => {
    resetGeminiDiscovery();
    const none = vi.fn(async (input: any) => String(input).includes("/models?pageSize") ? new Response(JSON.stringify({ models: [] }), { status: 200 }) : new Response(JSON.stringify({ error: { message: "model is not found" } }), { status: 404 }));
    expect(await callGemini({ GEMINI_API_KEY: "k" }, "hi", { fetchImpl: none as typeof fetch })).toMatchObject({ ok: false, kind: "http", status: 404 });
    const auth = vi.fn(async () => new Response(JSON.stringify({ error: { message: "API key not valid", status: "INVALID_ARGUMENT" } }), { status: 400 }));
    const r = await callGemini({ GEMINI_API_KEY: "k" }, "hi", { fetchImpl: auth as typeof fetch });
    expect(r.ok).toBe(false); expect(auth).toHaveBeenCalledTimes(1); resetGeminiDiscovery();
  });
});
