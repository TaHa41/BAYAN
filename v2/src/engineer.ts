// The "engineer": turns raw signals into prioritized, actionable findings. The rules are plain code
// (deterministic and testable); AI is only used on request to narrate the findings, never to decide them.
import type { AiResult } from "./ai";

export interface Signals {
  d1: { ok: boolean; error?: string; published?: number; archive?: number; publishedWithoutImage?: number };
  gemini: AiResult | null; workersAi: AiResult | null; availableFlashModels: string[];
  search: { ok: boolean; hits: number };
}
export type Severity = "critical" | "high" | "medium";
export interface Finding { id: string; severity: Severity; problem: string; fix: string }
const ORDER: Record<Severity, number> = { critical: 0, high: 1, medium: 2 };

export function analyze(s: Signals): Finding[] {
  const f: Finding[] = [];
  if (!s.d1.ok) f.push({ id: "d1_unreachable", severity: "critical", problem: "Database is not reachable" + (s.d1.error ? ` (${s.d1.error})` : ""), fix: "Check the D1 binding and the daily read quota in Cloudflare; pages degrade to empty lists until it recovers." });
  else {
    if (!s.d1.published) f.push({ id: "no_published_articles", severity: "high", problem: "No published articles are available to show", fix: "Check the news pipeline: the AI provider must work and each article needs 5 independent publishers and a real image." });
    if ((s.d1.publishedWithoutImage || 0) > 0) f.push({ id: "articles_without_image", severity: "medium", problem: `${s.d1.publishedWithoutImage} published article(s) have no HTTPS image and are hidden by the no-image-no-article rule`, fix: "Attach an image that matches the article, or leave them hidden." });
  }
  const g = s.gemini, w = s.workersAi;
  const gemOk = !!g?.ok, wOk = !!w?.ok;
  if (!gemOk && !wOk) f.push({ id: "no_ai_provider", severity: "critical", problem: "No AI provider is working, so articles cannot be drafted", fix: "Fix Gemini (see below) or enable the Workers AI binding." });
  if (g && !g.ok) {
    const fixes: Record<string, string> = {
      missing_key: "Add GEMINI_API_KEY as a Secret on the Worker (exact name, capital letters).",
      invalid_key: "Gemini rejected the key: create a new key in Google AI Studio and store it as the Secret GEMINI_API_KEY.",
      model_not_found: `Model "${g.model}" is not available: set GEMINI_MODEL to one of: ${s.availableFlashModels.join(", ") || "(list unavailable until the key is valid)"}.`,
      quota: "Gemini quota is exhausted: wait for reset or lower the daily AI budget.",
      timeout: "Gemini timed out: retry later or raise the timeout.", network: "Gemini could not be reached from the Worker.", empty: "Gemini returned an empty answer.", http_error: `Gemini returned an HTTP error ${g.detail || ""}`.trim(),
    };
    f.push({ id: "gemini_" + g.error, severity: gemOk || wOk ? "medium" : "high", problem: `Gemini check failed: ${g.error}`, fix: fixes[g.error || "http_error"] });
  }
  if (!s.search.ok || s.search.hits === 0) f.push({ id: "search_probe_empty", severity: "medium", problem: "A test search returned no real results", fix: "Check outbound connectivity to the search providers; search degrades to an honest 'no results' message." });
  return f.sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);
}
