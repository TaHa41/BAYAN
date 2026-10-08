import type {Env,Locale,SearchResponse,SearchResult,Source} from "../types";
import {searchArticles,saveSearch,publishVerifiedResearch} from "../db";
import {ask} from "./ai";

type Candidate = SearchResult & {score:number; provider:string};
const timeout = async (url:string, ms=4500) => {
  const c=new AbortController(); const t=setTimeout(()=>c.abort(),ms);
  try { return await fetch(url,{signal:c.signal,headers:{accept:"application/json,text/plain,*/*"}}); }
  finally { clearTimeout(t); }
};
const cleanText=(s:string)=>String(s||"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
const scoreSource=(publisher:string, title:string, q:string) => {
  const p=publisher.toLowerCase(), t=title.toLowerCase(), terms=q.toLowerCase().split(/\s+/).filter(x=>x.length>2);
  let score=0;
  if(/wikipedia|wikidata/.test(p))score+=72;
  if(/bbc|reuters|ap|associated press|france 24|dw|al jazeera|sky news/.test(p))score+=78;
  if(terms.filter(x=>t.includes(x)).length)score+=Math.min(20,terms.filter(x=>t.includes(x)).length*6);
  return Math.min(100,score);
};
const source=(title:string,publisher:string,url:string):Source=>({title,publisher,url});
const classifySection=(q:string,items:SearchResult[],language:Locale)=>{const s=(q+" "+items.slice(0,4).map(x=>x.title+" "+x.summary).join(" ")).toLowerCase();if(/gold|dollar|currency|price|inflation|سعر|ذهب|دولار|عملة|تضخم/.test(s))return"economy";if(/weather|طقس|حرارة|rain|temperature/.test(s))return"travel";if(/ai|artificial intelligence|technology|software|programming|ذكاء اصطناعي|تقنية|برمجة/.test(s))return"technology";if(/health|medicine|medical|nutrition|صحة|طب|دواء|تغذية/.test(s))return"health";if(/science|space|nasa|physics|biology|علم|فضاء|اكتشاف/.test(s))return"science";if(/history|historical|ancient|تاريخ|حضارة|قديم|culture|ثقافة/.test(s))return"history";if(/art|film|book|music|فن|سينما|كتاب|موسيقى|ترفيه/.test(s))return"art";if(/sports|football|soccer|basketball|رياضة|مباراة|لاعب/.test(s))return"sports";if(/travel|tourism|destination|سفر|سياحة|وجهة/.test(s))return"travel";if(/economy|business|market|اقتصاد|أعمال|سوق/.test(s))return"economy";if(/politic|government|election|president|سياسة|حكومة|انتخابات|رئيس/.test(s))return"politics";if(/biography|who is|من هو|من هي|سيرة|شخصية/.test(s))return"people";if(/trend|viral|popular|ترند|متداول|رائج/.test(s))return"trends";if(/egypt|مصر|القاهرة|الإسكندرية/.test(s))return"egypt";return"world"};

async function wikipedia(env:Env,q:string,language:Locale):Promise<Candidate[]>{
  try{
    const api=language==="ar"?"https://ar.wikipedia.org/w/api.php":"https://en.wikipedia.org/w/api.php";
    const u=api+"?action=query&generator=search&gsrsearch="+encodeURIComponent(q)+"&gsrlimit=6&prop=extracts|pageimages&exintro=1&explaintext=1&piprop=thumbnail&pithumbsize=900&format=json&origin=*";
    const r=await timeout(u); if(!r.ok)return[];
    const d=await r.json<any>(); return Object.values(d.query?.pages||{}).map((x:any)=>({
      title:cleanText(x.title),summary:cleanText(x.extract).slice(0,1800),section:"world",kind:"web",evidence:"mixed",
      sources:[source(x.title,language==="ar"?"Wikipedia Arabic":"Wikipedia",api.replace("api.php","wiki/")+encodeURIComponent(String(x.title).replace(/ /g,"_")))],
      url:"https://"+(language==="ar"?"ar":"en")+".wikipedia.org/wiki/"+encodeURIComponent(String(x.title).replace(/ /g,"_")),
      score:scoreSource("Wikipedia",x.title,q)+8,provider:"Wikipedia"
    }));
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
async function broadGdelt(q:string):Promise<Candidate[]>{
  const variants=[q,q.split(/\s+/).slice(0,6).join(" "),q.split(/\s+/).slice(0,3).join(" ")].filter(Boolean);
  const all:Candidate[]=[];
  for(const v of variants){const x=await gdelt(v);all.push(...x);if(all.length>=8)break}
  return all;
}
async function settings(env:Env){try{const r=await env.DB.prepare("SELECT key,value FROM admin_settings").all<any>();return Object.fromEntries((r.results||[]).map((x:any)=>[x.key,x.value]))}catch{return{}}}
const hasArabic=(value:string)=>/[\u0600-\u06ff]/.test(String(value||""));
// The headline is the strongest locale signal. A translated summary must not make
// an English headline appear in Arabic mode (or vice versa).
const localizedSource=(value:string,language:Locale)=>{
  const name=String(value||"").trim(),lower=name.toLowerCase();
  if(language==="ar"){
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
  const title=String(x.title||""),summary=String(x.summary||"");
  return language==="ar" ? hasArabic(title) && localeSafeText(summary,language) : !hasArabic(title) && localeSafeText(summary,language);
};export async function search(env:Env,q:string,language:Locale):Promise<SearchResponse>{
  const s=await settings(env);const max=Math.max(5,Math.min(30,Number(s.max_sources||12)));const safe=async<T>(task:Promise<T>,fallback:T):Promise<T>=>{try{return await task}catch{return fallback}};let [local, wiki, wd, gd, oa, remote, dd] = await Promise.all([safe(searchArticles(env,q,language,max),[]),safe(s.source_wikipedia==="0"?Promise.resolve([]):wikipedia(env,q,language),[]),safe(s.source_wikidata==="0"?Promise.resolve([]):wikidata(q,language),[]),safe(s.source_gdelt==="0"?Promise.resolve([]):gdelt(q),[]),safe(s.source_openalex==="0"?Promise.resolve([]):openAlex(q),[]),safe(s.source_ai_search==="0"?Promise.resolve([]):aiSearch(env,q),[]),safe(duck(q,language),[])]);
if(!local.length && !wiki.length && !wd.length && !gd.length && !oa.length && !remote.length && !dd.length) gd=await broadGdelt(q);
  const providerAttempted=["BAYAN Knowledge Base","Wikipedia","Wikidata","GDELT","OpenAlex","Cloudflare AI Search","DuckDuckGo"];const candidates:Candidate[]=[
    ...local.map(x=>({...x,score:92,provider:"BAYAN Knowledge Base"})),...wiki,...wd,...gd,...oa,...remote,...dd
  ];
  const seen=new Set<string>();
  const results=candidates.filter(x=>languageSafe(x,language)).sort((a,b)=>b.score-a.score).filter(x=>{
    const k=x.title.toLowerCase().replace(/\W+/g," ")+"|"+x.summary.toLowerCase().slice(0,160);
    if(seen.has(k))return false; seen.add(k); return true;
  }).slice(0,max).map(({score,provider,...x})=>({...x,sources:(x.sources||[]).map((s)=>({...s,publisher:localizedSource(s.publisher,language)}))}));
  const providers=[...new Set(candidates.map(x=>x.provider))];
  const publishers=[...new Set(results.flatMap(x=>x.sources||[]).map(x=>String(x.publisher||"").trim().toLowerCase()).filter(Boolean))];
  const configuredMin=Math.max(2,Math.min(5,Number(s.min_sources||3)));
  const status=results.length===0?"insufficient":publishers.length>=configuredMin?"verified":"mixed";
  let publishedSlug:string|undefined;
  let answer:string|undefined;
  let answerStatus:SearchResponse["status"]|undefined;
  if(status==="verified" && results.length){
    try{const drafted=await ask(env,q,language,results);if(drafted.answer){answer=drafted.answer;answerStatus=drafted.status;}if(drafted.answer && drafted.status==="verified") publishedSlug=await publishVerifiedResearch(env,{title:results[0].title,summary:results[0].summary||q,body:drafted.answer,section:classifySection(q,results,language),language,sources:results.flatMap(x=>x.sources||[])});}catch{}
  }
  const message=results.length?undefined:(language==="ar"?"تعذر العثور على نتيجة من مصادر البحث المتاحة حاليًا. يمكن توسيع البحث لاحقًا عند توفر مزودات إضافية.":"No result was returned by the available search providers right now. The search can be expanded when additional providers are available.");
  try{await saveSearch(env,q,language,intent(q),status,results.length)}catch{}
  return {query:q,locale:language,results,providers,providerAttempted,status,message,answer,answerStatus,articleSlug:publishedSlug};
}
function intent(q:string){
  const s=q.toLowerCase();
  if(/weather|طقس|جو|حرارة/.test(s))return"weather"; if(/price|سعر|ذهب|دولار|عملة/.test(s))return"prices";
  if(/how|كيف|طريقة|إصلاح|اصلح|برمج|كود|fix|build/.test(s))return"howto"; if(/who|من هو|من هي|شخصية|سيرة/.test(s))return"person";
  if(/news|خبر|أخبار|حدث|اليوم/.test(s))return"news"; return"research";
}
