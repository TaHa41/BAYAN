import { describe, expect, it } from "vitest";
import { layout } from "./ui";
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
