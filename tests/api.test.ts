import {describe,it,expect} from "vitest";
import worker from "../src/index";
import {body,json,text} from "../src/http";
import {aiRepairRequest} from "../src/services/repair";
const env={ASSETS:{fetch:async()=>new Response("asset")},DB:{prepare:(sql:string)=>({bind:()=>({all:async()=>({results:[]}),first:async()=>null,run:async()=>({})}),all:async()=>({results:[]}),first:async()=>sql.trim().startsWith("SELECT 1 AS ready")?{ready:1}:null,run:async()=>({})}),batch:async()=>[]}} as any;
describe("BAYAN public page routing",()=>{
  it("renders the public homepage instead of returning no response",async()=>{
    const r=await worker.fetch(new Request("https://bayan.test/"),env);
    expect(r).toBeDefined();
    if(!r)throw new Error("homepage request returned no response");
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toContain("text/html");
    const html=await r.text();
    expect(html).toContain("<html lang=");
    expect(html).toContain("المعلومة أولًا.");
  });
});

describe("BAYAN API",()=>{
  it("health",async()=>{
    const r=await worker.fetch(new Request("https://bayan.test/api/health"),env);
    expect(r).toBeDefined();
    if(!r) throw new Error("health request returned no response");
    const d=await r.json() as any;
    expect(r.status).toBe(200);
    expect(d.ok).toBe(true);
    expect(d.database).toBe(true);
  });
  it("JSON API responses include browser security headers",()=>{
    const r=json({ok:true});
    expect(r.headers.get("x-content-type-options")).toBe("nosniff");
    expect(r.headers.get("x-frame-options")).toBe("DENY");
    expect(r.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    expect(r.headers.get("permissions-policy")).toContain("geolocation=()");
  });
  it("text responses include browser security headers",()=>{
    const r=text("robots");
    expect(r.headers.get("x-content-type-options")).toBe("nosniff");
    expect(r.headers.get("x-frame-options")).toBe("DENY");
  });
  it("JSON body parser accepts valid small payloads",async()=>{
    const r=new Request("https://bayan.test/api/test",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({ok:true})});
    await expect(body<{ok:boolean}>(r)).resolves.toEqual({ok:true});
  });
  it("JSON body parser rejects declared oversized payloads",async()=>{
    const r=new Request("https://bayan.test/api/test",{method:"POST",headers:{"content-type":"application/json"},body:"x".repeat(65537)});
    await expect(body(r)).resolves.toBeNull();
  });
  it("search validates query",async()=>{
    const r=await worker.fetch(new Request("https://bayan.test/api/search"),env);
    expect(r).toBeDefined();
    if(!r) throw new Error("search request returned no response");
    expect(r.status).toBe(400);
  });
  it("protects all admin routes without a manager token",async()=>{
    for(const path of ["/api/admin/runtime","/api/admin/ai-repair","/api/admin/article","/api/admin/settings"]){
      const r=await worker.fetch(new Request("https://bayan.test"+path,{method:path.endsWith("/ai-repair")||path.endsWith("/article")?"POST":"GET"}),env);
      expect(r).toBeDefined();
      if(!r) throw new Error(`admin request returned no response: ${path}`);
      expect(r.status).toBe(401);
    }
  });
});

describe("BAYAN AI admin diagnosis safety",()=>{
  it("keeps AI diagnosis read-only and does not persist the raw problem",async()=>{
    const sql:string[]=[];
    const safeEnv={
      DB:{prepare:(statement:string)=>{sql.push(statement);return {bind:()=>({all:async()=>({results:[]}),first:async()=>null,run:async()=>({})}),all:async()=>({results:[]}),first:async()=>null,run:async()=>({})}}},
    } as any;
    const result=await aiRepairRequest(safeEnv,"Test incident with private details") as any;
    expect(result.ok).toBe(true);
    expect(result.mode).toBe("read_only");
    expect(result.health.verification).toBe("read_only_not_verified");
    expect(result.health.actions).toEqual([]);
    expect(sql.some((statement)=>statement.trim().toUpperCase().startsWith("UPDATE ")||statement.trim().toUpperCase().startsWith("DELETE "))).toBe(false);
    expect(sql.some((statement)=>statement.trim().toUpperCase().startsWith("UPDATE ")||statement.trim().toUpperCase().startsWith("DELETE "))).toBe(false);
    expect(sql.some((statement)=>statement.includes("Test incident with private details"))).toBe(false);
  });
});
