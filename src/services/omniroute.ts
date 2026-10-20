import type { Env } from "../types";

export type OmniRouteMessage = { role: "system" | "user" | "assistant"; content: string };
export type OmniRouteOptions = { json?: boolean; temperature?: number; maxTokens?: number; timeoutMs?: number };
export type OmniRouteResult = { ok: true; text: string } | { ok: false; detail: string };

function endpoint(base: string): string | undefined {
  const raw = String(base || "").trim().replace(/\/+$/, "");
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") return undefined;
    if (url.username || url.password || url.search || url.hash) return undefined;
    const path = url.pathname.replace(/\/+$/, "");
    return path.endsWith("/v1") ? url.origin + path + "/chat/completions" : url.origin + path + "/v1/chat/completions";
  } catch { return undefined; }
}

const safeDetail = (value: unknown, secret: string) =>
  String(value ?? "unknown").split(secret).join("[redacted]").replace(/https?:\/\/[^\s]+/g, "[url]").replace(/[\r\n\t]+/g, " ").slice(0, 240);

/** OpenAI-compatible OmniRoute client. Never logs prompts, credentials, or provider response bodies. */
export async function callOmniRoute(
  env: Pick<Env, "OMNIROUTE_BASE_URL" | "OMNIROUTE_API_KEY" | "OMNIROUTE_MODEL">,
  messages: OmniRouteMessage[],
  options: OmniRouteOptions = {},
  fetchImpl: typeof fetch = fetch,
): Promise<OmniRouteResult> {
  const url = endpoint(String(env.OMNIROUTE_BASE_URL || ""));
  const key = String(env.OMNIROUTE_API_KEY || "").trim();
  if (!url || !key) return { ok: false, detail: "OmniRoute endpoint or API key is not configured correctly" };
  const model = String(env.OMNIROUTE_MODEL || "auto").trim();
  if (!/^[a-zA-Z0-9._:/-]{1,120}$/.test(model)) return { ok: false, detail: "invalid OmniRoute model identifier" };
  try {
    const response = await fetchImpl(url, {
      method: "POST",
      headers: { authorization: "Bearer " + key, "content-type": "application/json" },
      signal: AbortSignal.timeout(options.timeoutMs ?? 10000),
      body: JSON.stringify({ model, messages, temperature: options.temperature ?? 0.1, max_tokens: options.maxTokens ?? 1200, ...(options.json ? { response_format: { type: "json_object" } } : {}) }),
    });
    if (!response.ok) return { ok: false, detail: "HTTP " + response.status };
    const data = await response.json() as { choices?: Array<{ message?: { content?: unknown } }> };
    const text = String(data?.choices?.[0]?.message?.content ?? "").trim();
    return text ? { ok: true, text } : { ok: false, detail: "empty_response" };
  } catch (error) {
    return { ok: false, detail: (error as Error)?.name === "TimeoutError" ? "timeout" : safeDetail((error as Error)?.message || "request_failed", key) };
  }
}
