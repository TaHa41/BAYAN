import { describe, expect, it } from "vitest";
import { fetchGdeltMetadataWithFallback, gdeltQueryForLanguage, gdeltQueryForTopic } from "../src/services/gdelt-evidence";

describe("GDELT source-language discovery", () => {
  it("uses the Arabic source-language operator inside the query", () => {
    expect(gdeltQueryForLanguage("ar")).toContain("sourcelang:arabic");
    expect(gdeltQueryForLanguage("ar")).toContain("breaking");
  });

  it("uses the English source-language operator inside the query", () => {
    expect(gdeltQueryForLanguage("en")).toContain("sourcelang:english");
    expect(gdeltQueryForLanguage("en")).toContain("breaking");
  });

  it("does not confuse source language with a URL parameter", () => {
    expect(gdeltQueryForLanguage("ar")).not.toContain("&sourcelang=");
    expect(gdeltQueryForLanguage("en")).not.toContain("&sourcelang=");
  });
});

describe("GDELT topic evidence discovery", () => {
  it("builds a bounded English topic query from meaningful title phrases", () => {
    const query = gdeltQueryForTopic("Egypt social protection programmes update", "en");
    expect(query).toContain('"egypt social"');
    expect(query).toContain('"social protection"');
    expect(query).toContain("OR egypt");
    expect(query).toContain("OR protection");
    expect(query).toContain("sourcelang:english");
    expect(query.length).toBeLessThan(240);
  });

  it("builds a bounded Arabic topic query and keeps language in the query", () => {
    const query = gdeltQueryForTopic("تكاليف المعيشة في مصر", "ar");
    expect(query).toContain('"تكاليف المعيشة"');
    expect(query).toContain("sourcelang:arabic");
    expect(query).not.toContain("&sourcelang=");
  });

  it("falls back to the language query when the topic contains no usable terms", () => {
    expect(gdeltQueryForTopic("news and the latest", "en")).toContain("sourcelang:english");
  });
});


describe("GDELT topic query recovery", () => {
  it("retries with a language query when the topic request times out", async () => {
    const diagnostics: string[] = [];
    let calls = 0;
    const fetchImpl = (async () => {
      calls++;
      if (calls === 1) throw new DOMException("timed out", "AbortError");
      return new Response(JSON.stringify({ articles: [{ title: "Egypt public health", url: "https://example.org/story", language: "English" }] }), { status: 200, headers: { "content-type": "application/json" } });
    }) as typeof fetch;
    const result = await fetchGdeltMetadataWithFallback("en", fetchImpl, diagnostics, "Egypt public health policy");
    expect(calls).toBe(2);
    expect(result).toHaveLength(1);
    expect(diagnostics.some(item => item.includes("topic request failed: AbortError"))).toBe(true);
    expect(diagnostics.some(item => item.includes("language-fallback parsed=1"))).toBe(true);
  });

  it("retries with a language query when the topic query returns no articles", async () => {
    const diagnostics: string[] = [];
    let calls = 0;
    const fetchImpl = (async () => {
      calls++;
      return new Response(JSON.stringify({ articles: calls === 1 ? [] : [{ title: "Egypt public health", url: "https://example.org/story", language: "English" }] }), { status: 200, headers: { "content-type": "application/json" } });
    }) as typeof fetch;
    const result = await fetchGdeltMetadataWithFallback("en", fetchImpl, diagnostics, "Egypt public health policy");
    expect(calls).toBe(2);
    expect(result).toHaveLength(1);
    expect(diagnostics).toContain("GDELT topic query empty; trying language fallback");
  });

  it("bounds metadata response bodies and retries the language fallback", async () => {
    const diagnostics: string[] = [];
    let calls = 0;
    const fetchImpl = (async () => {
      calls++;
      if (calls === 1) return new Response("x".repeat(512 * 1024 + 1), { status: 200 });
      return new Response(JSON.stringify({ articles: [{ title: "Verified topic", url: "https://example.org/story", language: "English" }] }), { status: 200 });
    }) as typeof fetch;
    const result = await fetchGdeltMetadataWithFallback("en", fetchImpl, diagnostics, "public health policy");
    expect(calls).toBe(2);
    expect(result).toHaveLength(1);
    expect(diagnostics).toContain("GDELT topic request failed: response_body_too_large");
    expect(diagnostics).toContain("GDELT language-fallback parsed=1");
  });

  it("does not fabricate results when both GDELT requests fail", async () => {
    const diagnostics: string[] = [];
    const fetchImpl = (async () => { throw new Error("network unavailable"); }) as typeof fetch;
    const result = await fetchGdeltMetadataWithFallback("ar", fetchImpl, diagnostics, "أخبار الصحة");
    expect(result).toEqual([]);
    expect(diagnostics).toHaveLength(2);
  });
});
