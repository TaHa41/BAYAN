const base=(process.env.BAYAN_URL||"https://bayan.tahaomar411.workers.dev").replace(/\/$/,"");
const checks=[
  ["/","text/html"],["/api/health","application/json"],["/health","application/json"],["/api/features","application/json"],["/api/trending","application/json"],["/api/gold","application/json"],
  ["/egypt","text/html"],["/arab","text/html"],["/world","text/html"],["/science","text/html"],["/economy","text/html"],["/politics","text/html"],["/technology","text/html"],["/history-culture","text/html"],["/people","text/html"],["/sports","text/html"],["/travel","text/html"],["/arts","text/html"],["/news","text/html"],["/trending","text/html"],
  ["/prices","text/html"],["/tools","text/html"],["/search","text/html"],["/ai","text/html"],["/saved","text/html"],["/contribute","text/html"],["/review","text/html"],["/manifest.json","application/json"],["/manifest.en.json","application/json"],["/sw.js","text/javascript"],["/sitemap.xml","application/xml"],["/robots.txt","text/plain"]
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

try{
  const englishSearch=await fetch(base+"/api/search?q="+encodeURIComponent("What is artificial intelligence?")+"&lang=en",{redirect:"follow"});
  const data=await englishSearch.json();
  const ok=englishSearch.ok && data?.status==="ok" && data?.research?.queries?.length>=3;
  console.log((ok?"PASS":"FAIL")+" /api/search English research depth");
  if(!ok) failed++;
}catch(e){console.log("FAIL /api/search English research depth "+e.message);failed++;}
try{
  const weather=await fetch(base+"/api/search?q="+encodeURIComponent("طقس الغردقة")+"&lang=ar",{redirect:"follow"});
  const data=await weather.json();
  const ok=weather.ok && data?.intent==="weather" && data?.weather?.city;
  console.log((ok?"PASS":"FAIL")+" /api/search weather routing");
  if(!ok) failed++;
}catch(e){console.log("FAIL /api/search weather routing "+e.message);failed++;}

// Deep contract checks for the endpoints that can appear healthy while returning the wrong payload.
try{
  const health=await fetch(base+"/api/health",{redirect:"follow"});
  const data=await health.json();
  const ok=health.ok && data?.status==="ok" && !!data?.service && !!data?.version && !!data?.commit &&
    health.headers.get("x-content-type-options")==="nosniff";
  console.log((ok?"PASS":"FAIL")+" /health contract commit="+String(data?.commit||"").slice(0,12));
  if(!ok) failed++;
}catch(e){console.log("FAIL /health contract "+e.message);failed++;}
try{
  const toolsPage=await fetch(base+"/tools",{redirect:"follow"});
  const toolsHtml=await toolsPage.text();
  const ok=toolsPage.ok && /BAYAN TOOLS|أدوات بيان|Weather|الطقس/i.test(toolsHtml);
  console.log((ok?"PASS":"FAIL")+" /tools page");
  if(!ok) failed++;
}catch(e){console.log("FAIL /tools page "+e.message);failed++;}

try{
  const home=await fetch(base+"/",{redirect:"follow"});
  const html=await home.text();
  const tags=[...html.matchAll(/<link\b[^>]*>/gi)].map(m=>m[0]);
  const meta=[...html.matchAll(/<meta\b[^>]*>/gi)].map(m=>m[0]);
  const hasCanonical=tags.some(t=>/\brel=["']canonical["']/i.test(t)&&/\bhref=["'][^"']+["']/i.test(t));
  const hasHreflang=tags.some(t=>/\bhreflang=["'](?:ar|en|x-default)["']/i.test(t)&&/\bhref=["'][^"']+["']/i.test(t));
  const hasRobots=meta.some(t=>/\bname=["']robots["']/i.test(t)&&/\bcontent=["'][^"']+["']/i.test(t));
  const ok=home.ok && hasCanonical && hasHreflang && hasRobots && /id=["']app["']/i.test(html);
  console.log((ok?"PASS":"FAIL")+" / HTML SEO/security contract");
  if(!ok) console.log("SEO_DEBUG", JSON.stringify({links:tags,metaRobots:meta.filter(t=>/name=["']robots["']/i.test(t)),head:html.slice(0,3200)}));
  if(!ok) failed++;
}catch(e){console.log("FAIL / HTML SEO/security contract "+e.message);failed++;}
try{
  const appJs=await (await fetch(base+"/app.js",{redirect:"follow"})).text();
  const routerOk=/function renderRoute\(routePath\)/.test(appJs) && /safeRenderRoute\(path\)/.test(appJs) && /function savedPage\(\)/.test(appJs) && /function toolsPage\(\)/.test(appJs);
  const ok=/querySelector\("#language"\)/.test(appJs) &&
    /addEventListener\("click"/.test(appJs) &&
    /searchParams\.set\("lang",isEn\?"ar":"en"\)/.test(appJs) &&
    /isEn=/.test(appJs) && routerOk;
  console.log((ok?"PASS":"FAIL")+" frontend language-switch contract");
  if(!ok) failed++;
}catch(e){console.log("FAIL frontend language-switch contract "+e.message);failed++;}
try{
  const en=await fetch(base+"/?lang=en",{redirect:"follow"});
  const html=await en.text();
  const links=[...html.matchAll(/<link\b[^>]*>/gi)].map(m=>m[0]);
  const hasEnCanonical=links.some(t=>/\brel=["']canonical["']/i.test(t)&&/\bhref=["'][^"']*\?lang=en["']/i.test(t));
  const hasArAlternate=links.some(t=>/\bhreflang=["']ar["']/i.test(t)&&/\bhref=["'][^"']+["']/i.test(t));
  const hasEnAlternate=links.some(t=>/\bhreflang=["']en["']/i.test(t)&&/\bhref=["'][^"']*\?lang=en["']/i.test(t));
  const ok=en.ok && /<html[^>]+lang=["']en["'][^>]+dir=["']ltr["']/i.test(html) && hasEnCanonical && hasArAlternate && hasEnAlternate;
  console.log((ok?"PASS":"FAIL")+" English SEO/language contract");
  if(!ok) console.log("EN_SEO_DEBUG", JSON.stringify({links,head:html.slice(0,3200)}));
  if(!ok) failed++;
}catch(e){console.log("FAIL frontend language-switch contract "+e.message);failed++;}
try{
  const englishRoutes=["/","/egypt","/science","/technology","/news","/prices","/tools","/about","/methodology","/search","/ai","/saved","/contribute"];
  for(const route of englishRoutes){
    const response=await fetch(base+route+"?lang=en",{redirect:"follow"});
    const html=await response.text();
    const manifestIsEnglish=html.includes('href="/manifest.en.json"') || html.includes("href='/manifest.en.json'");
    const htmlLanguageOk=/<html[^>]+lang=["']en["'][^>]+dir=["']ltr["']/i.test(html);
    const titleMatch=html.match(/<title>([^<]+)<\/title>/i);
    const titleText=titleMatch?.[1]||"";
    const titleOk=titleText.length>0 && /[A-Za-z]/.test(titleText) && !/[\u0600-\u06FF]/.test(titleText);
    const forbiddenShell=["بيان","بحث","المظهر","القائمة","التنقل الرئيسي","ماذا تريد أن تعرف؟","عن بيان","المنهجية","ساهم بمعلومة","الخصوصية","الشروط","تواصل","المحفوظات","أدوات بيان","إدارة بيان","المعلومة أولًا. الدليل قبل الادعاء."];
    const shellLeaks=forbiddenShell.filter((value)=>html.includes(value));
    const visibleHtml=html.replace(/<script[\s\S]*?<\/script>/gi,"").replace(/<style[\s\S]*?<\/style>/gi,"");
    const visibleArabic=/[\u0600-\u06FF]/.test(visibleHtml);
    const visibleArabicContext=(visibleHtml.match(/.{0,100}[\u0600-\u06FF].{0,100}/)||[])[0]||null;
    const jsonLdArabic=[...html.matchAll(/<script[^>]+type=["\']application\/ld\+json["\'][^>]*>([\s\S]*?)<\/script>/gi)].some((m)=>/[\u0600-\u06FF]/.test(m[1]||""));
    const englishFooterLinks=[...html.matchAll(/<a[^>]+href="([^"]+\?lang=en)"[^>]*>/gi)].map((m)=>m[1]);
    const footerLinksOk=["/about?lang=en","/methodology?lang=en","/contribute?lang=en","/privacy?lang=en","/terms?lang=en","/contact?lang=en","/saved?lang=en","/tools?lang=en","/review?lang=en"].every((x)=>englishFooterLinks.includes(x));
    const shellLeak=shellLeaks.length>0 || visibleArabic || jsonLdArabic;
    const ok=response.ok && htmlLanguageOk && manifestIsEnglish && titleOk && !shellLeak && footerLinksOk;
    console.log((ok?"PASS":"FAIL")+" English route "+route);
    if(!ok) console.log("EN_ROUTE_DEBUG",JSON.stringify({route,status:response.status,htmlLanguageOk,manifestIsEnglish,titleOk,shellLeaks,visibleArabic,jsonLdArabic,visibleArabicContext,footerLinksOk,head:html.slice(0,1200)}));
    if(!ok) failed++;
  }
}catch(e){console.log("FAIL English route coverage "+e.message);failed++;}
try{
  const features=await (await fetch(base+"/api/features",{redirect:"follow"})).json();
  const f=features?.features||{};
  const ok=f.pwa===true && f.savedArticles===true && f.selfHealing===true && f.runtimeAudit===true && f.sourceAwareAI===true;
  console.log((ok?"PASS":"FAIL")+" /api/features capability contract");
  if(!ok) failed++;
}catch(e){console.log("FAIL /api/features capability contract "+e.message);failed++;}

async function contractGet(path, validator, label){
  try{
    const response=await fetch(base+path,{redirect:"follow"});
    const data=await response.json().catch(()=>null);
    const ok=validator(response,data);
    console.log((ok?"PASS":"FAIL")+" "+label+" status="+response.status);
    if(!ok) failed++;
  }catch(e){console.log("FAIL "+label+" "+e.message);failed++;}
}
const publicApiContracts=[
  ["/api/tools",(r,d)=>r.ok&&d?.tools?.includes("search"),"API tools contract"],
  ["/api/ads/config",(r,d)=>r.ok&&typeof d?.enabled==="boolean","API ads contract"],
  ["/api/features",(r,d)=>r.ok&&d?.features?.pwa===true,"API features contract"],
  ["/api/search/compare?q="+encodeURIComponent("ما هي عاصمة مصر؟")+"&lang=ar",(r,d)=>r.ok&&d?.status==="ok"&&Array.isArray(d?.sources)&&d.sources.length>=2,"API source comparison contract"],
  ["/api/knowledge?lang=en&limit=3",(r,d)=>r.ok&&d?.status==="ok"&&Array.isArray(d?.articles),"API English knowledge contract"],
  ["/api/knowledge/graph?limit=3",(r,d)=>r.ok&&d?.status==="ok"&&Array.isArray(d?.nodes)&&Array.isArray(d?.edges)&&d.nodes.length>=0,"API knowledge graph contract"],
  ["/api/saved?visitorId=smoke-contract&lang=en",(r,d)=>r.ok&&d?.status==="ok"&&Array.isArray(d?.articles),"API saved contract"],
  ["/api/article/history?slug=smoke-contract",(r,d)=>r.ok&&d?.status==="ok"&&Array.isArray(d?.revisions),"API history contract"],
  ["/api/notifications?visitorId=smoke-contract",(r,d)=>r.ok&&d?.status==="ok"&&Array.isArray(d?.topics),"API notifications contract"],
  ["/api/news?lang=en",(r,d)=>[200,503].includes(r.status)&&Array.isArray(d?.articles),"API English news contract"],
  ["/api/trending?lang=en",(r,d)=>[200,503].includes(r.status)&&Array.isArray(d?.signals),"API English trending contract"],
  ["/api/maps/config",(r,d)=>[200,503].includes(r.status)&&typeof d?.status==="string","API maps contract"],
  ["/api/weather?city=Cairo",(r,d)=>[200,404,502].includes(r.status)&&typeof d?.status==="string","API weather contract"],
  ["/api/markets?base=USD&quote=EGP",(r,d)=>[200,404,502].includes(r.status)&&typeof d?.status==="string","API FX contract"],
  ["/api/images?q=cat",(r,d)=>[200,502].includes(r.status)&&typeof d?.status==="string","API image contract"]
];
for(const [path,validator,label] of publicApiContracts) await contractGet(path,validator,label);

const protectedApiContracts=[
  "/api/diagnostics","/api/analytics","/api/knowledge/searches","/api/requests/review","/api/contributions/review",
  "/api/ai/manager/repairs","/api/ai/manager/status"
];
for(const path of protectedApiContracts){
  try{
    const response=await fetch(base+path,{redirect:"follow"});
    const ok=response.status===403;
    console.log((ok?"PASS":"FAIL")+" protected route "+path+" status="+response.status);
    if(!ok) failed++;
  }catch(e){console.log("FAIL protected route "+path+" "+e.message);failed++;}
}

if(failed){console.error(`Production smoke failed: ${failed}`);process.exit(1);}
console.log("Production smoke passed.");
