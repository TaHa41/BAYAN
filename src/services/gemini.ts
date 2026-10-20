// Gemini API client. Pure transport: no D1/KV access and no logging of secrets.
export type GeminiEnv = { GEMINI_API_KEY?: string; GEMINI_MODEL?: string };
export type GeminiFailureKind = "no_key" | "auth" | "rate_limited" | "quota" | "blocked" | "http" | "timeout" | "bad_response";
export type GeminiResult =
  | { ok: true; text: string; model: string; finishReason?: string }
  | { ok: false; kind: GeminiFailureKind; status?: number; detail: string };
export type GeminiOptions = {
  system?: string;
  json?: boolean;
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const MODEL_PATTERN = /^[a-z0-9][a-z0-9.\-]{1,60}$/i;
export const resolveGeminiModel = (raw: unknown): string => {
  const model = String(raw ?? "").trim();
  return !model || !MODEL_PATTERN.test(model) || /-latest$/i.test(model) ? DEFAULT_GEMINI_MODEL : model;
};
const redact = (value: string, key: string): string => {
  let out = String(value ?? "").replace(/\s+/g, " ").slice(0, 300);
  if (key) out = out.split(key).join("[redacted]");
  return out.replace(/AIza[0-9A-Za-z_\-]{20,}|AQ\.[0-9A-Za-z_\-]{20,}/g, "[redacted]");
};

export async function callGemini(env: GeminiEnv, prompt: string, options: GeminiOptions = {}): Promise<GeminiResult> {
  const key = String(env.GEMINI_API_KEY ?? "").trim();
  if (!key) return { ok: false, kind: "no_key", detail: "GEMINI_API_KEY is not configured" };
  const text = String(prompt ?? "").trim();
  if (!text) return { ok: false, kind: "bad_response", detail: "empty prompt" };
  const model = resolveGeminiModel(env.GEMINI_MODEL);
  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text }] }],
    generationConfig: {
      temperature: options.temperature ?? 0.2,
      maxOutputTokens: options.maxOutputTokens ?? 2048,
      ...(options.json ? { responseMimeType: "application/json" } : {}),
    },
  };
  if (options.system) body.systemInstruction = { parts: [{ text: options.system }] };
  const doFetch = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 20_000);
  try {
    const response = await doFetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const raw = await response.text();
    let data: any = null;
    try { data = raw ? JSON.parse(raw) : null; } catch { data = null; }
    const apiMessage = String(data?.error?.message ?? raw ?? "");
    const apiStatus = String(data?.error?.status ?? "");
    if (!response.ok) {
      if (response.status === 401 || response.status === 403 || /API_KEY_INVALID|PERMISSION_DENIED|UNAUTHENTICATED/i.test(apiStatus + " " + apiMessage)) {
        return { ok: false, kind: "auth", status: response.status, detail: redact(apiMessage, key) };
      }
      if (response.status === 429 || apiStatus === "RESOURCE_EXHAUSTED") {
        const quota = /quota|per day|daily|billing/i.test(apiMessage);
        return { ok: false, kind: quota ? "quota" : "rate_limited", status: response.status, detail: redact(apiMessage, key) };
      }
      return { ok: false, kind: "http", status: response.status, detail: redact(apiMessage, key) };
    }
    if (data?.promptFeedback?.blockReason) return { ok: false, kind: "blocked", status: response.status, detail: "blocked: " + String(data.promptFeedback.blockReason) };
    const candidate = data?.candidates?.[0];
    const parts: unknown[] = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
    const output = parts.map((part: any) => typeof part?.text === "string" ? part.text : "").join("").trim();
    if (!output) return { ok: false, kind: "bad_response", status: response.status, detail: "no text (finishReason=" + String(candidate?.finishReason ?? "none") + ")" };
    return { ok: true, text: output, model, finishReason: candidate?.finishReason };
  } catch (error) {
    if ((error as { name?: string })?.name === "AbortError") return { ok: false, kind: "timeout", detail: "request timed out" };
    return { ok: false, kind: "http", detail: redact(String((error as Error)?.message ?? error), key) };
  } finally {
    clearTimeout(timer);
  }
}
