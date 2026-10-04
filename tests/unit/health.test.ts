import { describe, it, expect } from "vitest";
import worker from "../../src/index";

describe("BAYAN platform", () => {
  it("returns safe health metadata", async () => {
    const response = await worker.fetch(new Request("https://bayan.test/api/health"), {
      BAYAN_ENVIRONMENT: "test", BAYAN_VERSION: "0.9.0", BAYAN_COMMIT_SHA: "test",
    });
    expect(response.status).toBe(200);
    const body = await response.json() as unknown as { status: string; environment: string; version: string };
    expect(body.status).toBe("ok"); expect(body.environment).toBe("test"); expect(body.version).toBe("0.9.0");
  });
  it("keeps the health section separate from the API health endpoint", async () => {
    const asset=new Response("<!doctype html><html><body>BAYAN health section</body></html>",{status:200,headers:{"content-type":"text/html"}});
    const response=await worker.fetch(new Request("https://bayan.test/health"),{ASSETS:{fetch:async()=>asset} as unknown as Fetcher});
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
  });
  it("exposes the tool catalog without secrets", async () => {
    const response = await worker.fetch(new Request("https://bayan.test/api/tools"), { OPENAI_API_KEY: "secret" });
    const text = await response.text();
    expect(response.status).toBe(200); expect(text).not.toContain("secret"); expect(text).toContain("verification");
  });
  it("exposes advertising configuration without enabling ads by default", async () => {
    const response = await worker.fetch(new Request("https://bayan.test/api/ads/config"), {});
    const body = await response.json() as { enabled: boolean; provider: string | null };
    expect(response.status).toBe(200);
    expect(body.enabled).toBe(false);
    expect(body.provider).toBeNull();
  });
  it("serves a safe ads.txt response when no publisher is configured", async () => {
    const response = await worker.fetch(new Request("https://bayan.test/ads.txt"), {});
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("");
  });
  it("protects diagnostics and never returns secret values", async () => {
    const denied = await worker.fetch(new Request("https://bayan.test/api/diagnostics"), { OPENAI_API_KEY: "secret" });
    expect(denied.status).toBe(403);
    const allowed = await worker.fetch(new Request("https://bayan.test/api/diagnostics", { headers: { authorization: "Bearer manager-secret" } }), {
      BAYAN_AI_MANAGER_TOKEN: "manager-secret",
      OPENAI_API_KEY: "secret",
      SEARCH_PROVIDER: "ceramic",
      AI_SEARCH_INSTANCE: "bayan-knowledge",
      BAYAN_VERSION: "0.9.0",
      BAYAN_COMMIT_SHA: "test"
    });
    expect(allowed.status).toBe(200);
    const body = await allowed.text();
    expect(body).toContain('"status": "ok"');
    expect(body).toContain('"searchProviderChain"');
    expect(body).not.toContain("manager-secret");
    expect(body).not.toContain("secret");
  });
  it("requires AI input", async () => {
    const response = await worker.fetch(new Request("https://bayan.test/api/ai",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({input:" "})}), {});
    expect(response.status).toBe(400);
  });
  it("serves the SPA shell for a semantic route", async () => {
    const asset=new Response("<!doctype html><html><body>BAYAN</body></html>",{status:200,headers:{"content-type":"text/html"}});
    const assets={fetch:async()=>asset} as unknown as Fetcher;
    const response=await worker.fetch(new Request("https://bayan.test/science"),{ASSETS:assets});
    expect(response.status).toBe(200); expect(await response.text()).toContain("BAYAN");
  });
  it("requires an explicit weather city",async()=>{const r=await worker.fetch(new Request("https://bayan.test/api/weather"),{});expect(r.status).toBe(400);});
  it("validates market currency codes",async()=>{const r=await worker.fetch(new Request("https://bayan.test/api/markets?base=bad&quote=EGP"),{});expect(r.status).toBe(400);});
});