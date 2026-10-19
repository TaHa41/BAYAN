import { afterEach, describe, expect, it, vi } from "vitest";
import { draftArticle } from "../src/services/ai";

const supportedSentence = (locale: "ar" | "en") => locale === "ar"
  ? "توضح المواد المنشورة خلفية الموضوع وسياقه العام والاستجابة الموثقة وحدود المعلومات المتاحة، مع التمييز بين الوقائع المؤكدة والتفاصيل التي لا تثبتها المقتطفات المقدمة"
  : "the available reporting describes the development, its background, the documented public response, and the limits of what the cited material establishes without adding details beyond the supplied evidence";

const evidenceFor = (locale: "ar" | "en") => {
  const excerpt = Array.from({ length: 16 }, () => supportedSentence(locale)).join(" ");
  return [
    { title: locale === "ar" ? "تقرير موثق" : "documented report", summary: excerpt, section: "news", kind: "web", evidence: "verified", sources: [{ title: locale === "ar" ? "تقرير موثق" : "documented report", publisher: "publisher one", url: "https://publisher-one.example/news" }] },
    { title: locale === "ar" ? "تغطية مستقلة" : "independent coverage", summary: excerpt, section: "news", kind: "web", evidence: "verified", sources: [{ title: locale === "ar" ? "تغطية مستقلة" : "independent coverage", publisher: "publisher two", url: "https://publisher-two.example/news" }] },
  ] as any;
};

const draftJson = (locale: "ar" | "en", options: { unsupported?: boolean; invalidSource?: boolean | "all" } = {}) => {
  const sentence = supportedSentence(locale);
  const sections = Array.from({ length: 4 }, (_, index) => ({
    heading: locale === "ar" ? ["الخلفية", "الوقائع", "السياق", "الحدود"][index] : ["background", "documented facts", "context", "limitations"][index],
    sentences: Array.from({ length: 4 }, (_, sentenceIndex) => ({
      text: options.unsupported && index === 0 && sentenceIndex === 0
        ? (locale === "ar" ? "أعلن نادي ريال مدريد في 17 مارس 2031 قرارًا جديدًا." : "Acme Group announced the result on 17 March 2031.")
        : sentence,
      sourceIds: options.invalidSource === "all" || (options.invalidSource && index === 0 && sentenceIndex === 0) ? ["S99"] : ["S1"],
    })),
  }));
  return JSON.stringify({ sections });
};

function mockGeneration(responses: string[]) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify({
    choices: [{ message: { content: responses.shift() ?? "not-json" } }],
  }), { status: 200, headers: { "content-type": "application/json" } }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe.each(["ar", "en"] as const)("evidence-grounded article drafting (%s)", locale => {
  it("removes unsupported names, numbers and dates after at most one correction generation", async () => {
    const fetchMock = mockGeneration([draftJson(locale, { unsupported: true }), draftJson(locale, { unsupported: true })]);
    const result = await draftArticle({ OPENAI_API_KEY: "test-key" } as any, locale === "ar" ? "موضوع موثق" : "documented topic", locale, evidenceFor(locale));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect((result as any).verification?.retried).toBe(true);
    expect((result as any).verification?.removedSentences).toBe(1);
    expect((result as any).verification?.remainingSentences).toBe(15);
    expect(result.answer).not.toContain(locale === "ar" ? "ريال مدريد" : "Acme Group");
    expect(result.answer).not.toContain(locale === "ar" ? "2031" : "2031");
  });

  it("accepts a well-formed supported draft", async () => {
    mockGeneration([draftJson(locale)]);
    const result = await draftArticle({ OPENAI_API_KEY: "test-key" } as any, locale === "ar" ? "موضوع موثق" : "documented topic", locale, evidenceFor(locale));
    expect(result.status).toBe("verified");
    expect((result as any).verification?.remainingSentences).toBe(16);
    expect((result as any).verification?.removedSentences).toBe(0);
    expect((result as any).verification?.retried).toBe(false);
  });

  it("rejects malformed JSON safely after one retry", async () => {
    const fetchMock = mockGeneration(["{not-json", "{still-not-json"]);
    const result = await draftArticle({ OPENAI_API_KEY: "test-key" } as any, locale === "ar" ? "موضوع موثق" : "documented topic", locale, evidenceFor(locale));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.status).toBe("mixed");
    expect(result.answer).toBe("");
    expect((result as any).verification?.retried).toBe(true);
  });

  it("salvages supported sentences while rejecting an unknown source ID", async () => {
    const fetchMock = mockGeneration([draftJson(locale, { invalidSource: true }), draftJson(locale, { invalidSource: true })]);
    const result = await draftArticle({ OPENAI_API_KEY: "test-key" } as any, locale === "ar" ? "موضوع موثق" : "documented topic", locale, evidenceFor(locale));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.status).toBe("verified");
    expect((result as any).verification?.remainingSentences).toBe(15);
    expect((result as any).verification?.removedSentences).toBe(1);
  });

  it("normalizes fenced JSON, source_ids aliases, and numeric source IDs", async () => {
    const value = JSON.parse(draftJson(locale));
    for (const section of value.sections) {
      for (const sentence of section.sentences) {
        sentence.source_ids = sentence.sourceIds.map((id: string) => Number(id.slice(1)));
        delete sentence.sourceIds;
      }
    }
    const fence = String.fromCharCode(96).repeat(3);
    const fetchMock = mockGeneration([fence + "json\\n" + JSON.stringify(value).replace(/,\\s*([}\\]])/g, "$1") + "\\n" + fence]);
    const result = await draftArticle({ OPENAI_API_KEY: "test-key" } as any, locale === "ar" ? "موضوع موثق" : "documented topic", locale, evidenceFor(locale));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("verified");
    expect((result as any).verification?.remainingSentences).toBe(16);
  });

  it("rejects a draft if every sentence has an unknown source ID", async () => {
    const fetchMock = mockGeneration([draftJson(locale, { invalidSource: "all" }), draftJson(locale, { invalidSource: "all" })]);
    const result = await draftArticle({ OPENAI_API_KEY: "test-key" } as any, locale === "ar" ? "موضوع موثق" : "documented topic", locale, evidenceFor(locale));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.status).toBe("mixed");
    expect(result.answer).toBe("");
    expect((result as any).verification?.retried).toBe(true);
  });
});
