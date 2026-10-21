import { describe, expect, it, vi } from "vitest";
import { callGemini, resolveGeminiModel } from "../src/services/gemini";
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
