import{isTopicImageUrl,resolvePublishedImageUrl,safePublicImageUrl}from"../image-url";
import{bundledSearchArticles}from"../fallback-content";
import type {Env,Locale,SearchResponse,SearchResult,Source} from "../types";
import {searchArticles,saveSearch,publishVerifiedResearch,publicationRejectionReason} from "../db";
import {boundedLikeKeywords,escapedLikePattern} from "../search-patterns";
import {recordRuntimeEventLimited} from "../runtime-events";
import {ask,draftArticle,ARTICLE_DRAFT_TIMEOUT_MS,answerHasUnsupportedSpecifics,answerUnsupportedSpecificsDetail,handleOpenAIResponseFailure,consumeDailyNewsAiCall,openAIAllowed} from "./ai";
import {findRelatedImage,searchNewsFeed,searchTrustedNewsFeeds,resolvePublisherArticleUrl} from "./news";
import {fetchGdeltEvidenceStories} from "./gdelt-evidence";
import {searchWikimediaEnterprise} from "./wikimedia-enterprise";
import {sectionForOpenedStory,isContentForSection} from "./editorial";
import {sections} from "../sections";
import {requiredEvidencePublisherCount,requiredSearchExpansionPublisherCount,independentEvidenceHost,hasIndependentEvidenceDiversity,areNearDuplicateEvidenceTitles,areNearDuplicateEvidenceTexts} from "./evidence-diversity";
import {getProviderBreaker} from "./ai-provider-resilience";
import {shouldAttemptOpenAIWebSearchFallback,shouldSkipGoogleNewsRetry} from "./search-recovery";
import {selectExpandedSearchCandidates} from "./search-expansion";
const publicationErrorMessage=(error:unknown)=>String((error as {message?:string})?.message||error||"unknown").replace(/https?:\/\/[^\s]+/g,"[url]").replace(/\b(?:sk-[A-Za-z0-9_-]{8,}|Bearer\s+\S+)\b/gi,"[redacted]").slice(0,300);
const publicationFailureReason=(error:unknown)=>{const message=publicationErrorMessage(error);return /429|rate.?limit|timeout|timed out|abort|quota|neurons|overload|openai|workers ai|ai unavailable/i.test(message)?"ai_unavailable":"exception:"+message;};
async function recordPublicationWarning(env:Env,message:string){await recordRuntimeEventLimited(env,"news_archive_article_generation","publication_warning",message);}


type Candidate = SearchResult & {score:number; provider:string; identityAliases?:string[]};
const providerFailureKind=(error:unknown):"timeout"|"connection_failure"|"invalid_response"|"request_failure"=>{const value=error as {name?:string;message?:string};const name=String(value?.name||"");const message=String(value?.message||error||"").toLowerCase();if(name==="AbortError"||name==="TimeoutError"||/timeout|timed out|aborted/.test(message))return"timeout";if(name==="SyntaxError"||/json|parse|unexpected token/.test(message))return"invalid_response";if(name==="TypeError"||/fetch failed|network|connection|dns|socket|econn/.test(message))return"connection_failure";return"request_failure";};
const reportProviderFailure=(diagnostics:string[]|undefined,provider:string,error:unknown)=>{if(!diagnostics)return;const kind=providerFailureKind(error);const value=error as {message?:string};const detail=String(value?.message||error||"unknown").replace(/https?:\/\/[^\s]+/g,"[url]").slice(0,140);diagnostics.push(provider+": "+kind+(detail?": "+detail:""));};
const timeout = async (url:string, ms=2600, diagnostics?:string[], provider="external provider") => {
  const c=new AbortController(); const t=setTimeout(()=>c.abort(),ms);
  try {
    const response=await fetch(url,{signal:c.signal,headers:{accept:"application/json,text/plain,*/*","user-agent":"BAYAN/1.2 (+https://bayan.tahaomar411.workers.dev; contact: bayan.contact@yahoo.com)","api-user-agent":"BAYAN/1.2 (https://bayan.tahaomar411.workers.dev)"}});
    // Bound memory and parsing cost per upstream response. Search providers often
    // return full HTML pages; buffering several multi-megabyte pages concurrently
    // can exhaust a Worker even when every provider has a timeout.
    const contentType=String(response.headers.get("content-type")||"").toLowerCase();
    const maxBytes=/text\/html/.test(contentType)?256*1024:/xml|rss|text\/plain/.test(contentType)?384*1024:768*1024;
    const declaredSize=Number(response.headers.get("content-length")||0);
    if(declaredSize>maxBytes){
      await response.body?.cancel().catch(error=>{void error});
      throw new Error("response_body_too_large");
    }
    const bodyless=response.status===204||response.status===205||response.status===304;
    let body:ArrayBuffer|null=null;
    if(!bodyless&&response.body){
      const reader=response.body.getReader();
      const chunks:Uint8Array[]=[];
      let total=0;
      try{
        while(true){
          const part=await reader.read();
          if(part.done)break;
          total+=part.value.byteLength;
          if(total>maxBytes){
            await reader.cancel().catch(error=>{void error});
            throw new Error("response_body_too_large");
          }
          chunks.push(part.value);
        }
      }finally{
        reader.releaseLock();
      }
      const bytes=new Uint8Array(total);
      let offset=0;
      for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
      body=bytes.buffer as ArrayBuffer;
    }else if(!bodyless){
      body=new ArrayBuffer(0);
    }
    if(!response.ok)diagnostics?.push(provider+": http_"+response.status);
    return new Response(body,{status:response.status,statusText:response.statusText,headers:response.headers});
  }catch(error){throw error;}finally{clearTimeout(t);}
};
const cleanText=(s:string)=>String(s||"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
const scoreSource=(publisher:string, title:string, q:string) => {
  const p=publisher.toLowerCase(), t=title.toLowerCase(), terms=q.toLowerCase().split(/\s+/).filter(x=>x.length>2);
  let score=0;
  if(/wikipedia|wikidata/.test(p))score+=72;
  if(/pubmed|ncbi|crossref|openalex|nih|cdc|world health organization|who\.int|nature\.com|science\.org|gov\b/.test(p))score+=82;
  if(/bbc|reuters|ap|associated press|france 24|dw|al jazeera|sky news/.test(p))score+=78;
  if(terms.filter(x=>t.includes(x)).length)score+=Math.min(20,terms.filter(x=>t.includes(x)).length*6);
  return Math.min(100,score);
};
const source=(title:string,publisher:string,url:string):Source=>({title,publisher,url});
export const classifySection=(q:string,items:SearchResult[],language:Locale)=>{
 const personQuery=personLookup(q)||(nameOnlyArabicQuery(personQueryName(q))?personQueryName(q):undefined);
 if(personQuery&&items.some(x=>/wikipedia|wikidata|ويكيبيديا|ويكي بيانات/i.test((x.sources||[]).map(source=>source.publisher).join(" ")))&&items.some(item=>normalizedEntityTitle(item.title)===normalizedEntityTitle(personQueryName(q))&&personEvidence(item)))return"people";
 if(/عالم مصري|عالمة|كيميائي/.test(String(items.slice(0,6).map(item=>String(item.title||"")+" "+String(item.summary||"")).join(" ")))&&personQuery)return"people";
 const ordered=[...items].sort((a,b)=>Number(Boolean((b as any).body))-Number(Boolean((a as any).body)));
 const lead=ordered.find(item=>String(item.title||"").trim()&&String(item.summary||"").trim());
 const title=String(lead?.title||q);
 const evidence=ordered.slice(0,6).map(item=>String(item.title||"")+" "+String(item.summary||"")+" "+String((item as any).body||"")).join(" ");
 const combined=title+" "+evidence;
 if(/(?:\bweather\b|\btemperature\b|\brainfall\b|\bexchange rate\b|\bcurrency price\b|\bgold price\b|\bmarket price\b|الطقس|درجات الحرارة|سعر الذهب|أسعار العملات|سعر الصرف|الأسعار المباشرة)/i.test(q+" "+title))return "prices";
 const inferred=sectionForOpenedStory(title,evidence);
 if(inferred!=="unclassified")return inferred;
 // Unknown topics must stay unclassified rather than being routed into Global Shifts.
 // Preserve a concrete section attached to the strongest evidence instead of
 // silently routing every unrecognized topic into Global Shifts.
 const validSection=(value:unknown)=>sections.some(section=>section.slug===String(value||""));
 const explicitSection=[lead?.section,...ordered.map(item=>item.section)].map(value=>String(value||"")).find(value=>validSection(value)&&value!=="world");
 if(explicitSection&&(isContentForSection(explicitSection,title,String(lead?.summary||""))||(explicitSection==="travel"&&/(?:transit|transport|transportation|commute|public transport|تنقل|مواصلات|النقل|وسائل النقل)/i.test(title+" "+String(lead?.summary||"")))))return explicitSection;
 if(ordered.some(item=>String((item as any).kind||"")==="news"||Boolean((item as any).publishedAt)))return "news";
 if(/(?:\btrend\b|\bviral\b|\bpopular\b|ترند|متداول|رائج|اهتمام الناس)/i.test(combined))return "trends";
 if(/(?:\bcommunity\b|\bcommunities\b|\bsociety\b|\bsocial issue\b|\bpublic service\b|\bdaily life\b|\bhousing\b|\bfamilies\b|\bcost of living\b|مجتمع|مجتمعات|قضية اجتماعية|قضايا اجتماعية|خدمة عامة|خدمات عامة|الحياة اليومية|السكن|الأسرة|تكلفة المعيشة|المعيشة|السكان)/i.test(title+" "+String(lead?.summary||"")))return "egypt";
 if(/(?:\bidea\b|\bideas\b|\bdebate\b|\bphilosophy\b|\bphilosophical\b|\bargument\b|\bethics\b|\bcritical thinking\b|\bviewpoint\b|\bopinion\b|أفكار|فكرة|نقاش|نقاشات|فلسفة|فلسفي|جدل|حجة|أخلاقيات|تفكير نقدي|وجهة نظر|رأي|آراء|قضية فكرية|حوار فكري)/i.test(title+" "+String(lead?.summary||"")))return"arab";
 return "unclassified";
};

const searchTerms=(q:string)=>{const stop=new Set(["the","and","for","with","from","about","what","when","where","who","how","why","are","was","is","of","to","in","on","at","by","as","an","a","or","into","over","under","after","before","than","can","does","do","did","be","been","being","من","في","عن","على","الى","إلى","ما","ماذا","كيف","لماذا","هل","هو","هي","هذا","هذه","التي","الذي","مع"]);return String(q||"").normalize("NFKC").toLowerCase().replace(/[\u064B-\u065F\u0670]/g,"").replace(/[^\p{L}\p{N}\s]/gu," ").split(/\s+/).filter(x=>x.length>=2&&!stop.has(x)).slice(0,10)};
const searchTermVariants=(value:string)=>{
  const term=String(value||"").normalize("NFKC").toLowerCase().replace(/[\u064B-\u065F\u0670]/g,"").replace(/[أإآ]/g,"ا");
  if(/[\u0600-\u06FF]/.test(term)){
    const variants=[term];
    const withoutArticle=term.replace(/^(?:وال|بال|كال|لل|ال)/,"");
    variants.push(withoutArticle);
    for(const base of [term,withoutArticle]){
      if(base.length>4&&base.endsWith("ات"))variants.push(base.slice(0,-2));
      if(base.length>4&&/(?:ون|ين)$/.test(base))variants.push(base.slice(0,-2));
    }
    return [...new Set(variants.filter(Boolean))];
  }
  if(!/^[a-z]+$/.test(term)||["news","series","species"].includes(term))return [term];
  const variants=[term];
  if(term.length>5&&term.endsWith("ies"))variants.push(term.slice(0,-3)+"y",term.slice(0,-1));
  else if(term.length>5&&/(ches|shes|sses|xes|zes)$/.test(term))variants.push(term.slice(0,-2));
  else if(term.length>4&&term.endsWith("s")&&!/(ss|us|is)$/.test(term))variants.push(term.slice(0,-1));
  return [...new Set(variants)];
};
const matchingSearchTerms=(text:string,terms:string[])=>{const normalized=String(text||"").normalize("NFKC").toLowerCase().replace(/[\u064B-\u065F\u0670]/g,"").replace(/[^\p{L}\p{N}\s]/gu," ");const tokens=normalized.split(/\s+/).filter(Boolean);return terms.filter(term=>{const forms=searchTermVariants(term);return tokens.some(token=>{const tokenForms=searchTermVariants(token);return forms.some(form=>tokenForms.includes(form));});}).length;};
const relevanceScore=(x:Candidate,q:string)=>{const terms=searchTerms(q);if(!terms.length)return 0;const normalize=(v:string)=>String(v||"").normalize("NFKC").toLowerCase().replace(/[\u064B-\u065F\u0670]/g,"");const title=normalize(x.title),summary=normalize(x.summary),combined=title+" "+summary,normalizedQuery=normalize(q).trim(),titleHits=matchingSearchTerms(title,terms),summaryHits=matchingSearchTerms(summary,terms),allHits=matchingSearchTerms(combined,terms),phrase=title.includes(normalizedQuery);const person=personLookup(q);const identityBoost=person?(titleHits===terms.length?90:titleHits>0?titleHits*28:0):0;const authorOnlyPenalty=person&&titleHits===0&&summaryHits>0?35:0;return(phrase?75:0)+identityBoost+titleHits*18+summaryHits*7+allHits*4+Math.min(8,Number(x.score||0)/12)-authorOnlyPenalty};
// Do not reject a relevant result solely because a multi-word query is absent verbatim from its title.
// Use the summary and all query terms too, then fall back to the best locale-safe candidates if providers are weak.
const relevantCandidate=(x:Candidate,q:string)=>{const terms=searchTerms(q);const score=relevanceScore(x,q);if(!terms.length)return false;const normalize=(v:string)=>String(v||"").normalize("NFKC").toLowerCase().replace(/[\u064B-\u065F\u0670]/g,"");const title=normalize(x.title),summary=normalize(x.summary),combined=title+" "+summary;const titleHits=matchingSearchTerms(title,terms);const hits=matchingSearchTerms(combined,terms);const person=personLookup(q)||nameOnlyArabicQuery(q);if(personIdentityMatches(combined,personQueryName(q),x.identityAliases))return true;if(person){if(titleHits===0){const provider=String(x.provider||"")+" "+(x.sources||[]).map(source=>source.publisher||"").join(" ");const encyclopedia=/wikipedia|wikidata/i.test(provider);return encyclopedia?hits>0&&score>=20:hits>=Math.min(2,terms.length)&&score>=16;}return titleHits>=Math.min(1,terms.length)&& (hits>=Math.min(1,terms.length)||score>=25);}if(terms.length<=1)return hits>=1&&score>=4;return hits>=Math.min(2,terms.length);};
const relevantCandidateWithContext=(x:Candidate,q:string,context="")=>relevantCandidate(x,q)||Boolean(context&&relevantCandidate(x,context));
async function wikipedia(env:Env,q:string,language:Locale,diagnostics?:string[]):Promise<Candidate[]>{
  const api=language==="ar"?"https://ar.wikipedia.org/w/api.php":"https://en.wikipedia.org/w/api.php";
  const stop=new Set(["في","من","على","عن","إلى","الى","ما","ماذا","كيف","لماذا","هل","هو","هي","هذا","هذه","التي","الذي","مع","the","and","for","with","from","about","what","when","where","who","how","why","is","are"]);
  const normalized=String(q||"").replace(/[؟?،,:;.!]+/g," ").split(/\s+/).filter((word)=>word.length>1&&!stop.has(word.toLowerCase())).join(" ");
  const queries=[...new Set([q,normalized].filter((value)=>value&&value.trim()))];
  // Search the original wording and normalized variant concurrently. Previously,
  // a single weak result from the first query prevented the second query from running.
  const batches=await Promise.all(queries.map(async query=>{
    try{
      const u=api+"?action=query&generator=search&gsrsearch="+encodeURIComponent(query)+"&gsrlimit=8&prop=extracts|pageimages&exintro=1&explaintext=1&piprop=thumbnail&pithumbsize=900&format=json&origin=*";
      const r=await timeout(u,3500,diagnostics,"Wikipedia"); if(!r.ok)return [];
      const d=await r.json<any>();
      const pages=Object.values(d.query?.pages||{}) as any[];
      return pages.map((x:any)=>({
        title:cleanText(x.title),summary:cleanText(x.extract).slice(0,1800),section:"world",kind:"web" as const,evidence:"mixed" as const,
        imageUrl:/^https:\/\//i.test(String(x.thumbnail?.source||""))?String(x.thumbnail.source):undefined,imageAlt:cleanText(x.title),
        sources:[source(x.title,language==="ar"?"Wikipedia Arabic":"Wikipedia","https://"+(language==="ar"?"ar":"en")+".wikipedia.org/wiki/"+encodeURIComponent(String(x.title).replace(/ /g,"_")))],
        url:"https://"+(language==="ar"?"ar":"en")+".wikipedia.org/wiki/"+encodeURIComponent(String(x.title).replace(/ /g,"_")),
        score:scoreSource("Wikipedia",x.title,query)+8,provider:"Wikipedia"
      })).filter((x:any)=>x.title);
    }catch(error){reportProviderFailure(diagnostics,"Wikipedia",error);return []}
  }));
  const seen=new Set<string>();
  return batches.flat().filter(item=>{
    const key=String(item.title||"").toLocaleLowerCase();
    if(!key||seen.has(key))return false;
    seen.add(key);return true;
  }).slice(0,10);
}
async function wikipediaRestSearch(q:string,language:Locale,diagnostics?:string[]):Promise<Candidate[]>{
  // Independent Wikimedia REST search fallback: the Action API may be throttled
  // or unavailable from a particular edge location even when the REST endpoint works.
  try{
    const code=language==="ar"?"ar":"en";
    const url="https://api.wikimedia.org/core/v1/wikipedia/"+code+"/search/page?q="+encodeURIComponent(q)+"&limit=8";
    const r=await timeout(url,3500,diagnostics,"Wikipedia REST Search");
    if(!r.ok)return[];
    const data=await r.json<any>();
    return (Array.isArray(data.pages)?data.pages:[]).map((x:any)=>{
      const title=cleanText(x.title||x.key||"");
      const summary=cleanText(x.description||x.excerpt||"").slice(0,1600);
      const key=String(x.key||title).replace(/ /g,"_");
      const url="https://"+code+".wikipedia.org/wiki/"+encodeURIComponent(key);
      const imageUrl=String(x.thumbnail?.url||x.thumbnail?.source||"");
      return {title,summary,section:"world",kind:"web" as const,evidence:"mixed" as const,
        imageUrl:/^https:\/\//i.test(imageUrl)?imageUrl:undefined,imageAlt:title,
        sources:[source(title,language==="ar"?"Wikipedia Arabic":"Wikipedia",url)],
        url,score:scoreSource("Wikipedia",title,q)+8,provider:"Wikipedia REST Search"};
    }).filter((x:any)=>x.title&&x.url);
  }catch(error){reportProviderFailure(diagnostics,"Wikipedia REST Search",error);return[]}
}
async function wikidata(q:string,language:Locale,diagnostics?:string[]):Promise<Candidate[]>{
  try{
    const u="https://www.wikidata.org/w/api.php?action=wbsearchentities&search="+encodeURIComponent(q)+"&language="+language+"&limit=5&format=json&origin=*";
    const r=await timeout(u,2600,diagnostics,"Wikidata"); if(!r.ok)return[]; const d=await r.json<any>();
    return (d.search||[]).map((x:any)=>({title:cleanText(x.label||x.id),summary:cleanText(x.description||"").slice(0,900),section:"people",kind:"web",evidence:"mixed",sources:[source(x.label||x.id,"Wikidata","https://www.wikidata.org/wiki/"+x.id)],score:scoreSource("Wikidata",x.label||"",q),provider:"Wikidata"}));
  }catch(error){reportProviderFailure(diagnostics,"Wikidata",error);return[]}
}
async function wikidataEntityAliases(qid:string,diagnostics?:string[]):Promise<string[]>{
  if(!/^Q\d+$/i.test(qid))return[];
  try{
    const url="https://www.wikidata.org/w/api.php?action=wbgetentities&ids="+encodeURIComponent(qid)+"&props=labels%7Caliases&languages=en%7Car&format=json&origin=*";
    const response=await timeout(url,3500,diagnostics,"Wikidata entity aliases");
    if(!response.ok){diagnostics?.push("Wikidata entity aliases: http_"+response.status);return[];}
    const data=await response.json<any>();
    const entity=data.entities?.[qid];
    if(!entity)return[];
    const labels=Object.values(entity.labels||{}).map((item:any)=>item?.value||"");
    const aliases=Object.values(entity.aliases||{}).flatMap((items:any)=>Array.isArray(items)?items.map((item:any)=>item?.value||""):[]);
    return [...new Set([...labels,...aliases].map(cleanText).filter((value:string)=>value.length>=2&&value.length<=120))].slice(0,40);
  }catch(error){reportProviderFailure(diagnostics,"Wikidata entity aliases",error);return[]}
}

const decodeXml=(value:string)=>String(value||"").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)));
async function trustedPublisherRssSearch(q:string,language:Locale,diagnostics?:string[]):Promise<Candidate[]>{
  const stories=await searchTrustedNewsFeeds(q,language,diagnostics);
  return stories.slice(0,12).map(story=>{
    const title=cleanText(story.title),url=String(story.url||""),publisher=cleanText(story.publisher||"Trusted publisher");
    const summary=cleanText(story.summary||"").slice(0,1400);
    return {title,summary,section:sectionForOpenedStory(title,summary),kind:"web" as const,evidence:"mixed" as const,sources:[source(title,publisher,url)],url,score:scoreSource(publisher,title,q)+8,provider:"Trusted Publisher RSS Search"};
  }).filter(item=>item.title&&item.summary.length>=80&&/^https:\/\//i.test(item.url));
}
async function gdeltTopicEvidenceSearch(env:Env,q:string,language:Locale,diagnostics:string[]):Promise<Candidate[]>{
  const stories=await fetchGdeltEvidenceStories(language,env,diagnostics,fetch,q);
  const out=stories.map(story=>{
    const title=cleanText(story.title),url=String(story.url||""),publisher=cleanText(story.publisher||"");
    const summary=cleanText(story.summary||"").slice(0,1400);
    return {title,summary,section:sectionForOpenedStory(title,summary),kind:"web" as const,evidence:"mixed" as const,sources:[source(title,publisher,url)],url,score:scoreSource(publisher,title,q)+10,provider:"GDELT Publisher Text"};
  }).filter(item=>item.title&&item.summary.length>=120&&/^https:\/\//i.test(item.url));
  diagnostics.push("GDELT topic evidence accepted="+out.length+" language="+language);
  return out;
}
async function googleNewsSearch(q:string,language:Locale,diagnostics?:string[]):Promise<Candidate[]>{
  try{
    const stories=await searchNewsFeed(q,language,diagnostics);
    const out=stories.slice(0,8).map(story=>{
      const title=cleanText(story.title),url=String(story.url||""),publisher=cleanText(story.publisher||"Google News");
      const summary=cleanText(story.summary||"").slice(0,1400);
      return {title,summary,section:"news",kind:"web" as const,evidence:"mixed" as const,sources:[source(title,publisher,url)],url,score:scoreSource(publisher,title,q)+4,provider:"Google News Search"};
    }).filter(item=>item.title&&/^https:\/\//i.test(item.url));
    diagnostics?.push("Google News RSS parsed="+stories.length+" accepted="+out.length);
    return out;
  }catch(error){reportProviderFailure(diagnostics,"Google News Search",error);return[]}
}

export function normalizeBingNewsUrl(raw:string):string|undefined {
  try {
    const url=new URL(String(raw||"").trim());
    if(url.protocol==="http:"&&/(^|\.)bing\.com$/i.test(url.hostname))url.protocol="https:";
    if(url.protocol!=="https:"||url.username||url.password||/^(?:localhost|127(?:\.\d+){3}|0\.0\.0\.0|\[::1\])$/i.test(url.hostname))return;
    if(isBingAggregatorUrl(url.href)){
      for(const key of ["url","URL","u"]){
        let candidate=url.searchParams.get(key)||"";
        for(let attempt=0;candidate&&attempt<2;attempt++){
          try{
            const target=new URL(candidate);
            if(target.protocol==="https:"&&!isBingAggregatorUrl(target.href)&&!target.username&&!target.password&&!/^(?:localhost|127(?:\.\d+){3}|0\.0\.0\.0|\[::1\])$/i.test(target.hostname))return target.href;
          }catch(error){void error;}
          try{const decoded=decodeURIComponent(candidate);if(decoded===candidate)break;candidate=decoded}catch{break}
        }
      }
    }
    return url.toString();
  }catch{return}
}
const isBingAggregatorUrl=(value:string)=>{try{return /(^|\.)bing\.com$/i.test(new URL(value).hostname)}catch{return false}};
async function bingNewsSearch(q:string,language:Locale,diagnostics?:string[]):Promise<Candidate[]>{
  try{
    const setlang=language==="ar"?"ar":"en-US";
    const url="https://www.bing.com/news/search?q="+encodeURIComponent(q)+"&format=rss&setlang="+setlang;
    const response=await timeout(url,4500,diagnostics,"Bing News RSS");if(!response.ok){diagnostics?.push("Bing News RSS HTTP "+response.status);return[];}
    const xml=await response.text();const out:Candidate[]=[];let rawItems=0,rejectedTitle=0,rejectedUrl=0,aggregatorResolutions=0;
    for(const match of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)){
      rawItems++;
      const block=match[1];
      const field=(name:string)=>decodeXml(block.match(new RegExp("<"+name+"\\b[^>]*>([\\s\\S]*?)</"+name+">","i"))?.[1]||"").trim();
      const title=cleanText(field("title")),rawUrl=field("link"),summary=cleanText(field("description")).slice(0,1200);
      if(!title){rejectedTitle++;continue;}
      let articleUrl=normalizeBingNewsUrl(rawUrl);if(!articleUrl){rejectedUrl++;continue;}
      if(isBingAggregatorUrl(articleUrl)){
        if(aggregatorResolutions>=3){rejectedUrl++;continue;}
        aggregatorResolutions++;
        articleUrl=await resolvePublisherArticleUrl(articleUrl,diagnostics);
      }
      if(isBingAggregatorUrl(articleUrl)){rejectedUrl++;continue;}
      let publisher=cleanText(field("source")||"Bing News");
      if(/^Bing News$/i.test(publisher)){try{publisher=new URL(articleUrl).hostname.replace(/^www\./i,"")}catch(error){void error;}}
      out.push({title,summary,section:"news",kind:"web",evidence:"mixed",sources:[source(title,publisher,articleUrl)],url:articleUrl,score:scoreSource(publisher,title,q)+3,provider:"Bing News RSS"});
      if(out.length>=8)break;
    }
    diagnostics?.push("Bing News RSS raw="+rawItems+" accepted="+out.length+" rejected_title="+rejectedTitle+" rejected_url="+rejectedUrl);
    return out;
  }catch(error){reportProviderFailure(diagnostics,"Bing News RSS",error);return[]}
}
async function crossrefSearch(q:string,diagnostics?:string[]):Promise<Candidate[]>{
  try{
    const url="https://api.crossref.org/works?query.bibliographic="+encodeURIComponent(q)+"&rows=5&select=title,author,published,container-title,URL,abstract";
    const r=await timeout(url,4500,diagnostics,"Crossref");if(!r.ok)return[];
    const d=await r.json<any>();
    return (d.message?.items||[]).map((x:any)=>{
      const title=cleanText(Array.isArray(x.title)?x.title[0]||"":""),journal=cleanText(Array.isArray(x["container-title"])?x["container-title"][0]||"": "Crossref scholarly index");
      const year=x.published?.["date-parts"]?.[0]?.[0];
      const authors=Array.isArray(x.author)?x.author.slice(0,3).map((a:any)=>[a.given,a.family].filter(Boolean).join(" ")).join(", "):"";
      return {title,summary:[authors,year,journal,cleanText(x.abstract||"").replace(/<[^>]+>/g," ").slice(0,1000)].filter(Boolean).join(" — "),section:"science",kind:"web",evidence:"mixed",sources:[source(title,"Crossref",String(x.URL||"https://search.crossref.org/?q="+encodeURIComponent(q)))],url:String(x.URL||""),score:scoreSource("Crossref",title,q)+12,provider:"Crossref"};
    }).filter((x:any)=>x.title&&x.url);
  }catch(error){reportProviderFailure(diagnostics,"Crossref",error);return[]}
}
async function pubmedSearch(q:string,language:Locale,diagnostics?:string[]):Promise<Candidate[]>{
  if(language!=="en")return[];
  try{
    const searchUrl="https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=5&term="+encodeURIComponent(q);
    const sr=await timeout(searchUrl,2600,diagnostics,"PubMed search");if(!sr.ok)return[];
    const ids=(await sr.json<any>()).esearchresult?.idlist||[];if(!ids.length)return[];
    const detailUrl="https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id="+ids.join(",");
    const dr=await timeout(detailUrl,2600,diagnostics,"PubMed details");if(!dr.ok)return[];
    const d=await dr.json<any>();
    return ids.map((id:string)=>{const x=d.result?.[id]||{};const title=cleanText(x.title||"");return {title,summary:[x.pubdate,x.fulljournalname,x.elocationid].filter(Boolean).map(cleanText).join(" — "),section:"health",kind:"web",evidence:"mixed",sources:[source(title,"PubMed", "https://pubmed.ncbi.nlm.nih.gov/"+id+"/")],url:"https://pubmed.ncbi.nlm.nih.gov/"+id+"/",score:scoreSource("PubMed",title,q)+18,provider:"PubMed / NCBI"};}).filter((x:any)=>x.title);
  }catch(error){reportProviderFailure(diagnostics,"PubMed / NCBI",error);return[]}
}

async function openAiWebSearch(env:Env,q:string,language:Locale,diagnostics?:string[],backgroundBudget=false):Promise<Candidate[]>{
  if(!env.OPENAI_API_KEY||!(await openAIAllowed(env)))return[];
  const breaker=await getProviderBreaker(env,"openai");
  if(breaker.open){diagnostics?.push("OpenAI Web Search skipped: circuit_breaker_open code="+breaker.code);return[];}
  if(backgroundBudget&&!(await consumeDailyNewsAiCall(env))){diagnostics?.push("OpenAI Web Search skipped: background AI budget exhausted");return[];}
  try{
    const response=await fetch("https://api.openai.com/v1/responses",{
      method:"POST",
      headers:{authorization:"Bearer "+env.OPENAI_API_KEY,"content-type":"application/json"},
      signal:AbortSignal.timeout(6500),
      body:JSON.stringify({
        model:env.OPENAI_MODEL||"gpt-5-mini",
        tools:[{type:"web_search"}],
        instructions:language==="ar"
          ?"ابحث على الويب عن مصادر حقيقية. أعد JSON فقط بالشكل {\"results\":[{\"title\":\"...\",\"summary\":\"...\",\"url\":\"...\"}]}. أجب بالعربية، ولا تخترع روابط. استخدم فقط روابط وجدتها أداة البحث، وفضّل الجهات الرسمية والجامعات والأبحاث ووكالات الأنباء المعروفة."
          :"Search the web for real sources. Return JSON only in the shape {\"results\":[{\"title\":\"...\",\"summary\":\"...\",\"url\":\"...\"}]}. Use English and never invent URLs. Use only pages found by the web-search tool, preferring official institutions, universities, research, and reputable newsrooms.",
        input:"Search query: "+q+". Return up to six distinct useful sources with concise source-specific summaries."
      })
    });
    if(!response.ok){await handleOpenAIResponseFailure(env,"OpenAI Web Search",response);diagnostics?.push("OpenAI Web Search HTTP "+response.status+" classified");return[];}
    const data=await response.json<any>();
    const output=String(data.output_text||"").trim();
    const cited=new Map<string,string>();
    for(const item of data.output||[])for(const part of item.content||[])for(const ann of part.annotations||[]){
      if(ann.type==="url_citation"&&/^https:\/\//i.test(String(ann.url||"")))cited.set(String(ann.url),String(ann.title||""));
    }
    if(!cited.size)return[];
    let parsed:any;
    try{parsed=JSON.parse(output)}catch{return Array.from(cited.entries()).slice(0,5).map(([url,title])=>({title:cleanText(title||q),summary:cleanText(output).slice(0,1200),section:"world",kind:"web" as const,evidence:"mixed" as const,sources:[source(cleanText(title||q),new URL(url).hostname.replace(/^www\./i,""),url)],url,score:66,provider:"OpenAI Web Search"})).filter(x=>x.title&&x.summary&&languageSafe(x,language));}
    const rows=Array.isArray(parsed?.results)?parsed.results:[];
    return rows.filter((x:any)=>x&&cited.has(String(x.url||""))).slice(0,6).map((x:any)=>{
      const url=String(x.url),title=cleanText(x.title||cited.get(url)||q),summary=cleanText(x.summary||"").slice(0,1500);
      return {title,summary,section:"world",kind:"web",evidence:"mixed",sources:[source(title,new URL(url).hostname.replace(/^www\./i,""),url)],url,score:scoreSource("OpenAI Web Search",title,q)+8,provider:"OpenAI Web Search"};
    }).filter((x:Candidate)=>x.title&&x.summary&&languageSafe(x,language)&&!disallowedContent(x.title+" "+x.summary));
  }catch(error){reportProviderFailure(diagnostics,"OpenAI Web Search",error);return[]}
}
async function openAlex(q:string,diagnostics?:string[]):Promise<Candidate[]>{
 try{const u="https://api.openalex.org/works?search="+encodeURIComponent(q)+"&per-page=5";const r=await timeout(u,4000,diagnostics,"OpenAlex");if(!r.ok)return[];const d=await r.json<any>();return(d.results||[]).map((x:any)=>({title:cleanText(x.title||""),summary:cleanText(x.abstract_inverted_index?Object.keys(x.abstract_inverted_index).slice(0,80).join(" "):x.primary_location?.source?.display_name||"Research work"),section:"science",kind:"web",evidence:"mixed",sources:[source(x.title||"Research work","OpenAlex",x.id)],url:x.id,score:64,provider:"OpenAlex"})).filter((x:any)=>x.title)}catch(error){reportProviderFailure(diagnostics,"OpenAlex",error);return[]}
}
async function aiSearch(env:Env,q:string,language:Locale,diagnostics?:string[]):Promise<Candidate[]>{
  try{
    // The binding name is the namespace; the instance is bayan-search. Never
    // default to "default", which is not an AI Search instance ID.
    const instanceName=String(env.BAYAN_AI_SEARCH_INSTANCE||"bayan-search").trim();
    if(!env.AI_SEARCH||!instanceName||instanceName.toLowerCase()==="default")return[];
    const r=await env.AI_SEARCH.get(instanceName).search({messages:[{role:"user",content:q}]});
    const response=r as any;
    const chunks=Array.isArray(response?.chunks)?response.chunks:Array.isArray(response?.result?.chunks)?response.result.chunks:[];
    return chunks.slice(0,12).map((x:any)=>{
      const item=x?.item||{};
      const metadata=item?.metadata||x?.metadata||{};
      const url=String(x?.url||metadata?.url||item?.key||"").trim();
      const title=cleanText(x?.title||metadata?.title||x?.filename||"BAYAN evidence");
      const summary=cleanText(x?.summary||x?.content||x?.text||metadata?.description||"").slice(0,1800);
      const indexedLanguage=String(metadata?.language||"").toLowerCase();
      const isInternal=(()=>{try{return new URL(url).origin==="https://bayan.tahaomar411.workers.dev"}catch{return false}})();
      return {title,summary,section:String(metadata?.section||"world"),kind:isInternal&&new URL(url).pathname.startsWith("/article/")?"article":"web",evidence:"source_only",sources:[source(title,isInternal?"BAYAN internal index":String(metadata?.publisher||"BAYAN AI Search"),url||"https://bayan.tahaomar411.workers.dev/")],url,score:58,provider:"Cloudflare AI Search",language:indexedLanguage};
    }).filter((x:any)=>x.title&&x.summary&&(!x.language||x.language===language)&&(!x.url||/^https:\/\//i.test(x.url))).map(({language:_language,...candidate}:any)=>candidate);
  }catch(error){reportProviderFailure(diagnostics,"Cloudflare AI Search",error);return[]}
}
async function duck(q:string,language:Locale,diagnostics?:string[]):Promise<Candidate[]>{
  try{
    const u="https://api.duckduckgo.com/?q="+encodeURIComponent(q)+"&format=json&no_html=1&skip_disambig=0";
    const r=await timeout(u,3500,diagnostics,"DuckDuckGo Instant Answers"); if(!r.ok)return[];
    const d=await r.json<any>(); const out:Candidate[]=[];
    if(d.AbstractText) out.push({title:cleanText(d.Heading||q),summary:cleanText(d.AbstractText).slice(0,1800),section:"world",kind:"web",evidence:"mixed",sources:[source(cleanText(d.Heading||q),"DuckDuckGo","https://duckduckgo.com/?q="+encodeURIComponent(q))],score:68,provider:"DuckDuckGo"});
    for(const x of (d.RelatedTopics||[]).slice(0,6)){
      if(x?.Text) out.push({title:cleanText(String(x.Text).split(" - ")[0]||q),summary:cleanText(x.Text).slice(0,1200),section:"world",kind:"web",evidence:"mixed",sources:[source(cleanText(x.Text).slice(0,100),"DuckDuckGo",String(x.FirstURL||"https://duckduckgo.com/?q="+encodeURIComponent(q)))],score:52,provider:"DuckDuckGo"});
    }
    return out;
  }catch(error){reportProviderFailure(diagnostics,"DuckDuckGo Instant Answers",error);return[]}
}
async function bingWebSearch(q:string,language:Locale,diagnostics?:string[]):Promise<Candidate[]>{
  // General web search, independent of Bing News RSS and Wikimedia.
  // This is a public HTML fallback, so parse defensively and tolerate layout changes.
  try{
    const setlang=language==="ar"?"ar":"en-US";
    const url="https://www.bing.com/search?q="+encodeURIComponent(q)+"&setlang="+setlang+"&count=10";
    const response=await timeout(url,3000,diagnostics,"Bing Web Search");
    if(!response.ok)return[];
    const html=await response.text();
    const out:Candidate[]=[];
    const blocks=[...html.matchAll(/<li\b[^>]*class=["'][^"']*b_algo[^"']*["'][^>]*>([\s\S]*?)<\/li>/gi)];
    for(const match of blocks.slice(0,10)){
      const block=match[1];
      const anchor=block.match(/<h2\b[^>]*>[\s\S]*?<a\b([^>]*)>([\s\S]*?)<\/a>/i);
      if(!anchor)continue;
      const title=cleanText(decodeXml(anchor[2].replace(/<[^>]*>/g," ")));
      let target=decodeXml(anchor[1].match(/href=["']([^"']+)["']/i)?.[1]||"");
      try{const parsed=new URL(target);if(parsed.hostname==="www.bing.com"||parsed.hostname.endsWith(".bing.com"))continue;}catch{continue;}
      if(!title||!/^https:\/\//i.test(target))continue;
      const snippet=cleanText(decodeXml(block.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1]?.replace(/<[^>]*>/g," ")||"")).slice(0,1200);
      let publisher="Web result";try{publisher=new URL(target).hostname.replace(/^www\./i,"");}catch(error){reportProviderFailure(diagnostics,"Bing Web result URL",error)}
      out.push({title,summary:snippet,section:"world",kind:"web",evidence:"mixed",sources:[source(title,publisher,target)],url:target,score:scoreSource(publisher,title,q)+9,provider:"Bing Web Search"});
    }
    return out;
  }catch(error){reportProviderFailure(diagnostics,"Bing Web Search",error);return[]}
}
async function bingWebRssSearch(q:string,language:Locale,diagnostics?:string[]):Promise<Candidate[]>{
  // Bing's RSS endpoint is a bounded fallback. Aggregator URLs are resolved to
  // publisher hosts before they can contribute independent evidence.
  try{
    const setlang=language==="ar"?"ar":"en-US";
    const url="https://www.bing.com/search?q="+encodeURIComponent(q)+"&format=rss&setlang="+setlang;
    const response=await timeout(url,3200,diagnostics,"Bing Web RSS");if(!response.ok)return[];
    const xml=await response.text();const out:Candidate[]=[];let rawItems=0,aggregatorResolutions=0;
    for(const match of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)){
      rawItems++;
      const block=match[1];
      const field=(name:string)=>decodeXml(block.match(new RegExp("<"+name+"\\b[^>]*>([\\s\\S]*?)</"+name+">","i"))?.[1]||"").trim();
      const title=cleanText(field("title")),rawUrl=field("link"),summary=cleanText(field("description")).slice(0,1200);
      if(!title)continue;
      let target=normalizeBingNewsUrl(rawUrl);if(!target)continue;
      if(isBingAggregatorUrl(target)){
        if(aggregatorResolutions>=3)continue;
        aggregatorResolutions++;
        target=await resolvePublisherArticleUrl(target,diagnostics);
      }
      if(isBingAggregatorUrl(target))continue;
      let publisher="Bing Web";try{publisher=new URL(target).hostname.replace(/^www\./i,"")}catch(error){reportProviderFailure(diagnostics,"Bing RSS result URL",error)}
      out.push({title,summary,section:"world",kind:"web",evidence:"mixed",sources:[source(title,publisher,target)],url:target,score:scoreSource(publisher,title,q)+8,provider:"Bing Web RSS"});
      if(out.length>=8)break;
    }
    diagnostics?.push("Bing Web RSS raw="+rawItems+" accepted="+out.length+" resolved="+aggregatorResolutions);
    return out;
  }catch(error){reportProviderFailure(diagnostics,"Bing Web RSS",error);return[]}
}
const normalizedEntityTitle=(value:string)=>String(value||"").normalize("NFKC").toLowerCase()
  .replace(/[\u064B-\u065F\u0670]/g,"").replace(/[^\p{L}\p{N}]+/gu," ").trim();
const personQueryName=(query:string)=>String(query||"").trim()
  .replace(/^(?:who is|who was|biography(?: of)?|profile(?: of)?|من هو|من هي|سيرة ذاتية عن|سيرة ذاتية لشخص)\s+/i,"")
  .replace(/\s+(?:biography|profile|official profile|wikipedia|wiki|wikidata|سيرة ذاتية|ويكيبيديا|ويكي\s+بيانات|مصدر رسمي|official source)$/i,"").trim();
const personEvidence=(candidate:SearchResult)=>/(footballer|football player|soccer player|athlete|politician|writer|author|actor|actress|scientist|researcher|coach|president|minister|born in|is a .*player|لاعب كرة قدم|لاعب|رياضي|سياسي|كاتب|مؤلف|ممثل|عالِم|عالم|باحث|مدرب|رئيس|وزير|وُلد|ولد)/i.test(String(candidate.title||"")+" "+String(candidate.summary||""));
export const isSportsPersonProfile=(value:string)=>/(footballer|football player|soccer player|athlete|لاعب(?:\s+كرة قدم)?|اللاعب(?:ين|ون|ة)?|رياضي)/i.test(String(value||""));
const wikipediaExactPersonPage=async(query:string,language:Locale):Promise<Candidate[]>=>{
  const title=personQueryName(query).trim();
  if(!title||title.length>100)return[];
  const code=language==="ar"?"ar":"en";
  try{
    const url="https://"+code+".wikipedia.org/w/api.php?action=query&titles="+encodeURIComponent(title)+
      "&prop=extracts|pageimages|pageprops&exintro=1&explaintext=1&piprop=thumbnail&pithumbsize=1200&format=json&origin=*";
    const response=await timeout(url,2800);
    if(!response.ok)return[];
    const data=await response.json<any>();
    const pages=Object.values(data.query?.pages||{}) as any[];
    const page=pages.find((item:any)=>!item.missing&&normalizedEntityTitle(item.title)===normalizedEntityTitle(title));
    if(!page||page.pageprops?.disambiguation!==undefined||isDisambiguation({title:page.title,summary:page.extract} as Candidate))return[];
    const summary=cleanText(page.extract||"").slice(0,1800);
    if(!summary||!personEvidence({title:page.title,summary} as SearchResult))return[];
    if(mixedIdentitySummary(title,{title:page.title,summary} as Candidate))return[];
    const pageUrl="https://"+code+".wikipedia.org/wiki/"+encodeURIComponent(String(page.title).replace(/ /g,"_"));
    const imageUrl=String(page.thumbnail?.source||"");
    return [{
      title:cleanText(page.title),summary,section:"people",kind:"web",evidence:"mixed",
      imageUrl:imageUrl.startsWith("https://")?imageUrl:undefined,imageAlt:cleanText(page.title),
      sources:[source(cleanText(page.title),language==="ar"?"Wikipedia Arabic":"Wikipedia",pageUrl)],
      url:pageUrl,score:100,provider:"Wikipedia Exact Page"
    } as Candidate];
  }catch{return[]}
};

const isDisambiguation=(candidate:Candidate|string)=>{const value=typeof candidate==="string"?candidate:String(candidate.title||"")+" "+String(candidate.summary||"");return /(?:disambiguation|\(توضيح\)|صفحة توضيح|معاني الأسماء|قد يشير إلى|قد تشير إلى|may refer to|people with the name)/i.test(value);};
const identityText=(value:string)=>String(value||"").normalize("NFKC").toLowerCase()
  .replace(/[\u064B-\u065F\u0670]/g,"").replace(/[^\p{L}\p{N}]+/gu," ").replace(/\s+/g," ").trim();
const mixedIdentitySummary=(query:string,candidate:Candidate)=>{
  const name=identityText(personQueryName(query));
  const summary=identityText(candidate.summary||"");
  if(!name||!summary)return false;
  const explicitMarker=/(?:may refer to|people with the name|صفحة توضيح|قد يشير إلى|قد تشير إلى)/i.test(String(candidate.summary||""))||
    summary.includes(name+" توضيح");
  if(!explicitMarker)return false;
  const variants=new Set<string>();
  let pos=summary.indexOf(name);
  while(pos>=0){
    const suffix=summary.slice(pos+name.length).trim().split(" ")[0]||"";
    if(suffix&&!new Set(["محمد","صلاح","حامد","محروس","غالي","لاعب","اللاعب","من","هو","هي","الذي","التي","توضيح"]).has(suffix))variants.add(suffix);
    pos=summary.indexOf(name,pos+name.length);
  }
  return variants.size>=2;
};
const hasConflictingCurrentClubClaims=(value:string)=>{
  const text=String(value||"");
  const hasTrabzon=/(?:طرابزون\s*سبور|trabzonspor)/i.test(text);
  const hasLiverpool=/(?:ليفربول|liverpool)/i.test(text);
  const currentClub=/(?:يلعب\s*(?:حاليا|حالياً|حاليًا)?\s*(?:مع|في)|ناديه\s*الحالي|currently\s+plays\s+for|current\s+club|plays\s+for)/i.test(text);
  return hasTrabzon&&hasLiverpool&&currentClub;
};
const sanitizeConflictingCurrentClubClaims=(value:string)=>{
  const text=String(value||"");
  const hasTrabzon=/(?:طرابزون\s*سبور|trabzonspor)/i.test(text);
  const hasLiverpool=/(?:ليفربول|liverpool)/i.test(text);
  const currentClub=/(?:يلعب\s*(?:حاليا|حالياً|حاليًا)?\s*(?:مع|في)|ناديه\s*الحالي|currently\s+plays\s+for|current\s+club|plays\s+for)/i.test(text);
  if(!hasTrabzon||!hasLiverpool||!currentClub)return text;
  return text.split(/(?<=[.!؟?])\s+|\n+/).filter(sentence=>!/(?:طرابزون\s*سبور|trabzonspor|ليفربول|liverpool)/i.test(sentence)).join(" ").trim();
};

const nameOnlyArabicQuery=(query:string)=>{
 const raw=String(query||"").trim();
 if(!/^[\u0600-\u06FF]+(?:\s+[\u0600-\u06FF]+){1,3}$/.test(raw))return false;
 return !/(?:ما هو|ما هي|تاريخ|علوم|تقنية|اقتصاد|سياسة|رياضة|ذكاء اصطناعي|تغير المناخ|الفضاء|الطاقة|الصحة|السياحة|البرمجة|مصر|العالم العربي|التجارة|العملات|أسعار|فوائد|أنواع|دليل|شرح|مفهوم|تعريف)/.test(raw);
};
export const isolateExactPerson=(query:string,items:Candidate[])=>{
 const name=normalizedEntityTitle(personQueryName(query));
 if(!name)return items;
 const exactTitle=items.filter(item=>normalizedEntityTitle(item.title)===name);
 const cleanExact=exactTitle.filter(item=>!isDisambiguation(item)&&!mixedIdentitySummary(query,item));
 const profile=cleanExact.filter(personEvidence);
 // A single disambiguation result must not hide a valid exact profile from another provider.
 if(profile.length){
   const canonicalRank=(item:Candidate)=>{
      const summary=String(item.summary||"");
      const provider=String(item.provider||"")+" "+(item.sources||[]).map(source=>source.publisher||"").join(" ");
      let rank=Math.min(summary.length,1200)/24;
      if(/wikipedia/i.test(provider))rank+=36;
      if(/wikidata/i.test(provider))rank-=18;
      if(/footballer|football player|soccer player|لاعب كرة قدم|لاعب كرة القدم/i.test(summary))rank+=24;
      if(/actor|actress|ممثل|ممثلة/i.test(summary)&&!/footballer|football player|soccer player|لاعب كرة قدم|لاعب كرة القدم/i.test(summary))rank-=8;
      const currentClubClaims=(summary.match(/currently plays for|current club is|plays for [^,.؛]+|يلعب حاليا مع نادي|يلعب حاليًا مع نادي|ناديه الحالي/gi)||[]).length;
      if(currentClubClaims>1)rank-=140;
      if(isDisambiguation(item)||mixedIdentitySummary(query,item))rank-=1000;
      return rank+relevanceScore(item,query)/100;
    };
    const canonical=profile.sort((a,b)=>canonicalRank(b)-canonicalRank(a))[0];
    canonical.section="people";
   const description=String(canonical.summary||"");
   const sports=isSportsPersonProfile(description);
   const medicine=/physician|doctor|surgeon|طبيب|طبيبة/i.test(description);
   const politics=/politician|president|minister|سياسي|رئيس|وزير/i.test(description);
   const arts=/writer|author|poet|actor|actress|كاتب|مؤلف|شاعر|ممثل|ممثلة/i.test(description);
   const context=sports?/(football|soccer|footballer|soccer player|premier league|club|goal|match|team|league|transfer|sign(?:s|ed)?|contract|deal|join(?:s|ed)?|striker|forward|trabzonspor|منتخب|كرة قدم|الدوري|هدف|مباراة|نادي|رياضة|انتقال|يوقع|وقع|ينضم|انضم|عقد|صفقة|طرابزون|اللاعب(?:ين|ون|ة)?|لاعب(?:ين|ون|ة)?)/i:
     medicine?/(medical|medicine|hospital|clinical|doctor|طب|طبي|مستشفى|علاج|طبيب)/i:
     politics?/(government|election|president|minister|politic|حكومة|انتخابات|رئيس|وزير|سياسة)/i:
     arts?/(book|novel|film|movie|writer|author|actor|poet|كتاب|رواية|فيلم|كاتب|مؤلف|ممثل|شاعر)/i:null;
   // Collapse exact-title providers to one canonical identity, but merge their distinct source citations and a safe exact-page image.
   canonical.sources=(canonical.sources||[]).filter(source=>normalizedEntityTitle(source.title)===name||/wikidata/i.test(String(source.publisher||"")));
   const sourceKeys=new Set((canonical.sources||[]).map(source=>String(source.url||"").trim()).filter(Boolean));
   for(const candidate of cleanExact){
     if(candidate!==canonical){
       for(const source of candidate.sources||[]){if(normalizedEntityTitle(source.title)!==name&&!/wikidata/i.test(String(source.publisher||"")))continue;const url=String(source.url||"").trim();if(url&&!sourceKeys.has(url)){canonical.sources=[...(canonical.sources||[]),source];sourceKeys.add(url);}}
       if(!canonical.imageUrl&&/^https:\/\//i.test(String(candidate.imageUrl||""))){canonical.imageUrl=candidate.imageUrl;canonical.imageAlt=candidate.imageAlt||candidate.title;}
     }
   }
   const safe=items.filter(item=>{
     if(isDisambiguation(item)||mixedIdentitySummary(query,item))return false;
     if(normalizedEntityTitle(item.title)===name)return item===canonical;
     if((item.sources||[]).some(source=>/wikipedia|wikidata|ويكيبيديا|ويكي بيانات/i.test(String(source.publisher||""))))return false;
     const title=normalizedEntityTitle(item.title);
     // Exclude encyclopedia pages whose titles append a second person's identity.
     if(title.startsWith(name+" ")&&/(?:دندراوي|زكريا|مصطفى|العزب|جندي|ممثل|مدرب|توضيح|تشالدران|denrawi|zakaria|mustafa|al.?azab|soldier|actor|disambiguation)/i.test(title.slice(name.length)))return false;
     const text=String(item.title||"")+" "+String(item.summary||"");
     if(context)return context.test(text)&&personIdentityMatches(text,name,item.identityAliases);
     return personIdentityMatches(text,name,item.identityAliases);
   });
   return safe.length?safe:cleanExact;
 }
 // A bare Arabic name becomes a strict person lookup only when an exact profile exists.
 if(nameOnlyArabicQuery(personQueryName(query))&&exactTitle.length)return [];
 if(personLookup(query)||nameOnlyArabicQuery(query))return items.filter(item=>!isDisambiguation(item)&&!mixedIdentitySummary(query,item));
 return items.filter(item=>!mixedIdentitySummary(query,item));
};
const identityTextForSearch=(value:string)=>String(value||"").normalize("NFKC").toLowerCase()
 .replace(/[\u064B-\u065F\u0670]/g,"").replace(/[^\p{L}\p{N}]+/gu," ").replace(/\s+/g," ").trim();
export const personIdentityMatches=(text:string,name:string,aliases:string[]=[]):boolean=>{
  const normalizedText=identityTextForSearch(text);
  const candidates=[name,...(Array.isArray(aliases)?aliases:[])].map(identityTextForSearch).filter(alias=>alias.length>=2);
  return candidates.some(alias=>normalizedText.includes(alias));
};
export const isolateArticleSubject=(title:string,items:Candidate[])=>{
 const query=normalizedEntityTitle(title);
 if(!query||!Array.isArray(items))return [];
 const isolated=isolateExactPerson(title,items);
 if(isolated.length<items.length)return isolated.filter(item=>!isDisambiguation(String(item.title||"")+" "+String(item.summary||"")));
 const exact=items.filter(item=>normalizedEntityTitle(item.title)===query);
 const validExact=exact.filter(item=>!isDisambiguation(String(item.title||"")+" "+String(item.summary||"")));
 if(validExact.length){
  return validExact.filter(item=>!isDisambiguation(String(item.title||"")+" "+String(item.summary||""))&&!mixedIdentitySummary(title,item));
 }
 const arabicName=/^[\u0600-\u06FF]+(?:\s+[\u0600-\u06FF]+){1,3}$/.test(String(title||"").trim())&&!/(?:ما هو|ما هي|تاريخ|علوم|تقنية|اقتصاد|سياسة|رياضة|ذكاء اصطناعي|تغير المناخ|الفضاء|الطاقة|الصحة|السياحة|البرمجة|مصر|العالم العربي)/.test(title);
 if(arabicName&&items.some(item=>normalizedEntityTitle(item.title).startsWith(query+" ")))return [];
 return items.filter(item=>!isDisambiguation(String(item.title||"")+" "+String(item.summary||"")));
};
const personLookup=(q:string)=>{
  const raw=String(q||"").trim();
  const words=raw.split(/\s+/).filter(Boolean);
  // Treat a query as a person lookup only when the user explicitly asks for a
  // biography/profile, or when an English proper name is detected below.
  // Role words such as "scientist", "عالم", and "رئيس" also occur in ordinary
  // topic searches and must not force the restrictive biography-only path.
  const explicit=/^(?:who is|who was|biography(?: of)?|profile(?: of)?|من هو|من هي|سيرة ذاتية عن|سيرة ذاتية لشخص)\s+/i.test(raw);
  if(explicit)return true;
  if(words.length<2||words.length>4)return false;
  // Topic phrases must not be mistaken for people merely because they contain
  // two or more words. This is especially important for Arabic knowledge queries.
  if(/(weather|temperature|price|gold|dollar|currency|news|latest|today|history|science|technology|artificial intelligence|machine learning|climate change|renewable energy|economy|politics|football|sports|education|environment|energy|programming|cybersecurity|nutrition|agriculture|water resources|philosophy|mathematics|physics|chemistry|tourism|investment|taxes|law|international relations|space|astronomy|discoveries|discovery|planets|stars|galaxies|nasa|space exploration|best|top|how|what|why|where|when|guide|definition|meaning|difference|compare|types|benefits|tutorial|examples|restaurant|restaurants|recipe|recipes|طقس|حرارة|سعر|ذهب|دولار|عملة|أخبار|اليوم|تاريخ|علوم|تقنية|اقتصاد|سياسة|رياضة|ذكاء اصطناعي|تعلم الآلة|تغير المناخ|التغير المناخي|البيئة|الطاقة|التعليم|الاقتصاد|التاريخ|البرمجة|الأمن السيبراني|التغذية|الزراعة|المياه|الفلسفة|الرياضيات|الفيزياء|الكيمياء|السياحة|الاستثمار|الضرائب|القانون|التجارة|العلاقات الدولية|الفضاء|اكتشافات|اكتشاف|فلك|كواكب|نجوم|مجرات|ناسا|أفضل|كيف|ماذا|لماذا|أين|دليل|معنى|أنواع|فوائد|مطاعم|وصفة)/i.test(raw))return false;
  // Only infer a name-only English lookup from proper-name capitalization.
  // Arabic names still use the normal multi-provider search unless the user
  // explicitly asks "من هو/من هي", avoiding the restrictive person-only filter.
  return /^[A-Z][a-z]+(?:[ '-]+[A-Z][a-z]+){1,3}$/.test(raw);
};
async function expandedSearch(env:Env,q:string,language:Locale,person=false,identitySummary="",diagnostics:string[]=[],identityAliases:string[]=[],publicationResearch=false,publicationContext=""):Promise<Candidate[]>{
  // Recovery uses distinct query formulations, not just the same phrase with a suffix.
  // Keep the fan-out bounded so broader recall does not create unbounded latency/subrequests.
  const normalized=q.normalize("NFKC").replace(/[\u064B-\u065F\u0670]/g,"").replace(/[“”‘’]/g,'"').replace(/[؟?!،,;；]+/g," ").replace(/\s+/g," ").trim();
  const compact=searchTerms(normalized).slice(0,6).join(" ");
  const contextCompact=searchTerms(String(publicationContext||"").normalize("NFKC")).slice(0,6).join(" ");
  const generalCompact=publicationResearch&&contextCompact?[compact,contextCompact].filter(Boolean).join(" "):compact;
  const identity=String(identitySummary||"");
  const sportsProfile=isSportsPersonProfile(identity);
  const writerProfile=/(writer|author|novelist|poet|كاتب|مؤلف|روائي|شاعر)/i.test(identity);
  // Arabic sports queries can miss current coverage when providers index the
  // player's Latin-script name. Add an English-name query without assuming a club;
  // the result-language and relevance gates still enforce locale and identity.
  const englishPersonName=person&&language==="ar"
    ? identityAliases.find(alias=>!hasArabic(alias)&&normalizedEntityTitle(alias)!==normalizedEntityTitle(q))
    : undefined;
  // Query-type-aware recovery applies to every search; no person or topic is hard-coded.
  const variants=person
    ? (language==="ar"
      ? (sportsProfile
        ? [q+" آخر الأخبار",englishPersonName ? englishPersonName+" latest news" : q+" آخر الأخبار",q+" انتقال"]
        : writerProfile ? [q+" آخر الأخبار",englishPersonName ? englishPersonName+" latest news" : q+" مقابلة",q+" أعماله ومؤلفاته"] : [q+" آخر الأخبار",englishPersonName ? englishPersonName+" latest news" : q+" مقابلة",q+" مصدر رسمي"])
      : (sportsProfile
        ? [q+" latest news",q+" transfer news",q+" official profile"]
        : writerProfile ? [q+" latest news",q+" interview",q+" bibliography"] : [q+" latest news",q+" interview",q+" official profile"]))
    : (language==="ar" ? [generalCompact+" معلومات ومصادر موثوقة",generalCompact+" آخر الأخبار",q+" شرح"] : [generalCompact+" reliable sources",generalCompact+" latest news",q+" overview"]);
  // Run the first variant alone, then fan out remaining bounded variants only
  // when evidence is still sparse. This avoids unnecessary provider load while
  // keeping the worst-case recovery window short enough for the browser request.
  const uniqueVariants=[...new Set(variants.map(x=>x.trim()).filter(Boolean))].slice(0,publicationResearch?2:1);
  const labels=["Wikipedia REST Search","Google News Search","Bing Web RSS Search","Trusted Publisher RSS Search"];
  const runVariant=async(variant:string,variantIndex:number):Promise<Candidate[]>=>{
    // Publication recovery skips encyclopedia lookups and keeps only current-news providers.
    // Try a second wording only when the first still lacks useful independent evidence.
    const googleNewsRetrySkipped=shouldSkipGoogleNewsRetry(diagnostics);
    if(googleNewsRetrySkipped)diagnostics.push("Google News Search retry skipped after prior failure");
    const results=await Promise.all([
      publicationResearch?Promise.resolve([]):wikipediaRestSearch(variant,language,diagnostics).catch(error=>{reportProviderFailure(diagnostics,"Wikipedia REST Search",error);return[]}),
      googleNewsRetrySkipped?Promise.resolve([]):googleNewsSearch(variant,language,diagnostics).catch(error=>{reportProviderFailure(diagnostics,"Google News Search",error);return[]}),
      bingWebRssSearch(variant,language,diagnostics).catch(error=>{reportProviderFailure(diagnostics,"Bing Web RSS Search",error);return[]}),
      trustedPublisherRssSearch(variant,language,diagnostics).catch(error=>{reportProviderFailure(diagnostics,"Trusted Publisher RSS Search",error);return[]})
    ]);
    diagnostics.push("Expanded variant "+(variantIndex+1)+" result counts: "+labels.map((label,index)=>label+"="+(results[index]?.length||0)).join(", "));
    return results.flat();
  };
  const batches:Candidate[][]=[];
  if(uniqueVariants.length){
    batches.push(await runVariant(uniqueVariants[0],0));
    const recovered=batches.flat().filter(item=>relevantCandidateWithContext(item,q,publicationResearch?publicationContext:"")&&languageSafe(item,language));
    const hosts=new Set(recovered.flatMap(item=>(item.sources||[]).map(src=>{
      try{return new URL(String(src.url||"")).hostname.toLowerCase().replace(/^www\./,"")}
      catch{return ""}
    })).filter(host=>host&&!/wikipedia\.org|wikidata\.org|news\.google\.com|bing\.com|duckduckgo\.com/.test(host)));
    if(!(recovered.length>=6&&hosts.size>=3)&&uniqueVariants.length>1){
      // Retry alternate phrasings sequentially to avoid multiplying simultaneous
      // outbound requests when the first pass is already resource-constrained.
      for(let index=1;index<uniqueVariants.length;index++){
        batches.push(await runVariant(uniqueVariants[index],index));
        const accumulated=batches.flat().filter(item=>relevantCandidateWithContext(item,q,publicationResearch?publicationContext:"")&&languageSafe(item,language));
        const accumulatedHosts=new Set(accumulated.flatMap(item=>(item.sources||[]).map(src=>{
          try{return new URL(String(src.url||"")).hostname.toLowerCase().replace(/^www\./,"")}
          catch{return ""}
        })).filter(host=>host&&!/wikipedia\.org|wikidata\.org|news\.google\.com|bing\.com|duckduckgo\.com/.test(host)));
        if(accumulated.length>=6&&accumulatedHosts.size>=3)break;
      }
    }
  }
  return batches.flat().map(item=>identityAliases.length?({...item,identityAliases:[...identityAliases]}):item);
}
async function settings(env:Env){try{const r=await env.DB.prepare("SELECT key,value FROM admin_settings").all<any>();return Object.fromEntries((r.results||[]).map((x:any)=>[x.key,x.value]))}catch{return{}}}
const hasArabic=(value:string)=>/[\u0600-\u06ff]/.test(String(value||""));
const disallowedContent=(value:string)=>{
 const text=String(value||"").toLowerCase();
 return /(?:porn(?:ography)?|xxx\b|hentai|onlyfans|sex\s*video|explicit\s+sex|nude\s+leak|leaked\s+nudes|child\s+sexual\s+abuse|child\s+porn|csam|sexual\s+exploitation|(?:اباحي|إباحي|اباحية|إباحية|بورنو|بورن|هنتاي|صور\s+عارية|فيديوهات?\s+جنسية|مقاطع?\s+جنسية|تسريب\s+صور\s+حميمية|استغلال\s+جنسي\s+للأطفال))/i.test(text);
};
const usefulDraft=(answer:string,language:Locale)=>{
 const a=String(answer||"").trim();
 if(a.length<1800||disallowedContent(a))return false;
 const paragraphs=a.split(/\n\s*\n/).map(part=>part.trim()).filter(part=>part.length>=45);
 const headings=(a.match(/^#{1,3}\s+.+$/gm)||[]).length;
 // A length threshold alone can be satisfied by repetition. Require a meaningful
 // article structure as well; otherwise keep the result in search and do not publish it.
 if(paragraphs.length<5||(headings<4&&paragraphs.length<7))return false;
 if(language==="ar")return hasArabic(a)&&!a.includes("وجدت أدلة يمكن الرجوع إليها، لكن تعذر تشغيل صياغة BAYAN الذكية الآن");
 return !hasArabic(a)&&!a.includes("Relevant evidence was found, but BAYAN's drafting model is temporarily unavailable");
};
// The headline is the strongest locale signal. A translated summary must not make
// an English headline appear in Arabic mode (or vice versa).
const localizedSource=(value:string,language:Locale)=>{
  const name=String(value||"").trim(),lower=name.toLowerCase();
  if(language==="ar"){
    if(/youtube|youtu\.be|vimeo/.test(lower))return "فيديو على YouTube";
    if(/wikipedia/.test(lower))return "ويكيبيديا";
    if(/wikidata/.test(lower))return "ويكي بيانات";
    if(/openalex/.test(lower))return "أوبن أليكس للأبحاث";
    if(/cloudflare ai search/.test(lower))return "بحث كلاودفلير";
    if(/duckduckgo/.test(lower))return "داك داك جو";
    if(/gdelt/.test(lower))return "قاعدة الأخبار العالمية";
    if(/bbc/.test(lower))return "بي بي سي";
    if(/reuters/.test(lower))return "رويترز";
    if(/associated press|ap news/.test(lower))return "أسوشيتد برس";
    if(/al.?jazeera/.test(lower))return "الجزيرة";
    return name||"مصدر بحث";
  }
  if(/فيديو على youtube/i.test(name))return "YouTube video";
  if(/youtube|youtu\.be|vimeo/.test(lower))return "YouTube video";
  if(/ويكيبيديا/.test(name))return "Wikipedia";
  if(/ويكي بيانات/.test(name))return "Wikidata";
  if(/أوبن أليكس/.test(name))return "OpenAlex";
  if(/بحث كلاودفلير/.test(name))return "Cloudflare AI Search";
  if(/داك داك جو/.test(name))return "DuckDuckGo";
  if(/قاعدة الأخبار العالمية/.test(name))return "GDELT";
  return /[\u0600-\u06ff]/.test(name)?"Research source":name;
};
const localeSafeText=(value:string,language:Locale)=>{
  if(!value)return true;
  if(language==="en")return !hasArabic(value);
  if(!hasArabic(value))return false;
  const sentences=value.split(/[\n.!؟?]+/).map(part=>part.trim()).filter(Boolean);
  return sentences.every(part=>hasArabic(part)||!/[A-Za-z]{5,}/.test(part));
};
const localizedPersonDescription=(value:string,language:Locale)=>{
 const text=String(value||"").normalize("NFKC").toLowerCase();
 if(language==="ar"){
  if(/egyptian footballer|egyptian soccer player/.test(text))return "لاعب كرة قدم مصري.";
  if(/footballer|soccer player|association football player/.test(text))return "لاعب كرة قدم.";
  if(/egyptian novelist|egyptian writer|egyptian author/.test(text))return "كاتب مصري.";
  if(/novelist|writer|author/.test(text))return "كاتب أو مؤلف.";
  if(/politician|political figure/.test(text))return "شخصية سياسية.";
  if(/scientist|researcher/.test(text))return "عالم أو باحث.";
  if(/actor|actress/.test(text))return "ممثل.";
  if(/football manager|football coach/.test(text))return "مدرب كرة قدم.";
 }
 if(language==="en"){
  if(/لاعب كرة قدم مصري/.test(text))return "Egyptian footballer.";
  if(/لاعب كرة قدم/.test(text))return "Footballer.";
  if(/كاتب مصري/.test(text))return "Egyptian writer.";
  if(/كاتب|مؤلف/.test(text))return "Writer or author.";
  if(/شخصية سياسية|سياسي/.test(text))return "Political figure.";
  if(/عالم|باحث/.test(text))return "Scientist or researcher.";
  if(/ممثل/.test(text))return "Actor.";
  if(/مدرب كرة قدم/.test(text))return "Football coach.";
 }
 return "";
};
const languageSafe=(x:Candidate,language:Locale)=>{
  // Use the title to select the requested language. A source may have a useful
  // localized headline but an English abstract; keep the result and blank only
  // the mismatched summary below rather than discarding the entire source.
  const title=String(x.title||"");
  return language==="ar" ? hasArabic(title) : !hasArabic(title);
};export async function searchRecentNewsArchive(env:Env,q:string,language:Locale,publicationContext=""):Promise<Candidate[]>{
  const cutoff=new Date(Date.now()-7*24*60*60*1000).toISOString();
  const future=new Date(Date.now()+5*60*1000).toISOString();
  try{
    const requestedTerms=[...new Set([...searchTerms(q).slice(0,3),...(publicationContext?searchTerms(publicationContext).slice(0,4):[])])];
    // A title/query can contain a single oversized token. Split by UTF-8 byte
    // length and escape LIKE metacharacters; never pass a full title as pattern.
    const terms=boundedLikeKeywords(requestedTerms,6);
    if(!terms.length)return[];
    const predicates=terms.map(()=>"(title LIKE ? ESCAPE '!' OR summary LIKE ? ESCAPE '!')").join(" OR ");
    const patterns=terms.flatMap(term=>[escapedLikePattern(term),escapedLikePattern(term)]);
    const response=await env.DB.prepare("SELECT title,summary,url,publisher,published_at,image_url,image_alt,section FROM news_archive WHERE language=? AND fetched_at>=? AND published_at>=? AND published_at<=? AND length(summary)>=50 AND ("+predicates+") ORDER BY fetched_at DESC LIMIT 60").bind(language,cutoff,cutoff,future,...patterns).all<any>();
    const output:Candidate[]=[];
    const seenPublishers=new Set<string>();
    for(const row of response.results||[]){
      const title=cleanText(String(row.title||""));
      const summary=cleanText(String(row.summary||"")).slice(0,1200);
      const url=String(row.url||"").trim();
      if(!title||!summary||!/^https:\/\//i.test(url)||/\/videos?\/|youtube\.com|youtu\.be|vimeo\.com|^Watch:/i.test(url+" "+title))continue;
      if(!languageSafe({title,summary} as Candidate,language)||!localeSafeText(summary,language))continue;
      let host="";
      try{const parsed=new URL(url);if(parsed.protocol!=="https:"||parsed.username||parsed.password)continue;host=parsed.hostname.toLowerCase().replace(/^www\./,"");}catch{continue;}
      if(!host||/(?:^|\.)(?:bayan\.tahaomar411\.workers\.dev|wikipedia\.org|wikidata\.org|google\.com|googleusercontent\.com|bing\.com|duckduckgo\.com)$/i.test(host))continue;
      const publisher=cleanText(String(row.publisher||host));
      if(/google news|bing news|duckduckgo|wikipedia|wikidata|aggregator|ويكيبيديا|ويكي بيانات/i.test(publisher))continue;
      const candidate:Candidate={title,summary,section:"news",kind:"web",evidence:"mixed",sources:[{title,publisher,url,publishedAt:String(row.published_at||""),imageUrl:safePublicImageUrl(row.image_url)}],url,imageUrl:safePublicImageUrl(row.image_url),imageAlt:String(row.image_alt||title),score:scoreSource(publisher,title,q)+22,provider:"BAYAN Recent News Archive"};
      if(!relevantCandidateWithContext(candidate,q,publicationContext))continue;
      const publisherKey=publisher.toLowerCase();
      if(seenPublishers.has(publisherKey))continue;
      seenPublishers.add(publisherKey);
      output.push(candidate);
      if(output.length>=8)break;
    }
    return output;
  }catch(error){throw error;}
}
export async function searchAvailabilityProbe():Promise<boolean>{
  const diagnostics:string[]=[];
  const bing=await bingWebRssSearch("photosynthesis","en",diagnostics).catch(error=>{reportProviderFailure(diagnostics,"Bing RSS health probe",error);return[]});
  if(bing.length)return true;
  const wikipedia=await wikipediaRestSearch("photosynthesis","en",diagnostics).catch(error=>{reportProviderFailure(diagnostics,"Wikipedia health probe",error);return[]});
  return wikipedia.length>0;
}

export async function search(env:Env,q:string,language:Locale,options:{publish?:boolean;draft?:boolean;images?:boolean;healthCheck?:boolean;publicationContext?:string;background?:(task:Promise<unknown>)=>void}={}):Promise<SearchResponse>{
  if(disallowedContent(q)){const message=language==="ar"?"لا يعرض بيان المحتوى الإباحي أو الاستغلالي. جرّب البحث عن موضوع تعليمي أو معرفي آخر.":"BAYAN does not provide pornographic or exploitative content. Try an educational or knowledge-focused topic.";try{await saveSearch(env,q,language,intent(q),"blocked",0,"world",[])}catch(error){await recordRuntimeEventLimited(env,"search_log_persistence","blocked_search_log_write_failed",error)}return{query:q,locale:language,results:[],providers:["BAYAN content safety"],providerAttempted:["BAYAN content safety"],status:"insufficient",message};}
  // Reuse a recent, previously verified answer when its evidence is still source-diverse.
  // This avoids re-running the full external-provider fan-out for repeat queries.
  if(!options.publish&&!options.images&&!options.background&&!options.healthCheck&&!personLookup(q)&&!nameOnlyArabicQuery(q)&&intent(q)!=="news"){
    try{
      const since=new Date(Date.now()-5*60*1000).toISOString();
      const cached=await env.DB.prepare("SELECT results_json,status,created_at FROM searches WHERE query=? AND language=? AND created_at>=? AND status IN ('verified','mixed') ORDER BY created_at DESC LIMIT 1").bind(q,language,since).first<any>();
      let parsed:any[]=[];
      try{const value=JSON.parse(String(cached?.results_json||"[]"));if(Array.isArray(value))parsed=value}catch(error){await recordRuntimeEventLimited(env,"search_cache_parse","cached_results_json_invalid",error)}
      const cachedResults:Candidate[]=parsed.filter((item:any)=>String(item?.title||"").trim()&&String(item?.summary||"").trim()).slice(0,12).map((item:any)=>({...item,score:70,kind:item.kind||"evidence",evidence:item.evidence||"mixed",provider:"BAYAN verified search cache",sources:Array.isArray(item.sources)?item.sources:[]}));
      const hosts=new Set<string>();
      for(const item of cachedResults){
        for(const source of item.sources||[]){
          try{const url=new URL(String(source?.url||""));if(url.protocol==="https:"&&!/wikipedia\.org|wikidata\.org|news\.google\.com|bing\.com|duckduckgo\.com/i.test(url.hostname))hosts.add(url.hostname.toLowerCase().replace(/^www\./,""))}catch(error){void recordRuntimeEventLimited(env,"candidate_source_url","invalid_candidate_source_url",error)}
        }
        if(item.url){try{const url=new URL(String(item.url));if(url.protocol==="https:"&&!/wikipedia\.org|wikidata\.org|news\.google\.com|bing\.com|duckduckgo\.com/i.test(url.hostname))hosts.add(url.hostname.toLowerCase().replace(/^www\./,""))}catch(error){void recordRuntimeEventLimited(env,"candidate_source_url","invalid_candidate_source_url",error)}}
      }
      const substantive=cachedResults.filter(item=>String(item.summary||"").trim().length>=100).length;
      const localeSafe=cachedResults.every(item=>language==="ar"?hasArabic(item.title)&&hasArabic(item.summary):!hasArabic(item.title)&&!hasArabic(item.summary));
      if(cached&&cachedResults.length>=3&&hosts.size>=2&&substantive>=2&&localeSafe){
        let drafted:any=null;
        if(options.draft!==false){
          try{drafted=await Promise.race([ask(env,q,language,cachedResults),new Promise(resolve=>setTimeout(()=>resolve(null),2500))])}catch(error){await recordRuntimeEventLimited(env,"search_cache_draft","cached_answer_draft_failed",error)}
        }
        const status:SearchResponse["status"]=cached.status==="verified"?"verified":"mixed";
        return{query:q,locale:language,results:cachedResults,providers:["BAYAN verified search cache"],providerAttempted:["BAYAN verified search cache"],status,answer:drafted?.answer||undefined,answerStatus:drafted?.answer?(status==="verified"&&drafted.status==="verified"?"verified":"mixed"):undefined};
      }
    }catch(error){await recordRuntimeEventLimited(env,"search_cache_read","cached_search_lookup_failed",error)}
  }
  const s=await settings(env);const max=Math.max(5,Math.min(30,Number(s.max_sources||12)));const providerDiagnostics:string[]=[];const safe=async<T>(task:Promise<T>,fallback:T,provider="external provider"):Promise<T>=>{try{return await task}catch(error){reportProviderFailure(providerDiagnostics,provider,error);return fallback}};const academicQuery=/(research|paper|papers|study|studies|journal|doi|scholar|academic|citation|crossref|openalex|pubmed|clinical trial|systematic review|بحث علمي|أبحاث|دراسة|دراسات|مجلة علمية|ورقة بحثية|مصدر أكاديمي|دراسات سريرية|مراجعة منهجية)/i.test(q);
const medicalQuery=/(pubmed|medical research|clinical trial|systematic review|medicine|health study|بحث طبي|دراسة طبية|دراسات سريرية|تجربة سريرية|مراجعة منهجية)/i.test(q);
// Stage discovery: query the local index and compact reference providers first.
  // Article publication skips encyclopedia and academic lookups; they rarely establish
  // current-event publisher diversity and can exhaust the Worker's subrequest budget.
  // Broad HTML/RSS news providers are deferred until the first pass lacks relevant evidence.
  let [local, wiki, wikiRest, wd, remote, dd, oa, crossref, pubmed] = await Promise.all([
    safe(searchArticles(env,q,language,max),[],"BAYAN Knowledge Base"),
    safe(options.publish===true||s.source_wikipedia==="0"?Promise.resolve([]):wikipedia(env,q,language,providerDiagnostics),[],"Wikipedia"),
    safe(options.publish===true||s.source_wikipedia==="0"?Promise.resolve([]):wikipediaRestSearch(q,language,providerDiagnostics),[],"Wikipedia REST Search"),
    safe(options.publish===true||s.source_wikidata==="0"?Promise.resolve([]):wikidata(q,language,providerDiagnostics),[],"Wikidata"),
    safe(s.source_ai_search==="0"?Promise.resolve([]):aiSearch(env,q,language,providerDiagnostics),[],"Cloudflare AI Search"),
    safe(duck(q,language,providerDiagnostics),[],"DuckDuckGo Instant Answers"),
    safe((options.publish===true||s.source_openalex==="0"||!academicQuery)?Promise.resolve([]):openAlex(q,providerDiagnostics),[],"OpenAlex"),
    safe((options.publish!==true&&academicQuery&&!personLookup(q))?crossrefSearch(q,providerDiagnostics):Promise.resolve([]),[],"Crossref"),
    safe((options.publish!==true&&language==="en"&&medicalQuery)?pubmedSearch(q,language,providerDiagnostics):Promise.resolve([]),[],"PubMed / NCBI")
  ]);

  let google:Candidate[]=[];
  const providerAttempted:string[]=["BAYAN Knowledge Base",...(options.publish===true?[]:(s.source_wikipedia==="0"?[]:["Wikipedia","Wikipedia REST Search"])),...(options.publish===true||s.source_wikidata==="0"?[]:["Wikidata"]),...((options.publish!==true&&s.source_openalex!=="0"&&academicQuery)?["OpenAlex"]:[]),...((options.publish!==true&&academicQuery&&!personLookup(q))?["Crossref"]:[]),...((options.publish!==true&&language==="en"&&medicalQuery)?["PubMed / NCBI"]:[]),...(s.source_ai_search==="0"?[]:["Cloudflare AI Search"]),"DuckDuckGo Instant Answers"];
  providerAttempted.push(...providerDiagnostics);
  const bundledFallback:Candidate[]=bundledSearchArticles(q,language,Math.min(max,12)).map((item:any):Candidate=>({
    title:String(item.title||""),summary:String(item.summary||""),section:String(item.section||"world"),slug:String(item.slug||""),kind:"article",
    evidence:item.fallbackEvidence==="verified"?"verified":"source_only",
    sources:(Array.isArray(item.sources)?item.sources:[]).slice(0,6).map((src:any)=>({title:String(src.title||item.title||""),publisher:String(src.publisher||""),url:String(src.url||"")})).filter((src:Source)=>/^https:\/\//i.test(src.url)),
    url:"https://bayan.tahaomar411.workers.dev/article/"+encodeURIComponent(String(item.slug||""))+"?lang="+language,
    imageUrl:safePublicImageUrl(item.imageUrl),imageAlt:String(item.imageAlt||item.title||""),score:Math.min(72,42+Number(item.score||0)*4),provider:"BAYAN bundled fallback"
  })).filter((item:Candidate)=>item.title&&item.summary&&item.slug&&item.url);
  const candidates:Candidate[]=[
    ...local.map((x:Candidate)=>({...x,score:92,provider:"BAYAN Knowledge Base"})),...bundledFallback,...wiki,...wikiRest,...wd,...oa,...crossref,...pubmed,...remote,...dd,...google
  ];
  // Use the authenticated Enterprise index as a recovery provider only when
  // primary discovery is empty or thin; avoid token/article requests on every search.
  if(env.WIKIMEDIA_ENTERPRISE_USERNAME&&env.WIKIMEDIA_ENTERPRISE_REFRESH_TOKEN&&(!wiki.length||!wikiRest.length||candidates.length<5)){
    const enterpriseQueries=[q];
    const enterpriseRows=await safe(searchWikimediaEnterprise(env,enterpriseQueries,language),[],"Wikimedia Enterprise");
    providerAttempted.push("Wikimedia Enterprise");
    for(const row of enterpriseRows)candidates.push({...row,score:scoreSource("Wikimedia Enterprise",row.title,q)+12,provider:"Wikimedia Enterprise"});
  }
  // Person/name lookups should return a useful collection, not stop after the first matching page.
  const personQuery=personLookup(q)||nameOnlyArabicQuery(q);
  const identityAliases:string[]=personQuery?[personQueryName(q)]:[];
  if(personQuery){
    let exactWikidata=candidates.find(item=>item.provider==="Wikidata"&&normalizedEntityTitle(item.title)===normalizedEntityTitle(personQueryName(q))&&personEvidence(item));
    if(!exactWikidata){
      const queryLanguage:Locale=hasArabic(personQueryName(q))?"ar":"en";
      const queryEntities=await wikidata(personQueryName(q),queryLanguage).catch(()=>[]);
      exactWikidata=queryEntities.find(item=>normalizedEntityTitle(item.title)===normalizedEntityTitle(personQueryName(q))&&personEvidence(item));
    }
    const wikidataUrl=String(exactWikidata?.sources?.find(item=>/wikidata\.org\/wiki\/Q\d+/i.test(String(item.url||"")) )?.url||"");
    const qid=wikidataUrl.match(/\/(Q\d+)/i)?.[1];
    if(qid)identityAliases.push(...await wikidataEntityAliases(qid,providerDiagnostics));
    const uniqueAliases=[...new Set(identityAliases.map(cleanText).filter(value=>value.length>=2&&value.length<=120))];
    identityAliases.splice(0,identityAliases.length,...uniqueAliases);
    const exactName=normalizedEntityTitle(personQueryName(q));
    for(const item of candidates){item.identityAliases=identityAliases;if(normalizedEntityTitle(item.title)===exactName){item.summary=sanitizeConflictingCurrentClubClaims(item.summary||"");item.section="people";}}
  }
  if(personQuery){const exactProfile=await wikipediaExactPersonPage(q,language);if(exactProfile.length)candidates.unshift(...exactProfile);for(const item of candidates)item.identityAliases=identityAliases;}
  const publicationContext=String(options.publicationContext||"").slice(0,500);const candidateMatches=(x:Candidate)=>relevantCandidateWithContext(x,q,publicationContext);const candidateRelevance=(x:Candidate)=>Math.max(relevanceScore(x,q),publicationContext?relevanceScore(x,publicationContext):0);const firstPassMatches=()=>candidates.filter(x=>languageSafe(x,language)&&!disallowedContent(x.title+" "+x.summary)&&candidateMatches(x));
  const firstPassCount=()=>{const matching=firstPassMatches();return personQuery?isolateExactPerson(q,matching).length:matching.length;};
  // Count evidence diversity, not just result cards. Duplicate hits from Wikipedia
  // or one publisher must not suppress the broader search pass for any query type.
  const firstPassHasDiverseEvidence=()=>{
    const matching=personQuery?isolateExactPerson(q,firstPassMatches()):firstPassMatches();
    const publishers=new Set<string>(),hosts=new Set<string>();
    for(const item of matching){
      for(const src of item.sources||[]){
        const publisher=String(src.publisher||"").trim().toLowerCase();
        const host=independentEvidenceHost(publisher,String(src.url||item.url||""));
        if(!host)continue;
        if(publisher)publishers.add(publisher);
        hosts.add(host);
      }
    }
    const minSources=Math.max(2,Number(s.min_sources||3));
    // Internal BAYAN indexes and aggregator URLs never satisfy this gate.
    // Publication requires five genuinely independent HTTPS publishers/hosts.
    const requiredPublishers=requiredSearchExpansionPublisherCount(options.publish===true,Number(s.min_sources||5));
    const substantive=matching.filter(item=>String(item.summary||"").trim().length>=100).length;
    return publishers.size>=requiredPublishers&&hosts.size>=requiredPublishers&&substantive>=Math.min(3,minSources);
  };
  // Expand when sparse OR when the first pass is dominated by duplicates, a
  // single publisher, encyclopedia-only results, or very thin snippets.
  const expansionThreshold=personQuery?Math.min(7,Math.max(5,Number(s.min_sources||5))):Math.max(5,Number(s.min_sources||5));
  // The local news archive is a cheap, bounded recovery source; query it only
  // when primary retrieval lacks independent publishers, reducing work on healthy searches.
  if(firstPassCount()<expansionThreshold||!firstPassHasDiverseEvidence()){
    const archiveNews=await safe(searchRecentNewsArchive(env,q,language,options.publicationContext!==undefined?String(options.publicationContext).slice(0,500):""),[],"BAYAN Recent News Archive");
    providerAttempted.push("BAYAN Recent News Archive");
    if(archiveNews.length)candidates.push(...archiveNews);
  }
  if(firstPassCount()<expansionThreshold||!firstPassHasDiverseEvidence()){
    const diagnosticStart=providerDiagnostics.length;
    const [bingRssRows,googleRows]=await Promise.all([
      safe(bingWebRssSearch(q,language,providerDiagnostics),[],"Bing Web RSS Search"),
      safe(googleNewsSearch(q,language,providerDiagnostics),[],"Google News Search")
    ]);
    const bingRss=bingRssRows.slice(0,8);
    google=googleRows.slice(0,8);
    candidates.push(...bingRss,...google);
    providerAttempted.push("Bing Web RSS Search","Google News Search",...providerDiagnostics.slice(diagnosticStart));
  }
  if(firstPassCount()<expansionThreshold||!firstPassHasDiverseEvidence()){
    providerAttempted.push(options.publish===true?"Expanded topic variants: Google News Search, Bing Web RSS Search, Trusted Publisher RSS Search":"Expanded topic variants: Wikipedia REST Search, Google News Search, Bing Web RSS Search, Trusted Publisher RSS Search","OpenAI Web Search (fallback)");
    const expanded=await safe(expandedSearch(env,q,language,personQuery,String(candidates.find(item=>normalizedEntityTitle(item.title)===normalizedEntityTitle(personQuery?personQueryName(q):"")&&personEvidence(item))?.summary||""),providerAttempted,identityAliases,options.images===true,options.publicationContext||""),[]);
    const selectedExpanded=selectExpandedSearchCandidates(expanded,12);
    const selectedTrusted=selectedExpanded.filter(item=>item.provider==="Trusted Publisher RSS Search");
    const relevantExpanded=selectedExpanded.filter(item=>languageSafe(item,language)&&candidateMatches(item));
    const relevantTrusted=relevantExpanded.filter(item=>item.provider==="Trusted Publisher RSS Search");
    providerAttempted.push("Expanded selection raw="+expanded.length+" selected="+selectedExpanded.length+" trusted="+selectedTrusted.length+" relevant="+relevantExpanded.length+" relevant_trusted="+relevantTrusted.length);
    candidates.push(...selectedExpanded);
    // OpenAI web search is the final recovery path, not a parallel request on
    // every weak first pass. Skip it as soon as independent evidence is adequate.
    const shouldUseOpenAIWebSearch=shouldAttemptOpenAIWebSearchFallback({publishing:options.publish===true,firstPassCount:firstPassCount(),personOrAcademic:personQuery||academicQuery,evidenceDiverse:firstPassHasDiverseEvidence(),belowExpansionThreshold:firstPassCount()<expansionThreshold});
    if(shouldUseOpenAIWebSearch){
      const web=await safe(openAiWebSearch(env,q,language,providerDiagnostics,options.publish===true),[],"OpenAI Web Search");
      candidates.push(...web.slice(0,6).map(item=>identityAliases.length?({...item,identityAliases:[...identityAliases]}):item));
    }
  }
  
  // Publication-only recovery: query GDELT for this headline and fetch real publisher text under robots.txt and byte limits.
  // This runs only after normal providers remain below the five-independent-publisher gate; it does not weaken that gate.
  if(options.publish===true&&!firstPassHasDiverseEvidence()){
    const diagnosticStart=providerDiagnostics.length;
    const gdelt=await safe(gdeltTopicEvidenceSearch(env,q,language,providerDiagnostics),[],"GDELT Topic Evidence");
    candidates.push(...gdelt);
    providerAttempted.push("GDELT Topic Evidence",...providerDiagnostics.slice(diagnosticStart));
  }

  // Expanded providers are appended after the first-pass identity cleanup; sanitize them too before ranking.
  for(const candidate of candidates){candidate.summary=sanitizeConflictingCurrentClubClaims(candidate.summary||"");}
  const safeCandidates=candidates.filter(x=>(language==="ar"?hasArabic(x.title):!hasArabic(x.title))&&!disallowedContent(x.title+" "+x.summary)&&!hasConflictingCurrentClubClaims(x.summary));
  let ranked=safeCandidates.filter(candidateMatches).sort((a,b)=>candidateRelevance(b)-candidateRelevance(a));
  ranked=isolateExactPerson(q,ranked);
  // If strict matching rejected every result, recover candidates with a real
  // query-term match in the headline or at least two matches in the snippet.
  // This is a last-resort relevance tier, not unrelated padding: all candidates
  // still need a real provider URL, the requested headline language, and safety checks.
  if(!ranked.length){
    const terms=searchTerms(q);
    const normalize=(v:string)=>String(v||"").normalize("NFKC").toLowerCase().replace(/[\u064B-\u065F\u0670]/g,"");
    ranked=safeCandidates.filter(x=>{
      if(!x.url||!/^https:\/\//i.test(String(x.url)))return false;
      const title=normalize(x.title),summary=normalize(x.summary);
      const titleHits=matchingSearchTerms(title,terms);
      const totalHits=matchingSearchTerms(title+" "+summary,terms);
      // A single shared word is not enough for multi-word queries: it caused
      // "history of pyramids" to return unrelated pyramid attractions. Require
      // coverage of at least two query terms, unless the query itself is one term
      // or the exact normalized phrase appears in the title.
      const exactPhrase=title.includes(normalize(q).trim());
      const minimumHits=terms.length===1?1:Math.min(2,terms.length);
      const historyModifiers=new Set(["history","historical","ancient","origin","origins","timeline","archaeology","archaeological","تاريخ","تاريخي","تاريخية","قديم","قديمة","أصل","أصول","المنشأ","آثار","أثري","أثرية","حضارة","حضارية","فرعون","فرعوني"]);
      const historicalIntent=terms.some(term=>historyModifiers.has(term)||historyModifiers.has(term.replace(/[أإآ]/g,"ا")));
      const topicTerms=terms.filter(term=>!historyModifiers.has(term)&&!historyModifiers.has(term.replace(/[أإآ]/g,"ا")));
      const topicHits=matchingSearchTerms(title+" "+summary,topicTerms);
      const contextText=title+" "+summary;
      const historicalContext=/\b(history|historical|ancient|archaeolog(?:y|ical)|dynasty|century|civilization|civilisation|built|origin|origins|timeline|pharaoh|pharaonic)\b/i.test(contextText)||/(تاريخ|تاريخي|قديم|قديمة|آثار|أثري|أثرية|حضارة|فرعون)/.test(contextText);
      const historicalMatch=historicalIntent&&topicTerms.length>0&&topicHits>=1&&historicalContext;
      return terms.length>0&&(exactPhrase||totalHits>=minimumHits||historicalMatch)&&(terms.length===1||titleHits>=2||totalHits>=2||historicalMatch);
    }).sort((a,b)=>relevanceScore(b,q)-relevanceScore(a,q));
  }
  // Re-apply identity isolation after recovery: fallback must never reintroduce
  // unrelated people after the strict ranking tier rejected every candidate.
  ranked=isolateExactPerson(q,ranked);
  if(personQuery){const exactTitle=normalizedEntityTitle(personQueryName(q));ranked.sort((a,b)=>Number(normalizedEntityTitle(a.title)!==exactTitle)-Number(normalizedEntityTitle(b.title)!==exactTitle));}
  // Never pad the result list with unrelated items: expand providers first, then report honestly if relevance is still weak.
  // Merge provider duplicates only when their descriptions support the same entity.
  // A title-only key can incorrectly merge different people who share a name.
  const uniqueByTitle = new Map<string,Candidate>();
  const identityTerms = (value:string) => new Set(String(value||"").normalize("NFKC").toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g,"").replace(/[^\p{L}\p{N}]+/gu," ")
    .split(/\s+/).filter(term=>term.length>=4&&!/^(the|this|that|with|from|about|news|article|said|says|من|في|على|عن|هذا|هذه|الذي|التي|قال|عنها|عنه)$/.test(term)));
  const normalizedTitle = (value:string) => String(value||"").normalize("NFKC").toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g,"").replace(/[^\p{L}\p{N}]+/gu," ").trim();
  const sameEntity = (a:Candidate,b:Candidate) => {
    const left=identityTerms(a.summary),right=identityTerms(b.summary);
    const common=[...left].filter(term=>right.has(term)).length;
    const sameUrl=String(a.url||"").trim()===String(b.url||"").trim()&&Boolean(a.url);
    return sameUrl || (common>=2 && common/Math.max(1,Math.min(left.size,right.size))>=0.18);
  };
  for (const candidate of ranked) {
    const titleKey=normalizedTitle(candidate.title);
    if (!titleKey) continue;
    const matching=[...uniqueByTitle.entries()].find(([key,existing])=>key.startsWith(titleKey+"|")&&sameEntity(existing,candidate));
    const existing=matching?.[1];
    if (!existing) {
      const terms=[...identityTerms(candidate.summary)].sort().slice(0,6).join(" ");
      const fallback=String(candidate.url||candidate.sources?.[0]?.url||candidate.provider||"").toLowerCase();
      const key=titleKey+"|"+(terms||fallback||String(uniqueByTitle.size));
      uniqueByTitle.set(key,{...candidate,sources:[...(candidate.sources||[])]});
      continue;
    }
    const sourceKeys = new Set((existing.sources||[]).map(source => String(source.url||"").trim()).filter(Boolean));
    for (const source of candidate.sources||[]) {
      const sourceUrl = String(source.url||"").trim();
      if (sourceUrl && !sourceKeys.has(sourceUrl)) { existing.sources.push(source); sourceKeys.add(sourceUrl); }
    }
    if ((!existing.summary || existing.summary.length < 80) && candidate.summary) existing.summary = candidate.summary;
    if (!safePublicImageUrl(existing.imageUrl) && safePublicImageUrl(candidate.imageUrl)) {
      existing.imageUrl = safePublicImageUrl(candidate.imageUrl);
      existing.imageAlt = candidate.imageAlt || candidate.title || existing.title;
    }
  }
  const results=[...uniqueByTitle.values()].slice(0,max).map(({score,provider,identityAliases,...x})=>{const rawSources=Array.isArray(x.sources)?x.sources:[];const hasOnlyReferenceSources=rawSources.length>0&&rawSources.every(src=>/wikipedia|wikidata|ويكيبيديا|ويكي بيانات/i.test(String(src.publisher||"")));return{...x,evidence:hasOnlyReferenceSources?"source_only":(x.evidence||"mixed"),summary:localeSafeText(x.summary,language)?x.summary:(personQuery&&normalizedEntityTitle(x.title)===normalizedEntityTitle(q)?localizedPersonDescription(x.summary,language):""),sources:rawSources.map((s)=>({...s,publisher:localizedSource(s.publisher,language)}))}});
  // Last-resort recovery for relevant reviewed bundled articles. These are
  // curated, language-specific records; do not relabel them as externally
  // verified and never use this recovery to publish new articles.
  if (!results.length && options.publish !== true && !options.healthCheck) {
    const terms = searchTerms(q);
    if (terms.length) {
      const normalize = (value: string) => String(value || "").normalize("NFKC").toLowerCase().replace(/[\\u064B-\\u065F\\u0670]/g, "");
      const emergency = bundledFallback.filter(item => {
        const title = normalize(item.title);
        const text = normalize(item.title + " " + item.summary);
        const titleHits = matchingSearchTerms(title, terms);
        const totalHits = matchingSearchTerms(text, terms);
        const minimumHits = terms.length === 1 ? 1 : Math.min(2, terms.length);
        return titleHits >= 1 && totalHits >= minimumHits;
      }).sort((a, b) => candidateRelevance(b) - candidateRelevance(a)).slice(0, Math.min(max, 6));
      for (const item of emergency) {
        results.push({
          title: item.title, summary: item.summary, section: item.section,
          slug: item.slug, kind: "article",
          evidence: item.evidence === "verified" ? "verified" : "source_only",
          sources: Array.isArray(item.sources) ? item.sources : [],
          url: item.url, imageUrl: safePublicImageUrl(item.imageUrl),
          imageAlt: item.imageAlt || item.title
        } as SearchResult);
      }
    }
  }
  // Always include a curated, bilingual profile for an exact person query when one exists.
  // Keep independently sourced reporting already in the list; only the biography is pinned.
  if(personQuery && options.publish !== true && !options.healthCheck){
    const exactName=normalizedEntityTitle(personQueryName(q));
    const curated=bundledFallback.find(item=>
      item.section==="people" &&
      item.evidence==="verified" &&
      String(item.slug||"").startsWith("who-is-") &&
      String(item.slug||"").endsWith(language==="ar"?"-ar":"-en") &&
      normalizedEntityTitle(item.title).startsWith(exactName) &&
      String(item.summary||"").trim().length>80
    );
    if(curated){
      const curatedSlug=String(curated.slug||"");
      const hosts=new Set<string>();
      for(const src of curated.sources||[]){
        const host=independentEvidenceHost(String(src.publisher||""),String(src.url||""));
        if(host)hosts.add(host);
      }
      if(hosts.size>=2){
        const profile:SearchResult={
          title:curated.title,summary:curated.summary,section:"people",slug:curatedSlug,kind:"article",
          evidence:"verified",
          sources:(curated.sources||[]).map(src=>({...src,publisher:localizedSource(String(src.publisher||""),language)})),
          url:"https://bayan.tahaomar411.workers.dev/article/"+encodeURIComponent(curatedSlug)+"?lang="+language,
          imageUrl:safePublicImageUrl(curated.imageUrl),imageAlt:curated.imageAlt||curated.title
        };
        const duplicates=results.filter(item=>item.slug!==curatedSlug &&
          !(item.section==="people" && normalizedEntityTitle(item.title).startsWith(exactName) &&
            /who-is-mohamed-salah/.test(String(item.slug||""))));
        results.splice(0,results.length,profile,...duplicates.slice(0,Math.max(0,max-1)));
      }
    }
  }
  // Pin only an existing curated biography with explicit verification and at least
  // two independent publisher hosts. A single-source person result is never upgraded.
  if(personQuery){
    const exactName=normalizedEntityTitle(personQueryName(q));
    const independentBiography=(item:SearchResult)=>{
      if(item.section!=="people"||item.evidence!=="verified"||!item.slug)return false;
      if(!normalizedEntityTitle(item.title).startsWith(exactName)||!item.summary.trim())return false;
      const hosts=new Set<string>();
      for(const source of item.sources||[]){
        const host=independentEvidenceHost(String(source.publisher||""),String(source.url||""));
        if(host)hosts.add(host);
      }
      return hosts.size>=2;
    };
    const biographyIndex=results.findIndex(independentBiography);
    if(biographyIndex>0){const [biography]=results.splice(biographyIndex,1);results.unshift(biography);}
  }
  // Resolve a subject-specific image for the canonical person result before returning
  // cards, so the exact image can also be carried into the opened article.
  if(personQuery&&options.images!==false){
    const canonical=results.find(item=>normalizedEntityTitle(item.title)===normalizedEntityTitle(personQueryName(q))&&personEvidence(item));
    if(canonical&&!safePublicImageUrl(canonical.imageUrl)){
      const image=await Promise.race([findRelatedImage(String(canonical.title||q),String(canonical.url||canonical.sources?.[0]?.url||""),String(canonical.summary||""),env),new Promise<undefined>(resolve=>setTimeout(()=>resolve(undefined),4500))]).catch(async error=>{await recordRuntimeEventLimited(env,"search_result_image","search_result_image_lookup_failed",error);return undefined});
      if(safePublicImageUrl(image)){canonical.imageUrl=safePublicImageUrl(image);canonical.imageAlt=String(canonical.title||q);}
    }
  }
  for(const item of results){item.imageUrl=safePublicImageUrl(item.imageUrl);for(const source of item.sources||[])source.imageUrl=safePublicImageUrl(source.imageUrl);}
  const providers=[...new Set(candidates.map(x=>x.provider))];
  // Verification must reflect independent evidence, not the number of labels.
  // Wikipedia + Wikidata, or several aggregators pointing to one publisher, are not independent corroboration.
  const independentEvidence=(items:SearchResult[])=>{
    const publishers=new Set<string>(),hosts=new Set<string>();
    const seenTitles:string[]=[];
    const seenStoryEvidence:{title:string;summary:string}[]=[];
    const syndicatedTitle=(title:string)=>{
      if(seenTitles.some(previous=>areNearDuplicateEvidenceTitles(previous,title)))return true;
      const tokens=String(title||"").toLowerCase().normalize("NFKC").replace(/[^\p{L}\p{N}]+/gu," ").split(/\s+/).filter(token=>token.length>=3);
      if(tokens.length>=5)seenTitles.push(title);
      return false;
    };
    for(const item of items){
      const itemTitle=String(item.title||"").trim();
      const itemSummary=String(item.summary||"").trim();
      // RSS summaries from reputable publishers can be brief; count them from 50 characters,
      // while still requiring independent publisher hosts and non-syndicated evidence.
      const substantive=itemSummary.length>=50;
      if(!substantive)continue;
      if(seenStoryEvidence.some(previous=>areNearDuplicateEvidenceTitles(previous.title,itemTitle)||areNearDuplicateEvidenceTexts(previous.summary,itemSummary)))continue;
      seenStoryEvidence.push({title:itemTitle,summary:itemSummary});
      for(const src of item.sources||[]){
        const publisher=String(src.publisher||"").trim().toLowerCase();
        const url=String(src.url||item.url||"");
        const host=independentEvidenceHost(publisher,url);
        if(!host)continue;
        const title=String(src.title||item.title||"").trim();
        if(syndicatedTitle(title))continue;
        publishers.add(publisher||host);
        hosts.add(host);
      }
    }
    return {publishers,hosts};
  };
  const configuredMin=Math.max(5,Math.min(10,Number(s.min_sources||5)));
  const corroboration=independentEvidence(results);
  const independentlyVerified=hasIndependentEvidenceDiversity(corroboration.publishers.size,corroboration.hosts.size,configuredMin);
  const status=results.length===0?"insufficient":independentlyVerified?"verified":"mixed";
  let publishedSlug:string|undefined;
  let publishReason:string|undefined=options.publish!==false&&!independentlyVerified?"no_independent_sources":undefined;
  let publishReasonDetail:string|undefined=publishReason?("independent_evidence_below_threshold:publishers="+corroboration.publishers.size+";hosts="+corroboration.hosts.size+";required="+configuredMin):undefined;
  let answer:string|undefined;
  let answerStatus:SearchResponse["status"]|undefined;
  const exactPersonConfirmed=options.publicationContext!==undefined||!personQuery||results.some(item=>normalizedEntityTitle(item.title)===normalizedEntityTitle(personQueryName(q))&&personEvidence(item));
  if(options.publish!==false&&independentlyVerified&&!exactPersonConfirmed){publishReason="draft_not_verified";publishReasonDetail="entity_identity_unconfirmed";}
  if(options.publish!==false&&options.draft===false){publishReason="draft_not_verified";publishReasonDetail="drafting_disabled_by_caller";}
  if(results.length&&exactPersonConfirmed&&options.draft!==false&&!(options.publicationContext!==undefined&&options.publish!==false&&!independentlyVerified)){
    try{
      const drafted=await Promise.race([ask(env,q,language,results),new Promise<any>(resolve=>setTimeout(()=>resolve({status:"mixed",answer:"",reason:"ai_unavailable"}),7500))]);
      if("reason" in drafted&&drafted.reason==="ai_unavailable"&&options.publish!==false){publishReason="ai_unavailable";publishReasonDetail="short_answer_ai_unavailable";}
      if(drafted?.answer){answer=drafted.answer;answerStatus=independentlyVerified?drafted.status:"mixed";}
      else if(options.publish!==false){publishReason="ai_unavailable";publishReasonDetail="short_answer_empty_or_ai_unavailable";}
      const articleTitle=options.publicationContext!==undefined?q:(results.find(x=>x.title&&x.summary)?.title||"");
      const articleSummary=results.find(x=>x.title&&x.summary)?.summary||q;
      if(options.publish!==false){
        if(!independentlyVerified){publishReason="no_independent_sources";publishReasonDetail="independent_evidence_below_threshold:publishers="+corroboration.publishers.size+";hosts="+corroboration.hosts.size+";required="+configuredMin;}
        else if(classifySection(q,results,language)==="unclassified"){publishReason="draft_not_useful";publishReasonDetail="topic_section_unclassified";}
        else if(!articleTitle||disallowedContent(articleTitle+" "+articleSummary)){publishReason="draft_not_useful";publishReasonDetail="article_title_or_summary_missing_or_disallowed";}
        else{
          const publishLongArticle=async()=>{
            let longDraft:any;
            try{
              longDraft=await Promise.race([draftArticle(env,q,language,results,options.publish===true),new Promise<any>(resolve=>setTimeout(()=>resolve({status:"mixed",answer:"",reason:"ai_unavailable"}),ARTICLE_DRAFT_TIMEOUT_MS))]);
            }catch(error){
              publishReason=publicationFailureReason(error);
              publishReasonDetail="article_draft_exception:"+publishReason;
              await recordPublicationWarning(env,publishReason);
              return;
            }
            const verification=longDraft?.verification||{};
            const draftMetrics=("sentences_removed="+Math.max(0,Number(verification.removedSentences??verification.rejectedSentences)||0)+";sentences_remaining="+Math.max(0,Number(verification.remainingSentences??verification.sentenceCount)||0)+";regenerated="+(verification.retried===true?"true":"false")+(verification.failureStage?";failure_stage="+String(verification.failureStage):"")).slice(0,240);
            if(longDraft?.reason==="ai_unavailable"){publishReason="ai_unavailable";publishReasonDetail=("article_draft_all_providers_unavailable;"+draftMetrics).slice(0,300);return;}
            if(longDraft?.status!=="verified"){
              publishReason="draft_not_verified";
              publishReasonDetail=(!String(longDraft?.answer||"").trim()?"draft_empty_or_insufficient_evidence":answerHasUnsupportedSpecifics(String(longDraft.answer),results,q)?(answerUnsupportedSpecificsDetail(String(longDraft.answer),results,q)||"unsupported_specifics"):"verification_status_"+String(longDraft?.status||"missing"))+";"+draftMetrics;
              return;
            }
            if(!usefulDraft(longDraft.answer,language)){publishReason="draft_not_useful";publishReasonDetail=("article_draft_failed_usefulness_checks;"+draftMetrics).slice(0,300);return;}
            const sourceImage=results.find(item=>isTopicImageUrl(item.imageUrl)&&String(item.imageAlt||item.title||"").trim().length>0)?.imageUrl;
            let relatedImage:string|undefined;
            if(!sourceImage){
              try{relatedImage=await findRelatedImage(articleTitle,undefined,articleSummary,env);}
              catch(error){await recordPublicationWarning(env,publicationFailureReason(error));}
            }
            const imageCandidate=(isTopicImageUrl(sourceImage)?safePublicImageUrl(sourceImage):undefined)||(isTopicImageUrl(relatedImage)?safePublicImageUrl(relatedImage):undefined);const imageUrl=await resolvePublishedImageUrl(imageCandidate);
            if(!imageUrl){publishReason="no_image";publishReasonDetail=("no_safe_resolvable_topic_image;"+draftMetrics).slice(0,300);return;}
            let savedSlug:string|null;
            try{
              const publicationInput={title:articleTitle,summary:articleSummary,body:longDraft.answer,section:classifySection(q,results,language),language,sources:results.flatMap(x=>x.sources||[]),imageUrl,imageAlt:articleTitle};
              savedSlug=await publishVerifiedResearch(env,publicationInput);
            }catch(error){
              publishReason=publicationFailureReason(error);
              publishReasonDetail="publish_verified_research_exception:"+publishReason;
              await recordPublicationWarning(env,publishReason);
              return;
            }
            if(savedSlug){publishedSlug=savedSlug;publishReason=undefined;publishReasonDetail=("draft_verified;"+draftMetrics).slice(0,300);}
            else {publishReason="publish_rejected";publishReasonDetail="publication_quality:"+(publicationRejectionReason({title:articleTitle,summary:articleSummary,body:longDraft.answer,language,sources:results.flatMap(x=>x.sources||[]),imageUrl})||"null_without_quality_reason");}
          };
          if(options.background){
            try{options.background(publishLongArticle().catch(async error=>{publishReason=publicationFailureReason(error);publishReasonDetail="background_publication_exception:"+publishReason;await recordPublicationWarning(env,publishReason||"exception:unknown");}));}
            catch(error){publishReason=publicationFailureReason(error);publishReasonDetail="background_schedule_exception:"+publishReason;await recordPublicationWarning(env,publishReason);}
          }else await publishLongArticle();
        }
      }
    }catch(error){
      if(options.publish!==false){publishReason=publicationFailureReason(error);publishReasonDetail="search_draft_exception:"+publishReason;}
      await recordPublicationWarning(env,publicationFailureReason(error));
    }
  }
    const failedProviderNames=new Set([...providerDiagnostics,...providerAttempted].filter(item=>/(?:timeout|connection_failure|invalid_response|request_failure|http_\d{3})/i.test(item)).map(item=>item.split(":")[0]));const allExternalFailed=results.length===0&&failedProviderNames.size>=3;const message=results.length?undefined:allExternalFailed?(language==="ar"?"تعذر الاتصال بعدة مزودين للبحث الخارجي. سجّل بيان أسباب الفشل وأعاد المحاولة عبر المصادر البديلة؛ لم تُعرض نتائج غير موثوقة. حاول مجددًا بعد قليل.":"Several external search providers failed to respond. BAYAN recorded failure categories and attempted fallback sources; no unverified results were shown. Please retry shortly."):(language==="ar"?"لم تُرجع محاولات البحث المتاحة نتائج ذات صلة كافية. جرّب إضافة سياق أو كتابة الاسم الكامل أو استخدام صياغة أخرى؛ لن يعرض بيان نتائج غير مرتبطة لمجرد ملء الصفحة.":"The available search attempts did not return sufficiently relevant results. Add context, use the full name, or try another phrasing; BAYAN will not show unrelated results just to fill the page.");
  providerAttempted.push(...providerDiagnostics.filter(item=>!providerAttempted.includes(item)));if(!options.healthCheck)try{await saveSearch(env,q,language,intent(q),status,results.length,classifySection(q,results,language),results)}catch(error){await recordRuntimeEventLimited(env,"search_log_persistence","search_log_write_failed",error)}
  return {query:q,locale:language,results,providers,providerAttempted,status,message,answer,answerStatus,articleSlug:publishedSlug,publishReason,publishReasonDetail};
}
function intent(q:string){
  const s=q.toLowerCase();
  if(/weather|طقس|جو|حرارة/.test(s))return"weather"; if(/price|سعر|ذهب|دولار|عملة/.test(s))return"prices";
  if(/how|كيف|طريقة|إصلاح|اصلح|برمج|كود|fix|build/.test(s))return"howto"; if(/who|من هو|من هي|شخصية|سيرة/.test(s))return"person";
  if(/news|خبر|أخبار|حدث|اليوم/.test(s))return"news"; return"research";
}
