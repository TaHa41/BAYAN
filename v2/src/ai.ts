// AI providers behind one interface. Never throws: every outcome is a typed result, so callers (and the
// engineer diagnostics) can tell "bad key" from "wrong model" from "quota" instead of seeing a generic failure.
// Keys are only ever sent in a header and never appear in results or logs.
export interface AiEnv { GEMINI_API_KEY?: string; GEMINI_MODEL?: string; AI?: { run: (model: string, input: unknown) => Promise<any> } }
export type AiErrorKind = "missing_key" | "invalid_key" | "model_not_found" | "quota" | "timeout" | "http_error" | "empty" | "network";
export interface AiResult { ok: boolean; provider: "gemini" | "workers-ai"; model: string; ms: number; text?: string; error?: AiErrorKind; detail?: string }
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
export const WORKERS_AI_MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8";
const GEMINI = "https://generativelanguage.googleapis.com/v1beta";
type Fetcher = typeof fetch;

export function classify(status: number, body: string): AiErrorKind {
  const b = body.toLowerCase();
  if (status === 429 || b.includes("quota") || b.includes("resource_exhausted")) return "quota";
  if (status === 404 || b.includes("is not found") || b.includes("not supported for generatecontent")) return "model_not_found";
  if (status === 401 || status === 403 || b.includes("api key not valid") || b.includes("api_key_invalid") || b.includes("permission_denied")) return "invalid_key";
  return "http_error";
}
const model = (env: AiEnv) => (env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL).trim();

export async function geminiGenerate(env: AiEnv, prompt: string, o: { fetcher?: Fetcher; timeoutMs?: number } = {}): Promise<AiResult> {
  const started = Date.now(), m = model(env), base = { provider: "gemini" as const, model: m };
  if (!env.GEMINI_API_KEY) return { ...base, ok: false, ms: 0, error: "missing_key" };
  try {
    const res = await (o.fetcher || fetch)(`${GEMINI}/models/${encodeURIComponent(m)}:generateContent`, {
      method: "POST", signal: AbortSignal.timeout(o.timeoutMs ?? 12000),
      headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 700, temperature: 0.2 } }),
    });
    const raw = await res.text();
    if (!res.ok) return { ...base, ok: false, ms: Date.now() - started, error: classify(res.status, raw), detail: "HTTP " + res.status };
    const text = String(JSON.parse(raw)?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text || "").join("") || "").trim();
    return text ? { ...base, ok: true, ms: Date.now() - started, text } : { ...base, ok: false, ms: Date.now() - started, error: "empty" };
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return { ...base, ok: false, ms: Date.now() - started, error: timedOut ? "timeout" : "network" };
  }
}

export async function workersAiGenerate(env: AiEnv, prompt: string): Promise<AiResult> {
  const started = Date.now(), base = { provider: "workers-ai" as const, model: WORKERS_AI_MODEL };
  if (!env.AI) return { ...base, ok: false, ms: 0, error: "missing_key", detail: "AI binding absent" };
  try {
    const out = await env.AI.run(WORKERS_AI_MODEL, { messages: [{ role: "user", content: prompt }], max_tokens: 400 });
    const text = String(out?.response || "").trim();
    return text ? { ...base, ok: true, ms: Date.now() - started, text } : { ...base, ok: false, ms: Date.now() - started, error: "empty" };
  } catch (error) {
    const msg = String(error instanceof Error ? error.message : error).toLowerCase();
    return { ...base, ok: false, ms: Date.now() - started, error: msg.includes("quota") || msg.includes("limit") ? "quota" : "http_error" };
  }
}

/** Gemini first, Workers AI as the free fallback. Returns the winning result plus every attempt. */
export async function generate(env: AiEnv, prompt: string, o: { fetcher?: Fetcher } = {}): Promise<{ result: AiResult; attempts: AiResult[] }> {
  const attempts: AiResult[] = [];
  for (const run of [() => geminiGenerate(env, prompt, o), () => workersAiGenerate(env, prompt)]) {
    const r = await run(); attempts.push(r);
    if (r.ok) return { result: r, attempts };
  }
  return { result: attempts[attempts.length - 1], attempts };
}

/** Models in this account that support generateContent and look like Flash, so GEMINI_MODEL can be set to a real name. */
export async function listGeminiFlashModels(env: AiEnv, fetcher: Fetcher = fetch): Promise<string[]> {
  if (!env.GEMINI_API_KEY) return [];
  try {
    const res = await fetcher(`${GEMINI}/models?pageSize=100`, { headers: { "x-goog-api-key": env.GEMINI_API_KEY }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data: any = await res.json();
    return (Array.isArray(data?.models) ? data.models : []).filter((x: any) => /flash/i.test(String(x?.name)) && (x?.supportedGenerationMethods || []).includes("generateContent"))
      .map((x: any) => String(x.name).replace(/^models\//, "")).slice(0, 12);
  } catch (error) { return []; }
}
