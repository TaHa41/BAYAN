import type {Env,Locale,SearchResponse,SearchResult,Source} from "../types";
import {searchArticles,saveSearch} from "../db";

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

async function wikipedia(env:Env,q:string,language:Locale):Promise<Candidate[]>{
  try{
    const api=language==="ar"?"https://ar.wikipedia.org/w/api.php":"https://en.wikipedia.org/w/api.php";
    const u=api+"?action=query&generator=search&gsrsearch="+encodeURIComponent(q)+"&gsrlimit=6&prop=extracts|pageimages&exintro=1&explaintext=1&piprop=thumbnail&pithumbsize=900&format=json&origin=*";
    const r=await timeout(u); if(!r.ok)return[];
    const d=await r.json<any>(); return Object.values(d.query?.pages||{}).map((x:any)=>({
      title:cleanText(x.title),summary:cleanText(x.extract).slice(0,1800),section:"topics",kind:"web",evidence:"mixed",
      sources:[source(x.title,language==="ar"?"Wikipedia Arabic":"Wikipedia",api.replace("api.php","wiki/")+encodeURIComponent(String(x.title).replace(/ /g,"_")))],
      url:"https://"+(language==="ar"?"ar":"en")+".wikipedia.org/wiki/"+encodeURIComponent(String(x.title).replace(/ /g,"_")),
      score:scoreSource("Wikipedia",x.title,q)+8,provider:"Wikipedia"
    }));
  }catch{return[]}
}
async function wikidata(q:string):Promise<Candidate[]>{
  try{
    const u="https://www.wikidata.org/w/api.php?action=wbsearchentities&search="+encodeURIComponent(q)+"&language=en&limit=5&format=json&origin=*";
    const r=await timeout(u); if(!r.ok)return[]; const d=await r.json<any>();
    return (d.search||[]).map((x:any)=>({title:cleanText(x.label||x.id),summary:cleanText(x.description||"").slice(0,900),section:"people",kind:"web",evidence:"mixed",sources:[source(x.label||x.id,"Wikidata","https://www.wikidata.org/wiki/"+x.id)],score:scoreSource("Wikidata",x.label||"",q),provider:"Wikidata"}));
  }catch{return[]}
}
async function aiSearch(env:Env,q:string):Promise<Candidate[]>{
  try{
    if(!env.AI_SEARCH)return[]; const r=await env.AI_SEARCH.get(env.BAYAN_AI_SEARCH_INSTANCE||"default").search({messages:[{role:"user",content:q}]});
    const chunks=Array.isArray((r as any)?.chunks)?(r as any).chunks:[];
    return chunks.slice(0,12).map((x:any)=>({title:cleanText(x.title||x.filename||"BAYAN evidence"),summary:cleanText(x.content||x.text||"").slice(0,1800),section:String(x.metadata?.section||"topics"),kind:"web",evidence:"mixed",sources:[source(cleanText(x.title||"Evidence"),String(x.metadata?.publisher||"BAYAN AI Search"),String(x.url||"https://bayan.tahaomar411.workers.dev/"))],score:58,provider:"Cloudflare AI Search"}));
  }catch{return[]}
}
export async function search(env:Env,q:string,language:Locale):Promise<SearchResponse>{
  const [local, wiki, wd, remote] = await Promise.all([searchArticles(env,q,language),wikipedia(env,q,language),wikidata(q),aiSearch(env,q)]);
  const candidates:Candidate[]=[
    ...local.map(x=>({...x,score:92,provider:"BAYAN Knowledge Base"})),...wiki,...wd,...remote
  ];
  const seen=new Set<string>();
  const results=candidates.sort((a,b)=>b.score-a.score).filter(x=>{
    const k=x.title.toLowerCase().replace(/\W+/g," ")+"|"+x.summary.toLowerCase().slice(0,160);
    if(seen.has(k))return false; seen.add(k); return true;
  }).slice(0,20).map(({score,provider,...x})=>x);
  const providers=[...new Set(candidates.map(x=>x.provider))];
  const status=results.length>=2?"verified":results.length?"mixed":"insufficient";
  const message=results.length?undefined:(language==="ar"?"لم نجد أدلة كافية بعد؛ تم فحص مسارات البحث المتاحة دون اختلاق إجابة.":"Not enough evidence was found after checking the available search paths; BAYAN will not invent an answer.");
  await saveSearch(env,q,language,intent(q),status,results.length);
  return {query:q,locale:language,results,providers,status,message};
}
function intent(q:string){
  const s=q.toLowerCase();
  if(/weather|طقس|جو|حرارة/.test(s))return"weather"; if(/price|سعر|ذهب|دولار|عملة/.test(s))return"prices";
  if(/how|كيف|طريقة|إصلاح|اصلح|برمج|كود|fix|build/.test(s))return"howto"; if(/who|من هو|من هي|شخصية|سيرة/.test(s))return"person";
  if(/news|خبر|أخبار|حدث|اليوم/.test(s))return"news"; return"research";
}
