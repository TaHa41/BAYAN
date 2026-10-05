import type {Runtime} from "./types";
import {json,headers,auth} from "./security";
import {listArticles,getArticle,save,unsave,saved,contribution,analytics} from "./db";
import {search} from "./search";
import {weather,fx} from "./live";
const visitor=(r:Request)=>r.headers.get("x-bayan-visitor")||"anonymous";
const page=async(rt:Runtime)=>rt.env.ASSETS?.fetch(new URL("/index.html",rt.request))||new Response("BAYAN",{status:503});
export async function handle(rt:Runtime){
 const u=new URL(rt.request.url),p=u.pathname,lang=u.searchParams.get("lang")==="en"?"en":"ar";
 if(p.startsWith("/api/")){
  try{
   if(p==="/api/health"||p==="/health")return json({ok:true,service:"bayan-v3",time:new Date().toISOString()},200,headers());
   if(p==="/api/features")return json({ok:true,version:"3",features:["search","articles","news","trends","prices","weather","tools","saved","contribute","admin","telegram","analytics"]},200,headers());
   if(p==="/api/articles")return json({ok:true,items:await listArticles(rt.env,lang,u.searchParams.get("section")||undefined)},200,headers());
   if(p==="/api/article")return json({ok:true,article:await getArticle(rt.env,u.searchParams.get("slug")||"",lang)},200,headers());
   if(p==="/api/search"){const q=u.searchParams.get("q")||"";await analytics(rt.env,visitor(rt.request),"search",p,lang,q);return json({ok:true,...await search(rt.env,q,lang)},200,headers())}
   if(p==="/api/weather")return json({ok:true,data:await weather()},200,headers());
   if(p==="/api/fx")return json({ok:true,data:await fx()},200,headers());
   if(p==="/api/saved"&&rt.request.method==="GET")return json({ok:true,items:await saved(rt.env,visitor(rt.request),lang)},200,headers());
   if((p==="/api/save"||p==="/api/saved")&&rt.request.method==="POST"){const b:any=await rt.request.json();b.remove?await unsave(rt.env,visitor(rt.request),String(b.slug||"")):await save(rt.env,visitor(rt.request),String(b.slug||""));return json({ok:true},200,headers())}
   if(p==="/api/contributions"&&rt.request.method==="POST"){const b:any=await rt.request.json();if(!b.title||!b.body)return json({ok:false,error:"title and body are required"},400,headers());await contribution(rt.env,visitor(rt.request),String(b.title),String(b.body),b.source?String(b.source):undefined);return json({ok:true,status:"PENDING_REVIEW"},201,headers())}
   if(p==="/api/analytics/event"&&rt.request.method==="POST"){const b:any=await rt.request.json();await analytics(rt.env,visitor(rt.request),String(b.event||"event"),p,lang,b.query?String(b.query):undefined);return json({ok:true},204,headers())}
   if(p==="/api/admin/status")return auth(rt.request,rt.env)?json({ok:true,authenticated:true},200,headers()):json({ok:false,error:"Unauthorized"},401,headers());
   if(p==="/api/analytics"||p==="/api/diagnostics")return auth(rt.request,rt.env)?json({ok:true,private:true},200,headers()):json({ok:false,error:"Unauthorized"},401,headers());
   return json({ok:false,error:"Not Found"},404,headers())
  }catch{ return json({ok:false,error:"Service temporarily unavailable"},500,headers())}
 }
 const r=await page(rt),h=new Headers(r.headers);Object.entries(headers()).forEach(([k,v])=>h.set(k,v));return new Response(r.body,{status:r.status,headers:h});
}