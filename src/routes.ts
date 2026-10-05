import{Env,json,admin,unauthorized,clean}from"./core";import{news}from"./news";import{answer}from"./ai";import{getNews,getArticle}from"./db";
export async function api(req:Request,env:Env,url:URL){const p=url.pathname;
if(p==="/api/article"){const slug=clean(url.searchParams.get("slug"),300);const item=await getArticle(env,slug);return item?json({ok:true,item}):json({ok:false,error:"not_found"},404)}\nif(p==="/api/health")return json({ok:true,version:env.BAYAN_VERSION||"2.0",commit:env.BAYAN_COMMIT_SHA||null,time:new Date().toISOString()});
if(p==="/api/news"){const items=await news(env);return json({ok:true,items,providers:["RSS"],updatedAt:new Date().toISOString()})}
if(p==="/api/search"){const q=clean(url.searchParams.get("q"),500);if(!q)return json({ok:false,error:"missing_query"},400);const items=await getNews(env,20);const ev=items.filter((x:any)=>JSON.stringify(x).toLowerCase().includes(q.toLowerCase())).slice(0,8);return json({ok:true,query:q,results:ev})}
if(p==="/api/ask"){const q=clean(url.searchParams.get("q"),1000);if(!q)return json({ok:false,error:"missing_query"},400);const items=await getNews(env,20);const ev=items.filter((x:any)=>JSON.stringify(x).toLowerCase().includes(q.toLowerCase())).slice(0,8);return json({ok:true,query:q,...await answer(env,q,ev)})}
if(p.startsWith("/api/admin/")){if(!admin(req,env))return unauthorized();if(p==="/api/admin/news")return json({ok:true,items:await getNews(env,100)});return json({ok:true})}
return json({ok:false,error:"not_found"},404)}
