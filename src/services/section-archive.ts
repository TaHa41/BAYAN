// Section archive: every real, sourced search result or opened topic is filed under its own section as a
// reference entry (status 'ARCHIVE'). It is NOT a published article: the public article queries, home feed,
// sitemap and news sitemap all read status='PUBLISHED' only, so archive rows never leak into them and the
// 5-independent-publisher / full-article gates are untouched. Entries link back to a fresh search for the topic.
import type{Env,Locale,Source}from"../types";
import{sections}from"../sections";
import{isD1QuotaError}from"./d1-guard";
import{recordRuntimeEventLimited}from"../runtime-events";

export interface ArchiveInput{title:string;summary:string;sources:Source[];section?:string;language:Locale;imageUrl?:string|null}
const AGGREGATORS=/(?:^|\.)(?:news\.google\.com|msn\.com|flipboard\.com|newsbreak\.com|feedly\.com|smartnews\.com|ground\.news|bing\.com)$/i;
const ARCHIVE_SECTIONS=new Set(sections.map((s)=>s.slug).filter((slug)=>slug!=="news"&&slug!=="prices"));
const hasArabic=(v:string)=>/[\u0600-\u06ff]/.test(v);

/** Stable slug so the same topic is stored once per language (FNV-1a over the normalized title). */
export function archiveSlug(title:string,language:Locale):string{
  const norm=title.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").trim();
  let h=0x811c9dc5;for(let i=0;i<norm.length;i++){h^=norm.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0}
  return"arch-"+h.toString(36)+"-"+language;
}

export function httpsSources(sources:unknown):Source[]{
  if(!Array.isArray(sources))return[];
  const out:Source[]=[];
  for(const s of sources as Source[]){
    try{const u=new URL(String(s?.url||""));if(u.protocol==="https:"&&!AGGREGATORS.test(u.hostname))out.push({...s,url:u.toString()})}catch(error){continue}
  }
  return out.slice(0,5);
}

export function validateArchiveInput(input:ArchiveInput):{ok:true;title:string;summary:string;section:string;sources:Source[]}|{ok:false;reason:string}{
  const title=String(input.title||"").replace(/\s+/g," ").trim().slice(0,200);
  const summary=String(input.summary||"").replace(/\s+/g," ").trim().slice(0,600);
  if(title.length<3)return{ok:false,reason:"title_too_short"};
  if(summary.length<60)return{ok:false,reason:"summary_too_short"};
  const arabicOk=input.language==="ar"?hasArabic(title)&&hasArabic(summary):!hasArabic(title)&&!hasArabic(summary);
  if(!arabicOk)return{ok:false,reason:"language_mismatch"};
  const section=String(input.section||"");
  if(!ARCHIVE_SECTIONS.has(section))return{ok:false,reason:"section_not_archivable"};
  const sources=httpsSources(input.sources);
  if(!sources.length)return{ok:false,reason:"no_https_source"};
  return{ok:true,title,summary,section,sources};
}

/** Files one entry. Never throws; never overwrites a PUBLISHED article; touches an existing entry at most every 6 hours. */
export async function archiveResearch(env:Env,input:ArchiveInput):Promise<{stored:boolean;reason?:string;slug?:string}>{
  const v=validateArchiveInput(input);
  if(!v.ok)return{stored:false,reason:v.reason};
  const now=new Date().toISOString(),touchCutoff=new Date(Date.now()-6*60*60*1000).toISOString();
  const slug=archiveSlug(v.title,input.language);
  const image=/^https:\/\//i.test(String(input.imageUrl||""))?String(input.imageUrl):null;
  try{
    await env.DB.prepare("INSERT INTO articles(slug,section,language,title,summary,body,sources_json,status,image_url,image_alt,created_at,updated_at) VALUES(?,?,?,?,?,?,?,'ARCHIVE',?,?,?,?) ON CONFLICT(slug) DO UPDATE SET updated_at=excluded.updated_at WHERE articles.status='ARCHIVE' AND articles.updated_at<?")
      .bind(slug,v.section,input.language,v.title,v.summary,v.summary,JSON.stringify(v.sources.map((s)=>({title:String(s.title||"").slice(0,200),publisher:String(s.publisher||"").slice(0,120),url:s.url}))),image,image?v.title:null,now,now,touchCutoff).run();
    return{stored:true,slug};
  }catch(error){
    if(!isD1QuotaError(error))await recordRuntimeEventLimited(env,"section_archive","archive_write_failed",error);
    return{stored:false,reason:"write_failed"};
  }
}

/** Files up to `limit` of the top search results, each under the section the search already assigned to it. */
export async function archiveSearchResults(env:Env,results:unknown,language:Locale,limit=3):Promise<number>{
  if(!Array.isArray(results))return 0;
  let stored=0;
  for(const item of (results as any[]).slice(0,8)){
    if(stored>=limit)break;
    const sources=Array.isArray(item?.sources)&&item.sources.length?item.sources:(item?.url?[{title:item.title,publisher:item.publisher||"",url:item.url}]:[]);
    const r=await archiveResearch(env,{title:String(item?.title||""),summary:String(item?.summary||""),sources,section:String(item?.section||""),language,imageUrl:item?.imageUrl});
    if(r.stored)stored++;
  }
  return stored;
}

export async function listSectionArchive(env:Env,section:string,language:Locale,limit=24):Promise<any[]>{
  if(!ARCHIVE_SECTIONS.has(section))return[];
  const rows=await env.DB.prepare("SELECT title,summary,section,sources_json,image_url,image_alt,updated_at FROM articles WHERE section=? AND language=? AND status='ARCHIVE' ORDER BY updated_at DESC LIMIT ?").bind(section,language,limit).all<any>();
  return(rows.results||[]).map((row)=>{
    let sources:Source[]=[];try{sources=httpsSources(JSON.parse(String(row.sources_json||"[]")))}catch(error){sources=[]}
    return{title:String(row.title||""),summary:String(row.summary||""),body:String(row.summary||""),section:String(row.section||section),slug:"",kind:"archive",archived:true,sources,imageUrl:row.image_url||undefined,imageAlt:String(row.image_alt||row.title||""),archivedAt:String(row.updated_at||"")};
  });
}
