import type {Env,Article} from "./types";
export async function listArticles(env:Env,lang:"ar"|"en",section?:string){
 if(!env.DB) return [];
 let q="select * from knowledge_articles where language=? and status='published'";
 const args:any[]=[lang];
 if(section){q+=" and section=?";args.push(section)}
 q+=" order by coalesce(published_at,updated_at,created_at) desc limit 24";
 const r=await env.DB.prepare(q).bind(...args).all<any>();
 return (r.results||[]).map(row=>({slug:row.slug,title:row.title,summary:row.summary||"",body:row.body||"",section:row.section||"world",lang, imageUrl:row.hero_image_url||row.image_url,publishedAt:row.published_at,updatedAt:row.updated_at,sourceCount:Number(row.source_count||0),verified:row.verified===1,evidence:JSON.parse(row.sources_json||"[]")})) as Article[];
}
export async function getArticle(env:Env,slug:string,lang:"ar"|"en"){
 if(!env.DB) return null;
 const r=await env.DB.prepare("select * from knowledge_articles where slug=? and language=? and status='published' limit 1").bind(slug,lang).first<any>();
 if(!r)return null;
 return {slug:r.slug,title:r.title,summary:r.summary||"",body:r.body||"",section:r.section||"world",lang,imageUrl:r.hero_image_url||r.image_url,publishedAt:r.published_at,updatedAt:r.updated_at,sourceCount:Number(r.source_count||0),verified:r.verified===1,evidence:JSON.parse(r.sources_json||"[]")};
}
