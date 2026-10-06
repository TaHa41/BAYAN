import type{Env,Locale,SearchResponse,SearchResult}from"../types";
import{searchArticles,saveSearch}from"../db";

const intent=(q:string)=>{
  const s=q.toLowerCase();
  if(/weather|طقس|جو|درجة الحرارة/.test(s))return"weather";
  if(/price|سعر|أسعار|ذهب|دولار|عملة|جنيه/.test(s))return"prices";
  if(/how|كيف|طريقة|إصلاح|اصلح|برمج|كود|fix|build/.test(s))return"howto";
  if(/who|من هو|من هي|شخصية|سيرة/.test(s))return"person";
  if(/news|خبر|أخبار|حدث|اليوم/.test(s))return"news";
  return"research";
};

async function aiSearch(env:Env,q:string):Promise<SearchResult[]>{
  try{
    if(!env.AI_SEARCH)return[];
    const instanceName=env.BAYAN_AI_SEARCH_INSTANCE||"bayan";
    const r=await env.AI_SEARCH.get(instanceName).search({messages:[{role:"user",content:q}]});
    const chunks=Array.isArray((r as any)?.chunks)?(r as any).chunks:[];
    return chunks.slice(0,10).map((x:any)=>({
      title:String(x.title||x.filename||"BAYAN evidence"),
      summary:String(x.content||x.text||"").slice(0,1400),
      section:String(x.metadata?.section||"topics"),
      kind:"web" as const,
      evidence:"mixed" as const,
      sources:[{title:String(x.title||x.filename||"Evidence"),publisher:String(x.metadata?.publisher||"BAYAN AI Search"),url:String(x.url||"https://bayan.tahaomar411.workers.dev/")}]
    }));
  }catch{return[]}
}

export async function search(env:Env,q:string,language:Locale):Promise<SearchResponse>{
  const local=await searchArticles(env,q,language);
  const remote=await aiSearch(env,q);
  const seen=new Set<string>();
  const results=[...local,...remote].filter(x=>{
    const k=(x.title+"|"+x.summary).toLowerCase();
    if(seen.has(k))return false;
    seen.add(k);return true;
  }).slice(0,16);
  const status=results.length?"verified":"insufficient";
  const message=results.length?undefined:(language==="ar"?"لم أعثر على أدلة كافية داخل قاعدة بيان أو مصدر البحث المتاح الآن. لا سأخترع إجابة.":"I could not find enough evidence in BAYAN or the available search source. I will not invent an answer.");
  await saveSearch(env,q,language,intent(q),status,results.length);
  return{query:q,locale:language,results,providers:[...(local.length?["BAYAN Knowledge Base"]:[]),...(remote.length?["Cloudflare AI Search"]:[])],status,message};
}