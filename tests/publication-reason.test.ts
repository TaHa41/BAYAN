import { describe, expect, it } from "vitest";
import { publicationRejectionReason } from "../src/db";

const imageUrl = "https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png";
const longParagraph = (lead: string) => lead + " This paragraph explains the available evidence, context, limitations, and practical implications in clear language. It distinguishes established information from interpretation and avoids adding unsupported names, dates, numbers, or conclusions. ".repeat(4);
const validBody = [
  "# Introduction",
  longParagraph("The introduction establishes the topic."),
  "## Background",
  longParagraph("The background section provides context."),
  "## Evidence",
  longParagraph("The evidence section describes the sources."),
  "## Limitations",
  longParagraph("The limitations section explains uncertainty."),
  "## Conclusion",
  longParagraph("The conclusion summarizes supported findings.")
].join("\n\n");
const base = {
  title: "A verified English research topic",
  summary: "A concise summary of the evidence and its implications for the topic.",
  body: validBody,
  language: "en" as const,
  sources: [
    { publisher: "Source One", url: "https://one.example.org/report" },
    { publisher: "Source Two", url: "https://two.example.org/report" }
  ],
  imageUrl
};

describe("publication rejection details", () => {
  it("identifies a missing or unsafe image without weakening publication criteria", () => {
    expect(publicationRejectionReason({ ...base, imageUrl: undefined })).toBe("no_image");
  });

  it("identifies insufficient article length", () => {
    expect(publicationRejectionReason({ ...base, body: "Short body" })).toBe("body_too_short");
  });

  it("identifies insufficient independent source hosts", () => {
    expect(publicationRejectionReason({ ...base, sources: [
      { publisher: "Source One", url: "https://one.example.org/a" },
      { publisher: "Source Two", url: "https://one.example.org/b" }
    ] })).toBe("insufficient_independent_source_hosts");
  });
});
