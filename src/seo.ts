import {ORIGIN,SECTIONS} from "./config";
import type {Env,Locale} from "./types";
import {text}from"./http";

export function robots(){
  // Keep robots.txt limited to directives recognized by crawlers.
  return text("User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin\nDisallow: /review\nDisallow: /saved\nSitemap: "+ORIGIN+"/sitemap.xml\nSitemap: "+ORIGIN+"/news-sitemap.xml\n");
}
const xml=(s:string)=>Array.from(String(s)).filter((character)=>{const code=character.codePointAt(0)!;return code===0x9||code===0xA||code===0xD||(code>=0x20&&code<=0xD7FF)||(code>=0xE000&&code<=0xFFFD)||(code>=0x10000&&code<=0x10FFFF)}).join("").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
const retryableUnavailable=(message:string)=>{const response=text(message,"text/plain;charset=utf-8",503);response.headers.set("retry-after","300");return response;};
export async function sitemap(env:Env){
  let articleUrls:Array<{url:string;lastmod?:string}>=[];
  try{
    const r=await env.DB.prepare("SELECT slug,language,updated_at FROM articles WHERE status='PUBLISHED' ORDER BY updated_at DESC LIMIT 1000").all<any>();
    articleUrls=(r.results||[]).filter((x:any)=>x.slug&&(x.language==="ar"||x.language==="en")).map((x:any)=>({
      url:ORIGIN+"/article/"+encodeURIComponent(x.slug)+"?lang="+encodeURIComponent(x.language),
      lastmod:String(x.updated_at||"")
    }));
  }catch(error){
    // Avoid publishing a misleading partial sitemap when article discovery fails.
    console.error("sitemap_database_query_failed", error instanceof Error ? error.message : String(error));
    return retryableUnavailable("Sitemap temporarily unavailable; retry later.");
  }
  const publicPaths=["/","/news","/about","/methodology","/privacy","/terms",...SECTIONS.map(x=>"/"+x[0])];
  const localizedUrls=publicPaths.flatMap((path)=>["ar","en"].map((language)=>({url:path==="/"&&language==="ar"?ORIGIN+"/":ORIGIN+path+"?lang="+language})));
  const urlMap=new Map<string,{url:string;lastmod?:string}>();
  for(const item of [...localizedUrls,...articleUrls])urlMap.set(item.url,item);
  const urls:Array<{url:string;lastmod?:string}>=[...urlMap.values()];
  return text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.map((item)=>{
    const date=Date.parse(String(item.lastmod||""));
    const lastmod=Number.isFinite(date)?'<lastmod>'+xml(new Date(date).toISOString())+'</lastmod>':"";
    return '<url><loc>'+xml(item.url)+'</loc>'+lastmod+'</url>';
  }).join("")+"</urlset>","application/xml;charset=utf-8");
}
const newsSitemapEligibility=(row:any,now:number)=>{
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
  try{const parsed=JSON.parse(String(row?.sources_json||"[]"));sources=Array.isArray(parsed)?parsed:[]}catch{}
  const hosts=new Set<string>();
  for(const source of sources){
    try{
      const url=new URL(String(source?.url||""));
      if(url.protocol!=="https:"||url.username||url.password)continue;
      const host=url.hostname.toLowerCase().replace(/^www\./,"").replace(/\.$/,"");
      if(!host||host==="localhost"||host.endsWith(".localhost"))continue;
      hosts.add(host);
    }catch{}
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
export async function newsSitemap(env:Env){
  const now=Date.now();
  const recentCutoff=new Date(now-48*60*60*1000).toISOString();
  const futureLimit=new Date(now+5*60*1000).toISOString();
  let rows:any[]=[];
  let archiveRows:any[]=[];
  try{
    const r=await env.DB.prepare("SELECT slug,title,language,created_at,body,sources_json FROM articles WHERE status='PUBLISHED' AND language IN ('ar','en') AND created_at>=? AND created_at<=? AND length(body)>=500 ORDER BY created_at DESC LIMIT 200").bind(recentCutoff,futureLimit).all<any>();
    rows=r.results||[];
  }catch(error){
    console.error("news_sitemap_database_query_failed",error instanceof Error?error.message:String(error));
    return retryableUnavailable("News sitemap temporarily unavailable; retry later.");
  }
  try{
    const archive=await env.DB.prepare("SELECT id,url,language,title,summary,publisher,published_at,fetched_at FROM news_archive WHERE language IN ('ar','en') AND fetched_at>=? AND fetched_at<=? AND length(summary)>=120 ORDER BY fetched_at DESC LIMIT 200").bind(recentCutoff,futureLimit).all<any>();
    archiveRows=archive.results||[];
  }catch(error){
    // Archive diagnostics must not suppress valid full-article URLs.
    console.error("news_sitemap_archive_diagnostics_failed",error instanceof Error?error.message:String(error));
  }
  const rejectionReasons:Record<string,number>={};
  const eligibleRows:any[]=[];
  for(const row of rows){
    const result=newsSitemapEligibility(row,now);
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
  const items=[...unique.values()];
  const response=text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">'+items.map(item=>{
    return '<url><loc>'+xml(item.url)+'</loc><news:news><news:publication><news:name>BAYAN</news:name><news:language>'+xml(item.language)+'</news:language></news:publication><news:publication_date>'+xml(item.publishedAt)+'</news:publication_date><news:title>'+xml(item.title)+'</news:title></news:news></url>';
  }).join("")+"</urlset>","application/xml;charset=utf-8");
  response.headers.set("x-bayan-news-sitemap-candidate-count",String(rows.length));
  response.headers.set("x-bayan-news-sitemap-eligible-count",String(items.length));
  response.headers.set("x-bayan-news-sitemap-rejected-count",String(Math.max(0,rows.length-items.length)));
  response.headers.set("x-bayan-news-sitemap-archive-candidate-count",String(archiveRows.length));
  response.headers.set("x-bayan-news-sitemap-archive-ready-for-drafting-count",String(archiveEligibleCount));
  response.headers.set("x-bayan-news-sitemap-rejection-reasons",JSON.stringify(rejectionReasons));
  console.info("news_sitemap_generation",JSON.stringify({articleCandidates:rows.length,archiveCandidates:archiveRows.length,eligible:items.length,archiveReadyForArticleDrafting:archiveEligibleCount,rejected:Math.max(0,rows.length-items.length),rejectionReasons,freshnessWindowHours:48}));
  return response;
}
