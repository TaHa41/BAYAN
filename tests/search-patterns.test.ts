import { describe, expect, it } from "vitest";
import { boundedLikeKeywords, escapedLikePattern, MAX_LIKE_KEYWORD_UTF8_BYTES, utf8ByteLength } from "../src/search-patterns";
import { searchRecentNewsArchive } from "../src/services/search";

describe("bounded LIKE search patterns", () => {
  it("keeps long Arabic and English keyword patterns under SQLite's byte limit", () => {
    for (const text of ["م".repeat(180), "supercalifragilisticexpialidocious".repeat(5)]) {
      const terms = boundedLikeKeywords([text], 6);
      expect(terms.length).toBeGreaterThan(1);
      for (const term of terms) {
        expect(utf8ByteLength(term)).toBeLessThanOrEqual(MAX_LIKE_KEYWORD_UTF8_BYTES);
        expect(utf8ByteLength(escapedLikePattern(term))).toBeLessThanOrEqual(MAX_LIKE_KEYWORD_UTF8_BYTES + 2);
      }
    }
  });

  it("escapes LIKE wildcard characters", () => {
    expect(escapedLikePattern("a%b_c!d")).toBe("%a!%b!_c!!d%");
  });

  it.each([
    ["ar", "م".repeat(90), "هذا ملخص عربي طويل يشرح الموضوع ونتائجه ومعلوماته المهمة بطريقة واضحة ومفيدة للقارئ."],
    ["en", "supercalifragilisticexpialidocious".repeat(4), "This is a sufficiently long English summary describing the topic and its relevant findings for readers."]
  ] as const)("returns a matching %s archive result for a very long title/query", async (language, title, summary) => {
    let capturedSql = "";
    let capturedBindings: unknown[] = [];
    const row = {
      title, summary, url: "https://example.org/research",
      publisher: language === "ar" ? "ناشر مستقل" : "Independent Publisher",
      published_at: new Date().toISOString(), image_url: null, image_alt: title, section: "world"
    };
    const env = {
      DB: {
        prepare(sql: string) {
          capturedSql = sql;
          return {
            bind(...args: unknown[]) {
              capturedBindings = args;
              return { all: async () => ({ results: [row] }) };
            }
          };
        }
      }
    } as any;

    const results = await searchRecentNewsArchive(env, title, language);
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe(title);
    expect(capturedSql).toContain("LIKE ? ESCAPE '!'");
    const patterns = capturedBindings.slice(4) as string[];
    expect(patterns.length).toBeGreaterThan(0);
    for (const pattern of patterns) {
      expect(utf8ByteLength(pattern)).toBeLessThanOrEqual(MAX_LIKE_KEYWORD_UTF8_BYTES + 2);
    }
  });

  it("surfaces an internal provider query failure so the caller can record it and continue with other providers", async () => {
    const env = { DB: { prepare() { return { bind() { return { all: async () => { throw new Error("LIKE or GLOB pattern too complex"); } }; } } } } as any;
    await expect(searchRecentNewsArchive(env, "long title", "en")).rejects.toThrow("LIKE or GLOB pattern too complex");
  });
});
