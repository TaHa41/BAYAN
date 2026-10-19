import { describe, expect, it } from "vitest";
import { classifySection } from "../src/services/search";

describe("evidence-backed search section classification", () => {
  it("preserves an explicit section from the strongest evidence when topic inference is inconclusive", () => {
    const result = classifySection(
      "Local transit overview",
      [{
        title: "Local transit overview",
        summary: "A practical explainer about local transit service changes and passenger information.",
        section: "travel",
        kind: "web",
        sources: []
      } as any],
      "en"
    );
    expect(result).toBe("travel");
  });

  it("uses news for dated news evidence instead of defaulting to global shifts", () => {
    const result = classifySection(
      "Local transit overview",
      [{
        title: "Local transit overview",
        summary: "A guide describes transit service access and practical information for local residents.",
        kind: "news",
        publishedAt: "2026-10-19T05:00:00.000Z",
        sources: []
      } as any],
      "en"
    );
    expect(result).toBe("news");
  });

  it("keeps confident topic classification ahead of a conflicting fallback section", () => {
    const result = classifySection(
      "Artificial intelligence model release",
      [{
        title: "Artificial intelligence model release",
        summary: "The new software model uses machine learning algorithms and AI systems.",
        section: "news",
        kind: "news",
        publishedAt: "2026-10-19T05:00:00.000Z",
        sources: []
      } as any],
      "en"
    );
    expect(result).toBe("technology");
  });
});
