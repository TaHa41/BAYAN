import { describe, expect, it } from "vitest";
import { selectExpandedSearchCandidates } from "../src/services/search-expansion";

type Candidate = { provider: string; url: string; title: string };

const candidate = (provider: string, host: string, n: number): Candidate => ({
  provider,
  url: `https://${host}/story-${n}`,
  title: `${provider} ${host} ${n}`,
});

describe("expanded search candidate selection", () => {
  it("keeps trusted publisher sources instead of slicing them off after early provider batches", () => {
    const input = [
      ...Array.from({ length: 3 }, (_, i) => candidate("Wikipedia REST Search", `wiki${i}.example`, i)),
      ...Array.from({ length: 8 }, (_, i) => candidate("Bing Web RSS Search", `bing${i}.example`, i)),
      ...Array.from({ length: 7 }, (_, i) => candidate("Trusted Publisher RSS Search", `publisher${i}.example`, i)),
    ];
    const selected = selectExpandedSearchCandidates(input, 12);
    expect(selected).toHaveLength(12);
    expect(selected.filter(item => item.provider === "Trusted Publisher RSS Search")).toHaveLength(7);
    expect(selected.filter(item => item.provider === "Bing Web RSS Search")).toHaveLength(5);
    expect(selected.some(item => item.provider === "Wikipedia REST Search")).toBe(false);
  });

  it("limits duplicate hosts across alternate query variants", () => {
    const input = [
      candidate("Trusted Publisher RSS Search", "publisher.example", 1),
      candidate("Trusted Publisher RSS Search", "publisher.example", 2),
      candidate("Trusted Publisher RSS Search", "second.example", 3),
      candidate("Bing Web RSS Search", "third.example", 4),
    ];
    const selected = selectExpandedSearchCandidates(input, 12);
    expect(selected.map(item => item.title)).toEqual([
      "Trusted Publisher RSS Search publisher.example 1",
      "Trusted Publisher RSS Search second.example 3",
      "Bing Web RSS Search third.example 4",
    ]);
  });

  it("rejects unsafe URLs and obeys the requested output limit", () => {
    const input = [
      { ...candidate("Trusted Publisher RSS Search", "a.example", 1), url: "http://a.example/story" },
      candidate("Trusted Publisher RSS Search", "b.example", 2),
      candidate("Bing Web RSS Search", "c.example", 3),
    ];
    expect(selectExpandedSearchCandidates(input, 1).map(item => item.url)).toEqual(["https://b.example/story-2"]);
    expect(selectExpandedSearchCandidates(input, 0)).toEqual([]);
  });
});
