import{safePublicImageUrl}from"./image-url";import type{Article,Env,Locale}from"./types";import{now}from"./config";import{findRelatedImage}from"./services/news";import{boundedLikeKeywords,escapedLikePattern}from"./search-patterns";import{recordRuntimeEventLimited}from"./runtime-events";import{sectionForOpenedStory}from"./services/editorial";import{bundledArticleBySlug,bundledArticleForShortTitle,bundledArticlesForSection,bundledSearchArticles}from"./fallback-content";const parseArticleSources=(value:unknown):any[]=>{try{const parsed=JSON.parse(String(value||"[]"));return Array.isArray(parsed)?parsed:[]}catch{return[]}};export async function listArticles(env:Env,section:string,language:Locale,limit=12):Promise<Article[]>{try{const r=await env.DB.prepare("SELECT * FROM articles WHERE section=? AND language=? AND status='PUBLISHED' ORDER BY updated_at DESC LIMIT ?").bind(section,language,limit).all<any>();return(r.results||[]).map(row=>({...row,sources:parseArticleSources(row.sources_json),createdAt:row.created_at,updatedAt:row.updated_at,imageUrl:row.image_url,imageAlt:row.image_alt}))}catch{return bundledArticlesForSection(section,language,limit).map(row=>({...row,sources:row.sources,createdAt:row.createdAt,updatedAt:row.updatedAt,imageUrl:safePublicImageUrl(row.imageUrl),imageAlt:row.imageAlt,fallbackMode:true})) as Article[]}}export async function listSectionArticles(env:Env,section:string,language:Locale,limit=12){return listArticles(env,section,language,limit)}export async function getArticle(env:Env,slug:string,language:Locale){let r:any=null;try{r=await env.DB.prepare("SELECT * FROM articles WHERE slug=? AND language=? AND status='PUBLISHED' LIMIT 1").bind(slug,language).first<any>()}catch(error){await recordRuntimeEventLimited(env,"article_read","article_d1_read_failed",error)}if(r){const reviewed=String(r.body||"").trim().length<1200&&String(r.section||"")==="people"?bundledArticleForShortTitle(String(r.title||""),String(r.section||""),language):null;if(reviewed&&reviewed.slug===slug)return({...reviewed,sources:reviewed.sources,createdAt:reviewed.createdAt,updatedAt:reviewed.updatedAt,imageUrl:safePublicImageUrl(reviewed.imageUrl),imageAlt:reviewed.imageAlt,fallbackMode:true}as Article);return({...r,sources:parseArticleSources(r.sources_json),createdAt:r.created_at,updatedAt:r.updated_at,imageUrl:safePublicImageUrl(r.image_url),imageAlt:r.image_alt}as Article)}const row=bundledArticleBySlug(slug,language);return row?({...row,sources:row.sources,createdAt:row.createdAt,updatedAt:row.updatedAt,imageUrl:safePublicImageUrl(row.imageUrl),imageAlt:row.imageAlt,fallbackMode:true}as Article):null}// Compatibility note: the former narrow projection was SELECT title,summary,section,slug,sources_json FROM articles WHERE language=?; search now also selects the stored article body and image metadata.
export async function searchArticles(env:Env,q:string,language:Locale,limit=12){
 const rawTerms=String(q||"").normalize("NFKC").replace(/[^\p{L}\p{N}%_!\s]/gu," ").split(/\s+/).filter(Boolean);
 const terms=boundedLikeKeywords(rawTerms,6);
 if(!terms.length)return[];
 const predicates=terms.map(()=>"(title LIKE ? ESCAPE '!' OR summary LIKE ? ESCAPE '!' OR body LIKE ? ESCAPE '!')").join(" OR ");
 const patterns=terms.flatMap(term=>{const pattern=escapedLikePattern(term);return[pattern,pattern,pattern]});
 let r:any;try{r=await env.DB.prepare("SELECT title,summary,body,section,slug,sources_json,image_url,image_alt,updated_at FROM articles WHERE language=? AND status='PUBLISHED' AND ("+predicates+") ORDER BY updated_at DESC LIMIT ?").bind(language,...patterns,limit).all<any>()}catch{return bundledSearchArticles(q,language,limit).map(row=>({title:row.title,summary:row.summary,body:row.body,section:row.section,slug:row.slug,imageUrl:safePublicImageUrl(row.imageUrl),imageAlt:row.imageAlt,updatedAt:row.updatedAt,kind:"article" as const,evidence:row.fallbackEvidence==="verified"?"verified" as const:"source_only" as const,sources:row.sources,fallbackMode:true}))}
 return(r.results||[]).map((row:any)=>{
  const inferred=sectionForOpenedStory(String(row.title||""),String(row.summary||""));
  const section=inferred==="world"?String(row.section||"world"):inferred;
  const reviewed=String(row.body||"").trim().length<1200&&section==="people"?bundledArticleForShortTitle(String(row.title||""),"people",language):null;
  if(reviewed)return{title:reviewed.title,summary:reviewed.summary,body:reviewed.body,section:reviewed.section,slug:reviewed.slug,imageUrl:safePublicImageUrl(reviewed.imageUrl),imageAlt:reviewed.imageAlt,updatedAt:reviewed.updatedAt,kind:"article"as const,evidence:"verified"as const,sources:reviewed.sources,fallbackMode:true};
  return{title:row.title,summary:row.summary,body:row.body,section,slug:row.slug,imageUrl:row.image_url,imageAlt:row.image_alt,updatedAt:row.updated_at,kind:"article"as const,evidence:"verified"as const,sources:parseArticleSources(row.sources_json)};
 });
}export async function saveSearch(env:Env,q:string,language:Locale,intent:string,status:string,count:number,topicSection="world",results:any[]=[]){await env.DB.prepare("INSERT INTO searches(query,language,intent,status,source_count,topic_section,results_json,created_at) VALUES(?,?,?,?,?,?,?,?)").bind(q,language,intent,status,count,topicSection,JSON.stringify(results.slice(0,12).map((item:any)=>({title:String(item.title||"").slice(0,300),summary:String(item.summary||"").slice(0,700),url:String(item.url||"").slice(0,1000),slug:String(item.slug||"").slice(0,200),kind:String(item.kind||"evidence").slice(0,40),evidence:String(item.evidence||"mixed").slice(0,40),provider:String(item.provider||"").slice(0,100),imageUrl:safePublicImageUrl(item.imageUrl)||"",imageAlt:String(item.imageAlt||"").slice(0,300),publishedAt:String(item.publishedAt||"").slice(0,40),section:String(item.section||topicSection),sources:(Array.isArray(item.sources)?item.sources:[]).slice(0,5)}))),now()).run()}const publicationTextKey=(value:string)=>String(value||"").normalize("NFKC").toLowerCase().replace(/[\u064B-\u065F\u0670]/g,"").replace(/[^\p{L}\p{N}]+/gu," ").trim();
const publicationWords=(value:string)=>new Set(publicationTextKey(value).split(/\s+/).filter(word=>word.length>2));
const publicationTitleMatch=(a:string,b:string)=>{
 const left=publicationWords(a),right=publicationWords(b);
 if(!left.size||!right.size)return false;
 const common=[...left].filter(word=>right.has(word)).length;
 return publicationTextKey(a)===publicationTextKey(b)||(Math.min(left.size,right.size)>=3&&common/Math.max(1,Math.min(left.size,right.size))>=0.82);
};
type PublicationInput={title:string;summary:string;body:string;language:Locale;sources:any[];imageUrl?:string};
export function publicationRejectionReason(input:PublicationInput):string|undefined{
 const body=String(input.body||"").trim(),title=String(input.title||"").trim(),summary=String(input.summary||"").trim();
 const image=safePublicImageUrl(input.imageUrl);
 if(!image)return "no_image";
 if(title.length<8)return "title_too_short";
 if(summary.length<40)return "summary_too_short";
 if(body.length<1800)return "body_too_short";
 const headings=(body.match(/^#{1,3}\s+.+$/gm)||[]).length;
 if(headings<4)return "insufficient_headings";
 const paragraphs=body.split(/\n\s*\n/).map(p=>p.trim()).filter(p=>p.length>=65&&!/^#{1,4}\s/.test(p)&&!/^([-*+] |\d+[.)] )/.test(p));
 if(paragraphs.length<5)return "insufficient_substantive_paragraphs";
 const normalizedParagraphs=paragraphs.map(p=>publicationTextKey(p));
 const uniqueParagraphs=new Set(normalizedParagraphs);
 if(uniqueParagraphs.size<5||uniqueParagraphs.size!==normalizedParagraphs.length)return "duplicate_or_repetitive_paragraphs";
 const hasArabic=/[\u0600-\u06ff]/.test(title+" "+summary+" "+body);
 const localeConsistent=input.language==="ar"
  ? hasArabic&&[title,summary,...paragraphs].every(part=>/[\u0600-\u06ff]/.test(part)||!/[A-Za-z]{5,}/.test(part))
  : !hasArabic;
 if(!localeConsistent)return "language_mismatch";
 const hosts=new Set((input.sources||[]).flatMap(source=>{try{const url=new URL(String(source?.url||""));return url.protocol==="https:"?[url.hostname.toLowerCase().replace(/^www\./,"")]:[]}catch{return []}}));
 if(hosts.size<2)return "insufficient_independent_source_hosts";
 const publishers=new Set((input.sources||[]).map(source=>String(source?.publisher||"").trim().toLowerCase()).filter(Boolean));
 if(publishers.size<2)return "insufficient_independent_publishers";
 return undefined;
}
const publicationQuality=(input:PublicationInput)=>publicationRejectionReason(input)===undefined;
export async function publishVerifiedResearch(env:Env,input:{title:string;summary:string;body:string;section:string;language:Locale;sources:any[];imageUrl?:string;imageAlt?:string}){
 const imageUrl=safePublicImageUrl(input.imageUrl);
 if(!imageUrl||!publicationQuality({...input,imageUrl}))return null;
 input={...input,imageUrl};
 const rows=await env.DB.prepare("SELECT slug,title,summary,body,section,sources_json,image_url,image_alt FROM articles WHERE language=? AND status='PUBLISHED' ORDER BY updated_at DESC").bind(input.language).all<any>();
 const candidates=(rows.results||[]).filter(row=>publicationTitleMatch(String(row.title||""),input.title));
 const existing=candidates.sort((a,b)=>Number(publicationTextKey(a.title)===publicationTextKey(input.title))-Number(publicationTextKey(b.title)===publicationTextKey(input.title))).at(-1);
 const t=now();
 const sourceMap=new Map<string,any>();
 for(const source of [...(existing?JSON.parse(String(existing.sources_json||"[]")):[]),...(input.sources||[])]){
  try{const url=new URL(String(source?.url||""));if(url.protocol==="https:")sourceMap.set(url.toString(),source)}catch(error){await recordRuntimeEventLimited(env,"publication_source_url","invalid_publication_source_url",error)}
 }
 const mergedSources=[...sourceMap.values()].slice(0,20);
 if(existing){
  const priorBody=String(existing.body||"");
  const priorWords=publicationWords(priorBody),incomingWords=publicationWords(input.body);
  const newFacts=[...incomingWords].filter(word=>!priorWords.has(word));
  const oldHeadings=(priorBody.match(/^#{1,3}\s+.+$/gm)||[]).length;
  const oldParagraphs=priorBody.split(/\n\s*\n/).map(p=>p.trim()).filter(p=>p.length>=65&&!/^#{1,4}\s/.test(p)&&!/^([-*+] |\d+[.)] )/.test(p));
  const oldQuality=priorBody.length>=1800&&oldHeadings>=4&&oldParagraphs.length>=5&&new Set(oldParagraphs.map(publicationTextKey)).size===oldParagraphs.length;
  const materiallyNew=newFacts.length>=12&&input.body.length>=Math.max(1800,priorBody.length*0.75);
  const repairWeakArticle=!oldQuality;
  const nextBody=materiallyNew||repairWeakArticle?input.body:priorBody;
  const nextSummary=materiallyNew||repairWeakArticle?input.summary.slice(0,500):String(existing.summary||input.summary).slice(0,500);
  const nextTitle=materiallyNew||repairWeakArticle?input.title:String(existing.title||input.title);
  const nextSection=materiallyNew||repairWeakArticle?input.section:String(existing.section||input.section);
  const nextImageUrl=/^https:\/\//i.test(String(existing.image_url||"").trim())?String(existing.image_url):input.imageUrl;
  const nextImageAlt=input.imageAlt||String(existing.image_alt||nextTitle);
  const nextSourcesJson=JSON.stringify(mergedSources);
  const beforeSnapshot={slug:String(existing.slug),language:input.language,title:String(existing.title||""),summary:String(existing.summary||""),body:priorBody,section:String(existing.section||input.section),status:"PUBLISHED",sources_json:String(existing.sources_json||"[]"),image_url:existing.image_url||null,image_alt:existing.image_alt||null};
  const afterSnapshot={...beforeSnapshot,title:nextTitle,summary:nextSummary,body:nextBody,section:nextSection,sources_json:nextSourcesJson,image_url:nextImageUrl||null,image_alt:nextImageAlt,updated_at:t};
  await env.DB.batch([
    env.DB.prepare("UPDATE articles SET title=?,summary=?,body=?,section=?,sources_json=?,image_url=?,image_alt=?,updated_at=? WHERE slug=? AND language=? AND status='PUBLISHED'").bind(nextTitle,nextSummary,nextBody,nextSection,nextSourcesJson,nextImageUrl,nextImageAlt,t,String(existing.slug),input.language),
    env.DB.prepare("INSERT INTO article_revision_history(article_slug,language,title,summary,body,section,status,image_url,image_alt,sources_json,action,editor,before_json,after_json,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(String(existing.slug),input.language,beforeSnapshot.title,beforeSnapshot.summary,beforeSnapshot.body,beforeSnapshot.section,beforeSnapshot.status,beforeSnapshot.image_url,beforeSnapshot.image_alt,beforeSnapshot.sources_json,"AUTO_UPDATE","BAYAN_AI",JSON.stringify(beforeSnapshot),JSON.stringify(afterSnapshot),t)
  ]);
  return String(existing.slug);
 }
 const base=input.title.toLowerCase().normalize("NFKC").replace(/[^a-z0-9\u0600-\u06ff]+/gi,"-").replace(/^-|-$/g,"").slice(0,90)||"bayan-research";
 const slug=base+"-"+Date.now().toString(36);
 const sourcesJson=JSON.stringify(mergedSources.length?mergedSources:input.sources.slice(0,12));
  const afterSnapshot={slug,section:input.section,language:input.language,title:input.title,summary:input.summary.slice(0,500),body:input.body,sources_json:sourcesJson,status:"PUBLISHED",image_url:input.imageUrl||null,image_alt:input.imageAlt||input.title,created_at:t,updated_at:t};
  await env.DB.batch([
    env.DB.prepare("INSERT INTO articles(slug,section,language,title,summary,body,sources_json,status,image_url,image_alt,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)").bind(slug,input.section,input.language,input.title,input.summary.slice(0,500),input.body,sourcesJson,"PUBLISHED",input.imageUrl,input.imageAlt||input.title,t,t),
    env.DB.prepare("INSERT INTO article_revision_history(article_slug,language,title,summary,body,section,status,image_url,image_alt,sources_json,action,editor,before_json,after_json,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(slug,input.language,input.title,input.summary.slice(0,500),input.body,input.section,"PUBLISHED",input.imageUrl||null,input.imageAlt||input.title,sourcesJson,"CREATE","BAYAN_AI",null,JSON.stringify(afterSnapshot),t)
  ]);
return slug;
}
export async function addContribution(env:Env,title:string,body:string,source:string|undefined,section:string,language:Locale="ar"){await env.DB.prepare("INSERT INTO contributions(title,body,source,section,language,status,created_at) VALUES(?,?,?,?,?,?,?)").bind(title,body,source||null,section,language,"PENDING",now()).run()}export async function reviewContribution(env:Env,id:number,action:"APPROVE"|"REJECT",note:string){
 const c=await env.DB.prepare("SELECT * FROM contributions WHERE id=?").bind(id).first<any>();
 if(!c)throw new Error("contribution_not_found");
 if(action==="APPROVE"){
  const title=String(c.title||"").trim(),body=String(c.body||"").trim(),language:Locale=c.language==="en"?"en":"ar";
  const headings=(body.match(/^#{1,3}\s+.+$/gm)||[]).length;
  const paragraphs=body.split(/\n\s*\n/).map((p:string)=>p.trim()).filter((p:string)=>p.length>=65&&!/^#{1,4}\s/.test(p));
  const normalized=paragraphs.map((p:string)=>p.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").trim());
  if(title.length<8||body.length<1800||headings<4||paragraphs.length<5||new Set(normalized).size!==normalized.length)throw new Error("contribution_article_incomplete");
  const hasArabic=(value:string)=>/[\u0600-\u06ff]/.test(value);
  if(language==="ar"?(!hasArabic(title)||!hasArabic(body)):hasArabic(title+" "+body))throw new Error("contribution_language_mismatch");
  const urls=[String(c.source||""),...(body.match(/https:\/\/[^\s)\]}>,]+/gi)||[])].flatMap((value:string)=>{try{const url=new URL(value.trim());return url.protocol==="https:"?[url.toString()]:[]}catch{return[]}});
  const sourceMap=new Map<string,any>();
  for(const value of urls){try{const url=new URL(value);const host=url.hostname.toLowerCase().replace(/^www\./,"");sourceMap.set(host,{title:host,publisher:host,url:url.toString()})}catch(error){void recordRuntimeEventLimited(env,"contribution_source_url","invalid_contribution_source_url",error)}}
  const sources=[...sourceMap.values()];
  if(new Set(sources.map(s=>new URL(s.url).hostname)).size<2)throw new Error("contribution_needs_independent_sources");
  const summary=body.replace(/^#{1,4}\s+/gm,"").replace(/\s+/g," ").slice(0,500);
  if(summary.length<40)throw new Error("contribution_summary_missing");
  const image=await findRelatedImage(title,sources[0]?.url,"",env);
  if(!image||!/^https:\/\//i.test(image))throw new Error("contribution_image_unavailable");
  const published=await publishVerifiedResearch(env,{title,summary,body,section:String(c.section||"world"),language,sources,imageUrl:image,imageAlt:title});
  if(!published)throw new Error("contribution_article_not_publishable");
 }
 await env.DB.prepare("UPDATE contributions SET status=?,reviewer_note=?,reviewed_at=? WHERE id=?").bind(action==="APPROVE"?"APPROVED":"REJECTED",note||null,now(),id).run();
}export async function track(env:Env,visitor:string,event:string,path:string,language:Locale){if(visitor==="owner-excluded")return;try{await env.DB.prepare("INSERT INTO analytics(visitor_hash,event,path,language,created_at) VALUES(?,?,?,?,?)").bind(visitor,event,path,language,now()).run()}catch(error){await recordRuntimeEventLimited(env,"analytics_tracking","analytics_event_write_failed",error)}}
export async function analyticsStats(env:Env,language:Locale="ar"){
  const day=new Date(Date.now()-86400000).toISOString(),week=new Date(Date.now()-604800000).toISOString(),month=new Date(Date.now()-2592000000).toISOString();
  const r=await env.DB.batch([
    env.DB.prepare("SELECT COUNT(*) AS total FROM analytics WHERE event='page'"),
    env.DB.prepare("SELECT COUNT(DISTINCT visitor_hash) AS unique_visitors FROM analytics WHERE event='page'"),
    env.DB.prepare("SELECT COUNT(*) AS total FROM analytics WHERE event='page' AND created_at>=?").bind(day),
    env.DB.prepare("SELECT COUNT(DISTINCT visitor_hash) AS unique_visitors FROM analytics WHERE event='page' AND created_at>=?").bind(day),
    env.DB.prepare("SELECT COUNT(*) AS total FROM analytics WHERE event='page' AND created_at>=?").bind(week),
    env.DB.prepare("SELECT COUNT(DISTINCT visitor_hash) AS unique_visitors FROM analytics WHERE event='page' AND created_at>=?").bind(week),
    env.DB.prepare("SELECT COUNT(*) AS total FROM analytics WHERE event='page' AND created_at>=?").bind(month),
    env.DB.prepare("SELECT COUNT(DISTINCT visitor_hash) AS unique_visitors FROM analytics WHERE event='page' AND created_at>=?").bind(month),
    env.DB.prepare("SELECT path,COUNT(*) AS visits FROM analytics WHERE event='page' AND created_at>=? GROUP BY path ORDER BY visits DESC LIMIT 15").bind(month),
    env.DB.prepare("SELECT event,COUNT(*) AS count FROM analytics WHERE created_at>=? GROUP BY event ORDER BY count DESC LIMIT 15").bind(month),
    env.DB.prepare("SELECT language,COUNT(*) AS count FROM analytics WHERE created_at>=? GROUP BY language ORDER BY count DESC").bind(month),
    env.DB.prepare("SELECT query,COUNT(*) AS count,MAX(created_at) AS last_seen FROM searches WHERE language=? GROUP BY query ORDER BY count DESC,last_seen DESC LIMIT 15").bind(language),
    env.DB.prepare("SELECT status,COUNT(*) AS count FROM articles GROUP BY status"),
    env.DB.prepare("SELECT section,language,COUNT(*) AS count FROM articles WHERE status='PUBLISHED' GROUP BY section,language ORDER BY count DESC"),
    env.DB.prepare("SELECT COUNT(*) AS published,SUM(CASE WHEN length(trim(body))<1800 THEN 1 ELSE 0 END) AS short_bodies,SUM(CASE WHEN image_url IS NULL OR trim(image_url)='' THEN 1 ELSE 0 END) AS missing_images,SUM(CASE WHEN sources_json IS NULL OR sources_json='[]' THEN 1 ELSE 0 END) AS missing_sources FROM articles WHERE status='PUBLISHED'")
  ]);
  const v=(i:number)=>r[i]?.results||[];
  const one=(i:number,key:string)=>Number((v(i)[0] as any)?.[key]||0);
  return {totalViews:one(0,"total"),uniqueVisitors:one(1,"unique_visitors"),periods:{day:{views:one(2,"total"),uniqueVisitors:one(3,"unique_visitors")},week:{views:one(4,"total"),uniqueVisitors:one(5,"unique_visitors")},month:{views:one(6,"total"),uniqueVisitors:one(7,"unique_visitors")}},topPages:v(8),events:v(9),languages:v(10),topSearches:v(11),articleStatuses:v(12),contentBySection:v(13),contentQuality:(v(14)[0]||{published:0,short_bodies:0,missing_images:0,missing_sources:0})};
}