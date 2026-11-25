import { describe, expect, it, vi } from "vitest";
import {
  NEURON_COUNTER_KEY, createWorkersAiMeter, estimateCallNeurons, estimateTokens, neuronBudget, neuronCaps, neuronsFor, neuronsFromResponse,
  nextPacificMidnight, nextUtcMidnight, utcDay,
} from "../src/services/ai-budget";
import { anyAiProviderUsable, runWorkersAi } from "../src/services/ai";
import { classifyWorkersAIFailure, quotaResetAt, updateProviderBreaker } from "../src/services/ai-provider-resilience";

const L70 = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const M24 = "@cf/mistralai/mistral-small-3.1-24b-instruct";
const L8 = "@cf/meta/llama-3.1-8b-instruct-fp8";
const iso = (value: string) => Date.parse(value);

// DB fake: the meter's counter row and breaker rows are looked up by the bound key.
const dbWith = (rows: Record<string, string>, opts: { throws?: boolean } = {}) => ({
  prepare: () => ({
    bind: (key: string) => ({
      first: async () => { if (opts.throws) throw new Error("d1 down"); return key in rows ? { value: rows[key] } : null; },
      run: async () => ({ meta: { changes: 1 } }),
    }),
  }),
});
const today = () => utcDay();

describe("neuron costs (Cloudflare pricing, neurons per million tokens)", () => {
  it("prices the same article call very differently per model", () => {
    expect(neuronsFor(L70, 5000, 2500)).toBe(646);   // 133.3 in + 512.0 out
    expect(neuronsFor(L8, 5000, 2500)).toBe(135);    // 68.9 in + 65.3 out
    expect(neuronsFor(M24, 5000, 2500)).toBe(286);   // 159.4 in + 126.2 out
    // The expensive part of a 70B draft is its output: ~8x the 8B output rate.
    expect(neuronsFor(L70, 0, 1_000_000) / neuronsFor(L8, 0, 1_000_000)).toBeGreaterThan(7);
  });

  it("meters an unlisted model at the most expensive text rate so unknown spending is never hidden", () => {
    expect(neuronsFor("@cf/vendor/unknown-model", 5000, 2500)).toBe(neuronsFor(L70, 5000, 2500));
  });

  it("estimates more tokens for Arabic than for Latin text of the same length", () => {
    expect(estimateTokens("ب".repeat(1000))).toBeGreaterThan(estimateTokens("a".repeat(1000)));
    expect(estimateTokens("")).toBe(0);
  });

  it("uses the provider's own usage numbers when present and an estimate otherwise", () => {
    const input = { messages: [{ role: "user", content: "x".repeat(3500) }], max_tokens: 100 };
    expect(neuronsFromResponse(L70, input, { usage: { prompt_tokens: 1000, completion_tokens: 500 } }, "ignored")).toBe(neuronsFor(L70, 1000, 500));
    expect(neuronsFromResponse(L70, input, { response: "ok" }, "o".repeat(350))).toBe(neuronsFor(L70, 1000, 100));
    expect(estimateCallNeurons(L70, input)).toBe(neuronsFor(L70, 1000, 70));
  });
});

describe("reset times", () => {
  it("Workers AI neurons reset at 00:00 UTC", () => {
    expect(nextUtcMidnight(iso("2026-11-25T06:20:00Z"))).toBe(iso("2026-11-26T00:01:00Z"));
  });
  it("Gemini daily quota resets at midnight Pacific time, in winter and summer and across the DST change", () => {
    expect(nextPacificMidnight(iso("2026-11-25T06:20:00Z"))).toBe(iso("2026-11-25T08:01:00Z")); // PST, UTC-8
    expect(nextPacificMidnight(iso("2026-07-10T03:00:00Z"))).toBe(iso("2026-07-10T07:01:00Z")); // PDT, UTC-7
    expect(nextPacificMidnight(iso("2026-11-01T05:00:00Z"))).toBe(iso("2026-11-01T07:01:00Z")); // before the fall-back change
    expect(nextPacificMidnight(iso("2026-11-01T09:30:00Z"))).toBe(iso("2026-11-02T08:01:00Z")); // after it
  });
  it("breakers reopen at the provider's real reset instead of a flat six hours (bounded to 15 min - 26 h)", () => {
    const now = iso("2026-11-25T06:20:00Z");
    expect(quotaResetAt("workers_ai", now)).toBe(nextUtcMidnight(now));
    expect(quotaResetAt("gemini", now)).toBe(nextPacificMidnight(now));
    expect(quotaResetAt("openai", now)).toBe(now + 6 * 3600_000);
    // a reset a few minutes away is stretched to the 15-minute floor
    expect(quotaResetAt("workers_ai", iso("2026-11-25T23:58:00Z"))).toBe(iso("2026-11-25T23:58:00Z") + 15 * 60_000);
  });
  it("opens the Workers AI breaker until the next UTC midnight on a 4006 neuron failure, and rate limits stay short", async () => {
    const now = iso("2026-11-25T06:20:00Z");
    const env = { DB: dbWith({}) } as any;
    const quota = await updateProviderBreaker(env, "workers_ai", classifyWorkersAIFailure(new Error("4006: you have used up your daily free allocation of 10,000 neurons")), now);
    expect(quota).toMatchObject({ open: true, code: "quota_exceeded", openedUntil: nextUtcMidnight(now) });
    const gemini = await updateProviderBreaker(env, "gemini", { provider: "gemini", code: "quota_exceeded", detail: "daily" }, now);
    expect(gemini.openedUntil).toBe(nextPacificMidnight(now));
    // a single per-minute 429 does not open anything
    const rate = await updateProviderBreaker(env, "gemini", { provider: "gemini", code: "rate_limited", status: 429, retryAfterMs: 37_000, detail: "minute" }, now);
    expect(rate.open).toBe(false);
  });
});

describe("daily neuron budget", () => {
  it("caps background drafting at 70% and visitors at 92% of the day, and honours a paid-plan override", () => {
    expect(neuronCaps({})).toEqual({ total: 10_000, background: 7000, foreground: 9200 });
    expect(neuronCaps({ WORKERS_AI_NEURON_BUDGET: "100000" })).toEqual({ total: 100_000, background: 70_000, foreground: 92_000 });
    expect(neuronCaps({ WORKERS_AI_NEURON_BUDGET: "12" })).toEqual({ total: 10_000, background: 7000, foreground: 9200 });
  });
  it("reports used, remaining and the reset, and treats a stale day as zero", async () => {
    const live = await neuronBudget({ DB: dbWith({ [NEURON_COUNTER_KEY]: today() + ":6500" }) } as any, "background");
    expect(live).toMatchObject({ used: 6500, cap: 7000, remaining: 500, allowed: true, known: true });
    const full = await neuronBudget({ DB: dbWith({ [NEURON_COUNTER_KEY]: today() + ":7000" }) } as any, "background");
    expect(full).toMatchObject({ remaining: 0, allowed: false });
    // visitors keep their reserve after background drafting stopped
    const visitor = await neuronBudget({ DB: dbWith({ [NEURON_COUNTER_KEY]: today() + ":7000" }) } as any, "foreground");
    expect(visitor).toMatchObject({ remaining: 2200, allowed: true });
    const stale = await neuronBudget({ DB: dbWith({ [NEURON_COUNTER_KEY]: "2020-01-01:9999" }) } as any, "background");
    expect(stale).toMatchObject({ used: 0, remaining: 7000 });
  });
  it("fails open when the counter cannot be read (the provider's own quota still protects the account)", async () => {
    const b = await neuronBudget({ DB: dbWith({}, { throws: true }) } as any, "background");
    expect(b).toMatchObject({ known: false, allowed: true });
  });
  it("lets the large model run only while the budget covers several of its calls", async () => {
    const used = 7000 - 1500;                               // 1500 neurons remain for background work
    const meter = createWorkersAiMeter({ DB: dbWith({ [NEURON_COUNTER_KEY]: today() + ":" + used }) } as any, "background");
    const est70 = 646, est24 = 286;
    expect(await meter.allow(L70, est70)).toBe(false);      // needs 3 x 646 = 1938
    expect(await meter.allow(M24, est24)).toBe(true);
    expect(await meter.allow(L8, 135)).toBe(true);
  });
});

describe("runWorkersAi with the meter", () => {
  const input = { messages: [{ role: "user", content: "x".repeat(17_500) }], max_tokens: 3600 };
  const aiReturning = (calls: string[]) => ({ run: vi.fn(async (model: string) => { calls.push(model); return { response: "text", usage: { prompt_tokens: 5000, completion_tokens: 2500 } }; }) });

  it("tries 70B first for drafts while the budget is comfortable and charges the real usage", async () => {
    const calls: string[] = [], charged: number[] = [];
    const meter = { allow: async () => true, charge: async (_m: string, n: number) => { charged.push(n); } };
    await runWorkersAi({ AI: aiReturning(calls) } as any, input, true, meter);
    expect(calls).toEqual([L70]);
    expect(charged).toEqual([646]);
  });
  it("skips 70B when it no longer fits and uses the 24B model before the weak 8B one", async () => {
    const calls: string[] = [];
    const meter = { allow: async (model: string) => model !== L70, charge: async () => {} };
    await runWorkersAi({ AI: aiReturning(calls) } as any, input, true, meter);
    expect(calls).toEqual([M24]);
  });
  it("does not call the provider at all when nothing fits, and the error does not open the quota breaker", async () => {
    const calls: string[] = [];
    const meter = { allow: async () => false, charge: async () => {} };
    const error: any = await runWorkersAi({ AI: aiReturning(calls) } as any, input, true, meter).catch((e) => e);
    expect(calls).toEqual([]);
    expect(String(error.message)).toMatch(/workers_ai_budget_exhausted/);
    expect(classifyWorkersAIFailure(error).code).toBe("budget_exhausted");
  });
  it("keeps the old order and behavior without a meter (probe and self-heal calls)", async () => {
    const calls: string[] = [];
    await runWorkersAi({ AI: aiReturning(calls) } as any, input, false);
    expect(calls).toEqual([L8]);
  });
});

describe("pre-flight honours the background neuron budget", () => {
  it("skips background drafting when only Workers AI is available and its background share is spent", async () => {
    const spent = { AI: {}, DB: dbWith({ [NEURON_COUNTER_KEY]: today() + ":7000" }) } as any;
    const left = { AI: {}, DB: dbWith({ [NEURON_COUNTER_KEY]: today() + ":6999" }) } as any;
    expect(await anyAiProviderUsable(spent)).toBe(false);
    expect(await anyAiProviderUsable(left)).toBe(true);
  });
  it("does not let a spent Workers AI budget block another usable provider", async () => {
    const env = { AI: {}, GROQ_API_KEY: "k", DB: dbWith({ [NEURON_COUNTER_KEY]: today() + ":9999" }) } as any;
    expect(await anyAiProviderUsable(env)).toBe(true);
  });
});
