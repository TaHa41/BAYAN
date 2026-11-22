import type { Env } from "../types";

/**
 * Extra AI providers that speak the OpenAI chat-completions format and have free tiers (no card needed at the time of writing).
 * They sit between Gemini and the paid/limited providers, so one exhausted provider never stops article drafting.
 * A provider is used only when its key exists as a Cloudflare secret; nothing here stores or logs a key.
 */
export interface CompatProvider { id: "groq" | "cerebras" | "openrouter"; keyName: string; modelName: string; url: string; model: string; jsonMode: boolean }
export const COMPAT_PROVIDERS: readonly CompatProvider[] = [
  { id: "groq", keyName: "GROQ_API_KEY", modelName: "GROQ_MODEL", url: "https://api.groq.com/openai/v1/chat/completions", model: "llama-3.3-70b-versatile", jsonMode: true },
  { id: "cerebras", keyName: "CEREBRAS_API_KEY", modelName: "CEREBRAS_MODEL", url: "https://api.cerebras.ai/v1/chat/completions", model: "llama-3.3-70b", jsonMode: true },
  { id: "openrouter", keyName: "OPENROUTER_API_KEY", modelName: "OPENROUTER_MODEL", url: "https://openrouter.ai/api/v1/chat/completions", model: "meta-llama/llama-3.3-70b-instruct:free", jsonMode: false },
];

// Per-isolate cooldowns: no D1 statements are spent on bookkeeping (every statement counts against the per-invocation subrequest limit).
const cooldown = new Map<string, number>();
export const resetCompatCooldowns = () => cooldown.clear();
export const compatProvidersConfigured = (env: Env): string[] => COMPAT_PROVIDERS.filter((p) => String((env as any)[p.keyName] ?? "").trim() !== "").map((p) => p.id);

const redact = (s: string) => s.replace(/(key|token|secret|authorization|bearer)["'=:\s]+[^\s"',}]+/gi, "$1=…");

/** Tries each configured provider in order and returns the first non-empty answer; "" when none answered. */
export async function callCompatProviders(
  env: Env,
  messages: { role: string; content: string }[],
  opts: { json?: boolean; maxTokens: number; timeoutMs: number; label: string },
  onFailure: (label: string, detail: string) => Promise<unknown> | void,
): Promise<string> {
  for (const p of COMPAT_PROVIDERS) {
    const key = String((env as any)[p.keyName] ?? "").trim();
    if (!key || (cooldown.get(p.id) ?? 0) > Date.now()) continue;
    const label = `${opts.label} (${p.id})`;
    try {
      const model = String((env as any)[p.modelName] ?? "").trim() || p.model;
      const response = await fetch(p.url, {
        method: "POST",
        headers: { authorization: "Bearer " + key, "content-type": "application/json" },
        signal: AbortSignal.timeout(opts.timeoutMs),
        body: JSON.stringify({ model, messages, temperature: 0, max_tokens: opts.maxTokens, ...(opts.json && p.jsonMode ? { response_format: { type: "json_object" } } : {}) }),
      });
      if (response.ok) {
        const data: any = await response.json();
        const text = String(data?.choices?.[0]?.message?.content ?? "").trim();
        if (text) return text;
        cooldown.set(p.id, Date.now() + 2 * 60_000);
        await onFailure(label, "empty_response");
        continue;
      }
      const body = redact(await response.text().catch(() => "")).slice(0, 140);
      const retryAfter = Number(response.headers.get("retry-after"));
      const wait = response.status === 401 || response.status === 403 ? 6 * 3600_000 : response.status === 429 ? Math.min(Math.max((Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 600) * 1000, 60_000), 3600_000) : 3 * 60_000;
      cooldown.set(p.id, Date.now() + wait);
      await onFailure(label, `status=${response.status} ${body}`.trim());
    } catch (error) {
      cooldown.set(p.id, Date.now() + 3 * 60_000);
      await onFailure(label, redact(String(error instanceof Error ? error.message : error)).slice(0, 160));
    }
  }
  return "";
}
