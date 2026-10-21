import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "../src/index";
import { resetD1GuardForTests } from "../src/services/d1-guard";

const quotaError = () => new Error("D1_ERROR: free tier daily row read limit exceeded");

const quotaEnv = (aiRun = vi.fn(async () => ({ response: "A source-based summary." }))) => {
  const statement = {
    bind() { return statement; },
    all: async () => { throw quotaError(); },
    first: async () => { throw quotaError(); },
    run: async () => { throw quotaError(); },
  };
  return {
    DB: {
      prepare: () => statement,
      batch: async () => { throw quotaError(); },
    },
    ASSETS: { fetch: async () => new Response("asset") },
    AI: { run: aiRun },
  } as any;
};

afterEach(() => {
  vi.unstubAllGlobals();
  resetD1GuardForTests();
});

describe("Ask BAYAN during D1 quota exhaustion", () => {
  it("keeps external evidence recovery available and explicitly marks the response degraded", async () => {
    const aiRun = vi.fn(async () => ({ response: "Quantum computing uses quantum mechanics to process information." }));
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("wikipedia.org/w/api.php")) {
        return new Response(JSON.stringify({ query: { pages: { "1": {
          title: "Quantum computing",
          extract: "Quantum computing uses quantum mechanics to process information and solve certain computational problems.",
        } } } }), { status: 200, headers: { "content-type": "application/json" } });
      }
      return new Response("upstream unavailable", { status: 503 });
    }));
    const response = await worker.fetch(new Request("https://bayan.test/api/ask?lang=en", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question: "What is quantum computing?" }),
    }), quotaEnv(aiRun));
    const payload = await response.json() as any;
    expect(response.status).toBe(200);
    expect(response.headers.get("x-bayan-degraded")).toBe("d1_quota");
    expect(payload.degraded).toBe(true);
    expect(payload.reason).toBe("d1_quota");
    expect(payload.evidence.length).toBeGreaterThan(0);
  });

  it("does not invent an AI answer when every external provider fails", async () => {
    const aiRun = vi.fn(async () => ({ response: "This should not be called without evidence." }));
    vi.stubGlobal("fetch", vi.fn(async () => new Response("upstream unavailable", { status: 503 })));
    const response = await worker.fetch(new Request("https://bayan.test/api/ask?lang=en", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question: "What is quantum computing?" }),
    }), quotaEnv(aiRun));
    const payload = await response.json() as any;
    expect(response.status).toBe(200);
    expect(payload.degraded).toBe(true);
    expect(payload.reason).toBe("d1_quota");
    expect(payload.searchStatus).toBe("insufficient");
    expect(payload.evidence).toEqual([]);
    expect(payload.answer).toContain("could not find enough reliable results");
    expect(aiRun).not.toHaveBeenCalled();
  });
});
