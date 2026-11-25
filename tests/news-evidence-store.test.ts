import { describe, expect, it } from "vitest";
import { EVIDENCE_MAX_BYTES, EVIDENCE_TTL_MS, readPendingEvidence, serializePendingEvidence } from "../src/services/news-evidence-store";
import type { SearchResult } from "../src/types";

const item = (n: number, extra: Partial<SearchResult> = {}): SearchResult => ({
  title: "Title " + n,
  summary: "Summary text long enough to count as substantive evidence number " + n + ".",
  section: "world",
  kind: "web",
  evidence: "mixed",
  sources: [{ title: "Story " + n, publisher: "Publisher " + n, url: "https://publisher" + n + ".example/story" }],
  ...extra,
});
const NOW = Date.parse("2026-11-25T12:00:00Z");
const iso = (ms: number) => new Date(ms).toISOString();

describe("pending evidence store (two-phase news pipeline)", () => {
  it("round-trips evidence exactly, with no fields added or dropped", () => {
    const results = [1, 2, 3, 4, 5].map((n) => item(n));
    const json = serializePendingEvidence({ id: 7, language: "ar", results, storedAt: iso(NOW - 60_000) });
    expect(json).not.toBeNull();
    const state = readPendingEvidence(json, NOW);
    expect(state.state).toBe("ready");
    if (state.state === "ready") {
      expect(state.evidence.id).toBe(7);
      expect(state.evidence.language).toBe("ar");
      expect(state.evidence.results).toEqual(results);
    }
  });

  it("treats a missing value as none and malformed or foreign payloads as invalid", () => {
    expect(readPendingEvidence(undefined, NOW).state).toBe("none");
    expect(readPendingEvidence("", NOW).state).toBe("none");
    expect(readPendingEvidence("{not json", NOW).state).toBe("invalid");
    expect(readPendingEvidence(JSON.stringify({ v: 2, id: 1 }), NOW).state).toBe("invalid");
    expect(readPendingEvidence(JSON.stringify({ v: 1, id: 0, language: "ar", storedAt: iso(NOW), results: [item(1)] }), NOW).state).toBe("invalid");
    expect(readPendingEvidence(JSON.stringify({ v: 1, id: 1, language: "fr", storedAt: iso(NOW), results: [item(1)] }), NOW).state).toBe("invalid");
    expect(readPendingEvidence(JSON.stringify({ v: 1, id: 1, language: "en", storedAt: iso(NOW), results: [] }), NOW).state).toBe("invalid");
    expect(readPendingEvidence(JSON.stringify({ v: 1, id: 1, language: "en", storedAt: iso(NOW), results: [{ title: "x" }] }), NOW).state).toBe("invalid");
    expect(readPendingEvidence(JSON.stringify({ v: 1, id: 1, language: "en", storedAt: iso(NOW + 3_600_000), results: [item(1)] }), NOW).state).toBe("invalid");
  });

  it("expires stale evidence so old news is re-gathered instead of drafted", () => {
    const fresh = serializePendingEvidence({ id: 1, language: "en", results: [item(1)], storedAt: iso(NOW - EVIDENCE_TTL_MS + 1000) });
    const stale = serializePendingEvidence({ id: 1, language: "en", results: [item(1)], storedAt: iso(NOW - EVIDENCE_TTL_MS - 1000) });
    expect(readPendingEvidence(fresh, NOW).state).toBe("ready");
    expect(readPendingEvidence(stale, NOW).state).toBe("expired");
  });

  it("waits while retryAfter is in the future and becomes ready afterwards, keeping the original storedAt", () => {
    const storedAt = iso(NOW - 10 * 60_000);
    const json = serializePendingEvidence({ id: 3, language: "en", results: [item(1)], storedAt, retryAfter: iso(NOW + 5 * 60_000) });
    const waiting = readPendingEvidence(json, NOW);
    expect(waiting.state).toBe("waiting");
    const later = readPendingEvidence(json, NOW + 6 * 60_000);
    expect(later.state).toBe("ready");
    if (later.state === "ready") expect(later.evidence.storedAt).toBe(storedAt);
  });

  it("refuses to store empty, invalid or oversized evidence (measured in UTF-8 bytes)", () => {
    expect(serializePendingEvidence({ id: 1, language: "ar", results: [], storedAt: iso(NOW) })).toBeNull();
    expect(serializePendingEvidence({ id: 0, language: "ar", results: [item(1)], storedAt: iso(NOW) })).toBeNull();
    expect(serializePendingEvidence({ id: 1, language: "ar", results: [item(1)], storedAt: "not a date" })).toBeNull();
    // Arabic letters are 2 bytes each in UTF-8, so a string well under the cap in characters can still be over it in bytes.
    const arabic = "ب".repeat(Math.ceil(EVIDENCE_MAX_BYTES / 2));
    expect(serializePendingEvidence({ id: 1, language: "ar", results: [item(1, { summary: arabic })], storedAt: iso(NOW) })).toBeNull();
  });
});
