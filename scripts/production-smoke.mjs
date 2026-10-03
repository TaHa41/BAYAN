const base=(process.env.BAYAN_URL||"https://bayan.tahaomar411.workers.dev").replace(/\/$/,"");
const checks=[
  ["/","text/html"],["/health","application/json"],["/api/features","application/json"],["/api/trending","application/json"],["/api/gold","application/json"],
  ["/egypt","text/html"],["/science","text/html"],["/technology","text/html"],["/news","text/html"],
  ["/prices","text/html"],["/search","text/html"],["/ai","text/html"],["/saved","text/html"],["/manifest.json","application/json"],["/sw.js","application/javascript"],["/sitemap.xml","application/xml"],["/robots.txt","text/plain"]
];
let failed=0;
for(const [path,type] of checks){
  try{
    const res=await fetch(base+path,{redirect:"follow"});
    const body=await res.text();
    const ct=res.headers.get("content-type")||"";
    const html=type==="text/html";
    const nonblank=body.trim().length>0;
    const notError=!html||(!/Internal Server Error|Unhandled exception|Cannot read properties|undefined is not/i.test(body));
    const ok=res.ok&&nonblank&&ct.includes(type.split(";")[0])&&notError;
    console.log(`${ok?"PASS":"FAIL"} ${res.status} ${path} bytes=${body.length} type=${ct}`);
    if(!ok)failed++;
  }catch(e){console.log(`FAIL ${path} ${e.message}`);failed++;}
}
try{
  const res=await fetch(base+"/api/search/article?q="+encodeURIComponent("ما هو الذكاء الاصطناعي؟")+"&lang=ar",{redirect:"follow"});
  const body=await res.text();
  const ok=(res.status===200 && body.includes('"status": "ok"') && body.includes('"article"')) || [503,502].includes(res.status);
  console.log((ok?"PASS":"FAIL")+" "+res.status+" /api/search/article bytes="+body.length+" type="+(res.headers.get("content-type")||""));
  if(!ok)failed++;
}catch(e){console.log("FAIL /api/search/article "+e.message);failed++;}

// Deep contract checks for the endpoints that can appear healthy while returning the wrong payload.
try{
  const health=await fetch(base+"/health",{redirect:"follow"});
  const data=await health.json();
  const ok=health.ok && data?.status==="ok" && !!data?.service && !!data?.version && !!data?.commit &&
    health.headers.get("x-content-type-options")==="nosniff";
  console.log((ok?"PASS":"FAIL")+" /health contract commit="+String(data?.commit||"").slice(0,12));
  if(!ok) failed++;
}catch(e){console.log("FAIL /health contract "+e.message);failed++;}
try{
  const home=await fetch(base+"/",{redirect:"follow"});
  const html=await home.text();
  const ok=home.ok && /<link rel="canonical"/i.test(html) && /name="robots"/i.test(html) &&
    /hreflang="en"/i.test(html) && /id="app"/i.test(html);
  console.log((ok?"PASS":"FAIL")+" / HTML SEO/security contract");
  if(!ok) failed++;
}catch(e){console.log("FAIL / HTML SEO/security contract "+e.message);failed++;}
try{
  const features=await (await fetch(base+"/api/features",{redirect:"follow"})).json();
  const f=features?.features||{};
  const ok=f.pwa===true && f.savedArticles===true && f.selfHealing===true && f.runtimeAudit===true && f.sourceAwareAI===true;
  console.log((ok?"PASS":"FAIL")+" /api/features capability contract");
  if(!ok) failed++;
}catch(e){console.log("FAIL /api/features capability contract "+e.message);failed++;}
if(failed){console.error(`Production smoke failed: ${failed}`);process.exit(1);}
console.log("Production smoke passed.");
