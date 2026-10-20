import { describe, expect, it } from "vitest";
import { gdeltQueryForLanguage } from "../src/services/gdelt-evidence";

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
