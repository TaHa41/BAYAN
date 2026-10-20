import { describe, expect, it } from "vitest";
import { normalizeFeedPublisher } from "./news";

describe("normalizeFeedPublisher", () => {
  it("uses the configured feed name when the source tag is a CMS taxonomy path", () => {
    expect(normalizeFeedPublisher("taxonomy/term/2", "الشرق الأوسط")).toBe("الشرق الأوسط");
  });

  it("uses the configured feed name when the source tag is a URL", () => {
    expect(normalizeFeedPublisher("https://aawsat.com/feed", "الشرق الأوسط")).toBe("الشرق الأوسط");
  });

  it("preserves a real publisher label", () => {
    expect(normalizeFeedPublisher("Associated Press", "BBC News")).toBe("Associated Press");
  });

  it("falls back for an empty source tag", () => {
    expect(normalizeFeedPublisher("  ", "BBC News")).toBe("BBC News");
  });
});
