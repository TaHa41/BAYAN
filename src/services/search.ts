import type {Env,Locale,SearchResponse,SearchResult,Source} from "../types";
import {searchArticles,saveSearch,publishVerifiedResearch} from "../db";
import {ask} from "./ai";
import {findRelatedImage} from "./news";
import {searchWikimediaEnterprise} from "./wikimedia-enterprise";

type Candidate = SearchResult & {score:number; provider:string};
const timeout = async (url:string, ms=2600) => {
  const c=new AbortController(); const t=setTimeout(()=>c.abort(),ms);
  try {
    return await fetch(url,{signal:c.signal,headers:{
      accept:"application/json,text/plain,*/*",
      "user-agent":"BAYAN/1.2 (+https://bayan.tahaomar411.workers.dev; contact: bayan.contact@yahoo.com)",
      "api-user-agent":"BAYAN/1.2 (https://bayan.tahaomar411.workers.dev)"
    }});
  } finally { clearTimeout(t); }
};
const cleanText=(s:string)=>String(s||"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
const scoreSource=(publisher:string, title:string, q:string) => {
  const p=publisher.toLowerCase(), t=title.toLowerCase(), terms=q.toLowerCase().split(/\s+/).filter(x=>x.length>2);
  let score=0;
  if(/wikipedia|wikidata/.test(p))score+=72;
  if(/pubmed|ncbi|crossref|openalex|nih|cdc|world health organization|who\\.int|nature\\.com|science\\.org|gov\\b/.test(p))score+=82;
  if(/bbc|reuters|ap|associated press|france 24|dw|al jazeera|sky news/.test(p))score+=78;
  if(terms.filter(x=>t.includes(x)).length)score+=Math.min(20,terms.filter(x=>t.includes(x)).length*6);
  return Math.min(100,score);
};
const source=(title:string,publisher:string,url:string):Source=>({title,publisher,url});
const classifySection=(q:string,items:SearchResult[],language:Locale)=>{const qTerms=searchTerms(q);if(personLookup(q)&&items.some(x=>/wikipedia|wikidata|ويكيبيديا|ويكي بيانات/i.test((x.sources||[]).map(source=>source.publisher).join(" "))&&qTerms.some(term=>String(x.title||"").normalize("NFKC").toLowerCase().includes(term))))return"people";const s=(q+" "+items.slice(0,4).map(x=>x.title+" "+x.summary).join(" ")).toLowerCase();if(/\bscientist\b|\bchemist\b|\bwriter\b|\bauthor\b|\bpolitician\b|\bactor\b|\bathlete\b|\bbiography\b|\bnobel prize winner\b|\bphilosopher\b|\bphysicist\b|\bmathematician\b|عالم مصري|عالمة|كيميائي|سيرة ذاتية|شخصية عامة|كاتب|مؤلف|سياسي|ممثل|لاعب|باحث|رئيس سابق|من هو|من هي/.test(s))return"people";if(/gold|dollar|currency|price|inflation|سعر|ذهب|دولار|عملة|تضخم/.test(s))return"economy";if(/weather|طقس|حرارة|rain|temperature/.test(s))return"travel";if(/ai|artificial intelligence|technology|software|programming|ذكاء اصطناعي|تقنية|برمجة/.test(s))return"technology";if(/health|medicine|medical|nutrition|صحة|طب|دواء|تغذية/.test(s))return"health";if(/science|space|nasa|physics|biology|علم|فضاء|اكتشاف/.test(s))return"science";if(/history|historical|ancient|تاريخ|حضارة|قديم|culture|ثقافة/.test(s))return"history";if(/art|film|book|music|فن|سينما|كتاب|موسيقى|ترفيه/.test(s))return"art";if(/sports|football|soccer|basketball|رياضة|مباراة|لاعب/.test(s))return"sports";if(/travel|tourism|destination|سفر|سياحة|وجهة/.test(s))return"travel";if(/economy|business|market|اقتصاد|أعمال|سوق/.test(s))return"economy";if(/politic|government|election|president|سياسة|حكومة|انتخابات|رئيس/.test(s))return"politics";if(/biography|who is|من هو|من هي|سيرة|شخصية/.test(s))return"people";if(/trend|viral|popular|ترند|متداول|رائج/.test(s))return"trends";if(/egypt|مصر|القاهرة|الإسكندرية/.test(s))return"egypt";return"world"};

const searchTerms=(q:string)=>{const stop=new Set(["the","and","for","with","from","about","what","when","where","who","how","why","are","was","is","من","في","عن","على","الى","إلى","ما","ماذا","كيف","لماذا","هل","هو","هي","هذا","هذه","التي","الذي","مع"]);return String(q||"").normalize("NFKC").toLowerCase().replace(/[\u064B-\u065F\u0670]/g,"").replace(/[^\p{L}\p{N}\s]/gu," ").split(/\s+/).filter(x=>x.length>=2&&!stop.has(x)).slice(0,10)};
const relevanceScore=(x:Candidate,q:string)=>{const terms=searchTerms(q);if(!terms.length)return 0;const normalize=(v:string)=>String(v||"").normalize("NFKC").toLowerCase().replace(/[\u064B-\u065F\u0670]/g,"");const title=normalize(x.title),summary=normalize(x.summary),combined=title+" "+summary,normalizedQuery=normalize(q).trim(),titleHits=terms.filter(t=>title.includes(t)).length,summaryHits=terms.filter(t=>summary.includes(t)).length,allHits=terms.filter(t=>combined.includes(t)).length,phrase=title.includes(normalizedQuery);const person=personLookup(q);const identityBoost=person?(titleHits===terms.length?90:titleHits>0?titleHits*28:0):0;const authorOnlyPenalty=person&&titleHits===0&&summaryHits>0?35:0;return(phrase?75:0)+identityBoost+titleHits*18+summaryHits*7+allHits*4+Math.min(8,Number(x.score||0)/12)-authorOnlyPenalty};
// Do not reject a relevant result solely because a multi-word query is absent verbatim from its title.
// Use the summary and all query terms too, then fall back to the best locale-safe candidates if providers are weak.
const relevantCandidate=(x:Candidate,q:string)=>{const terms=searchTerms(q);const score=relevanceScore(x,q);if(!terms.length)return false;const normalize=(v:string)=>String(v||"").normalize("NFKC").toLowerCase().replace(/[\u064B-\u065F\u0670]/g,"");const title=normalize(x.title),summary=normalize(x.summary),combined=title+" "+summary;const titleHits=terms.filter(t=>title.includes(t)).length;const hits=terms.filter(t=>combined.includes(t)).length;const person=personLookup(q);if(person){/* A name appearing only in an academic abstract/author list is not a person-profile result. */if(titleHits===0)return /wikipedia|wikidata/i.test(x.provider)&&hits>0&&score>=20;return titleHits>=Math.min(1,terms.length)&& (hits>=Math.min(1,terms.length)||score>=25);}if(terms.length<=1)return score>=4;return hits>=Math.min(2,terms.length)||score>=25;};
async function wikipedia(env:Env,q:string,language:Locale):Promise<Candidate[]>{
  const api=language==="ar"?"https://ar.wikipedia.org/w/api.php":"https://en.wikipedia.org/w/api.php";
  const stop=new Set(["في","من","على","عن","إلى","الى","ما","ماذا","كيف","لماذا","هل","هو","هي","هذا","هذه","التي","الذي","مع","the","and","for","with","from","about","what","when","where","who","how","why","is","are"]);
  const normalized=String(q||"").replace(/[؟?،,:;.!]+/g," ").split(/\s+/).filter((word)=>word.length>1&&!stop.has(word.toLowerCase())).join(" ");
  const queries=[...new Set([q,normalized].filter((value)=>value&&value.trim()))];
  // Search the original wording and normalized variant concurrently. Previously,
  // a single weak result from the first query prevented the second query from running.
  const batches=await Promise.all(queries.map(async query=>{
    try{
      const u=api+"?action=query&generator=search&gsrsearch="+encodeURIComponent(query)+"&gsrlimit=8&prop=extracts|pageimages&exintro=1&explaintext=1&piprop=thumbnail&pithumbsize=900&format=json&origin=*";
      const r=await timeout(u,3500); if(!r.ok)return [];
      const d=await r.json<any>();
      const pages=Object.values(d.query?.pages||{}) as any[];
      return pages.map((x:any)=>({
        title:cleanText(x.title),summary:cleanText(x.extract).slice(0,1800),section:"world",kind:"web" as const,evidence:"mixed" as const,
        sources:[source(x.title,language==="ar"?"Wikipedia Arabic":"Wikipedia","https://"+(language==="ar"?"ar":"en")+".wikipedia.org/wiki/"+encodeURIComponent(String(x.title).replace(/ /g,"_")))],
        url:"https://"+(language==="ar"?"ar":"en")+".wikipedia.org/wiki/"+encodeURIComponent(String(x.title).replace(/ /g,"_")),
        score:scoreSource("Wikipedia",x.title,query)+8,provider:"Wikipedia"
      })).filter((x:any)=>x.title);
    }catch{return []}
  }));
  const seen=new Set<string>();
  return batches.flat().filter(item=>{
    const key=String(item.title||"").toLocaleLowerCase();
    if(!key||seen.has(key))return false;
    seen.add(key);return true;
  }).slice(0,10);
}
async function wikipediaRestSearch(q:string,language:Locale):Promise<Candidate[]>{
  // Independent Wikimedia REST search fallback: the Action API may be throttled
  // or unavailable from a particular edge location even when the REST endpoint works.
  try{
    const code=language==="ar"?"ar":"en";
    const url="https://api.wikimedia.org/core/v1/wikipedia/"+code+"/search/page?q="+encodeURIComponent(q)+"&limit=8";
    const r=await timeout(url,3500);
    if(!r.ok)return[];
    const data=await r.json<any>();
    return (Array.isArray(data.pages)?data.pages:[]).map((x:any)=>{
      const title=cleanText(x.title||x.key||"");
      const summary=cleanText(x.description||x.excerpt||"").slice(0,1600);
      const key=String(x.key||title).replace(/ /g,"_");
      const url="https://"+code+".wikipedia.org/wiki/"+encodeURIComponent(key);
      return {title,summary,section:"world",kind:"web" as const,evidence:"mixed" as const,
        sources:[source(title,language==="ar"?"Wikipedia Arabic":"Wikipedia",url)],
        url,score:scoreSource("Wikipedia",title,q)+8,provider:"Wikipedia REST Search"};
    }).filter((x:any)=>x.title&&x.url);
  }catch{return[]}
}
async function wikidata(q:string,language:Locale):Promise<Candidate[]>{
  try{
    const u="https://www.wikidata.org/w/api.php?action=wbsearchentities&search="+encodeURIComponent(q)+"&language="+language+"&limit=5&format=json&origin=*";
    const r=await timeout(u); if(!r.ok)return[]; const d=await r.json<any>();
    return (d.search||[]).map((x:any)=>({title:cleanText(x.label||x.id),summary:cleanText(x.description||"").slice(0,900),section:"people",kind:"web",evidence:"mixed",sources:[source(x.label||x.id,"Wikidata","https://www.wikidata.org/wiki/"+x.id)],score:scoreSource("Wikidata",x.label||"",q),provider:"Wikidata"}));
  }catch{return[]}
}
async function gdelt(q:string):Promise<Candidate[]>{
 try{const u="https://api.gdeltproject.org/api/v2/doc/doc?query="+encodeURIComponent(q)+"&mode=artlist&maxrecords=8&format=json&sort=HybridRel";const r=await timeout(u,4000);if(!r.ok)return[];const d=await r.json<any>();return(d.articles||[]).map((x:any)=>({title:cleanText(x.title),summary:cleanText(x.seendate||"")+" "+cleanText(x.domain||""),section:"news",kind:"web",evidence:"mixed",sources:[source(x.title,x.domain||"GDELT",x.url)],url:x.url,score:scoreSource(x.domain||"GDELT",x.title,q),provider:"GDELT"})).filter((x:any)=>x.title&&x.url)}catch{return[]}
}
const decodeXml=(value:string)=>String(value||"").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)));
async function googleNewsSearch(q:string,language:Locale):Promise<Candidate[]>{
  try{
    const hl=language==="ar"?"ar":"en-US",gl=language==="ar"?"EG":"US",ceid=language==="ar"?"EG:ar":"US:en";
    const url="https://news.google.com/rss/search?q="+encodeURIComponent(q)+"&hl="+hl+"&gl="+gl+"&ceid="+ceid;
    const response=await timeout(url,2600);if(!response.ok)return[];
    const xml=await response.text();const out:Candidate[]=[];
    for(const match of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)){
      const block=match[1];const field=(name:string)=>decodeXml(block.match(new RegExp("<"+name+"\\b[^>]*>([\\s\\S]*?)</"+name+">","i"))?.[1]||"").trim();
      const title=cleanText(field("title")),url=field("link"),summary=cleanText(field("description")).slice(0,1400),publisher=cleanText(field("source")||"Google News");
      if(!title||!/^https:\/\//i.test(url))continue;
      out.push({title,summary,section:"news",kind:"web",evidence:"mixed",sources:[source(title,publisher,url)],url,score:scoreSource(publisher,title,q)+4,provider:"Google News Search"});
      if(out.length>=8)break;
    }
    return out;
  }catch{return[]}
}

async function bingNewsSearch(q:string,language:Locale):Promise<Candidate[]>{
  try{
    const setlang=language==="ar"?"ar":"en-US";
    const url="https://www.bing.com/news/search?q="+encodeURIComponent(q)+"&format=rss&setlang="+setlang;
    const response=await timeout(url,4500);if(!response.ok)return[];
    const xml=await response.text();const out:Candidate[]=[];
    for(const match of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)){
      const block=match[1];
      const field=(name:string)=>decodeXml(block.match(new RegExp("<"+name+"\\b[^>]*>([\\s\\S]*?)</"+name+">","i"))?.[1]||"").trim();
      const title=cleanText(field("title")),url=field("link"),summary=cleanText(field("description")).slice(0,1200);
      if(!title||!/^https:\/\//i.test(url))continue;
      const publisher=cleanText(field("source")||"Bing News");
      out.push({title,summary,section:"news",kind:"web",evidence:"mixed",sources:[source(title,publisher,url)],url,score:scoreSource(publisher,title,q)+3,provider:"Bing News RSS"});
      if(out.length>=8)break;
    }
    return out;
  }catch{return[]}
}
async function crossrefSearch(q:string):Promise<Candidate[]>{
  try{
    const url="https://api.crossref.org/works?query.bibliographic="+encodeURIComponent(q)+"&rows=5&select=title,author,published,container-title,URL,abstract";
    const r=await timeout(url,4500);if(!r.ok)return[];
    const d=await r.json<any>();
    return (d.message?.items||[]).map((x:any)=>{
      const title=cleanText(Array.isArray(x.title)?x.title[0]||"":""),journal=cleanText(Array.isArray(x["container-title"])?x["container-title"][0]||"": "Crossref scholarly index");
      const year=x.published?.["date-parts"]?.[0]?.[0];
      const authors=Array.isArray(x.author)?x.author.slice(0,3).map((a:any)=>[a.given,a.family].filter(Boolean).join(" ")).join(", "):"";
      return {title,summary:[authors,year,journal,cleanText(x.abstract||"").replace(/<[^>]+>/g," ").slice(0,1000)].filter(Boolean).join(" — "),section:"science",kind:"web",evidence:"mixed",sources:[source(title,"Crossref",String(x.URL||"https://search.crossref.org/?q="+encodeURIComponent(q)))],url:String(x.URL||""),score:scoreSource("Crossref",title,q)+12,provider:"Crossref"};
    }).filter((x:any)=>x.title&&x.url);
  }catch{return[]}
}
async function pubmedSearch(q:string,language:Locale):Promise<Candidate[]>{
  if(language!=="en")return[];
  try{
    const searchUrl="https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=5&term="+encodeURIComponent(q);
    const sr=await timeout(searchUrl,2600);if(!sr.ok)return[];
    const ids=(await sr.json<any>()).esearchresult?.idlist||[];if(!ids.length)return[];
    const detailUrl="https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id="+ids.join(",");
    const dr=await timeout(detailUrl,2600);if(!dr.ok)return[];
    const d=await dr.json<any>();
    return ids.map((id:string)=>{const x=d.result?.[id]||{};const title=cleanText(x.title||"");return {title,summary:[x.pubdate,x.fulljournalname,x.elocationid].filter(Boolean).map(cleanText).join(" — "),section:"health",kind:"web",evidence:"mixed",sources:[source(title,"PubMed", "https://pubmed.ncbi.nlm.nih.gov/"+id+"/")],url:"https://pubmed.ncbi.nlm.nih.gov/"+id+"/",score:scoreSource("PubMed",title,q)+18,provider:"PubMed / NCBI"};}).filter((x:any)=>x.title);
  }catch{return[]}
}

async function openAiWebSearch(env:Env,q:string,language:Locale):Promise<Candidate[]>{
  if(!env.OPENAI_API_KEY)return[];
  try{
    const response=await fetch("https://api.openai.com/v1/responses",{
      method:"POST",
      headers:{authorization:"Bearer "+env.OPENAI_API_KEY,"content-type":"application/json"},
      signal:AbortSignal.timeout(3500),
      body:JSON.stringify({
        model:env.OPENAI_MODEL||"gpt-5-mini",
        tools:[{type:"web_search"}],
        instructions:language==="ar"
          ?"ابحث على الويب عن مصادر حقيقية. أعد JSON فقط بالشكل {\"results\":[{\"title\":\"...\",\"summary\":\"...\",\"url\":\"...\"}]}. أجب بالعربية، ولا تخترع روابط. استخدم فقط روابط وجدتها أداة البحث، وفضّل الجهات الرسمية والجامعات والأبحاث ووكالات الأنباء المعروفة."
          :"Search the web for real sources. Return JSON only in the shape {\"results\":[{\"title\":\"...\",\"summary\":\"...\",\"url\":\"...\"}]}. Use English and never invent URLs. Use only pages found by the web-search tool, preferring official institutions, universities, research, and reputable newsrooms.",
        input:"Search query: "+q+". Return up to six distinct useful sources with concise source-specific summaries."
      })
    });
    if(!response.ok)return[];
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
  }catch{return[]}
}
async function openAlex(q:string):Promise<Candidate[]>{
 try{const u="https://api.openalex.org/works?search="+encodeURIComponent(q)+"&per-page=5";const r=await timeout(u,4000);if(!r.ok)return[];const d=await r.json<any>();return(d.results||[]).map((x:any)=>({title:cleanText(x.title||""),summary:cleanText(x.abstract_inverted_index?Object.keys(x.abstract_inverted_index).slice(0,80).join(" "):x.primary_location?.source?.display_name||"Research work"),section:"science",kind:"web",evidence:"mixed",sources:[source(x.title||"Research work","OpenAlex",x.id)],url:x.id,score:64,provider:"OpenAlex"})).filter((x:any)=>x.title)}catch{return[]}
}
async function aiSearch(env:Env,q:string):Promise<Candidate[]>{
  try{
    if(!env.AI_SEARCH)return[]; const r=await env.AI_SEARCH.get(env.BAYAN_AI_SEARCH_INSTANCE||"default").search({messages:[{role:"user",content:q}]});
    const chunks=Array.isArray((r as any)?.chunks)?(r as any).chunks:[];
    return chunks.slice(0,12).map((x:any)=>({title:cleanText(x.title||x.filename||"BAYAN evidence"),summary:cleanText(x.content||x.text||"").slice(0,1800),section:String(x.metadata?.section||"world"),kind:"web",evidence:"mixed",sources:[source(cleanText(x.title||"Evidence"),String(x.metadata?.publisher||"BAYAN AI Search"),String(x.url||"https://bayan.tahaomar411.workers.dev/"))],score:58,provider:"Cloudflare AI Search"}));
  }catch{return[]}
}
async function duck(q:string,language:Locale):Promise<Candidate[]>{
  try{
    const u="https://api.duckduckgo.com/?q="+encodeURIComponent(q)+"&format=json&no_html=1&skip_disambig=0";
    const r=await timeout(u,3500); if(!r.ok)return[];
    const d=await r.json<any>(); const out:Candidate[]=[];
    if(d.AbstractText) out.push({title:cleanText(d.Heading||q),summary:cleanText(d.AbstractText).slice(0,1800),section:"world",kind:"web",evidence:"mixed",sources:[source(cleanText(d.Heading||q),"DuckDuckGo","https://duckduckgo.com/?q="+encodeURIComponent(q))],score:68,provider:"DuckDuckGo"});
    for(const x of (d.RelatedTopics||[]).slice(0,6)){
      if(x?.Text) out.push({title:cleanText(String(x.Text).split(" - ")[0]||q),summary:cleanText(x.Text).slice(0,1200),section:"world",kind:"web",evidence:"mixed",sources:[source(cleanText(x.Text).slice(0,100),"DuckDuckGo",String(x.FirstURL||"https://duckduckgo.com/?q="+encodeURIComponent(q)))],score:52,provider:"DuckDuckGo"});
    }
    return out;
  }catch{return[]}
}
async function duckWebSearch(q:string,language:Locale):Promise<Candidate[]>{
  try{
    const url="https://html.duckduckgo.com/html/?q="+encodeURIComponent(q)+"&kl="+(language==="ar"?"ar-eg":"us-en");
    const response=await timeout(url,2600);if(!response.ok)return[];
    const html=await response.text();const out:Candidate[]=[];
    const anchors=[...html.matchAll(/<a\b([^>]*class=["'][^"']*result__a[^"']*["'][^>]*)>([\s\S]*?)<\/a>/gi)];
    for(const match of anchors.slice(0,10)){
      const attrs=match[1],title=cleanText(decodeXml(match[2]).replace(/<[^>]*>/g," "));
      let url=decodeXml(attrs.match(/href=["']([^"']+)["']/i)?.[1]||"");
      try{const parsed=new URL(url,"https://duckduckgo.com");const redirect=parsed.searchParams.get("uddg");url=redirect?decodeURIComponent(redirect):parsed.href;}catch{}
      if(!title||!/^https:\/\//i.test(url)||/duckduckgo\.com\/l\//i.test(url))continue;
      const around=html.slice(match.index||0,(match.index||0)+1800);
      const snippet=cleanText(decodeXml(around.match(/class=["'][^"']*result__snippet[^"']*["'][^>]*>([\s\S]*?)<\//i)?.[1]||"")).slice(0,1200);
      let publisher="Web result";try{publisher=new URL(url).hostname.replace(/^www\./i,"");}catch{}
      out.push({title,summary:snippet,section:"world",kind:"web",evidence:"mixed",sources:[source(title,publisher,url)],url,score:scoreSource(publisher,title,q)+10,provider:"DuckDuckGo Web"});
    }
    return out;
  }catch{return[]}
}
async function bingWebSearch(q:string,language:Locale):Promise<Candidate[]>{
  // General web search, independent of Bing News RSS and Wikimedia.
  // This is a public HTML fallback, so parse defensively and tolerate layout changes.
  try{
    const setlang=language==="ar"?"ar":"en-US";
    const url="https://www.bing.com/search?q="+encodeURIComponent(q)+"&setlang="+setlang+"&count=10";
    const response=await timeout(url,3000);
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
      let publisher="Web result";try{publisher=new URL(target).hostname.replace(/^www\./i,"");}catch{}
      out.push({title,summary:snippet,section:"world",kind:"web",evidence:"mixed",sources:[source(title,publisher,target)],url:target,score:scoreSource(publisher,title,q)+9,provider:"Bing Web Search"});
    }
    return out;
  }catch{return[]}
}
async function broadGdelt(q:string):Promise<Candidate[]>{
  const variants=[...new Set([q,q.split(/\s+/).slice(0,6).join(" "),q.split(/\s+/).slice(0,3).join(" ")].filter(Boolean))];
  const batches=await Promise.all(variants.map(v=>gdelt(v).catch(()=>[])));
  return batches.flat().slice(0,12);
}
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
async function expandedSearch(env:Env,q:string,language:Locale,person=false):Promise<Candidate[]>{
  // Recovery uses distinct query formulations, not just the same phrase with a suffix.
  // Keep the fan-out bounded so broader recall does not create unbounded latency/subrequests.
  const normalized=q.normalize("NFKC").replace(/[\\u064B-\\u065F\\u0670]/g,"").replace(/[“”‘’]/g,'"').replace(/[؟?!،,;；]+/g," ").replace(/\\s+/g," ").trim();
  const compact=searchTerms(normalized).slice(0,6).join(" ");
  const variants=person
    ? (language==="ar" ? [q+" سيرة ذاتية",normalized,q+" مصدر رسمي"] : [q+" biography",normalized,q+" official profile"])
    : (language==="ar" ? [q+" شرح",normalized,compact+" معلومات موثوقة"] : [q+" overview",normalized,compact+" reliable sources"]);
  const uniqueVariants=[...new Set(variants.map(x=>x.trim()).filter(Boolean))].slice(0,3);
  const batches=await Promise.all(uniqueVariants.map(async variant=>{
    const results=await Promise.all([
      wikipedia(env,variant,language).catch(()=>[]),
      wikipediaRestSearch(variant,language).catch(()=>[]),
      wikidata(variant,language).catch(()=>[]),
      gdelt(variant).catch(()=>[]),
      googleNewsSearch(variant,language).catch(()=>[]),
      bingNewsSearch(variant,language).catch(()=>[]),
      duck(variant,language).catch(()=>[]),
      duckWebSearch(variant,language).catch(()=>[]),
      bingWebSearch(variant,language).catch(()=>[])
    ]);
    return results.flat();
  }));
  return batches.flat();
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
    if(/youtube|youtu\\.be|vimeo/.test(lower))return "فيديو على YouTube";
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
    return /[\u0600-\u06ff]/.test(name)?name:"مصدر بحث";
  }
  if(/فيديو على youtube/i.test(name))return "YouTube video";
  if(/youtube|youtu\\.be|vimeo/.test(lower))return "YouTube video";
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
const languageSafe=(x:Candidate,language:Locale)=>{
  // Use the title to select the requested language. A source may have a useful
  // localized headline but an English abstract; keep the result and blank only
  // the mismatched summary below rather than discarding the entire source.
  const title=String(x.title||"");
  return language==="ar" ? hasArabic(title) : !hasArabic(title);
};
const isVideoEvidenceUrl=(value:string)=>{
 try{const u=new URL(value);return /(^|\\.)((youtube\\.com)|(youtu\\.be)|(vimeo\\.com))$/i.test(u.hostname.replace(/^www\\./i,""))}catch{return false}
};
const getYouTubeVideoId=(value:string)=>{
 try{const u=new URL(value);if(u.hostname.endsWith("youtu.be"))return u.pathname.split("/").filter(Boolean)[0]||"";if(u.hostname.endsWith("youtube.com"))return u.searchParams.get("v")||u.pathname.match(/\\/(?:embed|shorts)\\/([^/?]+)/)?.[1]||"";return ""}catch{return ""}
};
const extractVideoTranscript=async(url:string,language:Locale)=>{
 const id=getYouTubeVideoId(url);if(!id)return "";
 try{
  const page=await fetch("https://www.youtube.com/watch?v="+encodeURIComponent(id),{signal:AbortSignal.timeout(3200),headers:{"accept-language":language==="ar"?"ar,en;q=0.8":"en,en-US;q=0.8","user-agent":"Mozilla/5.0 (compatible; BAYAN/1.2; +https://bayan.tahaomar411.workers.dev/)"}});
  if(!page.ok)return "";
  const html=(await page.text()).slice(0,1800000);
  const start=html.indexOf('"captionTracks":[');if(start<0)return "";
  const end=html.indexOf("]",start);if(end<0)return "";
  const block=html.slice(start,end+1);
  const trackRe=/"baseUrl":"((?:\\\\.|[^"\\\\])*)"[\\s\\S]{0,1400}?"languageCode":"([^"]+)"/g;
  let match:RegExpExecArray|null,captionUrl="";
  while((match=trackRe.exec(block))){const trackLang=String(match[2]||"").toLowerCase();if(language==="ar"?trackLang.startsWith("ar"):trackLang.startsWith("en")){captionUrl=String(match[1]||"").replace(/\\\\u0026/g,"&").replace(/\\\\u003d/g,"=").replace(/\\\\u002f/g,"/").replace(/\\\\\\//g,"/");break;}}
  if(!captionUrl)return "";
  const captions=await fetch(captionUrl+(captionUrl.includes("?")?"&":"?")+"fmt=json3",{signal:AbortSignal.timeout(3200)});
  if(!captions.ok)return "";
  const data=await captions.json<any>();
  const transcript=(data.events||[]).flatMap((event:any)=>(event.segs||[]).map((seg:any)=>String(seg.utf8||""))).join(" ").replace(/\\s+/g," ").trim();
  if(transcript.length<180)return "";
  const localeCorrect=language==="ar"?/[\\u0600-\\u06ff]/.test(transcript):!/[\\u0600-\\u06ff]/.test(transcript);
  return localeCorrect?transcript.slice(0,3600):"";
 }catch{return ""}
};
const gateVideoEvidence=async(candidates:Candidate[],language:Locale)=>{
 const videos=candidates.filter(x=>isVideoEvidenceUrl(String(x.url||x.sources?.[0]?.url||""))).slice(0,2);
 const extracted=await Promise.all(videos.map(async candidate=>({candidate,url:String(candidate.url||candidate.sources?.[0]?.url||""),transcript:await extractVideoTranscript(String(candidate.url||candidate.sources?.[0]?.url||""),language)})));
 const allowed=new Set<string>();
 for(const item of extracted){if(!item.transcript)continue;item.candidate.summary="[Video transcript extracted] "+item.transcript;item.candidate.sources=[{title:item.candidate.title,publisher:"YouTube transcript",url:item.url}];item.candidate.provider="YouTube transcript";allowed.add(item.url);}
 return candidates.filter(x=>!isVideoEvidenceUrl(String(x.url||x.sources?.[0]?.url||""))||allowed.has(String(x.url||x.sources?.[0]?.url||"")));
};
\nexport async function search(env:Env,q:string,language:Locale,options:{publish?:boolean}={}):Promise<SearchResponse>{
  if(disallowedContent(q)){const message=language==="ar"?"لا يعرض بيان المحتوى الإباحي أو الاستغلالي. جرّب البحث عن موضوع تعليمي أو معرفي آخر.":"BAYAN does not provide pornographic or exploitative content. Try an educational or knowledge-focused topic.";try{await saveSearch(env,q,language,intent(q),"blocked",0,"world",[])}catch{}return{query:q,locale:language,results:[],providers:["BAYAN content safety"],providerAttempted:["BAYAN content safety"],status:"insufficient",message};}
  const s=await settings(env);const max=Math.max(5,Math.min(30,Number(s.max_sources||12)));const safe=async<T>(task:Promise<T>,fallback:T):Promise<T>=>{try{return await task}catch{return fallback}};const academicQuery=/(research|paper|papers|study|studies|journal|doi|scholar|academic|citation|crossref|openalex|pubmed|clinical trial|systematic review|بحث علمي|أبحاث|دراسة|دراسات|مجلة علمية|ورقة بحثية|مصدر أكاديمي|دراسات سريرية|مراجعة منهجية)/i.test(q);
const medicalQuery=/(pubmed|medical research|clinical trial|systematic review|medicine|health study|بحث طبي|دراسة طبية|دراسات سريرية|تجربة سريرية|مراجعة منهجية)/i.test(q);
let [local, wiki, wikiRest, wd, gd, oa, remote, dd, duckWeb, bingWeb, google, bing, crossref, pubmed] = await Promise.all([safe(searchArticles(env,q,language,max),[]),safe(s.source_wikipedia==="0"?Promise.resolve([]):wikipedia(env,q,language),[]),safe(s.source_wikipedia==="0"?Promise.resolve([]):wikipediaRestSearch(q,language),[]),safe(s.source_wikidata==="0"?Promise.resolve([]):wikidata(q,language),[]),safe(s.source_gdelt==="0"?Promise.resolve([]):gdelt(q),[]),safe((s.source_openalex==="0"||!academicQuery)?Promise.resolve([]):openAlex(q),[]),safe(s.source_ai_search==="0"?Promise.resolve([]):aiSearch(env,q),[]),safe(duck(q,language),[]),safe(duckWebSearch(q,language),[]),safe(bingWebSearch(q,language),[]),safe(googleNewsSearch(q,language),[]),safe(bingNewsSearch(q,language),[]),safe((academicQuery&&!personLookup(q))?crossrefSearch(q):Promise.resolve([]),[]),safe((language!=="en"||!medicalQuery)?Promise.resolve([]):pubmedSearch(q,language),[])]);
const providerAttempted:string[]=["BAYAN Knowledge Base",...(s.source_wikipedia==="0"?[]:["Wikipedia","Wikipedia REST Search"]),...(s.source_wikidata==="0"?[]:["Wikidata"]),...(s.source_gdelt==="0"?[]:["GDELT"]),...((s.source_openalex!=="0"&&academicQuery)?["OpenAlex"]:[]),...((academicQuery&&!personLookup(q))?["Crossref"]:[]),...((language==="en"&&medicalQuery)?["PubMed / NCBI"]:[]),...(s.source_ai_search==="0"?[]:["Cloudflare AI Search"]),"DuckDuckGo Instant Answers","DuckDuckGo Web Search","Bing Web Search","Google News Search","Bing News RSS"];const candidates:Candidate[]=[
    ...local.map(x=>({...x,score:92,provider:"BAYAN Knowledge Base"})),...wiki,...wikiRest,...wd,...gd,...oa,...crossref,...pubmed,...remote,...dd,...duckWeb,...bingWeb,...google,...bing
  ];
  // Optional authenticated Enterprise enrichment: exact-title article lookups only.
  // Public Wikipedia remains the discovery mechanism; Enterprise is supplemental.
  if (env.WIKIMEDIA_ENTERPRISE_USERNAME && env.WIKIMEDIA_ENTERPRISE_REFRESH_TOKEN && wiki.length) {
    const enterpriseRows = await safe(searchWikimediaEnterprise(env, wiki.slice(0, 2).map(x => x.title), language), []);
    for (const row of enterpriseRows) {
      candidates.push({ ...row, score: scoreSource("Wikimedia Enterprise", row.title, q) + 12, provider: "Wikimedia Enterprise" });
    }
  }
  // Person/name lookups should return a useful collection, not stop after the first matching page.
  const personQuery=personLookup(q);
  const firstPassCount=()=>candidates.filter(x=>languageSafe(x,language)&&!disallowedContent(x.title+" "+x.summary)&&relevantCandidate(x,q)).length;
  // Expand when the first pass is merely sparse, not only when it is empty.
  // People searches need several independent identity clues; general searches need
  // enough relevant evidence to produce a useful answer rather than a thin snippet.
  const expansionThreshold=personQuery?Math.min(6,Math.max(3,Number(s.min_sources||3))):Math.max(3,Number(s.min_sources||3));
  if(firstPassCount()<expansionThreshold){
    providerAttempted.push("Expanded topic variants: Wikipedia, Wikipedia REST Search, Wikidata, GDELT, DuckDuckGo Web Search, Bing Web Search, Google News Search, Bing News RSS","OpenAI Web Search (fallback)");
    const [expanded,web]=await Promise.all([
      safe(expandedSearch(env,q,language,personQuery),[]),
      safe(openAiWebSearch(env,q,language),[])
    ]);
    candidates.push(...expanded,...web);
  }
  
  const seen=new Set<string>();
  const evidenceCandidates=await gateVideoEvidence(candidates,language);\n  const safeCandidates=evidenceCandidates.filter(x=>(language==="ar"?hasArabic(x.title):!hasArabic(x.title))&&!disallowedContent(x.title+" "+x.summary));
  let ranked=safeCandidates.filter(x=>relevantCandidate(x,q)).sort((a,b)=>relevanceScore(b,q)-relevanceScore(a,q));
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
      const titleHits=terms.filter(term=>title.includes(term)).length;
      const totalHits=terms.filter(term=>(title+" "+summary).includes(term)).length;
      return terms.length>0&&(titleHits>=1||totalHits>=2);
    }).sort((a,b)=>relevanceScore(b,q)-relevanceScore(a,q));
  }
  // Never pad the result list with unrelated items: expand providers first, then report honestly if relevance is still weak.
  const results=ranked.filter(x=>{
    const k=x.title.toLowerCase().replace(/\W+/g," ")+"|"+x.summary.toLowerCase().slice(0,160);
    if(seen.has(k))return false; seen.add(k); return true;
  }).slice(0,max).map(({score,provider,...x})=>({...x,summary:localeSafeText(x.summary,language)?x.summary:"",sources:(x.sources||[]).map((s)=>({...s,publisher:localizedSource(s.publisher,language)}))}));
  const providers=[...new Set(candidates.map(x=>x.provider))];
  const publishers=[...new Set(results.flatMap(x=>x.sources||[]).map(x=>String(x.publisher||"").trim().toLowerCase()).filter(Boolean))];
  const configuredMin=Math.max(2,Math.min(5,Number(s.min_sources||3)));
  const status=results.length===0?"insufficient":publishers.length>=configuredMin?"verified":"mixed";
  let publishedSlug:string|undefined;
  let answer:string|undefined;
  let answerStatus:SearchResponse["status"]|undefined;
  if(results.length){
    try{const drafted=await Promise.race([ask(env,q,language,results),new Promise<any>(resolve=>setTimeout(()=>resolve({status:"mixed",answer:""}),1000))]);if(drafted.answer){answer=drafted.answer;answerStatus=drafted.status;}const independentSources=new Set(results.flatMap(x=>x.sources||[]).map(x=>String(x.publisher||"").trim().toLowerCase()).filter(Boolean));const articleTitle=results.find(x=>x.title&&x.summary)?.title||"";const articleSummary=results.find(x=>x.title&&x.summary)?.summary||q;if(options.publish!==false&&drafted.status==="verified"&&usefulDraft(drafted.answer,language)&&independentSources.size>=2&&articleTitle&&!disallowedContent(articleTitle+" "+articleSummary)){const imageUrl=await findRelatedImage(articleTitle+" "+articleSummary).catch(()=>undefined);publishedSlug=await publishVerifiedResearch(env,{title:articleTitle,summary:articleSummary,body:drafted.answer,section:classifySection(q,results,language),language,sources:results.flatMap(x=>x.sources||[]),imageUrl,imageAlt:articleTitle});}}catch{}
  }
  const message=results.length?undefined:(language==="ar"?"تعذر العثور على نتيجة من مصادر البحث المتاحة حاليًا. يمكن توسيع البحث لاحقًا عند توفر مزودات إضافية.":"No result was returned by the available search providers right now. The search can be expanded when additional providers are available.");
  try{await saveSearch(env,q,language,intent(q),status,results.length,classifySection(q,results,language),results)}catch{}
  return {query:q,locale:language,results,providers,providerAttempted,status,message,answer,answerStatus,articleSlug:publishedSlug};
}
function intent(q:string){
  const s=q.toLowerCase();
  if(/weather|طقس|جو|حرارة/.test(s))return"weather"; if(/price|سعر|ذهب|دولار|عملة/.test(s))return"prices";
  if(/how|كيف|طريقة|إصلاح|اصلح|برمج|كود|fix|build/.test(s))return"howto"; if(/who|من هو|من هي|شخصية|سيرة/.test(s))return"person";
  if(/news|خبر|أخبار|حدث|اليوم/.test(s))return"news"; return"research";
}
