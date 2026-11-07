import { describe, expect, it } from "vitest";
import { relatedStories, researchBody, type LiveStory } from "../v2/src/ui";
import { runWorkersAi } from "../src/services/ai";

const story: LiveStory = { title: "البنك المركزي يثبت أسعار الفائدة عند مستواها الحالي", summary: "أعلن البنك المركزي تثبيت أسعار الفائدة. وجاء القرار بعد اجتماع لجنة السياسة النقدية هذا الأسبوع. وقال البنك إنه سيراقب معدلات التضخم.", publisher: "الأهرام", publishedAt: "2026-11-05T08:00:00Z", url: "https://ahram.example/1" };
const pool: LiveStory[] = [
  story,
  { title: "المركزي يثبت أسعار الفائدة عند مستواها الحالي للمرة الثانية", summary: "تفاصيل القرار.", publisher: "المصري اليوم", url: "https://almasry.example/2" },
  { title: "مباراة الأهلي والزمالك تنتهي بالتعادل", summary: "ملخص المباراة.", publisher: "اليوم السابع", url: "https://youm7.example/3" },
  { title: "البنك المركزي يثبت أسعار الفائدة عند مستواها الحالي اليوم", summary: "", publisher: "الأهرام", url: "https://ahram.example/4" },
];

describe("a story page is always a complete, organised article", () => {
  it("never shows an apology or a retry notice, even when the detailed write-up failed (null)", () => {
    for (const lang of ["ar", "en"] as const) {
      const html = researchBody(lang, story, null, relatedStories(story, pool));
      expect(html).not.toContain("تعذر"); expect(html).not.toMatch(/could not be prepared|Try again|حاول مرة أخرى/);
      expect(html).not.toContain("class=\"verdict\"");
    }
  });
  it("is structured: brief, key points, how each source covered it, and a source list", () => {
    const html = researchBody("ar", story, null, relatedStories(story, pool));
    for (const h of ["<h2>الخلاصة</h2>", "<h2>أبرز النقاط</h2>", "<h2>كيف تناولته المصادر</h2>"]) expect(html).toContain(h);
    expect(html).toContain("المصري اليوم"); expect(html).toContain("https://almasry.example/2"); expect(html).toContain("لم تُضف معلومات من خارجها");
  });
  it("related stories: other publishers, same story only, no duplicates of the same publisher", () => {
    const rel = relatedStories(story, pool);
    expect(rel.map((x) => x.publisher)).toEqual(["المصري اليوم"]);
  });
  it("a single source still gives a complete page without a fake source list", () => {
    const html = researchBody("en", { ...story, summary: "Short one-line summary of the story." }, null, []);
    expect(html).toContain("<h2>In brief</h2>"); expect(html).toContain("<h2>Source</h2>"); expect(html).toContain("Based on 1 published source");
  });
  it("source-only results from the research service use the same complete layout", () => {
    const html = researchBody("ar", story, { title: story.title, summary: "x", body: "x", sources: [{ title: "t", publisher: "p", url: "https://a.example" }], status: "source_only" }, []);
    expect(html).toContain("<h2>الخلاصة</h2>"); expect(html).not.toContain("class=\"verdict\"");
  });
  it("a real detailed write-up is rendered as sections and keeps its sources", () => {
    const body = "## ما حدث\nنص أول.\n- نقطة أ\n- نقطة ب\n## الخلفية\nنص ثان.";
    const html = researchBody("ar", story, { title: "عنوان", summary: "ملخص", body, sources: [{ title: "ت1", publisher: "ن1", url: "https://s1.example" }, { title: "ت2", publisher: "ن2", url: "https://s2.example" }] }, []);
    expect(html).toContain("<h2>ما حدث</h2>"); expect(html).toContain("<li>نقطة أ</li>"); expect(html).toContain("https://s2.example");
  });
});

describe("Workers AI falls back to other models", () => {
  const text = (t: string) => ({ response: t });
  it("uses the next model when the first throws or answers empty", async () => {
    const seen: string[] = [];
    const AI = { run: async (m: string) => { seen.push(m); if (seen.length === 1) throw new Error("model down"); if (seen.length === 2) return text(""); return text("ok"); } };
    const r = await runWorkersAi({ AI } as any, {});
    expect(r.response).toBe("ok"); expect(seen.length).toBe(3); expect(new Set(seen).size).toBe(3);
  });
  it("throws only when every model fails", async () => {
    const AI = { run: async () => { throw new Error("down"); } };
    await expect(runWorkersAi({ AI } as any, {})).rejects.toThrow("down");
  });
});
