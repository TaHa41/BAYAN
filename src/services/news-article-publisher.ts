import type {Env,Locale} from "../types";
import {search} from "./search";

// One bounded, evidence-gated article attempt per cron tick keeps the Worker responsive.
export async function publishNextArchivedNewsArticle(env:Env){
  const now=Date.now();
  const cutoff=new Date(now-48*60*60*1000).toISOString();
  const retryBefore=new Date(now-30*60*1000).toISOString();
  const lowEvidenceRetryBefore=new Date(now-6*60*60*1000).toISOString();
  const setting=await env.DB.prepare("SELECT value FROM admin_settings WHERE key=? LIMIT 1").bind("news_article_queue_language").first<any>().catch(()=>null);
  const preferred:Locale=String(setting?.value||"ar")==="en"?"en":"ar";
  const futureLimit=new Date(now+5*60*1000).toISOString();
  const pick=async(language:Locale)=>env.DB.prepare("SELECT id,title,summary,language,article_attempts FROM news_archive WHERE language=? AND article_slug IS NULL AND article_attempts<2 AND length(summary)>=120 AND published_at>=? AND published_at<=? AND fetched_at>=? AND (article_last_attempt_at IS NULL OR article_last_attempt_at<=?) AND (article_last_reason IS NULL OR article_last_reason!='skipped_low_evidence' OR article_last_attempt_at<=?) ORDER BY CASE WHEN article_last_reason='draft_not_verified' THEN 0 ELSE 1 END,published_at DESC,fetched_at DESC,id DESC LIMIT 1").bind(language,cutoff,futureLimit,cutoff,retryBefore,lowEvidenceRetryBefore).first<any>();
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
    const result=await search(env,title,language,{publish:true,draft:true,images:true,publicationContext:String(row.summary||"").slice(0,500)});
    const slug=String(result.articleSlug||"").trim();
    if(!slug){
      const sourceRecords=(Array.isArray(result.results)?result.results:[]).flatMap((item:any)=>Array.isArray(item.sources)?item.sources:[]);
      const independentSources=sourceRecords.filter((source:any)=>{const publisher=String(source.publisher||"").trim().toLowerCase();const url=String(source.url||"");if(!url||["wikipedia","wikidata","google news","bing","duckduckgo","bayan recent news archive"].some(label=>publisher.includes(label)))return false;try{const parsed=new URL(url);const host=parsed.hostname.toLowerCase().replace(/^www[.]/,"");return parsed.protocol==="https:"&&!["wikipedia.org","wikidata.org","news.google.com","bing.com","duckduckgo.com"].some(domain=>host===domain||host.endsWith("."+domain))}catch{return false}});
      const independentPublisherCount=new Set(independentSources.map((source:any)=>String(source.publisher||new URL(String(source.url)).hostname).trim().toLowerCase())).size;
      const independentHostCount=new Set(independentSources.map((source:any)=>{try{return new URL(String(source.url)).hostname.toLowerCase().replace(/^www[.]/,"")}catch{return ""}}).filter(Boolean)).size;
      const attempts=Array.isArray(result.providerAttempted)?result.providerAttempted.map((value:any)=>String(value)):[];
      const expandedSearchAttempted=attempts.some((value:string)=>value.includes("Expanded topic variants")||value.includes("Expanded variant "));
      const providerFailures=attempts.filter((value:string)=>/timeout|failed|unavailable|HTTP [45][0-9]{2}/i.test(value)).map((value:string)=>value.split(" ").slice(0,3).join(" ")).slice(0,3);
      const providerDiagnostic=attempts.slice(-8).map((value:string)=>value.replace(/https?:\/\/[^\s]+/g,"[url]").replace(/\b(?:sk-[A-Za-z0-9_-]{8,}|Bearer\s+\S+)\b/gi,"[redacted]").replace(/\s+/g," ").slice(0,100)).join(" | ").slice(0,350);
      if(providerDiagnostic)await env.DB.prepare("INSERT INTO runtime_events(level,kind,message,created_at) VALUES(?,?,?,?)").bind("WARN","news_archive_provider_diagnostics",providerDiagnostic,new Date().toISOString()).run().catch(()=>undefined);
      const publishReason=String(result.publishReason||"publish_rejected").slice(0,350);
      const detail=String(result.publishReasonDetail||"detail_not_provided").replace(/https?:\/\/[^\s]+/g,"[url]").replace(/\b(?:sk-[A-Za-z0-9_-]{8,}|Bearer\s+\S+)\b/gi,"[redacted]").replace(/\s+/g," ").slice(0,300);
      const sourceCount=new Set(sourceRecords.map((source:any)=>String(source.url||"").trim()).filter(Boolean)).size;
      const queueStatus=publishReason==="no_independent_sources"?"skipped_low_evidence":publishReason;
      if(queueStatus==="skipped_low_evidence"){
        // A low-evidence item is deferred, not burned: preserve its history,
        // release one claim attempt, and retry only after six hours.
        await env.DB.prepare("UPDATE news_archive SET article_attempts=MAX(0,article_attempts-1),article_last_reason='skipped_low_evidence',article_last_detail=? WHERE id=?").bind(("no_independent_sources; "+detail).slice(0,350),id).run();
      }else{
        await env.DB.prepare("UPDATE news_archive SET article_last_reason=?,article_last_detail=? WHERE id=?").bind(publishReason,detail,id).run();
      }
      const gateEvent=("id="+id+" publishReason="+publishReason+" queueStatus="+queueStatus+" detail="+detail+" independentPublishers="+independentPublisherCount+" independentHosts="+independentHostCount+" sourceCount="+sourceCount).slice(0,350);
      try{await env.DB.prepare("INSERT INTO runtime_events(level,kind,message,created_at) VALUES(?,?,?,?)").bind("WARN","news_archive_publication_gate",gateEvent,new Date().toISOString()).run()}catch{}
      return{status:"attempted_no_publish" as const,id,language,searchStatus:result.status,publishReason,queueStatus,publishReasonDetail:detail,resultCount:Array.isArray(result.results)?result.results.length:0,sourceCount,independentPublisherCount,independentHostCount,expandedSearchAttempted,providerFailures,providers:Array.isArray(result.providers)?result.providers.slice(0,4):[]};
    }
    await env.DB.prepare("UPDATE news_archive SET article_slug=?,article_last_reason=NULL,article_last_detail=NULL WHERE id=?").bind(slug,id).run();
    return{status:"published" as const,id,language,slug};
  }catch(error){
    const detail=String((error as {message?:string})?.message||error||"unknown").replace(/https?:\/\/[^\s]+/g,"[url]").replace(/\b(?:sk-[A-Za-z0-9_-]{8,}|Bearer\s+\S+)\b/gi,"[redacted]").slice(0,300);
    const publishReason=/429|rate.?limit|timeout|timed out|abort|quota|neurons|overload|openai|workers ai|ai unavailable/i.test(detail)?"ai_unavailable":"exception:"+detail;
    const detailReason=("publisher_exception:"+detail).slice(0,350);
    try{await env.DB.prepare("UPDATE news_archive SET article_last_reason=?,article_last_detail=? WHERE id=?").bind(publishReason,detailReason,id).run()}catch{}
    try{await env.DB.prepare("INSERT INTO runtime_events(level,kind,message,created_at) VALUES(?,?,?,?)").bind("WARN","news_archive_article_generation",(publishReason+" "+detailReason).slice(0,350),new Date().toISOString()).run()}catch{}
    return{status:"attempted_failed" as const,id,language,publishReason,publishReasonDetail:detailReason};
  }
}
