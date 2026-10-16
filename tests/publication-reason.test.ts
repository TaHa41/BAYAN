import { describe, expect, it } from "vitest";
import { publicationRejectionReason } from "../src/db";

const imageUrl = "https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png";
const validBody = [
  "# Introduction",
  "This paragraph explains the topic and gives enough context for a reader to understand the subject clearly.",
  "## Background",
  "This paragraph provides background information and distinguishes established facts from interpretation.",
  "## Evidence",
  "This paragraph explains what the available evidence supports without adding unsupported names, dates, or numbers.",
  "## Limitations",
  "This paragraph describes uncertainty and limitations in the available information and the boundaries of the conclusion.",
  "## Conclusion",
  "This paragraph summarizes the supported findings and identifies what remains unknown."
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
