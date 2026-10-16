import type {Env,Locale} from "../types";
import {search} from "./search";

// One bounded, evidence-gated article attempt per cron tick keeps the Worker responsive.
export async function publishNextArchivedNewsArticle(env:Env){
  const now=Date.now();
  const cutoff=new Date(now-48*60*60*1000).toISOString();
  const retryBefore=new Date(now-30*60*1000).toISOString();
  const setting=await env.DB.prepare("SELECT value FROM admin_settings WHERE key=? LIMIT 1").bind("news_article_queue_language").first<any>().catch(()=>null);
  const preferred:Locale=String(setting?.value||"ar")==="en"?"en":"ar";
  const futureLimit=new Date(now+5*60*1000).toISOString();
  const pick=async(language:Locale)=>env.DB.prepare("SELECT id,title,language,article_attempts FROM news_archive WHERE language=? AND article_slug IS NULL AND article_attempts<2 AND length(summary)>=120 AND published_at>=? AND published_at<=? AND fetched_at>=? AND (article_last_attempt_at IS NULL OR article_last_attempt_at<=?) ORDER BY published_at DESC,fetched_at DESC,id DESC LIMIT 1").bind(language,cutoff,futureLimit,cutoff,retryBefore).first<any>();
  let row=await pick(preferred);
  if(!row)row=await pick(preferred==="ar"?"en":"ar");
  if(!row)return{status:"idle" as const};
  const id=Number(row.id),language=row.language as Locale,title=String(row.title||"").trim();
  if(!Number.isInteger(id)||id<1||!title)return{status:"invalid_queue_item" as const};
  const stamp=new Date(now).toISOString();
  const claim=await env.DB.prepare("UPDATE news_archive SET article_attempts=article_attempts+1,article_last_attempt_at=? WHERE id=? AND article_slug IS NULL AND article_attempts<2").bind(stamp,id).run();
  if(Number((claim.meta as any)?.changes||0)!==1)return{status:"already_claimed" as const,id};
  // Persist the next language before drafting so a failed Arabic attempt cannot
  // starve English news forever (and vice versa).
  const nextLanguage:Locale=language==="ar"?"en":"ar";
  await env.DB.prepare("INSERT INTO admin_settings(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at").bind("news_article_queue_language",nextLanguage,stamp).run().catch(()=>undefined);
  try{
    const result=await search(env,title,language,{publish:true,draft:true,images:true});
    const slug=String(result.articleSlug||"").trim();
    if(!slug){
      const publishReason=String(result.publishReason||"publish_rejected").slice(0,350);
      await env.DB.prepare("UPDATE news_archive SET article_last_reason=? WHERE id=?").bind(publishReason,id).run();
      return{status:"attempted_no_publish" as const,id,language,searchStatus:result.status,publishReason,resultCount:Array.isArray(result.results)?result.results.length:0,sourceCount:new Set((result.results||[]).flatMap((item:any)=>item.sources||[]).map((source:any)=>String(source.url||"").trim()).filter(Boolean)).size,providers:Array.isArray(result.providers)?result.providers.slice(0,8):[]};
    }
    await env.DB.prepare("UPDATE news_archive SET article_slug=?,article_last_reason=NULL WHERE id=?").bind(slug,id).run();
    return{status:"published" as const,id,language,slug};
  }catch(error){
    const detail=String((error as {message?:string})?.message||error||"unknown").replace(/https?:\/\/[^\s]+/g,"[url]").replace(/\b(?:sk-[A-Za-z0-9_-]{8,}|Bearer\s+\S+)\b/gi,"[redacted]").slice(0,300);
    const publishReason=/429|rate.?limit|timeout|timed out|abort|quota|neurons|overload|openai|workers ai|ai unavailable/i.test(detail)?"ai_unavailable":"exception:"+detail;
    try{await env.DB.prepare("UPDATE news_archive SET article_last_reason=? WHERE id=?").bind(publishReason.slice(0,350),id).run()}catch{}
    try{await env.DB.prepare("INSERT INTO runtime_events(level,kind,message,created_at) VALUES(?,?,?,?)").bind("WARN","news_archive_article_generation",publishReason.slice(0,350),new Date().toISOString()).run()}catch{}
    return{status:"attempted_failed" as const,id,language,publishReason};
  }
}
