import { describe, it, expect } from "vitest";
import worker from "../../src/index";

const env = (extra:any = {}) => ({
  ...extra,
  BAYAN_AI_MANAGER_TOKEN: "manager-secret",
});

describe("BAYAN V3 runtime contract", () => {
  it("returns V3 health metadata", async () => {
    const r = await worker.fetch(new Request("https://bayan.test/api/health"), env());
    expect(r.status).toBe(200);
    const b:any = await r.json();
    expect(b.ok).toBe(true);
    expect(b.service).toBe("bayan-v3");
  });

  it("keeps the health compatibility route", async () => {
    const r = await worker.fetch(new Request("https://bayan.test/health"), env());
    expect(r.status).toBe(200);
    expect((await r.json()).ok).toBe(true);
  });

  it("returns the feature contract", async () => {
    const r = await worker.fetch(new Request("https://bayan.test/api/features"), env());
    const b:any = await r.json();
    expect(r.status).toBe(200);
    expect(b.features).toEqual(expect.arrayContaining(["search","articles","news","trends","prices","weather","tools","saved","contribute","admin","telegram","analytics"]));
  });

  it("protects manager endpoints", async () => {
    const denied = await worker.fetch(new Request("https://bayan.test/api/ai/manager/status"), env());
    expect(denied.status).toBe(401);
    const allowed = await worker.fetch(new Request("https://bayan.test/api/ai/manager/status", {
      headers: { authorization: "Bearer manager-secret" }
    }), env());
    expect(allowed.status).toBe(200);
  });

  it("serves semantic routes through the asset shell", async () => {
    const assets = { fetch: async () => new Response("<!doctype html><html><body>BAYAN</body></html>", {
      status: 200, headers: { "content-type": "text/html" }
    }) } as unknown as Fetcher;
    const r = await worker.fetch(new Request("https://bayan.test/science"), env({ASSETS: assets}));
    expect(r.status).toBe(200);
    expect(await r.text()).toContain("BAYAN");
  });

  it("never exposes manager secrets in the public feature response", async () => {
    const r = await worker.fetch(new Request("https://bayan.test/api/features"), env());
    expect(await r.text()).not.toContain("manager-secret");
  });
});
