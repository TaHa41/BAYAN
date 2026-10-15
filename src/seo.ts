import {ORIGIN,SECTIONS} from "./config";
import type {Env,Locale} from "./types";
import {text}from"./http";


export function robots(){
  // Keep robots.txt limited to directives recognized by crawlers.
  return text("User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin\nDisallow: /review\nDisallow: /saved\nSitemap: "+ORIGIN+"/sitemap.xml\nSitemap: "+ORIGIN+"/news-sitemap.xml\n");
}
const xml=(s:string)=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
const retryableUnavailable=(message:string)=>{const response=text(message,"text/plain;charset=utf-8",503);response.headers.set("retry-after","300");return response;};
export async function sitemap(env:Env){
  let articleUrls:Array<{url:string;lastmod?:string}>=[];
  try{
    const r=await env.DB.prepare("SELECT slug,language,updated_at FROM articles WHERE status='PUBLISHED' ORDER BY updated_at DESC LIMIT 1000").all<any>();
    articleUrls=(r.results||[]).map((x:any)=>({
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
const NEWS_PUBLISHER_HOSTS=new Set([
  "reuters.com","apnews.com","bbc.com","bbc.co.uk","theguardian.com",
  "aljazeera.net","aljazeera.com","dw.com","france24.com","skynewsarabia.com",
  "independentarabia.com","aawsat.com","youm7.com","yallakora.com","filgoal.com",
  "masrawy.com","almasryalyoum.com","alarabiya.net","egypttoday.com","cnn.com",
  "nytimes.com","washingtonpost.com","npr.org","cbsnews.com","nbcnews.com",
  "abcnews.go.com","thetimes.com","ft.com","bloomberg.com","ap.org"
]);
const hostname=(value:unknown)=>{
  try{return new URL(String(value||"")).hostname.toLowerCase().replace(/^www\\./,"")}
  catch{return ""}
};
const bodyText=(value:unknown)=>String(value||"")
  .replace(/<script\\b[\\s\\S]*?<\\/script>/gi," ")
  .replace(/<style\\b[\\s\\S]*?<\\/style>/gi," ")
  .replace(/<[^>]*>/g," ")
  .replace(/&nbsp;/gi," ")
  .replace(/&amp;/gi,"&")
  .replace(/&(?:quot|apos|lt|gt);/gi," ")
  .replace(/\\s+/g," ").trim();

export async function newsSitemap(env:Env){
  const now=Date.now();
  const windowMs=48*60*60*1000;
  let candidates:Array<{slug:string;title:string;language:Locale;publishedAt:string;body:string;sources_json:string;created_at:string}>=[];
  try{
    // Query a wider recent window of published articles. News is stored under
    // topical sections, so section='news' would incorrectly omit valid stories.
    const r=await env.DB.prepare(
      "SELECT slug,title,language,created_at,body,sources_json FROM articles WHERE status='PUBLISHED' ORDER BY created_at DESC LIMIT 2000"
    ).all<any>();
    candidates=(r.results||[]).map((x:any)=>({
      slug:String(x.slug||""),
      title:String(x.title||"").trim(),
      language:x.language as Locale,
      publishedAt:String(x.created_at||""),
      created_at:String(x.created_at||""),
      body:String(x.body||""),
      sources_json:String(x.sources_json||"[]")
    }));
  }catch(error){
    console.error("news_sitemap_database_query_failed", error instanceof Error ? error.message : String(error));
    return retryableUnavailable("News sitemap temporarily unavailable; retry later.");
  }
  const items=candidates.filter((x)=>{
    const published=Date.parse(x.publishedAt);
    const plainBody=bodyText(x.body);
    let sources:any[]=[];
    try{const parsed=JSON.parse(x.sources_json);sources=Array.isArray(parsed)?parsed:[]}catch{}
    const validSources=sources.filter((source:any)=>{
      try{return new URL(String(source?.url||"")).protocol==="https:"}catch{return false}
    });
    const hosts=new Set(validSources.map((source:any)=>hostname(source.url)).filter(Boolean));
    const recognizedNewsPublisher=validSources.some((source:any)=>{
      const host=hostname(source.url);
      return [...NEWS_PUBLISHER_HOSTS].some((known)=>host===known||host.endsWith("."+known));
    });
    const recentSource=validSources.some((source:any)=>{
      const date=Date.parse(String(source?.publishedAt||""));
      return Number.isFinite(date)&&date<=now+5*60*1000&&now-date<=windowMs;
    });
    return Boolean(
      x.slug &&
      x.title.length>=8 &&
      (x.language==="ar"||x.language==="en") &&
      Number.isFinite(published) &&
      published<=now+5*60*1000 &&
      now-published<=windowMs &&
      plainBody.length>=1200 &&
      hosts.size>=2 &&
      (recognizedNewsPublisher||recentSource)
    );
  }).map((x)=>({
    slug:x.slug,
    title:x.title,
    language:x.language,
    publishedAt:new Date(Date.parse(x.publishedAt)).toISOString()
  }));
  const unique=new Map<string,typeof items[number]>();
  for(const item of items){
    const url=ORIGIN+"/article/"+encodeURIComponent(item.slug)+"?lang="+item.language;
    unique.set(url,item);
  }
  const finalItems=[...unique.entries()].map(([url,item])=>({url,...item}));
  const response=text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">'+finalItems.map(x=>{
    return '<url><loc>'+xml(x.url)+'</loc><news:news><news:publication><news:name>BAYAN</news:name><news:language>'+xml(x.language)+'</news:language></news:publication><news:publication_date>'+xml(x.publishedAt)+'</news:publication_date><news:title>'+xml(x.title)+'</news:title></news:news></url>';
  }).join("")+"</urlset>","application/xml;charset=utf-8");
  response.headers.set("cache-control","public, max-age=300, s-maxage=300");
  response.headers.set("x-bayan-news-sitemap-candidate-count",String(candidates.length));
  response.headers.set("x-bayan-news-sitemap-eligible-count",String(finalItems.length));
  return response;
}
