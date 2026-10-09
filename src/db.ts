import type{Article,Env,Locale}from"./types";import{now}from"./config";export async function listArticles(env:Env,section:string,language:Locale,limit=12):Promise<Article[]>{const r=await env.DB.prepare("SELECT * FROM articles WHERE section=? AND language=? AND status='PUBLISHED' ORDER BY updated_at DESC LIMIT ?").bind(section,language,limit).all<any>();return(r.results||[]).map(row=>({...row,sources:JSON.parse(row.sources_json||"[]"),createdAt:row.created_at,updatedAt:row.updated_at,imageUrl:row.image_url,imageAlt:row.image_alt}))}export async function listSectionArticles(env:Env,section:string,language:Locale,limit=12){return listArticles(env,section,language,limit)}export async function getArticle(env:Env,slug:string,language:Locale){const r=await env.DB.prepare("SELECT * FROM articles WHERE slug=? AND language=? AND status='PUBLISHED' LIMIT 1").bind(slug,language).first<any>();return r?({...r,sources:JSON.parse(r.sources_json||"[]"),createdAt:r.created_at,updatedAt:r.updated_at,imageUrl:r.image_url,imageAlt:r.image_alt}as Article):null}export async function searchArticles(env:Env,q:string,language:Locale,limit=12){const like="%"+q.replace(/[%_]/g,"")+"%";const r=await env.DB.prepare("SELECT * FROM articles WHERE language=? AND status='PUBLISHED' AND (title LIKE ? OR summary LIKE ? OR body LIKE ?) ORDER BY updated_at DESC LIMIT ?").bind(language,like,like,like,limit).all<any>();return(r.results||[]).map(row=>({title:row.title,summary:row.summary,section:row.section,slug:row.slug,kind:"article"as const,evidence:"verified"as const,sources:JSON.parse(row.sources_json||"[]")}))}export async function saveSearch(env:Env,q:string,language:Locale,intent:string,status:string,count:number,topicSection="world",results:any[]=[]){await env.DB.prepare("INSERT INTO searches(query,language,intent,status,source_count,topic_section,results_json,created_at) VALUES(?,?,?,?,?,?,?,?)").bind(q,language,intent,status,count,topicSection,JSON.stringify(results.slice(0,12).map((item:any)=>({title:String(item.title||"").slice(0,300),summary:String(item.summary||"").slice(0,700),url:String(item.url||"").slice(0,1000),section:String(item.section||topicSection),sources:(Array.isArray(item.sources)?item.sources:[]).slice(0,5)}))),now()).run()}const publicationTextKey=(value:string)=>String(value||"").normalize("NFKC").toLowerCase().replace(/[\u064B-\u065F\u0670]/g,"").replace(/[^\p{L}\p{N}]+/gu," ").trim();
const publicationWords=(value:string)=>new Set(publicationTextKey(value).split(/\s+/).filter(word=>word.length>2));
const publicationTitleMatch=(a:string,b:string)=>{
 const left=publicationWords(a),right=publicationWords(b);
 if(!left.size||!right.size)return false;
 const common=[...left].filter(word=>right.has(word)).length;
 return publicationTextKey(a)===publicationTextKey(b)||(Math.min(left.size,right.size)>=3&&common/Math.max(1,Math.min(left.size,right.size))>=0.82);
};
const publicationQuality=(input:{title:string;summary:string;body:string;language:Locale;sources:any[];imageUrl?:string})=>{
 const body=String(input.body||"").trim(),title=String(input.title||"").trim(),summary=String(input.summary||"").trim();
 const headings=(body.match(/^#{1,3}\s+.+$/gm)||[]).length;
 const paragraphs=body.split(/\n\s*\n/).map(p=>p.trim()).filter(p=>p.length>=65&&!/^#{1,4}\s/.test(p)&&!/^([-*+] |\d+[.)] )/.test(p));
 const hasArabic=/[\u0600-\u06ff]/.test(title+" "+summary+" "+body);
 const hosts=new Set((input.sources||[]).flatMap(source=>{try{const url=new URL(String(source?.url||""));return url.protocol==="https:"?[url.hostname.toLowerCase().replace(/^www\./,"")]:[]}catch{return []}}));
 return title.length>=8&&summary.length>=40&&body.length>=1800&&headings>=4&&paragraphs.length>=5&&(input.language==="ar"?hasArabic:!hasArabic)&&hosts.size>=2&&/^https:\/\//i.test(String(input.imageUrl||""));
};
export async function publishVerifiedResearch(env:Env,input:{title:string;summary:string;body:string;section:string;language:Locale;sources:any[];imageUrl?:string;imageAlt?:string}){
 if(!publicationQuality(input))return undefined;
 const rows=await env.DB.prepare("SELECT slug,title,summary,body,section,sources_json,image_url FROM articles WHERE language=? AND status='PUBLISHED' ORDER BY updated_at DESC LIMIT 600").bind(input.language).all<any>();
 const candidates=(rows.results||[]).filter(row=>publicationTitleMatch(String(row.title||""),input.title));
 const existing=candidates.sort((a,b)=>Number(publicationTextKey(a.title)===publicationTextKey(input.title))-Number(publicationTextKey(b.title)===publicationTextKey(input.title))).at(-1);
 const t=now();
 const sourceMap=new Map<string,any>();
 for(const source of [...(existing?JSON.parse(String(existing.sources_json||"[]")):[]),...(input.sources||[])]){
  try{const url=new URL(String(source?.url||""));if(url.protocol==="https:")sourceMap.set(url.toString(),source)}catch{}
 }
 const mergedSources=[...sourceMap.values()].slice(0,16);
 if(existing){
  const priorBody=String(existing.body||"");
  const priorWords=publicationWords(priorBody),incomingWords=publicationWords(input.body);
  const newFacts=[...incomingWords].filter(word=>!priorWords.has(word));
  const oldQuality=priorBody.length>=1800&&(priorBody.match(/^#{1,3}\s+.+$/gm)||[]).length>=4&&priorBody.split(/\n\s*\n/).filter(p=>p.trim().length>=65&&!/^#{1,4}\s/.test(p.trim())).length>=5;
  const materiallyNew=newFacts.length>=18&&input.body.length>=Math.max(1800,priorBody.length*0.85);
  const repairWeakArticle=!oldQuality;
  if(materiallyNew||repairWeakArticle){
   await env.DB.prepare("UPDATE articles SET title=?,summary=?,body=?,section=?,sources_json=?,image_url=CASE WHEN image_url IS NULL OR trim(image_url)='' THEN ? ELSE image_url END,image_alt=CASE WHEN image_url IS NULL OR trim(image_url)='' THEN ? ELSE image_alt END,updated_at=? WHERE slug=? AND language=? AND status='PUBLISHED'").bind(input.title,input.summary.slice(0,500),input.body,input.section,JSON.stringify(mergedSources),input.imageUrl,input.imageAlt||input.title,t,String(existing.slug),input.language).run();
  }else if(!String(existing.image_url||"").trim()){
   await env.DB.prepare("UPDATE articles SET image_url=?,image_alt=?,sources_json=?,updated_at=? WHERE slug=? AND language=? AND status='PUBLISHED'").bind(input.imageUrl,input.imageAlt||input.title,JSON.stringify(mergedSources),t,String(existing.slug),input.language).run();
  }
  return String(existing.slug);
 }
 const base=input.title.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/gi,"-").replace(/^-|-$/g,"").slice(0,90)||"bayan-research";
 const slug=base+"-"+Date.now().toString(36);
 await env.DB.prepare("INSERT INTO articles(slug,section,language,title,summary,body,sources_json,status,image_url,image_alt,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)").bind(slug,input.section,input.language,input.title,input.summary.slice(0,500),input.body,JSON.stringify(mergedSources.length?mergedSources:input.sources.slice(0,12)),"PUBLISHED",input.imageUrl,input.imageAlt||input.title,t,t).run();
 return slug;
}export async function addContribution(env:Env,title:string,body:string,source:string|undefined,section:string,language:Locale="ar"){await env.DB.prepare("INSERT INTO contributions(title,body,source,section,language,status,created_at) VALUES(?,?,?,?,?,?,?)").bind(title,body,source||null,section,language,"PENDING",now()).run()}export async function reviewContribution(env:Env,id:number,action:"APPROVE"|"REJECT",note:string){const c=await env.DB.prepare("SELECT * FROM contributions WHERE id=?").bind(id).first<any>();if(!c)throw new Error("contribution_not_found");if(action==="APPROVE"){const slug=String(c.title).toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/gi,"-").replace(/^-|-$/g,"").slice(0,100)+"-"+id;const sources=c.source?[{title:c.source,publisher:"Contributor",url:c.source}]:[];const language=c.language==="en"?"en":"ar";const t=now();await env.DB.prepare("INSERT INTO articles(slug,section,language,title,summary,body,sources_json,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)").bind(slug,c.section,language,c.title,c.body.slice(0,300),c.body,JSON.stringify(sources),"PUBLISHED",t,t).run()}await env.DB.prepare("UPDATE contributions SET status=?,reviewer_note=?,reviewed_at=? WHERE id=?").bind(action==="APPROVE"?"APPROVED":"REJECTED",note||null,now(),id).run()}export async function track(env:Env,visitor:string,event:string,path:string,language:Locale){if(visitor==="owner-excluded")return;try{await env.DB.prepare("INSERT INTO analytics(visitor_hash,event,path,language,created_at) VALUES(?,?,?,?,?)").bind(visitor,event,path,language,now()).run()}catch{}}
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