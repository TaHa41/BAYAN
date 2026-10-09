import {describe,it,expect} from "vitest";
import worker from "../src/index";
import {body,json,text} from "../src/http";
const env={ASSETS:{fetch:async()=>new Response("asset")},DB:{prepare:()=>({bind:()=>({all:async()=>({results:[]}),first:async()=>null,run:async()=>({})})}),batch:async()=>[]}} as any;
describe("BAYAN API",()=>{
  it("health",async()=>{
    const r=await worker.fetch(new Request("https://bayan.test/api/health"),env);
    const d=await r.json() as any;
    expect(r.status).toBe(200);
    expect(d.ok).toBe(true);
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
    const r=new Request("https://bayan.test/api/test",{method:"POST",headers:{"content-type":"application/json","content-length":"65537"},body:"{}"});
    await expect(body(r)).resolves.toBeNull();
  });
  it("search validates query",async()=>{
    const r=await worker.fetch(new Request("https://bayan.test/api/search"),env);
    expect(r.status).toBe(400);
  });
  it("protects all admin routes without a manager token",async()=>{
    for(const path of ["/api/admin/runtime","/api/admin/ai-repair","/api/admin/article","/api/admin/settings"]){
      const r=await worker.fetch(new Request("https://bayan.test"+path,{method:path.endsWith("/ai-repair")||path.endsWith("/article")?"POST":"GET"}),env);
      expect(r.status).toBe(401);
    }
  });
});
