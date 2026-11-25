import { beforeEach, describe, expect, it, vi } from "vitest";

const searchMock = vi.fn();
const storedMock = vi.fn();
vi.mock("../src/services/search", () => ({ search: (...a: unknown[]) => searchMock(...a), publishFromStoredEvidence: (...a: unknown[]) => storedMock(...a) }));
vi.mock("../src/services/ai", () => ({ anyAiProviderUsable: async () => true }));
vi.mock("../src/runtime-events", () => ({ recordRuntimeEventLimited: vi.fn(async () => undefined) }));

import { publishNextArchivedNewsArticle } from "../src/services/news-article-publisher";
import { PENDING_EVIDENCE_KEY, serializePendingEvidence } from "../src/services/news-evidence-store";
import type { Env, SearchResult } from "../src/types";

const ROW = { id: 41, title: "Parliament passes the budget bill", summary: "x".repeat(150), language: "en", article_attempts: 0, publisher: "Reuters", published_at: new Date().toISOString(), fetched_at: new Date().toISOString() };
const evidence = (n: number): SearchResult => ({ title: "t" + n, summary: "s".repeat(80), section: "politics", kind: "web", evidence: "mixed", sources: [{ title: "a", publisher: "P" + n, url: "https://p" + n + ".example/a" }] });

type Call = { sql: string; args: unknown[] };
function makeEnv(opts: { pending?: { value: string; updatedAt: string }; pendingDeleteChanges?: number; rowById?: unknown; candidates?: unknown[] }) {
  const calls: Call[] = [];
  const prepare = (sql: string) => {
    const call: Call = { sql, args: [] };
    calls.push(call);
    const stmt: any = {
      bind: (...args: unknown[]) => { call.args = args; return stmt; },
      all: async () => {
        if (/FROM admin_settings WHERE key IN/.test(sql)) return { results: opts.pending ? [{ key: PENDING_EVIDENCE_KEY, value: opts.pending.value, updated_at: opts.pending.updatedAt }] : [] };
        if (/FROM news_archive/.test(sql) && /LIMIT 40/.test(sql)) return { results: opts.candidates ?? [] };
        return { results: [] };
      },
      first: async () => {
        if (/RETURNING value/.test(sql)) return { value: "ok" };
        if (/SELECT id,title,summary,language,article_attempts,publisher FROM news_archive WHERE id=\?/.test(sql)) return opts.rowById ?? null;
        return null;
      },
      run: async () => ({ meta: { changes: /DELETE FROM admin_settings WHERE key=\? AND updated_at=\?/.test(sql) ? (opts.pendingDeleteChanges ?? 1) : 1 } }),
    };
    return stmt;
  };
  return { env: { DB: { prepare } } as unknown as Env, calls };
}
const wrote = (calls: Call[], re: RegExp) => calls.filter((c) => re.test(c.sql));

beforeEach(() => { searchMock.mockReset(); storedMock.mockReset(); });

describe("two-phase article pipeline orchestration", () => {
  it("phase 1 parks the evidence through storeEvidence and does not count a draft attempt", async () => {
    const { env, calls } = makeEnv({ candidates: [ROW] });
    const results = [1, 2, 3, 4, 5].map(evidence);
    searchMock.mockImplementation(async (_e: unknown, _t: string, _l: string, options: any) => {
      expect(options.evidenceStage).toBe("collect");
      expect(await options.storeEvidence(results)).toBe(true);
      return { publishReason: "evidence_stored", publishReasonDetail: "publishers=5;hosts=5;required=5;stored_for_next_cycle" };
    });
    const out: any = await publishNextArchivedNewsArticle(env);
    expect(out.status).toBe("evidence_stored");
    const park = wrote(calls, /INSERT INTO admin_settings\(key,value,updated_at\) VALUES\(\?,\?,\?\)/).find((c) => c.args[0] === PENDING_EVIDENCE_KEY);
    expect(park).toBeTruthy();
    expect(JSON.parse(String(park!.args[1])).results).toEqual(results);
    expect(wrote(calls, /article_attempts=article_attempts\+1/)).toHaveLength(0);
    expect(storedMock).not.toHaveBeenCalled();
  });

  it("phase 2 claims the parked evidence atomically and drafts from it without gathering (search is never called)", async () => {
    const value = serializePendingEvidence({ id: 41, language: "en", results: [1, 2, 3, 4, 5].map(evidence), storedAt: new Date(Date.now() - 5 * 60_000).toISOString() })!;
    const { env, calls } = makeEnv({ pending: { value, updatedAt: "2026-11-25T10:00:00.000Z" }, rowById: ROW });
    storedMock.mockResolvedValue({ articleSlug: "parliament-budget", publishReasonDetail: "draft_verified" });
    const out: any = await publishNextArchivedNewsArticle(env);
    expect(out).toMatchObject({ status: "published", id: 41, slug: "parliament-budget" });
    expect(searchMock).not.toHaveBeenCalled();
    expect(storedMock).toHaveBeenCalledTimes(1);
    const claim = wrote(calls, /DELETE FROM admin_settings WHERE key=\? AND updated_at=\?/)[0];
    expect(claim.args).toEqual([PENDING_EVIDENCE_KEY, "2026-11-25T10:00:00.000Z"]);
    // No second queue claim or language rotation in phase 2: phase 1 already did both.
    expect(wrote(calls, /UPDATE news_archive SET article_last_attempt_at=\? WHERE id=\? AND article_slug IS NULL/)).toHaveLength(0);
  });

  it("phase 2 does nothing when another invocation already claimed the parked evidence", async () => {
    const value = serializePendingEvidence({ id: 41, language: "en", results: [evidence(1)], storedAt: new Date().toISOString() })!;
    const { env } = makeEnv({ pending: { value, updatedAt: "t" }, pendingDeleteChanges: 0, rowById: ROW });
    const out: any = await publishNextArchivedNewsArticle(env);
    expect(out.status).toBe("already_claimed");
    expect(storedMock).not.toHaveBeenCalled();
    expect(searchMock).not.toHaveBeenCalled();
  });

  it("waits quietly during the AI backoff instead of gathering new evidence over the parked set", async () => {
    const value = serializePendingEvidence({ id: 41, language: "en", results: [evidence(1)], storedAt: new Date(Date.now() - 60_000).toISOString(), retryAfter: new Date(Date.now() + 10 * 60_000).toISOString() })!;
    const { env, calls } = makeEnv({ pending: { value, updatedAt: "t" }, rowById: ROW, candidates: [ROW] });
    const out: any = await publishNextArchivedNewsArticle(env);
    expect(out.status).toBe("evidence_waiting");
    expect(searchMock).not.toHaveBeenCalled();
    expect(storedMock).not.toHaveBeenCalled();
    expect(wrote(calls, /DELETE FROM admin_settings/)).toHaveLength(0);
  });

  it("keeps the parked evidence (same storedAt, with retryAfter) when every AI provider fails in phase 2", async () => {
    const storedAt = new Date(Date.now() - 30 * 60_000).toISOString();
    const original = [1, 2, 3, 4, 5].map(evidence);
    const value = serializePendingEvidence({ id: 41, language: "en", results: original, storedAt })!;
    const { env, calls } = makeEnv({ pending: { value, updatedAt: "t" }, rowById: ROW });
    storedMock.mockResolvedValue({ publishReason: "ai_unavailable", publishReasonDetail: "article_draft_all_providers_unavailable" });
    const out: any = await publishNextArchivedNewsArticle(env);
    expect(out.status).toBe("attempted_failed");
    const keep = wrote(calls, /INSERT INTO admin_settings\(key,value,updated_at\) VALUES\(\?,\?,\?\)/).find((c) => c.args[0] === PENDING_EVIDENCE_KEY);
    expect(keep).toBeTruthy();
    const saved = JSON.parse(String(keep!.args[1]));
    expect(saved.storedAt).toBe(storedAt);
    expect(Date.parse(saved.retryAfter)).toBeGreaterThan(Date.now());
    expect(saved.results).toEqual(original);
  });

  it("discards expired parked evidence and falls back to a fresh phase 1 gather", async () => {
    const value = serializePendingEvidence({ id: 41, language: "en", results: [evidence(1)], storedAt: new Date(Date.now() - 6 * 3_600_000).toISOString() })!;
    const { env, calls } = makeEnv({ pending: { value, updatedAt: "t" }, candidates: [ROW] });
    searchMock.mockResolvedValue({ publishReason: "no_independent_sources", publishReasonDetail: "independent_evidence_below_threshold:publishers=1;hosts=1;required=5", results: [] });
    const out: any = await publishNextArchivedNewsArticle(env);
    expect(out.status).toBe("attempted_no_publish");
    expect(wrote(calls, /DELETE FROM admin_settings WHERE key=\?$/)).toHaveLength(1);
    expect(storedMock).not.toHaveBeenCalled();
  });
});
