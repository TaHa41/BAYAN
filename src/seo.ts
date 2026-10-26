import {ORIGIN,SECTIONS} from "./config";
import {recordRuntimeEventLimited} from "./runtime-events";
import type {Env,Locale} from "./types";
import {text}from"./http";
import {BUNDLED_ARTICLES} from "./fallback-content";
import {isTopicImageUrl} from "./image-url";

export function robots(){
  // Advertise only the general sitemap. Google News sitemaps are useful only
  // while eligible, recent, full news articles exist; never advertise an empty feed.
  return text("User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin\nDisallow: /review\nDisallow: /saved\nSitemap: "+ORIGIN+"/sitemap.xml\n");
}
// /ads.txt is served only when the owner sets the ADS_TXT variable (the lines the ad network provides).
// Nothing is invented: unset means 404, and only well-formed ads.txt lines, comments and variables are emitted.
export function adsTxt(env:Env){
  const raw=String(env.ADS_TXT||"").replace(/\\n/g,"\n").slice(0,8000);
  const line=/^(?:#.*|(?:contact|subdomain|ownerdomain|managerdomain|inventorypartnerdomain)\s*=\s*[\w.\-\/:@]+|[a-z0-9.\-]+\s*,\s*[\w\-]+\s*,\s*(?:DIRECT|RESELLER)(?:\s*,\s*[\w\-]+)?)\s*(?:#.*)?$/i;
  const lines=raw.split(/\r?\n/).map((l)=>l.trim()).filter((l)=>l&&line.test(l));
  if(!lines.some((l)=>!l.startsWith("#")))return new Response("Not found",{status:404,headers:{"content-type":"text/plain; charset=utf-8","cache-control":"no-store"}});
  return new Response(lines.join("\n")+"\n",{status:200,headers:{"content-type":"text/plain; charset=utf-8","cache-control":"public, max-age=3600","x-content-type-options":"nosniff"}});
}
const hasTopicImage=isTopicImageUrl;
const xml=(s:string)=>Array.from(String(s)).filter((character)=>{const code=character.codePointAt(0)!;return code===0x9||code===0xA||code===0xD||(code>=0x20&&code<=0xD7FF)||(code>=0xE000&&code<=0xFFFD)||(code>=0x10000&&code<=0x10FFFF)}).join("").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");

const cachedXmlResponse=async(path:string,env:Env,ttlSeconds:number,build:()=>Promise<Response>):Promise<Response>=>{
  const scope=String((env as any).BAYAN_ENVIRONMENT||"default");
  const key=new Request(ORIGIN+path+"?__bayan_cache_scope="+encodeURIComponent(scope));
  try{if(typeof caches!=="undefined"){const cache=await caches.open("bayan-sitemap-cache-v1");const cached=await cache.match(key);if(cached){const hit=new Response(cached.body,cached);hit.headers.set("x-bayan-sitemap-cache","HIT");return hit;}}}catch{/* Cache is optional; sitemap generation must remain available. */}
  const response=await build();
  const degraded=response.headers.get("x-bayan-news-sitemap-degraded")==="d1-unavailable";
  const ttl=degraded?30:ttlSeconds;
  response.headers.set("Cache-Control","public, max-age="+ttl+", stale-while-revalidate="+(ttl*2));
  response.headers.set("x-bayan-sitemap-cache","MISS");
  try{if(typeof caches!=="undefined"){const cache=await caches.open("bayan-sitemap-cache-v1");await cache.put(key,response.clone());}}catch{/* Cache is optional; sitemap generation must remain available. */}
  return response;
};
async function generateSitemap(env:Env){
  let articleUrls:Array<{url:string;lastmod?:string}>=[];
  try{
    const r=await env.DB.prepare("SELECT slug,language,updated_at,image_url FROM articles WHERE status='PUBLISHED' AND image_url IS NOT NULL AND trim(image_url)!='' AND lower(image_url) NOT LIKE '%/sections/%' AND lower(image_url) NOT LIKE '%placeholder%' AND lower(image_url) NOT LIKE '%/logo%' AND lower(image_url) NOT LIKE '%/favicon%' ORDER BY updated_at DESC LIMIT 5000").all<any>();
    articleUrls=(r.results||[]).filter((x:any)=>x.slug&&hasTopicImage(x.image_url)&&(x.language==="ar"||x.language==="en")).map((x:any)=>({
      url:ORIGIN+"/article/"+encodeURIComponent(x.slug)+"?lang="+encodeURIComponent(x.language),
      lastmod:String(x.updated_at||"")
    }));
  }catch(error){
    // Continue with reviewed bundled articles when D1 reads are unavailable.
    console.error("sitemap_database_query_failed", error instanceof Error ? error.message : String(error));
  }
  // Bundled article routes are served even when a matching D1 row is absent.
  // Include only reviewed, verified entries; prefer the D1 timestamp when present.
  const bundledArticleUrls=BUNDLED_ARTICLES.filter((x)=>x.slug&&x.status==="PUBLISHED"&&x.fallbackEvidence==="verified"&&hasTopicImage(x.imageUrl)&&(x.language==="ar"||x.language==="en")).map((x)=>({url:ORIGIN+"/article/"+encodeURIComponent(x.slug)+"?lang="+encodeURIComponent(x.language),lastmod:String(x.updatedAt||"")}));
  const mergedArticleUrls=new Map<string,{url:string;lastmod?:string}>();
  for(const item of bundledArticleUrls)mergedArticleUrls.set(item.url,item);
  for(const item of articleUrls){
    const existing=mergedArticleUrls.get(item.url);
    mergedArticleUrls.set(item.url,{url:item.url,lastmod:item.lastmod||existing?.lastmod});
  }
  articleUrls=[...mergedArticleUrls.values()];
  const publicPaths=["/","/news","/about","/methodology","/privacy","/terms",...SECTIONS.map(x=>"/"+x[0])];
  const localizedUrls=publicPaths.flatMap((path)=>["ar","en"].map((language)=>({
    url:path==="/"&&language==="ar"?ORIGIN+"/":ORIGIN+path+"?lang="+language,
    alternateUrl:path==="/"&&language==="ar"?ORIGIN+"/?lang=en":path==="/"&&language==="en"?ORIGIN+"/":ORIGIN+path+"?lang="+(language==="ar"?"en":"ar")
  })));
  const urlMap=new Map<string,{url:string;lastmod?:string;alternateUrl?:string}>();
  for(const item of [...localizedUrls,...articleUrls])urlMap.set(item.url,item);
  const urls:Array<{url:string;lastmod?:string;alternateUrl?:string}>=[...urlMap.values()];
  return text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'+urls.map((item)=>{
    const date=Date.parse(String(item.lastmod||""));
    const lastmod=Number.isFinite(date)?'<lastmod>'+xml(new Date(date).toISOString())+'</lastmod>':"";
    const alternates=item.alternateUrl?'<xhtml:link rel="alternate" hreflang="ar" href="'+xml(item.url.includes("lang=en")?item.alternateUrl:item.url)+'"/><xhtml:link rel="alternate" hreflang="en" href="'+xml(item.url.includes("lang=en")?item.url:item.alternateUrl)+'"/>':"";
    return '<url><loc>'+xml(item.url)+'</loc>'+lastmod+alternates+'</url>';
  }).join("")+"</urlset>","application/xml;charset=utf-8");
}
export async function sitemap(env:Env){return cachedXmlResponse("/sitemap.xml",env,600,()=>generateSitemap(env));}

const newsSitemapEligibility=async(row:any,now:number,env:Env)=>{
  const reject=(reason:string)=>({eligible:false,reason});
  const slug=String(row?.slug||"").trim(),title=String(row?.title||"").trim(),language=String(row?.language||"");
  if(!slug)return reject("missing_slug");
  if(title.length<8)return reject("title_too_short");
  if(language!=="ar"&&language!=="en")return reject("invalid_language");
  const published=Date.parse(String(row?.created_at||""));
  if(!Number.isFinite(published))return reject("invalid_publication_date");
  if(published>now+5*60*1000)return reject("future_publication_date");
  if(now-published>48*60*60*1000)return reject("outside_48_hour_window");
  const body=String(row?.body||"").replace(/<script\b[\s\S]*?<\/script>/gi," ").replace(/<style\b[\s\S]*?<\/style>/gi," ").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();
  if(body.length<500)return reject("body_too_short");
  let sources:any[]=[];
  try{const parsed=JSON.parse(String(row?.sources_json||"[]"));sources=Array.isArray(parsed)?parsed:[]}catch(error){await recordRuntimeEventLimited(env,"news_sitemap_sources_parse","news_sitemap_sources_json_invalid",error)}
  const hosts=new Set<string>();
  for(const source of sources){
    try{
      const url=new URL(String(source?.url||""));
      if(url.protocol!=="https:"||url.username||url.password)continue;
      const host=url.hostname.toLowerCase().replace(/^www\./,"").replace(/\.$/,"");
      if(!host||host==="localhost"||host.endsWith(".localhost"))continue;
      hosts.add(host);
    }catch(error){await recordRuntimeEventLimited(env,"news_sitemap_source_url","news_sitemap_source_url_invalid",error)}
  }
  if(hosts.size<2)return reject("fewer_than_two_https_source_hosts");
  return {eligible:true,reason:""};
};
const archiveArticleCandidate=(row:any,now:number)=>{
  const title=String(row?.title||"").trim(),language=String(row?.language||""),summary=String(row?.summary||"").replace(/<script\b[\s\S]*?<\/script>/gi," ").replace(/<style\b[\s\S]*?<\/style>/gi," ").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();
  const publisher=String(row?.publisher||"").trim(),fetched=Date.parse(String(row?.fetched_at||""));
  if(!Number.isInteger(Number(row?.id))||Number(row?.id)<1||title.length<8||(language!=="ar"&&language!=="en")||summary.length<120||!publisher)return false;
  if(!Number.isFinite(fetched)||fetched>now+5*60*1000||now-fetched>48*60*60*1000)return false;
  try{const source=new URL(String(row?.url||""));return source.protocol==="https:"&&!source.username&&!source.password}catch{return false}
};
async function generateNewsSitemap(env:Env){
  const now=Date.now();
  const recentCutoff=new Date(now-48*60*60*1000).toISOString();
  const futureLimit=new Date(now+5*60*1000).toISOString();
  let rows:any[]=[];
  let archiveRows:any[]=[];
  try{
    // Google News sitemaps must contain only eligible news articles published
    // within the recent 48-hour window. The general sitemap carries evergreen
    // pages and all published articles; never pad this sitemap with unrelated URLs.
    const r=await env.DB.prepare("SELECT slug,title,language,created_at,body,sources_json FROM articles WHERE status='PUBLISHED' AND language IN ('ar','en') AND created_at>=? AND created_at<=? AND length(body)>=500 ORDER BY created_at DESC LIMIT 200").bind(recentCutoff,futureLimit).all<any>();
    rows=r.results||[];
  }catch(error){
    console.error("news_sitemap_database_query_failed",error instanceof Error?error.message:String(error));
    // Never fabricate news. Return valid empty XML while D1 row reads are unavailable.
    const response=text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"></urlset>',"application/xml;charset=utf-8");
    response.headers.set("x-bayan-news-sitemap-degraded","d1-unavailable");
    response.headers.set("x-bayan-news-sitemap-candidate-count","0");
    response.headers.set("x-bayan-news-sitemap-eligible-count","0");
    return response;
  }
  try{
    const archive=await env.DB.prepare("SELECT id,url,language,title,summary,publisher,published_at,fetched_at,article_attempts,article_last_reason FROM news_archive WHERE language IN ('ar','en') AND fetched_at>=? AND fetched_at<=? AND length(summary)>=120 ORDER BY fetched_at DESC LIMIT 200").bind(recentCutoff,futureLimit).all<any>();
    archiveRows=archive.results||[];
  }catch(error){
    // Archive diagnostics must not suppress valid full-article URLs.
    console.error("news_sitemap_archive_diagnostics_failed",error instanceof Error?error.message:String(error));
  }
  const rejectionReasons:Record<string,number>={};
  const eligibleRows:any[]=[];
  for(const row of rows){
    const result=await newsSitemapEligibility(row,now,env);
    if(result.eligible)eligibleRows.push(row);
    else rejectionReasons[result.reason]=(rejectionReasons[result.reason]||0)+1;
  }
  const unique=new Map<string,{slug:string;title:string;language:Locale;publishedAt:string;url:string}>();
  for(const row of eligibleRows){
    const slug=String(row.slug),language=row.language as Locale,key=language+":"+slug;
    if(unique.has(key)){rejectionReasons.duplicate_article_url=(rejectionReasons.duplicate_article_url||0)+1;continue;}
    unique.set(key,{slug,title:String(row.title).trim(),language,publishedAt:new Date(String(row.created_at)).toISOString(),url:ORIGIN+"/article/"+encodeURIComponent(slug)+"?lang="+language});
  }
  const archiveEligibleCount=archiveRows.filter((row)=>archiveArticleCandidate(row,now)).length;
  // Why are the ready archive rows not becoming articles? Aggregate the recorded reasons from the rows already loaded
  // (no extra D1 reads). Only coarse reason codes and counts are exposed, never row content.
  const archiveReasons:Record<string,number>={};
  for(const row of archiveRows){
    if(!archiveArticleCandidate(row,now))continue;
    const reason=String(row.article_last_reason||"never_attempted").replace(/[^a-z0-9_:\-]/gi,"_").slice(0,48);
    archiveReasons[reason]=(archiveReasons[reason]||0)+1;
    const bucket="attempts_"+Math.min(2,Math.max(0,Number(row.article_attempts||0)));
    archiveReasons[bucket]=(archiveReasons[bucket]||0)+1;
  }
  const items=[...unique.values()];
  const response=text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">'+items.map(item=>{
    const news='<news:news><news:publication><news:name>BAYAN</news:name><news:language>'+xml(item.language)+'</news:language></news:publication><news:publication_date>'+xml(item.publishedAt)+'</news:publication_date><news:title>'+xml(item.title)+'</news:title></news:news>';
    return '<url><loc>'+xml(item.url)+'</loc>'+news+'</url>';
  }).join("")+"</urlset>","application/xml;charset=utf-8");
  response.headers.set("x-bayan-news-sitemap-candidate-count",String(rows.length));
  response.headers.set("x-bayan-news-sitemap-eligible-count",String(items.length));
  response.headers.set("x-bayan-news-sitemap-rejected-count",String(Math.max(0,rows.length-items.length)));
  response.headers.set("x-bayan-news-sitemap-archive-candidate-count",String(archiveRows.length));
  response.headers.set("x-bayan-news-sitemap-archive-ready-for-drafting-count",String(archiveEligibleCount));
  response.headers.set("x-bayan-news-sitemap-rejection-reasons",JSON.stringify(rejectionReasons));
  response.headers.set("x-bayan-news-sitemap-archive-reasons",JSON.stringify(archiveReasons).slice(0,500));
  console.info("news_sitemap_generation",JSON.stringify({articleCandidates:rows.length,archiveCandidates:archiveRows.length,eligible:items.length,archiveReadyForArticleDrafting:archiveEligibleCount,rejected:Math.max(0,rows.length-items.length),rejectionReasons,freshnessWindowHours:48}));
  // An empty news sitemap is valid when no recent eligible articles exist. Google
  // may show an empty-sitemap warning, but a 503 makes the sitemap unavailable and
  // creates a fetch error. The separate production health check still flags an
  // archive-to-publication gap, so returning valid XML does not hide pipeline failure.
  return response;
}

export async function newsSitemap(env:Env){return cachedXmlResponse("/news-sitemap.xml",env,300,()=>generateNewsSitemap(env));}
