import { afterEach, describe, expect, it } from "vitest";
import type { Env } from "../src/types";
import { countSubrequests } from "../src/subrequests";

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

describe("subrequest counter for scheduled work", () => {
  it("counts fetch calls, D1 statements and Workers AI calls, passes everything through, and restores fetch", async () => {
    globalThis.fetch = (async () => new Response("ok")) as typeof fetch;
    const base = globalThis.fetch;
    const DB = { prepare: (sql: string) => ({ sql, first: async () => ({ ok: true }) }), batch: async () => [], other: 5 };
    const AI = { run: async (m: string) => ({ response: m }), other: "x" };
    const { env, stats, restore } = countSubrequests({ DB, AI, NEWS_AI_DAILY_LIMIT: "40" } as unknown as Env);
    await fetch("https://a.example"); await fetch("https://b.example");
    const st: any = (env.DB as any).prepare("SELECT 1"); await st.first(); (env.DB as any).prepare("SELECT 2"); await (env.DB as any).batch([]);
    expect(await (env.AI as any).run("m1")).toEqual({ response: "m1" });
    expect(stats).toEqual({ fetch: 2, db: 3, ai: 1 });
    expect((env.DB as any).other).toBe(5); expect((env.AI as any).other).toBe("x"); expect((env as any).NEWS_AI_DAILY_LIMIT).toBe("40");
    restore(); expect(globalThis.fetch).toBe(base);
  });
  it("works without an AI binding", () => {
    const { env, restore } = countSubrequests({ DB: { prepare: () => ({}) } } as unknown as Env);
    expect((env as any).AI).toBeUndefined(); restore();
  });
  it("with a fetch cap, lookups beyond it fail fast like a network error and are not counted, so the AI call keeps its room", async () => {
    let real = 0; globalThis.fetch = (async () => { real++; return new Response("ok"); }) as typeof fetch;
    const { stats, restore } = countSubrequests({ DB: { prepare: () => ({}) } } as unknown as Env, { fetchCap: 3 });
    for (let i = 0; i < 3; i++) await fetch("https://e.example/" + i);
    await expect(fetch("https://e.example/over")).rejects.toThrow("subrequest_budget_reached");
    expect(real).toBe(3); expect(stats.fetch).toBe(3); restore();
  });
});
