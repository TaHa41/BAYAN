import {ORIGIN,SECTIONS} from "./config";
import type {Env,Locale} from "./types";
import {text}from"./http";


export function robots(){
  // Keep robots.txt limited to directives recognized by crawlers.
  return text("User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin\nDisallow: /saved\nSitemap: "+ORIGIN+"/sitemap.xml\nSitemap: "+ORIGIN+"/news-sitemap.xml\n");
}
const xml=(s:string)=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
export async function sitemap(env:Env){
  let articleUrls:Array<{url:string;lastmod?:string}>=[];
  try{
    const r=await env.DB.prepare("SELECT slug,language,updated_at FROM articles WHERE status='PUBLISHED' ORDER BY updated_at DESC LIMIT 1000").all<any>();
    articleUrls=(r.results||[]).map((x:any)=>({
      url:ORIGIN+"/article/"+encodeURIComponent(x.slug)+"?lang="+encodeURIComponent(x.language),
      lastmod:String(x.updated_at||"")
    }));
  }catch{}
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
      const body=String(x.body||"").trim();
      const headings=(body.match(/^#{1,3}\\s+.+$/gm)||[]).length;
      const paragraphs=body.split(/\\n\\s*\\n/).map((part:string)=>part.trim()).filter((part:string)=>part.length>=65&&!/^#{1,4}\\s/.test(part)&&!/^([-*+] |\\d+[.)] )/.test(part));
      const uniqueParagraphs=new Set(paragraphs.map((part:string)=>part.normalize("NFKC").toLowerCase().replace(/[^\\p{L}\\p{N}]+/gu," ").trim()));
      let sources:any[]=[];
      try{const parsed=JSON.parse(String(x.sources_json||"[]"));sources=Array.isArray(parsed)?parsed:[]}catch{}
      const hosts=new Set(sources.map((source:any)=>{try{return new URL(String(source.url||"")).hostname.toLowerCase().replace(/^www\\./,"")}catch{return""}}).filter(Boolean));
      const publishers=new Set(sources.map((source:any)=>String(source.publisher||"").trim().toLowerCase()).filter(Boolean));
      return Boolean(x.slug&&x.title&&(x.language==="ar"||x.language==="en")&&Number.isFinite(published)&&published<=now+5*60*1000&&now-published<=48*60*60*1000&&body.length>=1800&&headings>=4&&paragraphs.length>=5&&uniqueParagraphs.size>=5&&hosts.size>=2&&publishers.size>=2);
    }).map((x:any)=>({slug:String(x.slug),title:String(x.title),language:x.language as Locale,publishedAt:new Date(String(x.created_at)).toISOString()}));
  }catch{}
  return text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">'+items.map(x=>{
    const url=ORIGIN+"/article/"+encodeURIComponent(x.slug)+"?lang="+x.language;
    return '<url><loc>'+xml(url)+'</loc><news:news><news:publication><news:name>BAYAN</news:name><news:language>'+xml(x.language)+'</news:language></news:publication><news:publication_date>'+xml(x.publishedAt)+'</news:publication_date><news:title>'+xml(x.title)+'</news:title></news:news></url>';
  }).join("")+"</urlset>","application/xml;charset=utf-8");
}
