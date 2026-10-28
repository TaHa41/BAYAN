import { describe, expect, it } from "vitest";
import { articleBody, layout } from "./ui";
import { SECTIONS } from "./sections";

describe("BAYAN v2 visual consistency", () => {
  const html = layout({
    lang: "ar",
    origin: "https://bayan.example",
    path: "/",
    title: "BAYAN",
    description: "واجهة بيان",
    body: "<main>اختبار</main>",
  });

  it("uses the shared warm background and flat card system", () => {
    expect(html).toContain("--bg:#f9f9f9");
    expect(html).toContain("--card:#fff");
    expect(html).toContain("border:1px solid var(--line)");
    expect(html).not.toContain("box-shadow:0 20px 44px");
    expect(html).toContain("@media(max-width:520px)");
  });

  it("renders every public section with a consistent SVG icon", () => {
    for (const section of SECTIONS) {
      expect(html).toContain(`href="/${section.slug}?lang=ar"><svg`);
    }
  });

  it("shows a localized fallback when any image fails to load", () => {
    expect(html).toContain("Image currently unavailable");
    expect(html).toContain("الصورة غير متاحة حاليًا");
    expect(html).toContain('parent.classList.add("image-failed")');
  });

  it("shows the independent-source threshold on article pages", () => {
    const article = {
      slug: "sample", section: "science", lang: "ar", title: "عنوان", summary: "ملخص",
      body: "نص", imageUrl: "https://example.com/image.jpg", imageAlt: "صورة",
      sources: [
        { title: "one", publisher: "one", url: "https://one.example/a" },
        { title: "two", publisher: "two", url: "https://two.example/a" },
      ], updatedAt: "2026-10-29", archived: false,
    } as const;
    const body = articleBody("ar", article);
    expect(body).toContain("لم يكتمل التحقق المستقل");
    expect(body).toContain("2/5");
  });

  it("preserves Arabic RTL and English LTR page direction", () => {
    expect(html).toContain('<html lang="ar" dir="rtl">');
    const english = layout({
      lang: "en",
      origin: "https://bayan.example",
      path: "/",
      title: "BAYAN",
      description: "BAYAN interface",
      body: "",
    });
    expect(english).toContain('<html lang="en" dir="ltr">');
  });
});
