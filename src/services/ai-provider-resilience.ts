import type { Env } from "../types";

export type ProviderFailure = {
  provider: "openai" | "workers_ai" | "gemini";
  code: string;
  status?: number;
  retryAfterMs?: number;
  resetMs?: number;
  detail: string;
};

const safe = (value: unknown) => String(value ?? "")
  .replace(/https?:\/\/[^\s]+/g, "[url]")
  .replace(/\b(?:sk-[A-Za-z0-9_-]{8,}|Bearer\s+\S+)\b/gi, "[redacted]")
  .replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").slice(0, 240);

export function parseRetryAfter(value: string | null, now = Date.now()): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(24 * 60 * 60_000, seconds * 1000);
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, Math.min(24 * 60 * 60_000, date - now)) : undefined;
}

export function classifyOpenAIFailure(status: number, body: unknown, headers: Headers, now = Date.now()): ProviderFailure {
  const payload = body && typeof body === "object" ? body as any : {};
  const code = safe(payload?.error?.code || payload?.error?.type || (status === 429 ? "rate_limit_unknown" : "http_" + status));
  const retryAfterMs = parseRetryAfter(headers.get("retry-after"), now);
  const resetValues = ["x-ratelimit-reset-requests", "x-ratelimit-reset-tokens"]
    .map(name => headers.get(name)).filter(Boolean).map(value => {
      const text = String(value);
      const seconds = Number(text.replace(/s$/, ""));
      if (Number.isFinite(seconds) && seconds >= 0) return Math.min(24 * 60 * 60_000, seconds * 1000);
      const date = Date.parse(text);
      return Number.isFinite(date) ? Math.max(0, date - now) : undefined;
    }).filter((value): value is number => value !== undefined);
  const metadata = ["x-ratelimit-limit-requests", "x-ratelimit-remaining-requests", "x-ratelimit-reset-requests", "x-ratelimit-limit-tokens", "x-ratelimit-remaining-tokens", "x-ratelimit-reset-tokens"]
    .map(name => name + "=" + (headers.get(name) || "n/a")).join(",");
  return {
    provider: "openai", code, status,
    retryAfterMs,
    resetMs: resetValues.length ? Math.max(...resetValues) : undefined,
    detail: safe("status=" + status + "; code=" + code + "; retry_after_ms=" + (retryAfterMs ?? "n/a") + "; " + metadata)
  };
}

export function classifyWorkersAIFailure(error: unknown): ProviderFailure {
  const raw = safe((error as any)?.message || error || "unknown");
  const lower = raw.toLowerCase();
  const code = /4006|quota|neurons|exceeded.*limit/.test(lower) ? "quota_exceeded"
    : /timeout|timed out|abort/.test(lower) ? "timeout"
    : /model.*(not found|unsupported|invalid)|unsupported.*model/.test(lower) ? "unsupported_model"
    : /json|parse/.test(lower) ? "invalid_json"
    : "provider_error";
  return { provider: "workers_ai", code, detail: safe("code=" + code + "; " + raw) };
}

export function classifyGeminiFailure(kind: string, status?: number, detail = ""): ProviderFailure {
  const normalized = String(kind || "provider_error").toLowerCase();
  const code = normalized === "quota" ? "quota_exceeded"
    : normalized === "rate_limited" ? "rate_limited"
    : normalized === "auth" ? "authentication_failed"
    : normalized === "timeout" ? "timeout"
    : normalized === "blocked" ? "blocked"
    : normalized === "bad_response" ? "invalid_response"
    : normalized === "http" ? "http_error"
    : normalized === "no_key" ? "not_configured"
    : "provider_error";
  return { provider: "gemini", code, status, detail: safe(detail || code) };
}

export function isOpenAIQuotaFailure(code: string): boolean {
  const normalized = String(code || "").toLowerCase().replace(/[- ]/g, "_");
  return ["insufficient_quota", "quota_exceeded", "credit_balance_exhausted", "billing_hard_limit_reached", "billing_not_active"].some(value => normalized.includes(value));
}

export function exponentialBackoffMs(attempt: number, baseMs = 15 * 60_000, capMs = 2 * 60 * 60_000): number {
  const n = Math.max(0, Math.floor(attempt));
  return Math.min(capMs, baseMs * 2 ** Math.min(n, 16));
}

export function normalizeDraftJson(raw: string): string {
  let value = String(raw || "").trim().replace(/^\uFEFF/, "");
  value = value.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  const first = value.indexOf("{");
  const last = value.lastIndexOf("}");
  if (first >= 0 && last > first) value = value.slice(first, last + 1);
  value = value.replace(/"source_ids"\s*:/g, '"sourceIds":').replace(/,\s*([}\]])/g, "$1");
  return value;
}

type BreakerState = { openedUntil: number; consecutive429: number; code: string };
const breakerKey = (provider: string) => "ai_breaker_" + provider;

export async function getProviderBreaker(env: Pick<Env, "DB">, provider: "openai" | "workers_ai" | "gemini", now = Date.now()): Promise<{ open: boolean; openedUntil: number; code: string }> {
  try {
    const row = await env.DB.prepare("SELECT value FROM admin_settings WHERE key=? LIMIT 1").bind(breakerKey(provider)).first<{value:string}>();
    const state = row?.value ? JSON.parse(row.value) as BreakerState : { openedUntil: 0, consecutive429: 0, code: "closed" };
    return { open: Number(state.openedUntil) > now, openedUntil: Number(state.openedUntil) || 0, code: String(state.code || "closed") };
  } catch {
    return { open: false, openedUntil: 0, code: "state_unavailable" };
  }
}

export async function updateProviderBreaker(env: Pick<Env, "DB">, provider: "openai" | "workers_ai" | "gemini", failure?: ProviderFailure, now = Date.now()): Promise<{ open: boolean; openedUntil: number; code: string }> {
  let previous: BreakerState = { openedUntil: 0, consecutive429: 0, code: "closed" };
  try {
    const row = await env.DB.prepare("SELECT value FROM admin_settings WHERE key=? LIMIT 1").bind(breakerKey(provider)).first<{value:string}>();
    if (row?.value) previous = { ...previous, ...JSON.parse(row.value) };
  } catch { /* fail closed for breaker state; provider failure is still recorded */ }
  let next: BreakerState = { openedUntil: 0, consecutive429: 0, code: "closed" };
  if (failure) {
    const quota = provider === "openai"
      ? isOpenAIQuotaFailure(failure.code)
      : /quota|quota_exceeded|neurons/.test(failure.code.toLowerCase());
    const rateLimited = failure.status === 429 || /rate_limited|rate_limit/.test(failure.code.toLowerCase());
    if (quota || rateLimited) {
      next.consecutive429 = previous.consecutive429 + 1;
      next.code = failure.code;
      const open = quota || next.consecutive429 >= 3;
      if (open) next.openedUntil = now + (quota ? 6 * 60 * 60_000 : Math.max(15 * 60_000, failure.retryAfterMs || 0, failure.resetMs || 0));
    }
  }
  try {
    await env.DB.prepare("INSERT INTO admin_settings(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at")
      .bind(breakerKey(provider), JSON.stringify(next), new Date(now).toISOString()).run();
  } catch { /* telemetry/breaker persistence must not hide the provider error */ }
  return { open: next.openedUntil > now, openedUntil: next.openedUntil, code: next.code };
}

export async function recordProviderDiagnostic(env: Pick<Env, "DB">, failure: ProviderFailure, event = "ai_provider_failure") {
  const message = safe(failure.provider + ": " + failure.detail);
  try {
    await env.DB.prepare("INSERT INTO runtime_events(level,kind,message,created_at) VALUES(?,?,?,?)")
      .bind("WARN", event, message, new Date().toISOString()).run();
  } catch { /* best effort; never include request prompts or credentials */ }
}

/** Normalize the supported Workers AI response shapes without stringifying an object as "[object Object]". */
export function workersAIResponseText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (!value || typeof value !== "object") return "";
  const data = value as any;
  if (typeof data.response === "string" && data.response.trim()) return data.response.trim();
  const messageContent = data.choices?.[0]?.message?.content;
  if (typeof messageContent === "string" && messageContent.trim()) return messageContent.trim();
  if (data.response && typeof data.response === "object") {
    try { return JSON.stringify(data.response); } catch { return ""; }
  }
  return "";
}
