import { describe, expect, it } from "vitest";
import { classifyStory } from "../src/classify";
import { articleQuality, isGenericImage } from "../src/quality";

describe("classifyStory", () => {
  it.each([
    ["الانتخابات الإسرائيلية: ماهي السيناريوهات المحتملة لتشكيل الحكومة", "politics"],
    ["«دويتشه بنك» يتجاوز التوقعات ويرفع أرباحه", "economy"],
    ["هاري كين يتوج بالكرة الذهبية 2026", "sports"],
    ["إيطاليا: هجوم إلكتروني يستهدف بريد ميلوني", "technology"],
    ["قصف مدفعي وإطلاق نار إسرائيلي مكثف في غزة", "world"],
    ["أرقام قياسية جديدة تسجلها الغازات الدفيئة", "science"],
    ["Fed expected to hold interest rates", "economy"],
    ["New vaccine approved by regulators", "health"],
  ])("%s -> %s", (title, expected) => expect(classifyStory(title)).toBe(expected));
  it("returns null when nothing matches (story stays in News only)", () => expect(classifyStory("عنوان عام بلا كلمات مفتاحية")).toBeNull());
});

describe("articleQuality", () => {
  const long = "فقرة مفصلة ".repeat(150);
  const sources = [{ title: "a", publisher: "A", url: "https://bbc.com/a" }, { title: "b", publisher: "B", url: "https://reuters.com/b" }];
  it("flags a stub: summary-only body, one placeholder source, generic cover image", () => {
    const q = articleQuality({ summary: "شرح مبسط.", body: "شرح مبسط.", imageUrl: "https://www.nationalacademies.org/cover.jpg", sources: [{ title: "Reference", publisher: "BAYAN reference", url: "https://www.nationalacademies.org/" }] });
    expect(q.complete).toBe(false);
    expect(q.reasons).toEqual(["body_too_short", "fewer_than_2_independent_sources", "no_topic_image"]);
  });
  it("accepts a full article with 2 independent sources and a topic image", () => {
    expect(articleQuality({ summary: "ملخص", body: "ملخص\n" + long, imageUrl: "https://img.example/2026/10/photo-123.jpg", sources })).toEqual({ complete: true, reasons: [] });
  });
  it("detects generic images but not normal photos", () => {
    for (const u of ["https://x.com/cover.jpg", "https://x.com/a/logo.png", "https://x.com/default.webp", "http://x.com/p.jpg"]) expect(isGenericImage(u)).toBe(true);
    expect(isGenericImage("https://x.com/photos/protest-paris-2026.jpg")).toBe(false);
  });
});
