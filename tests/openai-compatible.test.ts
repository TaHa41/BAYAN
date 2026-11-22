import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Env } from "../src/types";
import { callCompatProviders, compatProvidersConfigured, resetCompatCooldowns } from "../src/services/openai-compatible";

const ok = (text: string) => new Response(JSON.stringify({ choices: [{ message: { content: text } }] }), { status: 200 });
const msgs = [{ role: "system", content: "s" }, { role: "user", content: "u" }];
const opts = { json: true, maxTokens: 100, timeoutMs: 1000, label: "Draft" };
let failures: string[];
const onFailure = (label: string, detail: string) => { failures.push(label + ": " + detail); };
beforeEach(() => { resetCompatCooldowns(); failures = []; });
afterEach(() => vi.unstubAllGlobals());

describe("free OpenAI-compatible providers", () => {
  it("uses nothing when no key is configured", async () => {
    const f = vi.fn(); vi.stubGlobal("fetch", f);
    expect(compatProvidersConfigured({} as Env)).toEqual([]);
    expect(await callCompatProviders({} as Env, msgs, opts, onFailure)).toBe(""); expect(f).not.toHaveBeenCalled();
  });
  it("calls the first configured provider with the key, model and JSON mode, and returns its text", async () => {
    const calls: { url: string; init: any }[] = [];
    vi.stubGlobal("fetch", async (url: string, init: any) => { calls.push({ url, init }); return ok("draft text"); });
    const env = { GROQ_API_KEY: "gsk_secret", CEREBRAS_API_KEY: "c" } as unknown as Env;
    expect(compatProvidersConfigured(env)).toEqual(["groq", "cerebras"]);
    expect(await callCompatProviders(env, msgs, opts, onFailure)).toBe("draft text");
    expect(calls.length).toBe(1); expect(calls[0].url).toContain("api.groq.com");
    expect(calls[0].init.headers.authorization).toBe("Bearer gsk_secret");
    const body = JSON.parse(calls[0].init.body); expect(body.model).toBe("llama-3.3-70b-versatile"); expect(body.response_format).toEqual({ type: "json_object" }); expect(body.temperature).toBe(0);
  });
  it("fails over to the next provider when one is rate limited, remembers the cooldown, and never leaks a key", async () => {
    const hosts: string[] = [];
    vi.stubGlobal("fetch", async (url: string) => { hosts.push(new URL(url).host); return url.includes("groq") ? new Response('{"error":{"message":"rate limit api_key=gsk_secret"}}', { status: 429, headers: { "retry-after": "120" } }) : ok("from cerebras"); });
    const env = { GROQ_API_KEY: "gsk_secret", CEREBRAS_API_KEY: "ck" } as unknown as Env;
    expect(await callCompatProviders(env, msgs, opts, onFailure)).toBe("from cerebras");
    expect(hosts).toEqual(["api.groq.com", "api.cerebras.ai"]);
    expect(failures.join(" ")).toContain("status=429"); expect(failures.join(" ")).not.toContain("gsk_secret");
    hosts.length = 0;
    expect(await callCompatProviders(env, msgs, opts, onFailure)).toBe("from cerebras");
    expect(hosts).toEqual(["api.cerebras.ai"]); // groq is skipped while cooling down: no wasted subrequest
  });
  it("treats empty answers, timeouts and auth errors as failures and moves on; OpenRouter gets no JSON mode", async () => {
    const bodies: Record<string, any> = {};
    vi.stubGlobal("fetch", async (url: string, init: any) => {
      const host = new URL(url).host; bodies[host] = JSON.parse(init.body);
      if (host.includes("groq")) return new Response("{}", { status: 401 });
      if (host.includes("cerebras")) throw new Error("The operation timed out");
      return ok("via openrouter");
    });
    const env = { GROQ_API_KEY: "a", CEREBRAS_API_KEY: "b", OPENROUTER_API_KEY: "c", OPENROUTER_MODEL: "custom/model" } as unknown as Env;
    expect(await callCompatProviders(env, msgs, opts, onFailure)).toBe("via openrouter");
    expect(failures.length).toBe(2); expect(bodies["openrouter.ai"].response_format).toBeUndefined(); expect(bodies["openrouter.ai"].model).toBe("custom/model");
  });
  it("returns an empty string when every provider fails", async () => {
    vi.stubGlobal("fetch", async () => new Response("down", { status: 503 }));
    expect(await callCompatProviders({ GROQ_API_KEY: "a", CEREBRAS_API_KEY: "b" } as unknown as Env, msgs, opts, onFailure)).toBe(""); expect(failures.length).toBe(2);
  });
});
