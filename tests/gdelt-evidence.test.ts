import { describe, expect, it } from "vitest";
import { gdeltQueryForLanguage, gdeltQueryForTopic } from "../src/services/gdelt-evidence";

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
