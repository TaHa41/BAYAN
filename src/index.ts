import{isD1IndependentApiPath,isD1QuotaTolerantApiPath}from"./services/d1-independent-routes";import{safePublicImageUrl}from"./image-url";import{d1Blocked,d1BlockedPersisted,isD1QuotaError,logD1QuotaOncePerHour,persistD1Block,withD1QuotaGuard}from"./services/d1-guard";import{recordRuntimeEventLimited}from"./runtime-events";
import type{Env}from"./types";import{api}from"./routes/api";import{robots,sitemap,newsSitemap,adsTxt}from"./seo";import{serveV2,unavailablePage}from"./v2-bridge";import{selfHeal}from"./services/repair";import{news}from"./services/news";import{publishNextArchivedNewsArticle}from"./services/news-article-publisher";import{track}from"./db";import{analyticsExcluded,manager,visitorId}from"./security";import{ensureSchema}from"./schema";import{ORIGIN,SECTIONS}from"./config";import{notify}from"./services/telegram";import{bundledArticleBySlug,bundledArticlesForSection}from"./fallback-content";
const BUILD="2026.10.21.05";
const COMMIT_SHA="0000000000000000000000000000000000000000";
let lastManualNewsTriggerAt=0;
const notFoundResponse=(language:string)=>new Response(language==="en"?"Page not found":"الصفحة غير موجودة",{status:404,headers:{"content-type":"text/plain; charset=utf-8","cache-control":"no-store","x-robots-tag":"noindex, nofollow","x-content-type-options":"nosniff","referrer-policy":"strict-origin-when-cross-origin","x-frame-options":"DENY","permissions-policy":"camera=(), microphone=(), geolocation=()"}});
const isPublicSvgAsset=(pathname:string)=>/^\/sections\/[a-z0-9-]+\.svg$/.test(pathname)||/^\/og-(?:bayan|article)\.svg$/.test(pathname);
/** Static files from /public (images, manifest, key files). Anything that is not a real file is a 404, never a page. */
export async function staticAsset(request:Request,env:Env):Promise<Response>{
  const u=new URL(request.url);
  const lang=u.searchParams.get("lang")==="en"?"en":"ar";
  const response=await env.ASSETS.fetch(request);
    if (/^\/sections\/[a-z0-9-]+\.svg$/.test(u.pathname) &&
      (!response.ok || !/^image\/svg\+xml(?:;|$)/i.test(String(response.headers.get("content-type") || "")))) {
    const slug = u.pathname.slice("/sections/".length, -".svg".length);
    const themes: Record<string, [string, string, string]> = {
      science:["#0f4c5c","#e36414","⚗"],technology:["#1d3557","#457b9d","⌘"],
      economy:["#1b4332","#2d6a4f","◈"],politics:["#3d0c02","#872517","▣"],
      health:["#005f73","#0a9396","+"],history:["#582f0e","#7f4f24","▱"],
      people:["#2b2d42","#8d99ae","●"],sports:["#004b23","#38b000","△"],
      travel:["#0077b6","#0096c7","✈"],art:["#5c038c","#890cb5","✦"],
      news:["#9a031e","#d90429","◉"],trends:["#d00000","#dc2f02","↗"],
      prices:["#3f37c9","#4361ee","◌"],egypt:["#7f5539","#9c6644","⌂"],
      arab:["#143601","#245501","☷"],world:["#0b090a","#161a1d","◎"]
    };
    const [dark, light, glyph] = themes[slug] || ["#176b67","#e06b3c","✦"];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="BAYAN section artwork"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${dark}"/><stop offset="100%" stop-color="${light}"/></linearGradient></defs><rect width="1200" height="630" fill="url(#g)"/><circle cx="600" cy="275" r="190" fill="#fff" fill-opacity=".08"/><text x="600" y="315" font-size="150" fill="#fff" text-anchor="middle" font-family="sans-serif">${glyph}</text><text x="600" y="490" font-size="38" fill="#fff" fill-opacity=".9" text-anchor="middle" font-family="Tahoma,sans-serif" font-weight="700">BAYAN | بيان</text></svg>`;
    return new Response(svg, {status:200, headers:{"Content-Type":"image/svg+xml; charset=utf-8","Cache-Control":"public, max-age=604800, s-maxage=604800","X-Content-Type-Options":"nosniff"}});
  }
  if(!response.ok||/text\/html/i.test(String(response.headers.get("content-type")||"")))return notFoundResponse(lang);
  const headers=new Headers(response.headers);
  headers.set("Cache-Control","public, max-age=3600");headers.set("X-Content-Type-Options","nosniff");headers.set("Referrer-Policy","strict-origin-when-cross-origin");headers.set("X-Frame-Options","DENY");
  return new Response(response.body,{status:response.status,headers});
}
type PublicApiCacheEntry={expiresAt:number;body:string;status:number;headers:Array<[string,string]>};
const publicApiResponseCache=new Map<string,PublicApiCacheEntry>();
const publicApiCacheTtl=(request:Request,url:URL):number=>{
 if(request.method!=="GET")return 0;
 if(url.pathname==="/api/search"&&request.method==="GET")return 60_000;
 if(url.pathname==="/api/section"||url.pathname==="/api/news")return 45_000;
 if(url.pathname==="/api/live/weather"||url.pathname==="/api/live/fx"||url.pathname==="/api/live/gold")return 60_000;
 if(url.pathname==="/api/live/prayer")return 300_000;
 if(url.pathname==="/api/wisdom")return 60_000;
 return 0;
};
const markD1QuotaDegradedResponse=async(response:Response)=>{
 const headers=new Headers(response.headers);
 headers.set("x-bayan-degraded","d1_quota");
 let payload:any=null;
 try{payload=await response.clone().json()}catch(error){console.warn("d1_quota_response_json_failed",error instanceof Error?error.name:"unknown")}
 if(payload&&typeof payload==="object"&&!Array.isArray(payload))return new Response(JSON.stringify({...payload,degraded:true,reason:"d1_quota"}),{status:response.status,headers});
 return new Response(response.body,{status:response.status,headers});
};
const d1QuotaFallback=(url:URL)=>{
 const lang=url.searchParams.get("lang")==="en"?"en":"ar";
 const headers={"content-type":"application/json;charset=utf-8","cache-control":"no-store","x-bayan-degraded":"d1_quota","x-content-type-options":"nosniff","referrer-policy":"strict-origin-when-cross-origin","x-frame-options":"DENY","permissions-policy":"camera=(), microphone=(), geolocation=()"};
 if(url.pathname==="/api/health")return new Response(JSON.stringify({ok:false,service:"BAYAN",version:"1.2.0",database:false,newsArchiveRead:false,articleRevisionHistory:false,error:"d1_quota",checkedAt:new Date().toISOString()}),{status:503,headers});
 if(url.pathname==="/api/news/archive")return new Response(JSON.stringify({ok:true,language:lang,section:"news",items:[],count:0,degraded:true,archiveAvailable:false,reason:"d1_quota",message:lang==="ar"?"الأرشيف المحفوظ غير متاح مؤقتًا بسبب بلوغ حد القراءة اليومي؛ لم تُعرض أخبار غير متحققة.":"The saved archive is temporarily unavailable because the daily read limit was reached; no unverified stories were shown."}),{status:200,headers});
 if(url.pathname==="/api/news")return new Response(JSON.stringify({items:[],degraded:true,reason:"d1_quota",message:lang==="ar"?"الأخبار المحفوظة غير متاحة مؤقتًا بسبب حد قاعدة البيانات.":"Saved news is temporarily unavailable because of the database quota."}),{status:200,headers});
 if(url.pathname==="/api/section")return new Response(JSON.stringify({section:url.searchParams.get("section")||"",items:[],degraded:true,reason:"d1_quota"}),{status:200,headers});
 return new Response(JSON.stringify({degraded:true,reason:"d1_quota",error:"database_temporarily_unavailable"}),{status:200,headers});
};
export default{async fetch(request:Request,env:Env,ctx?:ExecutionContext){env=withD1QuotaGuard(env);const u=new URL(request.url);
if(u.pathname==="/.well-known/build.json"){return new Response(JSON.stringify({service:"BAYAN",commit:COMMIT_SHA,build:BUILD}),{status:200,headers:{"content-type":"application/json;charset=utf-8","cache-control":"no-store, max-age=0","cdn-cache-control":"no-store","x-bayan-commit":COMMIT_SHA,"x-bayan-build":BUILD,"x-content-type-options":"nosniff","referrer-policy":"strict-origin-when-cross-origin","x-frame-options":"DENY"}})}
await d1BlockedPersisted();
{const v2=await serveV2(request,env,ctx);if(v2)return v2}
if(u.pathname==="/api/internal/trigger-news-pipeline"){
 const headers={"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff","referrer-policy":"strict-origin-when-cross-origin","x-frame-options":"DENY"};
 const respond=(status:number,data:Record<string,unknown>)=>new Response(JSON.stringify(data),{status,headers});
 if(request.method!=="POST")return respond(405,{ok:false,error:"method_not_allowed"});
 if(!manager(request,env))return respond(401,{ok:false,error:"unauthorized"});
 if(env.NEWS_PIPELINE_ENABLED!=="true")return respond(503,{ok:false,error:"news_pipeline_disabled"});
 if(d1Blocked())return respond(503,{ok:false,error:"database_temporarily_unavailable"});
 if(Date.now()-lastManualNewsTriggerAt<5*60*1000)return respond(429,{ok:false,error:"trigger_rate_limited"});
 lastManualNewsTriggerAt=Date.now();
 try{
  await ensureSchema(env);
  const result=await publishNextArchivedNewsArticle(env);
  const status=String((result as any)?.status||"unknown");
  const detail={status,publishReason:(result as any)?.publishReason||null,publishReasonDetail:(result as any)?.publishReasonDetail||null,articleId:(result as any)?.id||null,language:(result as any)?.language||null,slug:(result as any)?.slug||null};
  await recordRuntimeEventLimited(env,"news_archive_manual_trigger",status,JSON.stringify(detail));
  const published=status==="published"&&typeof (result as any)?.slug==="string";
  return respond(status==="budget_exhausted"?503:200,{ok:status!=="attempted_failed"&&status!=="budget_exhausted",published,...detail,articleUrl:published?ORIGIN+"/article/"+encodeURIComponent(String((result as any).slug))+"?lang="+(String((result as any).language)==="en"?"en":"ar"):null});
 }catch(error){
  if(isD1QuotaError(error)){await persistD1Block();logD1QuotaOncePerHour(error);return respond(503,{ok:false,error:"database_temporarily_unavailable"});}
  await recordRuntimeEventLimited(env,"news_archive_manual_trigger","trigger_failed",error);
  return respond(500,{ok:false,error:"news_pipeline_attempt_failed"});
 }
}
const apiCacheTtl=publicApiCacheTtl(request,u),apiCacheKey=u.pathname+u.search;
if(apiCacheTtl&&!d1Blocked()){
 const cached=publicApiResponseCache.get(apiCacheKey);
 if(cached&&cached.expiresAt>Date.now())return new Response(cached.body,{status:cached.status,headers:cached.headers});
 if(cached)publicApiResponseCache.delete(apiCacheKey);
}
if(u.pathname.startsWith("/api/")){
 const schemaOptional=["/api/search","/api/section","/api/article"].includes(u.pathname);
 const d1Independent=isD1IndependentApiPath(u.pathname);
 const d1QuotaTolerant=isD1QuotaTolerantApiPath(u.pathname);
 if(!d1Independent){
  const quotaAlreadyBlocked=await d1BlockedPersisted();
  if(quotaAlreadyBlocked&&!d1QuotaTolerant)return d1QuotaFallback(u);
  if(!quotaAlreadyBlocked)try{await ensureSchema(env)}catch(error){if(isD1QuotaError(error)){await persistD1Block();logD1QuotaOncePerHour(error);if(!d1QuotaTolerant)return d1QuotaFallback(u)}else if(!schemaOptional)return new Response(JSON.stringify({error:"database_unavailable"}),{status:503,headers:{"content-type":"application/json;charset=utf-8","x-content-type-options":"nosniff","referrer-policy":"strict-origin-when-cross-origin","x-frame-options":"DENY","permissions-policy":"camera=(), microphone=(), geolocation=()"}})}
 }
 try{
  let response=await api(request,env,ctx);
  if(d1QuotaTolerant&&d1Blocked()&&response.ok)response=await markD1QuotaDegradedResponse(response);
  if(apiCacheTtl&&response.ok&&!d1Blocked()){
   const bodyText=await response.clone().text();
   if(bodyText.length<=512*1024){
    const headers:Array<[string,string]>=[];
    response.headers.forEach((value:string,key:string)=>headers.push([key,value]));
    if(publicApiResponseCache.size>=160){const oldest=publicApiResponseCache.keys().next().value;if(oldest)publicApiResponseCache.delete(oldest);}
    publicApiResponseCache.set(apiCacheKey,{expiresAt:Date.now()+apiCacheTtl,body:bodyText,status:response.status,headers});
   }
  }
  if(d1Blocked()&&!d1Independent&&u.pathname!=="/api/health"&&!d1QuotaTolerant)return d1QuotaFallback(u);
  return response;
 }catch(error){
  if(isD1QuotaError(error)){await persistD1Block();logD1QuotaOncePerHour(error);return d1QuotaFallback(u)}
  const message=String(error).slice(0,800);
  try{await notify(env,"BAYAN API ERROR\\nPath: "+u.pathname+"\\nError: "+message)}catch(error){await recordRuntimeEventLimited(env,"worker_operation","operation_failed",error)}
  return new Response(JSON.stringify({error:"internal_error"}),{status:500,headers:{"content-type":"application/json;charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff","referrer-policy":"strict-origin-when-cross-origin","x-frame-options":"DENY","permissions-policy":"camera=(), microphone=(), geolocation=()"}})
 }
}let seoPath=u.pathname;while(seoPath.length>1&&seoPath.endsWith("/"))seoPath=seoPath.slice(0,-1);
if(seoPath==="/llms.txt"){const body=`# BAYAN | بيان\n\n> Evidence-first Arabic and English knowledge, verified news, research summaries, and live data. Evidence before claims.\n\n## Public pages\n- [Homepage](${ORIGIN}/): BAYAN knowledge center.\n- [Search](${ORIGIN}/search?lang=ar): Search across available sources.\n- [Verified news in Arabic](${ORIGIN}/news?lang=ar): Arabic news and source checks.\n- [Verified news in English](${ORIGIN}/news?lang=en): English news and source checks.\n- [Science and understanding](${ORIGIN}/science?lang=ar): Science explainers.\n- [Technology and AI](${ORIGIN}/technology?lang=ar): Technology and AI.\n- [Economy and money](${ORIGIN}/economy?lang=ar): Economic information.\n- [Health and medicine](${ORIGIN}/health?lang=ar): Health information.\n- [History and culture](${ORIGIN}/history?lang=ar): History and culture.\n- [Methodology](${ORIGIN}/methodology?lang=ar): Evidence and verification approach.\n- [About BAYAN](${ORIGIN}/about?lang=ar): About the project.\n- [Sitemap](${ORIGIN}/sitemap.xml): Public indexable pages.\n- [News sitemap](${ORIGIN}/news-sitemap.xml): Recent eligible news pages.\n\n## Language versions\nUse the lang=ar parameter for Arabic pages and lang=en for English pages.\n\n## Editorial principles\nBAYAN aims to distinguish sourced evidence from summaries, avoid fabricated claims, and identify uncertainty when evidence is insufficient.\n`;return new Response(body,{status:200,headers:{"Content-Type":"text/markdown; charset=utf-8","Cache-Control":"public, max-age=3600","X-Content-Type-Options":"nosniff","Referrer-Policy":"strict-origin-when-cross-origin","X-Frame-Options":"DENY","Permissions-Policy":"camera=(), microphone=(), geolocation=()"}})}
if(seoPath==="/ai-catalog.json"||seoPath==="/.well-known/ai-catalog.json"){const catalog={specVersion:"1.0",host:{displayName:"BAYAN | بيان",identifier:"bayan.tahaomar411.workers.dev",documentationUrl:ORIGIN+"/methodology?lang=en"},entries:[]};return new Response(JSON.stringify(catalog,null,2),{status:200,headers:{"Content-Type":"application/ai-catalog+json; charset=utf-8","Cache-Control":"public, max-age=3600","X-Content-Type-Options":"nosniff","Referrer-Policy":"strict-origin-when-cross-origin","X-Frame-Options":"DENY","Permissions-Policy":"camera=(), microphone=(), geolocation=()","Link":'<'+ORIGIN+'/.well-known/ai-catalog.json>; rel="self"'}})}
if(seoPath==="/robots.txt")return robots();
if(seoPath==="/ads.txt")return adsTxt(env);
if(seoPath==="/sitemap.xml"||seoPath==="/news-sitemap.xml"){
  const degradedSitemap=()=>new Response(seoPath==="/news-sitemap.xml"?'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"></urlset>':'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml"></urlset>',{status:200,headers:{"Content-Type":"application/xml; charset=utf-8","Cache-Control":"no-store","X-BAYAN-Degraded":"d1_quota","X-BAYAN-SEO":"sitemap-degraded-d1-quota","X-Content-Type-Options":"nosniff"}});
  const sitemapCache=(caches as unknown as {default:Cache}).default;
  const sitemapCacheKey=new Request(new URL(seoPath,ORIGIN).toString(),{method:"GET"});
  try{
    const cached=await sitemapCache.match(sitemapCacheKey);
    if(cached)return cached;
  }catch(error){console.warn("sitemap_edge_cache_read_failed",String(error).slice(0,120))}
  if(d1Blocked())return degradedSitemap();
  try{
    const response=seoPath==="/sitemap.xml"?await sitemap(env):await newsSitemap(env);
    const headers=new Headers(response.headers);
    headers.set("X-Content-Type-Options","nosniff");
    headers.set("X-BAYAN-SEO",response.status>=500?"sitemap-unavailable":"sitemap-v1");
    if(response.status>=500&&d1Blocked())return degradedSitemap();
    if(response.status>=500){
      headers.set("Cache-Control","no-store");
      headers.set("Retry-After",response.headers.get("Retry-After")||"300");
      return new Response(response.body,{status:response.status,headers});
    }
    headers.set("Content-Type","application/xml; charset=utf-8");
    headers.set("Cache-Control","public, max-age=300, s-maxage=300, stale-while-revalidate=3600");
    const finalResponse=new Response(response.body,{status:response.status,headers});
    if(response.status===200){try{await sitemapCache.put(sitemapCacheKey,finalResponse.clone())}catch(error){console.warn("sitemap_edge_cache_write_failed",String(error).slice(0,120))}}
    return finalResponse;
  }catch(error){if(isD1QuotaError(error)||d1Blocked()){if(!d1Blocked())await persistD1Block();logD1QuotaOncePerHour(error);return degradedSitemap()}
    try{await notify(env,"BAYAN SITEMAP ERROR\\nPath: "+seoPath+"\\nError: "+String(error).slice(0,300))}catch(error){await recordRuntimeEventLimited(env,"worker_operation","operation_failed",error)}
    return new Response("Sitemap temporarily unavailable; retry later.",{status:503,headers:{"Content-Type":"text/plain; charset=utf-8","Cache-Control":"no-store","Retry-After":"300","X-Content-Type-Options":"nosniff","X-BAYAN-SEO":"sitemap-unavailable"}});
  }
}
if((request.method==="GET"||request.method==="HEAD")&&/\.[a-z0-9]{1,10}$/i.test(u.pathname))return staticAsset(request,env);
// Every HTML page is served by the new site (serveV2). Reaching this point for a page means it failed to render, so show a plain new-design notice.
if(request.method==="GET"&&(request.headers.get("accept")||"").includes("text/html"))return unavailablePage(request);
return notFoundResponse(u.searchParams.get("lang")==="en"?"en":"ar");
},async scheduled(event:ScheduledEvent,env:Env){
  env=withD1QuotaGuard(env);
  if(await d1BlockedPersisted())return;
  try{await ensureSchema(env)}catch(error){if(isD1QuotaError(error)){await persistD1Block();logD1QuotaOncePerHour(error);return;}await recordRuntimeEventLimited(env,"worker_operation","operation_failed",error)}
  // Keep each cron invocation to one expensive task. Preserve news refresh every 15 minutes;
  // use the second maintenance slot for publication on most cycles, reserving two slots per hour
  // for self-healing. Each publication invocation still claims at most one row and uses bounded AI calls.
  // Visitor-facing search runs in its own request and is not awaited on by this scheduled task.
  const scheduleSlot=Math.floor(Number(event.scheduledTime||Date.now())/(5*60*1000));
  const task=scheduleSlot%3;
  if(task===0){
    try{
      const now=Date.now();
      const previous=await env.DB.prepare("SELECT value FROM admin_settings WHERE key=? LIMIT 1").bind("news_archive_refresh_last").first<any>();
      const last=Date.parse(String(previous?.value||""));
      if(!Number.isFinite(last)||now-last>=15*60*1000){
        const stamp=new Date(now).toISOString();
        await env.DB.prepare("INSERT INTO admin_settings(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at").bind("news_archive_refresh_last",stamp,stamp).run();
        const languageSetting=await env.DB.prepare("SELECT value FROM admin_settings WHERE key=? LIMIT 1").bind("news_archive_refresh_language").first<any>();
        const language=String(languageSetting?.value||"ar")==="en"?"en":"ar";
        const nextLanguage=language==="ar"?"en":"ar";
        await env.DB.prepare("INSERT INTO admin_settings(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at").bind("news_archive_refresh_language",nextLanguage,stamp).run();
        await news(env,language,{forceRefresh:true});
      }
    }catch(error){
      if(isD1QuotaError(error)){await persistD1Block();logD1QuotaOncePerHour(error);return;}
      try{await env.DB.prepare("INSERT INTO runtime_events(level,kind,message,created_at) VALUES(?,?,?,?)").bind("WARN","scheduled_news_archive_refresh",String(error).slice(0,300),new Date().toISOString()).run()}catch(error){await recordRuntimeEventLimited(env,"worker_operation","operation_failed",error)}
    }
  }else if(env.NEWS_PIPELINE_ENABLED==="true"&&(task===1||(task===2&&scheduleSlot%12!==2&&scheduleSlot%12!==8))){
    try{
      const result=await publishNextArchivedNewsArticle(env);
      // The publisher reports exhausted/unavailable D1 budget without throwing. Do not
      // turn that expected quota state into a second D1 telemetry write.
      if(result.status==="budget_exhausted")return;
      if(result.status!=="idle"){
        const level=result.status==="published"?"INFO":"WARN";
        const details=JSON.stringify(result).slice(0,900);
        try{await env.DB.prepare("INSERT INTO runtime_events(level,kind,message,created_at) VALUES(?,?,?,?)").bind(level,"news_archive_article_generation",details,new Date().toISOString()).run()}catch(error){await recordRuntimeEventLimited(env,"worker_operation","operation_failed",error)}
        console.info("news_archive_article_generation",details);
      }
    }catch(error){
      if(isD1QuotaError(error)){await persistD1Block();logD1QuotaOncePerHour(error);return;}
      try{await env.DB.prepare("INSERT INTO runtime_events(level,kind,message,created_at) VALUES(?,?,?,?)").bind("WARN","news_archive_article_generation",String(error).slice(0,350),new Date().toISOString()).run()}catch(error){await recordRuntimeEventLimited(env,"worker_operation","operation_failed",error)}
    }
  }else{
    try{await selfHeal(env)}catch(error){
      if(isD1QuotaError(error)){await persistD1Block();logD1QuotaOncePerHour(error);return;}
      try{await env.DB.prepare("INSERT INTO runtime_events(level,kind,message,created_at) VALUES(?,?,?,?)").bind("WARN","scheduled_self_heal",String(error).slice(0,300),new Date().toISOString()).run()}catch(error){await recordRuntimeEventLimited(env,"worker_operation","operation_failed",error)}
    }
  }
}};