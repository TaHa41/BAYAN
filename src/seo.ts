import {ORIGIN,SECTIONS} from "./config";
import type {Env,Locale} from "./types";
import {text}from"./http";
import {latestNewsForSitemap} from "./services/news";

export function robots(){
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
  const localizedUrls=publicPaths.flatMap((path)=>["ar","en"].map((language)=>({url:ORIGIN+path+"?lang="+language})));
  const urlMap=new Map<string,{url:string;lastmod?:string}>();
  for(const item of [...localizedUrls,...articleUrls])urlMap.set(item.url,item);
  const urls:Array<{url:string;lastmod?:string}>=[...urlMap.values()];
  return text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.map((item)=>{
    const date=Date.parse(String(item.lastmod||""));
    const lastmod=Number.isFinite(date)?'<lastmod>'+xml(new Date(date).toISOString())+'</lastmod>':"";
    return '<url><loc>'+xml(item.url)+'</loc>'+lastmod+'</url>';
  }).join("")+"</urlset>","application/xml;charset=utf-8");
}
export async function newsSitemap(_env:Env){
  let items:Array<any>=[];
  try{
    const [ar,en]=await Promise.all([latestNewsForSitemap("ar"),latestNewsForSitemap("en")]);
    items=[...ar.map(x=>({...x,language:"ar" as Locale})),...en.map(x=>({...x,language:"en" as Locale}))];
  }catch{}
  const now=Date.now();
  items=items.filter(x=>{
    const published=Date.parse(String(x.publishedAt||""));
    return Number.isFinite(published)&&published<=now+5*60*1000&&now-published<=48*60*60*1000&&String(x.title||"").length>0;
  });
  return text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">'+items.map(x=>{
    const url=ORIGIN+"/news?story="+encodeURIComponent(String(x.title||""))+"&lang="+x.language;
    return '<url><loc>'+xml(url)+'</loc><news:news><news:publication><news:name>BAYAN</news:name><news:language>'+xml(x.language)+'</news:language></news:publication><news:publication_date>'+xml(new Date(String(x.publishedAt)).toISOString())+'</news:publication_date><news:title>'+xml(String(x.title||""))+'</news:title></news:news></url>';
  }).join("")+"</urlset>","application/xml;charset=utf-8");
}
