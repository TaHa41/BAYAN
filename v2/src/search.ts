// Provider-agnostic search: every provider is isolated (timeout + retry), one failure never fails the
// search, and when nothing is found we say so with per-provider reasons instead of inventing results.
import { independentPublishers, verdictFor, type Verdict } from "./evidence";

export interface Hit { title: string; summary: string; url: string; publisher: string; score?: number }
export interface Provider { name: string; run: (query: string, signal: AbortSignal) => Promise<Hit[]> }
export interface ProviderReport { name: string; ok: boolean; count: number; ms: number; attempts: number; error?: string }
export interface SearchOutcome { query: string; hits: Hit[]; verdict: Verdict; independentPublishers: number; providers: ProviderReport[] }
export interface SearchOptions { timeoutMs?: number; retries?: number; backoffMs?: number }

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Canonical key for de-duplication: lower-case host, no hash, no utm_* params, no trailing slash. */
export function urlKey(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    for (const key of [...u.searchParams.keys()]) if (/^utm_/i.test(key)) u.searchParams.delete(key);
    return (u.protocol + "//" + u.host.toLowerCase().replace(/^www\./, "") + u.pathname.replace(/\/+$/, "") + u.search).toLowerCase();
  } catch (error) {
    return url.trim().toLowerCase();
  }
}

async function runProvider(provider: Provider, query: string, o: Required<SearchOptions>): Promise<{ report: ProviderReport; hits: Hit[] }> {
  const started = Date.now();
  let lastError = "";
  for (let attempt = 1; attempt <= o.retries + 1; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), o.timeoutMs);
    try {
      const hits = (await provider.run(query, controller.signal)).filter((h) => h && h.title && h.url);
      return { hits, report: { name: provider.name, ok: true, count: hits.length, ms: Date.now() - started, attempts: attempt } };
    } catch (error) {
      lastError = controller.signal.aborted ? "timeout" : String(error instanceof Error ? error.message : error).slice(0, 160);
    } finally {
      clearTimeout(timer);
    }
    if (attempt <= o.retries) await sleep(o.backoffMs * 2 ** (attempt - 1));
  }
  return { hits: [], report: { name: provider.name, ok: false, count: 0, ms: Date.now() - started, attempts: o.retries + 1, error: lastError } };
}

export async function searchAll(query: string, providers: Provider[], options: SearchOptions = {}): Promise<SearchOutcome> {
  const o = { timeoutMs: options.timeoutMs ?? 4000, retries: options.retries ?? 1, backoffMs: options.backoffMs ?? 150 };
  const results = await Promise.all(providers.map((p) => runProvider(p, query, o)));
  const byKey = new Map<string, Hit>();
  for (const { hits } of results) for (const hit of hits) {
    const key = urlKey(hit.url);
    const existing = byKey.get(key);
    if (!existing || (hit.score ?? 0) > (existing.score ?? 0)) byKey.set(key, hit);
  }
  const hits = [...byKey.values()].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const sources = hits.map((h) => ({ title: h.title, publisher: h.publisher, url: h.url }));
  return { query, hits, verdict: verdictFor(sources), independentPublishers: independentPublishers(sources).length, providers: results.map((r) => r.report) };
}
