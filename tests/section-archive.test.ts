import { describe, expect, it } from "vitest";
import type { Env } from "../src/types";
import { archiveResearch, archiveSearchResults, archiveSlug, listSectionArchive, validateArchiveInput } from "../src/services/section-archive";

const src = (url: string) => ({ title: "t", publisher: "p", url });
const longAr = "هذه خلاصة موثقة عن الموضوع المطلوب وتحتوي على معلومات كافية لتكون مدخل أرشيف مفيد للقارئ في القسم المناسب.";
function fakeDb() {
  const writes: any[][] = [];
  const rows: any[] = [];
  const stmt = (sql: string) => ({
    bind: (...args: any[]) => ({
      run: async () => { writes.push([sql, ...args]); return { meta: { changes: 1 } }; },
      all: async () => ({ results: rows }),
    }),
  });
  return { db: { prepare: stmt } as any, writes, rows };
}

describe("section archive", () => {
  it("accepts a sourced, language-correct entry for an archivable section", () => {
    const v = validateArchiveInput({ title: "الأزمة الاقتصادية", summary: longAr, sources: [src("https://www.bbc.com/arabic/x")], section: "economy", language: "ar" });
    expect(v.ok).toBe(true);
  });
  it.each([
    ["no source", { sources: [] }, "no_https_source"],
    ["aggregator only", { sources: [src("https://news.google.com/a")] }, "no_https_source"],
    ["http only", { sources: [src("http://bbc.com/a")] }, "no_https_source"],
    ["live-data section", { section: "prices" }, "section_not_archivable"],
    ["news section (own pipeline)", { section: "news" }, "section_not_archivable"],
    ["wrong language", { language: "en" as const }, "language_mismatch"],
    ["thin summary", { summary: "قصير" }, "summary_too_short"],
  ])("rejects %s", (_n, patch: any, reason) => {
    const base = { title: "الأزمة الاقتصادية", summary: longAr, sources: [src("https://bbc.com/a")], section: "economy", language: "ar" as const };
    const v = validateArchiveInput({ ...base, ...patch });
    expect(v).toMatchObject({ ok: false, reason });
  });
  it("uses a stable per-language slug and never targets PUBLISHED rows", async () => {
    expect(archiveSlug("محمد صلاح", "ar")).toBe(archiveSlug("  محمد   صلاح ", "ar"));
    expect(archiveSlug("محمد صلاح", "ar")).not.toBe(archiveSlug("محمد صلاح", "en"));
    const { db, writes } = fakeDb();
    const r = await archiveResearch({ DB: db } as Env, { title: "محمد صلاح", summary: longAr, sources: [src("https://bbc.com/a")], section: "people", language: "ar" });
    expect(r.stored).toBe(true);
    expect(String(writes[0][0])).toContain("'ARCHIVE'");
    expect(String(writes[0][0])).toContain("articles.status='ARCHIVE'");
  });
  it("files at most 3 top results, each under its own section", async () => {
    const { db, writes } = fakeDb();
    const mk = (i: number, section: string) => ({ title: "عنوان رقم " + "أ".repeat(i + 3), summary: longAr, section, sources: [src("https://bbc.com/" + i)] });
    const n = await archiveSearchResults({ DB: db } as Env, [mk(1, "politics"), mk(2, "people"), mk(3, "science"), mk(4, "sports")], "ar");
    expect(n).toBe(3);
    expect(writes.map((w) => w[2])).toEqual(["politics", "people", "science"]);
  });
  it("lists archive rows as slug-less topic cards", async () => {
    const { db, rows } = fakeDb();
    rows.push({ title: "أ", summary: "ب", section: "people", sources_json: JSON.stringify([src("https://bbc.com/a"), src("http://bad.com/x")]), image_url: null, image_alt: null, updated_at: "2026-10-27" });
    const items = await listSectionArchive({ DB: db } as Env, "people", "ar");
    expect(items[0]).toMatchObject({ slug: "", kind: "archive", archived: true });
    expect(items[0].sources).toHaveLength(1);
    expect(await listSectionArchive({ DB: db } as Env, "news", "ar")).toEqual([]);
  });
});
