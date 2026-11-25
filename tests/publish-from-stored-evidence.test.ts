import { afterEach, describe, expect, it, vi } from "vitest";
import { publishFromStoredEvidence } from "../src/services/search";
import type { Env, SearchResult } from "../src/types";

const result = (n: number, publisher: string, host: string): SearchResult => ({
  title: "Parliament passes the budget bill after a long debate " + n,
  summary: "Lawmakers approved the budget bill on Tuesday after several days of debate, according to the report published by " + publisher + ".",
  section: "politics",
  kind: "web",
  evidence: "mixed",
  sources: [{ title: "Budget bill passes " + n, publisher, url: "https://" + host + "/budget-bill-" + n }],
});

const fakeEnv = () => {
  const ai = { run: vi.fn(async () => ({ response: "should never be called" })) };
  const statement = { bind() { return statement; }, all: async () => ({ results: [] }), first: async () => null, run: async () => ({ meta: { changes: 1 } }) };
  return { env: { DB: { prepare: () => statement }, AI: ai } as unknown as Env, ai };
};

afterEach(() => vi.unstubAllGlobals());

describe("publishFromStoredEvidence (phase 2 of the two-phase pipeline)", () => {
  it("re-applies the independent-publisher gate to stored evidence and never fetches or calls AI when it fails", async () => {
    const fetchSpy = vi.fn(async () => { throw new Error("phase 2 must not fetch"); });
    vi.stubGlobal("fetch", fetchSpy);
    const { env, ai } = fakeEnv();
    // Two independent publishers is below the required five: the gate must reject, exactly as in a single-run attempt.
    const stored = [result(1, "Reuters", "reuters.com"), result(2, "BBC News", "bbc.com")];
    const out = await publishFromStoredEvidence(env, "Parliament passes the budget bill", "en", stored, "Lawmakers approved the budget bill on Tuesday.");
    expect(out.articleSlug).toBeUndefined();
    expect(out.publishReason).toBe("no_independent_sources");
    expect(String(out.publishReasonDetail)).toContain("required=5");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(ai.run).not.toHaveBeenCalled();
    expect(out.providers).toEqual(["BAYAN stored evidence"]);
  });
});
