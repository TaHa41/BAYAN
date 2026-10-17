import type {Env,Locale} from "../types";
import {search} from "./search";
import {recordRuntimeEventLimited} from "../runtime-events";

const DAILY_D1_READ_CALL_LIMIT=12000;
const D1_READ_RESERVATION=120;

// Rank a bounded, recent candidate set without deleting archive rows. Exact normalized
// title duplicates are represented once; publisher diversity is counted by source host.
const normalizeArchiveTitle=(value:string)=>String(value||"").normalize("NFKC").toLocaleLowerCase()
  .replace(/[\\u064B-\\u065F\\u0670]/g,"").replace(/[^\\p{L}\\p{N}]+/gu," ").trim().replace(/\\s+/g," ");
const archivePublisherKey=(row:any)=>{
  try{const host=new URL(String(row.url||"")).hostname.toLowerCase().replace(/^www\\./,"");if(host)return host}catch{}
  return String(row.publisher||"").trim().toLocaleLowerCase();
};
export function rankNewsArchiveCandidates(rows:any[],now=Date.now()){
  const cutoff=now-48*60*60*1000;
  const futureLimit=now+5*60*1000;
  const eligible=rows.filter(row=>{
    const published=Date.parse(String(row.published_at||""));
    return Number(row.id)>0&&String(row.title||"").trim()&&!row.article_slug&&Number(row.article_attempts||0)<2
      &&Number.isFinite(published)&&published>=cutoff&&published<=futureLimit;
  });
  const groups=new Map<string,any[]>();
  for(const row of eligible){
    const titleKey=normalizeArchiveTitle(row.title)||("id:"+row.id);
    const group=groups.get(titleKey)||[];
    group.push(row);groups.set(titleKey,group);
  }
  const ranked:any[]=[];
  let duplicates=0;
  for(const group of groups.values()){
    if(group.length>1)duplicates+=group.length-1;
    const publishers=new Set(group.map(archivePublisherKey).filter(Boolean));
    const ordered=[...group].sort((a,b)=>{
      const dateDelta=Date.parse(String(b.published_at||""))-Date.parse(String(a.published_at||""));
      if(dateDelta)return dateDelta;
      const imageDelta=Number(Boolean(String(b.image_url||"").trim()))-Number(Boolean(String(a.image_url||"").trim()));
      return imageDelta||Number(b.id)-Number(a.id);
    });
    ranked.push({...ordered[0],independentPublisherCount:publishers.size,duplicateArchiveRows:group.length-1});
  }
  ranked.sort((a,b)=>{
    const dateDelta=Date.parse(String(b.published_at||""))-Date.parse(String(a.published_at||""));
    if(dateDelta)return dateDelta;
    const publisherDelta=Number(b.independentPublisherCount||0)-Number(a.independentPublisherCount||0);
    if(publisherDelta)return publisherDelta;
    const imageDelta=Number(Boolean(String(b.image_url||"").trim()))-Number(Boolean(String(a.image_url||"").trim()));
    return imageDelta||Date.parse(String(b.fetched_at||""))-Date.parse(String(a.fetched_at||""))||Number(b.id)-Number(a.id);
  });
  return{candidates:ranked,duplicateRows:duplicates,eligibleRows:eligible.length};
}
type ReadCounter={reads:number;limit:number};
const wrapReadStatement=(statement:any,sql:string,counter:ReadCounter):any=>new Proxy(statement,{
  get(target,property){
    if(property==="bind")return(...args:any[])=>wrapReadStatement(target.bind(...args),sql,counter);
    const isReadMethod=property==="first"||property==="all"||property==="raw";
    const isReadRun=property==="run"&&/^\\s*(SELECT|WITH|PRAGMA|EXPLAIN)\\b/i.test(sql);
    if(isReadMethod||isReadRun)return async(...args:any[])=>{
      counter.reads++;
      if(counter.reads>counter.limit)throw new Error("news_d1_read_call_budget_exceeded");
      return target[property](...args);
    };
    const value=target[property];
    return typeof value==="function"?value.bind(target):value;
  }
});
const wrapReadBudgetEnv=(env:Env,counter:ReadCounter):Env=>{
  const DB=new Proxy(env.DB as any,{
    get(target,property){
      if(property==="prepare")return(sql:string)=>wrapReadStatement(target.prepare(sql),sql,counter);
      const value=target[property];
      return typeof value==="function"?value.bind(target):value;
    }
  });
  return {...env,DB:DB as Env["DB"]};
};
const reserveDailyD1ReadCalls=async(env:Env)=>{
  const day=new Date().toISOString().slice(0,10),stamp=new Date().toISOString();
  try{
    const row=await env.DB.prepare("INSERT INTO admin_settings(key,value,updated_at) VALUES('news_d1_read_calls_daily',?,?) ON CONFLICT(key) DO UPDATE SET value=CASE WHEN substr(admin_settings.value,1,10)=substr(excluded.value,1,10) THEN substr(admin_settings.value,1,11)||CAST(CAST(substr(admin_settings.value,12) AS INTEGER)+120 AS TEXT) ELSE excluded.value END,updated_at=excluded.updated_at WHERE substr(admin_settings.value,1,10)!=substr(excluded.value,1,10) OR CAST(substr(admin_settings.value,12) AS INTEGER)+120<=12000 RETURNING value").bind(day+":"+D1_READ_RESERVATION,stamp).first<any>();
    return row?{day,stamp}:null;
  }catch(error){
    await recordRuntimeEventLimited(env,"news_d1_budget","budget_counter_unavailable","background publication blocked because D1 read budget accounting failed");
    return null;
  }
};
const settleDailyD1ReadCalls=async(env:Env,day:string,actualReads:number)=>{
  try{
    await env.DB.prepare("UPDATE admin_settings SET value=substr(value,1,11)||CAST(MAX(0,CAST(substr(value,12) AS INTEGER)-120+?) AS TEXT),updated_at=? WHERE key='news_d1_read_calls_daily' AND substr(value,1,10)=?").bind(Math.min(D1_READ_RESERVATION,Math.max(0,actualReads)),new Date().toISOString(),day).run();
    await recordRuntimeEventLimited(env,"news_d1_budget","background_read_usage",JSON.stringify({day,readCalls:Math.min(D1_READ_RESERVATION,Math.max(0,actualReads)),dailyLimit:DAILY_D1_READ_CALL_LIMIT}));
  }catch(error){await recordRuntimeEventLimited(env,"news_d1_budget","usage_persist_failed","could not persist background D1 read usage");}
};

// One bounded, evidence-gated article attempt per cron tick keeps the Worker responsive.
async function publishNextArchivedNewsArticleInner(env:Env){
  const now=Date.now();
  const cutoff=new Date(now-48*60*60*1000).toISOString();
  const retryBefore=new Date(now-30*60*1000).toISOString();
  const lowEvidenceRetryBefore=new Date(now-6*60*60*1000).toISOString();
  let setting:any=null;try{setting=await env.DB.prepare("SELECT value FROM admin_settings WHERE key=? LIMIT 1").bind("news_article_queue_language").first<any>()}catch(error){await recordRuntimeEventLimited(env,"news_queue_settings","settings_read_failed",error)}
  const preferred:Locale=String(setting?.value||"ar")==="en"?"en":"ar";
  const futureLimit=new Date(now+5*60*1000).toISOString();
  const pick=async(language:Locale)=>{
    const result=await env.DB.prepare("SELECT id,url,title,summary,language,article_attempts,article_last_attempt_at,article_last_reason,publisher,image_url,published_at,fetched_at,article_slug FROM news_archive WHERE language=? AND article_slug IS NULL AND article_attempts<2 AND length(summary)>=120 AND published_at>=? AND published_at<=? AND fetched_at>=? AND (article_last_attempt_at IS NULL OR article_last_attempt_at<=?) AND (article_last_reason IS NULL OR article_last_reason!='skipped_low_evidence' OR article_last_attempt_at<=?) ORDER BY published_at DESC LIMIT 100").bind(language,cutoff,futureLimit,cutoff,retryBefore,lowEvidenceRetryBefore).all<any>();
    const ranked=rankNewsArchiveCandidates(result.results||[],now);
    if(ranked.duplicateRows)await recordRuntimeEventLimited(env,"news_archive_queue","duplicate_candidates_skipped","language="+language+";duplicate_rows="+ranked.duplicateRows+";bounded_candidates="+ranked.eligibleRows);
    return ranked.candidates[0]||null;
  };
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
  try{await env.DB.prepare("INSERT INTO admin_settings(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at").bind("news_article_queue_language",nextLanguage,stamp).run()}catch(error){await recordRuntimeEventLimited(env,"news_queue_settings","language_rotation_failed",error)}
  const selectedPublisher=String(row.publisher||"").trim().slice(0,160);
  if(selectedPublisher)try{await env.DB.prepare("INSERT INTO admin_settings(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at").bind("news_article_queue_last_publisher",selectedPublisher,stamp).run()}catch(error){await recordRuntimeEventLimited(env,"news_queue_settings","publisher_rotation_failed",error)}
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
      if(providerDiagnostic)await recordRuntimeEventLimited(env,"news_archive_provider_diagnostics","provider_diagnostics",providerDiagnostic);
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
      await recordRuntimeEventLimited(env,"news_archive_publication_gate",publishReason,gateEvent);
      return{status:"attempted_no_publish" as const,id,language,searchStatus:result.status,publishReason,queueStatus,publishReasonDetail:detail,resultCount:Array.isArray(result.results)?result.results.length:0,sourceCount,independentPublisherCount,independentHostCount,expandedSearchAttempted,providerFailures,providers:Array.isArray(result.providers)?result.providers.slice(0,4):[]};
    }
    const detail=String(result.publishReasonDetail||"draft_verified_metrics_unavailable").replace(/https?:\/\/[^\s]+/g,"[url]").replace(/\b(?:sk-[A-Za-z0-9_-]{8,}|Bearer\s+\S+)\b/gi,"[redacted]").replace(/\s+/g," ").slice(0,300);
    await env.DB.prepare("UPDATE news_archive SET article_slug=?,article_last_reason=NULL,article_last_detail=? WHERE id=?").bind(slug,detail,id).run();
    await recordRuntimeEventLimited(env,"news_archive_article_generation","article_published",("id="+id+";language="+language+";"+detail).slice(0,350));
    return{status:"published" as const,id,language,slug,publishReasonDetail:detail};
  }catch(error){
    const detail=String((error as {message?:string})?.message||error||"unknown").replace(/https?:\/\/[^\s]+/g,"[url]").replace(/\b(?:sk-[A-Za-z0-9_-]{8,}|Bearer\s+\S+)\b/gi,"[redacted]").slice(0,300);
    const publishReason=/429|rate.?limit|timeout|timed out|abort|quota|neurons|overload|openai|workers ai|ai unavailable/i.test(detail)?"ai_unavailable":"exception:"+detail;
    const detailReason=("publisher_exception:"+detail).slice(0,350);
    try{await env.DB.prepare("UPDATE news_archive SET article_last_reason=?,article_last_detail=? WHERE id=?").bind(publishReason,detailReason,id).run()}catch(error){await recordRuntimeEventLimited(env,"news_archive_reason_persist","reason_persist_failed",error)}
    await recordRuntimeEventLimited(env,"news_archive_article_generation",publishReason,detailReason);
    return{status:"attempted_failed" as const,id,language,publishReason,publishReasonDetail:detailReason};
  }
}

export async function publishNextArchivedNewsArticle(env:Env){
  const reservation=await reserveDailyD1ReadCalls(env);
  if(!reservation){
    await recordRuntimeEventLimited(env,"news_d1_budget","daily_read_budget_exhausted","UTC daily background D1 read-call limit reached");
    return {status:"budget_exhausted" as const};
  }
  const counter:ReadCounter={reads:0,limit:D1_READ_RESERVATION};
  try{
    return await publishNextArchivedNewsArticleInner(wrapReadBudgetEnv(env,counter));
  }finally{
    await settleDailyD1ReadCalls(env,reservation.day,counter.reads);
  }
}
