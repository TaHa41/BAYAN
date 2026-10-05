import type {Runtime,Lang} from "./types";
import {json,headers,auth} from "./security";
import {listArticles,getArticle} from "./db";
import {search} from "./search";
import {weather,fx} from "./live";
const html=async(rt:Runtime)=>rt.env.ASSETS?.fetch(new URL("/index.html",rt.request))||new Response("BAYAN",{status:503});
export async function handle(rt:Runtime){
 const u=new URL(rt.request.url), p=u.pathname, lang=(u.searchParams.get("lang")==="en"||u.pathname.startsWith("/en"))?"en":"ar";
 if(p.startsWith("/api/")){
  try{
   if(p==="/api/health"||p==="/health") return json({ok:true,service:"bayan-v3",time:new Date().toISOString()},200,headers());
   if(p==="/api/features") return json({ok:true,version:"3",features:["search","articles","news","trends","prices","weather","tools","saved","contribute","admin","telegram","analytics"]},200,headers());
   if(p==="/api/articles") return json({ok:true,items:await listArticles(rt.env,lang,u.searchParams.get("section")||undefined)},200,headers());
   if(p==="/api/article") return json({ok:true,article:await getArticle(rt.env,u.searchParams.get("slug")||"",lang)},200,headers());
   if(p==="/api/search") return json({ok:true,...await search(rt.env,u.searchParams.get("q")||"",lang)},200,headers());
   if(p==="/api/weather") return json({ok:true,data:await weather()},200,headers());
   if(p==="/api/fx") return json({ok:true,data:await fx()},200,headers());
   if(p==="/api/admin/status") return auth(rt.request,rt.env)?json({ok:true,authenticated:true},200,headers()):json({ok:false,error:"Unauthorized"},401,headers());
   return json({ok:false,error:"Not Found"},404,headers());
  }catch(e){return json({ok:false,error:"Service temporarily unavailable"},500,headers())}
 }
 const r=await html(rt); const h=new Headers(r.headers); Object.entries(headers()).forEach(([k,v])=>h.set(k,v)); return new Response(r.body,{status:r.status,headers:h});
}
