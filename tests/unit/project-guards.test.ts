import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import worker from "../../src/index";

describe("BAYAN V3 contracts", () => {
  it("exports fetch and scheduled handlers", () => {
    expect(worker.fetch).toBeTypeOf("function");
    expect(worker.scheduled).toBeTypeOf("function");
  });

  it("keeps migrations contiguous through the V3 contract", () => {
    const files = readdirSync("migrations").filter((x) => /^\d+_.*\.sql$/.test(x)).sort();
    expect(files.at(-1)).toBe("0016_v3_content_contract.sql");
    expect(files.map(x => Number(x.split("_")[0]))).toEqual(files.map((_x, i) => i + 1));
  });

  it("keeps the V3 public contract aligned", () => {
    const source = readFileSync("src/v3/app.ts", "utf8");
    const html = readFileSync("public/index.html", "utf8");
    const app = readFileSync("public/app.js", "utf8");
    expect(source).toContain("/api/health");
    expect(source).toContain("/api/search");
    expect(source).toContain("/api/news");
    expect(source).toContain("/api/weather");
    expect(source).toContain("/api/fx");
    expect(source).toContain("/api/ai/manager/");
    expect(source).toContain("BAYAN_AI_MANAGER_TOKEN");
    expect(html).toContain("/styles.css");
    expect(html).toContain("/app.js");
    expect(app).toContain("location.href=\"/search?q=");
    expect(app).toContain("lang=en");
  });

  it("does not reintroduce Resend", () => {
    const source = readFileSync("src/v3/app.ts", "utf8") + readFileSync("src/v3/manager.ts", "utf8");
    expect(source.toLowerCase()).not.toContain("resend");
  });

  it("keeps the canonical schema compatible with V3 fields", () => {
    const schema = readFileSync("schema.sql", "utf8");
    for (const field of ["language","title_en","summary_en","body_en","hero_image_url","published_at","source_count","verified"]) {
      expect(schema).toContain(field);
    }
  });
});
