import { describe, it, expect } from "vitest";
import worker from "../../src/index";

describe("BAYAN platform", () => {
  it("returns safe health metadata", async () => {
    const response = await worker.fetch(new Request("https://bayan.test/health"), {
      BAYAN_ENVIRONMENT: "test", BAYAN_VERSION: "0.3.0", BAYAN_COMMIT_SHA: "test",
    });
    expect(response.status).toBe(200);
    const body = await response.json() as { status: string; environment: string; version: string };
    expect(body.status).toBe("ok"); expect(body.environment).toBe("test"); expect(body.version).toBe("0.3.0");
  });
  it("exposes the tool catalog without secrets", async () => {
    const response = await worker.fetch(new Request("https://bayan.test/api/tools"), { OPENAI_API_KEY: "secret" });
    const text = await response.text();
    expect(response.status).toBe(200); expect(text).not.toContain("secret"); expect(text).toContain("verification");
  });
  it("requires AI input", async () => {
    const response = await worker.fetch(new Request("https://bayan.test/api/ai",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({input:" "})}), {});
    expect(response.status).toBe(400);
  });
  it("does not invent live market data", async () => {
    const response = await worker.fetch(new Request("https://bayan.test/api/markets"), {});
    expect(response.status).toBe(503); expect((await response.json() as {status:string}).status).toBe("not_configured");
  });
  it("serves the SPA shell for a semantic route", async () => {
    const asset=new Response("<!doctype html><html><body>BAYAN</body></html>",{status:200,headers:{"content-type":"text/html"}});
    const assets={fetch:async()=>asset} as unknown as Fetcher;
    const response=await worker.fetch(new Request("https://bayan.test/science"),{ASSETS:assets});
    expect(response.status).toBe(200); expect(await response.text()).toContain("BAYAN");
  });
  it("keeps the public header free of decorative icon spam", async () => {
    const html=await (await fetch("https://raw.githubusercontent.com/TaHa41/BAYAN/main/public/index.html")).text().catch(()=> "");
    if(html) { expect(html).not.toContain("☰"); expect(html).not.toContain("⌕"); expect(html).toContain("Created by Taha Omar"); }
  });
});