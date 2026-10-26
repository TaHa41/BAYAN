import { describe, expect, it } from "vitest";
import { independentPublishers, registrableDomain, verdictFor, type Source } from "../src/evidence";

const src = (url: string): Source => ({ title: "t", publisher: "p", url });

describe("evidence rules", () => {
  it("normalises registrable domains, incl. two-part suffixes, and rejects non-HTTPS", () => {
    expect(registrableDomain("https://www.bbc.co.uk/news/1")).toBe("bbc.co.uk");
    expect(registrableDomain("https://edition.cnn.com/x")).toBe("cnn.com");
    expect(registrableDomain("http://cnn.com/x")).toBeNull();
    expect(registrableDomain("not a url")).toBeNull();
  });
  it("never counts aggregators or repeated domains as independent publishers", () => {
    const sources = [src("https://news.google.com/a"), src("https://www.bbc.com/a"), src("https://bbc.com/b"), src("https://msn.com/c")];
    expect(independentPublishers(sources)).toEqual(["bbc.com"]);
  });
  it("is 'verified' only at 5 independent publishers", () => {
    const four = ["bbc.com", "cnn.com", "reuters.com", "aljazeera.net"].map((d) => src(`https://${d}/a`));
    expect(verdictFor(four)).toBe("mixed");
    expect(verdictFor([...four, src("https://apnews.com/a")])).toBe("verified");
    expect(verdictFor([src("https://bbc.com/a")])).toBe("insufficient");
    expect(verdictFor([])).toBe("insufficient");
  });
});
