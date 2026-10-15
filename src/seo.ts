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
export async function newsSitemap(env:Env){
  const now=Date.now();
  let items:Array<{slug:string;title:string;language:Locale;publishedAt:string}>=[];
  try{
    const r=await env.DB.prepare("SELECT slug,title,language,created_at,body,sources_json FROM articles WHERE status='PUBLISHED' ORDER BY created_at DESC LIMIT 1000").all<any>();
    items=(r.results||[]).filter((x:any)=>{
      const published=Date.parse(String(x.created_at||""));
      const body=String(x.body||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();
      let sources:any[]=[];
      try{const parsed=JSON.parse(String(x.sources_json||"[]"));sources=Array.isArray(parsed)?parsed:[]}catch{}
      // Count distinct HTTPS source hosts, not publisher display labels: imported
      // records often have valid source URLs but omit the optional publisher field.
      const hosts=new Set(sources.flatMap((source:any)=>{
        try{
          const url=new URL(String(source?.url||""));
          if(url.protocol!=="https:"||url.username||url.password)return [];
          const host=url.hostname.toLowerCase().replace(/^www\./,"").replace(/\.$/,"");
          if(!host||host==="localhost"||host.endsWith(".localhost"))return [];
          return [host];
        }catch{return []}
      }));
      // Stories live in topical sections, not necessarily a section named "news".
      // Google News entries must be recent, real published articles with independent
      // evidence; do not impose an arbitrary 1,800-character minimum or require
      // optional publisher labels that are absent from some valid source records.
      return Boolean(
        x.slug &&
        String(x.title||"").trim().length>=8 &&
        (x.language==="ar"||x.language==="en") &&
        Number.isFinite(published) &&
        published<=now+5*60*1000 &&
        now-published<=48*60*60*1000 &&
        body.length>=500 &&
        hosts.size>=2
      );
    }).map((x:any)=>({
      slug:String(x.slug),
      title:String(x.title).trim(),
      language:x.language as Locale,
      publishedAt:new Date(String(x.created_at)).toISOString()
    }));
  }catch(error){
    console.error("news_sitemap_database_query_failed", error instanceof Error ? error.message : String(error));
    return retryableUnavailable("News sitemap temporarily unavailable; retry later.");
  }
  // Stable de-duplication prevents duplicated URLs from creating invalid news entries.
  const unique=new Map<string,typeof items[number]>();
  for(const item of items)unique.set(item.language+":"+item.slug,item);
  return text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">'+[...unique.values()].map(x=>{
    const url=ORIGIN+"/article/"+encodeURIComponent(x.slug)+"?lang="+x.language;
    return '<url><loc>'+xml(url)+'</loc><news:news><news:publication><news:name>BAYAN</news:name><news:language>'+xml(x.language)+'</news:language></news:publication><news:publication_date>'+xml(x.publishedAt)+'</news:publication_date><news:title>'+xml(x.title)+'</news:title></news:news></url>';
  }).join("")+"</urlset>","application/xml;charset=utf-8");
}
