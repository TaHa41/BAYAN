import type {Env,Article} from "./types";
const map=(r:any,lang:"ar"|"en"):Article=>({slug:r.slug,title:r.title,summary:r.summary||"",body:r.body||"",section:r.section||"world",lang,imageUrl:r.hero_image_url,publishedAt:r.published_at||r.updated_at,updatedAt:r.updated_at,sourceCount:Number(r.source_count||0),verified:Number(r.verified||0)===1,evidence:JSON.parse(r.sources_json||"[]")});
export async function listArticles(env:Env,lang:"ar"|"en",section?:string){
 if(!env.DB)return [];
 let q="select slug,title,summary,body,section,hero_image_url,published_at,updated_at,source_count,verified,sources_json from knowledge_articles where language=? and status='PUBLISHED'";
 const args:any[]=[lang]; if(section){q+=" and section=?";args.push(section)}
 q+=" order by coalesce(published_at,updated_at,created_at) desc limit 24";
 const r=await env.DB.prepare(q).bind(...args).all<any>(); return (r.results||[]).map(x=>map(x,lang));
}
export async function getArticle(env:Env,slug:string,lang:"ar"|"en"){
 if(!env.DB)return null;
 const r=await env.DB.prepare("select slug,title,summary,body,section,hero_image_url,published_at,updated_at,source_count,verified,sources_json from knowledge_articles where slug=? and language=? and status='PUBLISHED' limit 1").bind(slug,lang).first<any>();
 return r?map(r,lang):null;
}
export async function save(env:Env,visitor:string,slug:string){if(!env.DB)return false;await env.DB.prepare("insert or ignore into saved_articles(visitor_id,article_slug,created_at) values(?,?,?)").bind(visitor,slug,new Date().toISOString()).run();return true}
export async function unsave(env:Env,visitor:string,slug:string){if(!env.DB)return false;await env.DB.prepare("delete from saved_articles where visitor_id=? and article_slug=?").bind(visitor,slug).run();return true}
export async function saved(env:Env,visitor:string,lang:"ar"|"en"){if(!env.DB)return [];const r=await env.DB.prepare("select a.slug,a.title,a.summary,a.body,a.section,a.hero_image_url,a.published_at,a.updated_at,a.source_count,a.verified,a.sources_json from saved_articles s join knowledge_articles a on a.slug=s.article_slug where s.visitor_id=? and a.language=? and a.status='PUBLISHED' order by s.created_at desc limit 50").bind(visitor,lang).all<any>();return (r.results||[]).map(x=>map(x,lang))}
export async function contribution(env:Env,visitor:string,title:string,body:string,source?:string){if(!env.DB)return false;await env.DB.prepare("insert into visitor_contributions(visitor_id,title,body,source,created_at) values(?,?,?,?,?)").bind(visitor,title,body,source||null,new Date().toISOString()).run();return true}
export async function analytics(env:Env,visitor:string,event:string,path:string,lang:string,query?:string){if(!env.DB)return;await env.DB.prepare("insert into bayan_analytics_events(visitor_id,event_type,path,query,language,created_at) values(?,?,?,?,?,?)").bind(visitor,event,path,query||null,lang,new Date().toISOString()).run()}
