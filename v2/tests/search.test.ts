import { describe, expect, it } from "vitest";
import { searchAll, urlKey, type Hit, type Provider } from "../src/search";

const hit = (url: string, score = 1): Hit => ({ title: "T " + url, summary: "s", url, publisher: "p", score });
const ok = (name: string, hits: Hit[]): Provider => ({ name, run: async () => hits });
const fast = { backoffMs: 0, timeoutMs: 200 };

describe("searchAll", () => {
  it("keeps results when one provider throws, and reports why", async () => {
    const bad: Provider = { name: "bad", run: async () => { throw new Error("boom"); } };
    const out = await searchAll("q", [bad, ok("good", [hit("https://bbc.com/a")])], fast);
    expect(out.hits).toHaveLength(1);
    expect(out.providers.find((p) => p.name === "bad")).toMatchObject({ ok: false, error: "boom", attempts: 2 });
    expect(out.providers.find((p) => p.name === "good")?.ok).toBe(true);
  });
  it("retries a flaky provider before giving up", async () => {
    let calls = 0;
    const flaky: Provider = { name: "flaky", run: async () => { if (++calls === 1) throw new Error("once"); return [hit("https://cnn.com/a")]; } };
    const out = await searchAll("q", [flaky], fast);
    expect(out.hits).toHaveLength(1);
    expect(out.providers[0]).toMatchObject({ ok: true, attempts: 2 });
  });
  it("times out a hanging provider without blocking the others", async () => {
    const hang: Provider = { name: "hang", run: (_q, signal) => new Promise((_res, rej) => signal.addEventListener("abort", () => rej(new Error("aborted")))) };
    const out = await searchAll("q", [hang, ok("good", [hit("https://bbc.com/a")])], { backoffMs: 0, timeoutMs: 30, retries: 0 });
    expect(out.hits).toHaveLength(1);
    expect(out.providers.find((p) => p.name === "hang")?.error).toBe("timeout");
  });
  it("de-duplicates the same URL across providers (utm, www, trailing slash) keeping the best score", async () => {
    const out = await searchAll("q", [ok("a", [hit("https://www.bbc.com/a/?utm_source=x", 1)]), ok("b", [hit("https://bbc.com/a", 5)])], fast);
    expect(out.hits).toHaveLength(1);
    expect(out.hits[0].score).toBe(5);
    expect(urlKey("https://WWW.bbc.com/a/#frag")).toBe(urlKey("https://bbc.com/a"));
  });
  it("returns an honest 'insufficient' with no hits when every provider fails", async () => {
    const bad: Provider = { name: "bad", run: async () => { throw new Error("down"); } };
    const out = await searchAll("q", [bad], fast);
    expect(out.hits).toEqual([]);
    expect(out.verdict).toBe("insufficient");
  });
});
