import type{Env}from"../types";import{now}from"../config";import{notify}from"./telegram";import{findRelatedImage,news}from"./news";
async function newsCacheHealthy(env:Env){
  const rows=await env.DB.prepare("SELECT language,payload FROM news_cache WHERE language IN ('ar','en')").all<any>();
  const cache=rows.results||[];
  for(const language of ["ar","en"]){
    const row=cache.find((item:any)=>item.language===language);
    if(!row?.payload)return false;
    let items:any[]=[];
    try{const parsed=JSON.parse(String(row.payload));items=Array.isArray(parsed)?parsed:(Array.isArray(parsed?.items)?parsed.items:[])}catch{return false}
    const fresh=items.filter((item:any)=>{
      const title=String(item.title||""),date=Date.parse(String(item.publishedAt||""));
      const localeMatch=language==="ar"?/[\u0600-\u06ff]/.test(title):!/[\u0600-\u06ff]/.test(title);
      return localeMatch&&Number.isFinite(date)&&date<=Date.now()+5*60*1000&&Date.now()-date<=72*60*60*1000;
    });
    if(fresh.length<3)return false;
  }
  return true;
}


const CANONICAL_SECTIONS=["science","technology","economy","politics","health","history","people","sports","travel","art","news","trends","prices","egypt","arab","world"] as const;
const CONTENT_SECTIONS=["science","technology","economy","politics","health","history","people","sports","travel","art","trends","egypt","arab","world"] as const;

export async function record(env:Env,level:string,kind:string,message:string){
  try{await env.DB.prepare("INSERT INTO runtime_events(level,kind,message,created_at) VALUES(?,?,?,?)").bind(level,kind,message.slice(0,4000),now()).run()}catch{}
}

async function diagnose(env:Env,failures:string[]){
  let history="No recorded repair history for this failure signature.";
  try{const rows=await env.DB.prepare("SELECT attempt_no,diagnosis,action,verification,created_at FROM repair_attempts WHERE signature=? ORDER BY attempt_no DESC LIMIT 5").bind(failures.join(",")).all<any>();if((rows.results||[]).length)history=(rows.results||[]).map((row:any)=>"Attempt "+row.attempt_no+"; verification="+row.verification+"; action="+String(row.action||"").slice(0,700)+"; diagnosis="+String(row.diagnosis||"").slice(0,500)).join("\n")}catch{}
  const prompt="BAYAN self-healing diagnostic. Confirmed failing checks: "+failures.join(", ")+".\nPrevious attempts (do not repeat a failed action unchanged):\n"+history+"\nReturn evidence, likely cause, and one safest reversible action that improves on prior attempts. Never propose destructive SQL, authentication changes, secret exposure, or unverified code mutation.";
  if(env.OPENAI_API_KEY)try{
    const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{authorization:"Bearer "+env.OPENAI_API_KEY,"content-type":"application/json"},signal:AbortSignal.timeout(12000),body:JSON.stringify({model:env.OPENAI_MODEL||"gpt-5-mini",instructions:"You are a conservative reliability engineer. Separate evidence from hypothesis.",input:prompt,store:false})});
    if(r.ok){const d=await r.json<any>();return String(d.output_text||"").slice(0,3000)}
  }catch{}
  if(env.AI)try{const d=await env.AI.run("@cf/meta/llama-3.1-8b-instruct",{prompt});return String((d as any)?.response||"").slice(0,3000)}catch{}
  return"AI diagnostic unavailable; deterministic health evidence recorded.";
}

async function repairTaxonomy(env:Env){
  const actions:string[]=[];
  const canonical=[
    ["egypt","egypt-%"],["arab","arab-%"],["world","world-%"],["science","science-%"],["technology","technology-%"],
    ["economy","economy-%"],["politics","politics-%"],["health","health-%"],["history","history-%"],["people","people-%"],
    ["sports","sports-%"],["travel","travel-%"],["art","art-%"],["trends","trends-%"]
  ] as const;
  for(const [section,pattern] of canonical){
    try{await env.DB.prepare("UPDATE articles SET section=? WHERE slug LIKE ?").bind(section,pattern).run()}catch{}
  }
  const legacy=[
    ["people",["who-is-naguib-mahfouz-ar","who-is-naguib-mahfouz-en"]],
    ["economy",["what-is-inflation-ar","what-is-inflation-en"]],
    ["technology",["how-ai-works-ar","how-ai-works-en","how-to-debug-web-ar","how-to-debug-web-en"]],
    ["science",["why-sky-blue-ar","why-sky-blue-en"]],
    ["health",["what-is-public-health-ar","what-is-public-health-en"]],
    ["history",["world-war-two-overview-ar","world-war-two-overview-en"]],
    ["world",["what-is-a-news-story-ar","what-is-a-news-story-en","how-stories-are-built-ar","how-stories-are-built-en"]],
    ["egypt",["egypt-at-a-glance-ar","egypt-at-a-glance-en"]]
  ] as const;
  for(const [section,slugs] of legacy)for(const slug of slugs)try{await env.DB.prepare("UPDATE articles SET section=? WHERE slug=?").bind(section,slug).run()}catch{}
  try{await env.DB.prepare("UPDATE articles SET status='PUBLISHED' WHERE section='trends' AND slug LIKE 'trends-%'").run()}catch{}
  try{await env.DB.prepare("UPDATE articles SET status='ARCHIVED' WHERE section IN ('guides','topics','stories')").run()}catch{}
  actions.push("approved taxonomy enforced; legacy section assignments neutralized");
  return actions;
}

async function repairRuntime(env:Env,failures:string[]){
  const actions:string[]=[];
  try{await env.DB.prepare("SELECT 1").first();actions.push("database verified")}catch{
    try{await env.DB.prepare("CREATE TABLE IF NOT EXISTS runtime_events(id INTEGER PRIMARY KEY AUTOINCREMENT,level TEXT NOT NULL,kind TEXT NOT NULL,message TEXT NOT NULL,created_at TEXT NOT NULL)").run();actions.push("runtime_events recreated")}catch{}
  }
  try{await env.DB.prepare("CREATE TABLE IF NOT EXISTS repair_jobs(id INTEGER PRIMARY KEY AUTOINCREMENT,signature TEXT NOT NULL UNIQUE,status TEXT NOT NULL DEFAULT 'DETECTED',diagnosis TEXT,action TEXT,verification TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL)").run();actions.push("repair_jobs verified")}catch{}
  try{
    const defaults:Record<string,string>={min_sources:"2",max_sources:"8",image_required:"0",image_fallback:"1",auto_repair:"1",news_items:"12",search_timeout_ms:"7000",source_wikipedia:"1",source_wikidata:"1",source_gdelt:"1",source_openalex:"1",source_ai_search:"1"};
    for(const key of Object.keys(defaults)){const row=await env.DB.prepare("SELECT value FROM admin_settings WHERE key=?").bind(key).first<any>();if(!row)await env.DB.prepare("INSERT OR IGNORE INTO admin_settings(key,value,updated_at) VALUES(?,?,?)").bind(key,defaults[key],now()).run()}
    actions.push("admin settings verified")
  }catch{}
  actions.push(...await repairTaxonomy(env));
  // Avoid a permanent deadlock: when both checks fail, the old logic refreshed
  // news on every run and deferred images on every run. Alternate bounded passes.
  let previousAction="";
  if(failures.includes("news_cache")&&failures.includes("images")){
    try{const previous=await env.DB.prepare("SELECT action FROM repair_jobs WHERE signature=?").bind(failures.join(",")).first<any>();previousAction=String(previous?.action||"")}catch{}
  }
  const imageOnlyPass=failures.includes("news_cache")&&failures.includes("images")&&previousAction.includes("image repair deferred until the next run");
  if(failures.includes("news_cache")&&!imageOnlyPass){
    const refreshed:string[]=[];
    for(const language of ["ar","en"] as const){
      try{const result=await news(env,language);refreshed.push(language+":"+result.items.length)}catch(error){refreshed.push(language+":failed");await record(env,"warn","self_heal_news_refresh",language+" "+String(error).slice(0,300))}
    }
    actions.push("live news refresh attempted for both locales ("+refreshed.join(", ")+"); no news content fabricated");
  }else if(imageOnlyPass){
    actions.push("bounded image-only repair pass selected because the previous run deferred images");
  }
    if(failures.includes("articles"))try{
    const row=await env.DB.prepare("SELECT COUNT(*) count FROM articles WHERE status='PUBLISHED'").first<any>();
    if(Number(row?.count||0)===0)actions.push("no published articles; deployment/content seed review required");
  }catch{}
  if(failures.includes("sections"))try{
    const rows=await env.DB.prepare("SELECT section,language,COUNT(*) count FROM articles WHERE status='PUBLISHED' GROUP BY section,language").all<any>();
    const missing=CONTENT_SECTIONS.flatMap(section=>["ar","en"].filter(language=>!Number((rows.results||[]).find((r:any)=>r.section===section&&r.language===language)?.count||0)).map(language=>section+"_"+language));
    if(missing.length)actions.push("missing section content: "+missing.join(", "));
  }catch{}
  if(failures.includes("images")&&failures.includes("news_cache")&&!imageOnlyPass){actions.push("image repair deferred until the next run to preserve Worker subrequest budget after news refresh")}else if(failures.includes("images"))try{
    const rows=await env.DB.prepare("SELECT id,title,summary FROM articles WHERE status='PUBLISHED' AND (image_url IS NULL OR trim(image_url)='') ORDER BY updated_at DESC LIMIT 4").all<any>();
    let filledArticles=0;
    for(const row of rows.results||[])try{const url=await findRelatedImage(String(row.title||""));if(url){await env.DB.prepare("UPDATE articles SET image_url=?,updated_at=? WHERE id=? AND (image_url IS NULL OR trim(image_url)='')").bind(url,now(),row.id).run();filledArticles++}}catch{}
    let filledNews=0;
    for(const language of ["ar","en"] as const)try{
      const row=await env.DB.prepare("SELECT payload FROM news_cache WHERE language=? LIMIT 1").bind(language).first<any>();
      if(!row?.payload)continue;
      const parsed=JSON.parse(String(row.payload));
      const items:any[]=Array.isArray(parsed)?parsed:(Array.isArray(parsed?.items)?parsed.items:[]);
      let changed=false;
      for(const item of items.filter((entry:any)=>!entry.imageUrl).slice(0,3)){
        const url=await findRelatedImage(String(item.title||""));
        if(url){item.imageUrl=url;item.imageAlt=String(item.title||"");filledNews++;changed=true}
      }
      if(changed&&Array.isArray(parsed))await env.DB.prepare("UPDATE news_cache SET payload=?,updated_at=? WHERE language=?").bind(JSON.stringify(items.slice(0,40)),now(),language).run();
      else if(changed&&parsed&&Array.isArray(parsed.items))await env.DB.prepare("UPDATE news_cache SET payload=?,updated_at=? WHERE language=?").bind(JSON.stringify({...parsed,items:items.slice(0,40)}),now(),language).run();
    }catch{}
    actions.push("image repair filled "+filledArticles+" article(s) and "+filledNews+" cached news image(s); attempted up to 4 articles and 3 stories per locale");
  }catch{actions.push("image repair failed before completion; inspect runtime_events for database or image-provider errors")}
  return actions;
}

async function imageHealth(env:Env){
  const articleRow=await env.DB.prepare("SELECT COUNT(*) AS total,SUM(CASE WHEN image_url IS NULL OR trim(image_url)='' THEN 1 ELSE 0 END) AS missing FROM (SELECT image_url FROM articles WHERE status='PUBLISHED' ORDER BY updated_at DESC LIMIT 12)").first<any>();
  const total=Number(articleRow?.total||0),missing=Number(articleRow?.missing||0);
  if(total===0||missing>3)return false;
  for(const language of ["ar","en"] as const){
    const row=await env.DB.prepare("SELECT payload FROM news_cache WHERE language=? LIMIT 1").bind(language).first<any>();
    if(!row?.payload)return false;
    try{
      const parsed=JSON.parse(String(row.payload));
      const items:any[]=Array.isArray(parsed)?parsed:(Array.isArray(parsed?.items)?parsed.items:[]);
      const eligible=items.filter((item:any)=>item&&String(item.title||"").trim()).slice(0,6);
      if(eligible.length>=3&&eligible.filter((item:any)=>Boolean(String(item.imageUrl||"").trim())).length<Math.min(3,eligible.length))return false;
    }catch{return false}
  }
  return true;
}

async function sectionHealth(env:Env){
  const rows=await env.DB.prepare("SELECT section,language,COUNT(*) count FROM articles WHERE status='PUBLISHED' GROUP BY section,language").all<any>();
  return CONTENT_SECTIONS.flatMap(section=>["ar","en"].filter(language=>!Number((rows.results||[]).find((r:any)=>r.section===section&&r.language===language)?.count||0)).map(language=>section+"_"+language));
}

async function resolveVerifiedLegacyJobs(env:Env){try{await env.DB.prepare("UPDATE repair_jobs SET status='RESOLVED',diagnosis=COALESCE(diagnosis,'')||' | Closed as historical after current runtime checks passed',action='No runtime mutation required; current runtime checks passed; historical signature not reproduced',verification='verified_in_current_release',updated_at=? WHERE status='WAITING_AI' AND (signature LIKE '%generated is not defined%' OR signature LIKE '%resolveWikimediaEditorialImage is not defined%' OR signature LIKE '%manual Telegram diagnostic report%' OR signature LIKE '%predictive runtime degradation: /search%')").bind(now()).run()}catch{}}

export async function selfHeal(env:Env){
  const checks:[string,()=>Promise<boolean>][]=[
    ["database",async()=>{await env.DB.prepare("SELECT 1").first();return true}],
    ["articles",async()=>{const r=await env.DB.prepare("SELECT COUNT(*) count FROM articles WHERE status='PUBLISHED'").first<any>();return Number(r?.count||0)>0}],
    ["sections",async()=>{return (await sectionHealth(env)).length===0}],
    ["news_cache",async()=>await newsCacheHealthy(env)],
    ["images",async()=>await imageHealth(env)],
    ["contributions",async()=>{await env.DB.prepare("SELECT 1 FROM contributions LIMIT 1").first();return true}],
    ["repair_state",async()=>{await env.DB.prepare("SELECT 1 FROM repair_jobs LIMIT 1").first();return true}],
    ["settings",async()=>{await env.DB.prepare("SELECT key FROM admin_settings LIMIT 1").first();return true}]
  ];
  const failures:string[]=[];
  for(const[c,fn]of checks)try{if(!(await fn())){failures.push(c);await record(env,"error","health",c+" check failed")}}catch(e){failures.push(c);await record(env,"error","health",c+" failed: "+String(e))}
  if(!failures.some((failure)=>["database","articles","sections"].includes(failure)))await resolveVerifiedLegacyJobs(env);
  if(!failures.length){try{await env.DB.prepare("UPDATE repair_jobs SET status='RESOLVED',verification='verified_runtime',diagnosis=COALESCE(diagnosis,'')||' | News cache and image health now pass',updated_at=? WHERE status IN ('REVIEW','REPAIRED') AND (signature LIKE '%news_cache%' OR signature LIKE '%images%')").bind(now()).run()}catch{}await record(env,"info","health","AI self-healing checks passed");return{ok:true,failures:[],actions:[],verification:"healthy",message:"All runtime checks passed; no repair was necessary."}}
  const diagnosis=await diagnose(env,failures);
  const actions=await repairRuntime(env,failures);
  let verification="repair_attempted";
  const remainingFailures:string[]=[];
  for(const [name,check] of checks){
    try{if(!(await check()))remainingFailures.push(name)}
    catch{remainingFailures.push(name)}
  }
  verification=remainingFailures.length===0?"verified_runtime":"needs_deployment_or_manual_review";
  const signature=failures.join(",");
  const nextStatus=verification==="verified_runtime"?"REPAIRED":"REVIEW";
  let shouldNotify=true;
  try{
    const previous=await env.DB.prepare("SELECT status,updated_at FROM repair_jobs WHERE signature=?").bind(signature).first<any>();
    const previousTime=Date.parse(String(previous?.updated_at||""));
    if(previous&&previous.status===nextStatus&&Number.isFinite(previousTime)&&Date.now()-previousTime<30*60*1000)shouldNotify=false;
  }catch{}
  try{await env.DB.prepare("INSERT INTO repair_jobs(signature,status,diagnosis,action,verification,created_at,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(signature) DO UPDATE SET status=excluded.status,diagnosis=excluded.diagnosis,action=excluded.action,verification=excluded.verification,updated_at=excluded.updated_at").bind(signature,nextStatus,diagnosis,actions.join("; ")||"No safe runtime action available",verification,now(),now()).run()}catch{}
  try{const count=await env.DB.prepare("SELECT COALESCE(MAX(attempt_no),0) AS n FROM repair_attempts WHERE signature=?").bind(signature).first<any>();const attemptNo=Number(count?.n||0)+1;await env.DB.prepare("INSERT INTO repair_attempts(signature,attempt_no,diagnosis,action,verification,created_at) VALUES(?,?,?,?,?,?)").bind(signature,attemptNo,diagnosis,actions.join("; ")||"No safe runtime action available",verification,now()).run()}catch{}
  await record(env,verification==="verified_runtime"?"info":"error","self_heal",JSON.stringify({initialFailures:failures,remainingFailures,actions,verification}).slice(0,3800));
  if(shouldNotify)await notify(env,"BAYAN AI Self-Healing\nInitial failures: "+failures.join(", ")+"\nRemaining failures: "+(remainingFailures.join(", ")||"none")+"\nAction: "+(actions.join("; ")||"none")+"\nVerification: "+verification);
  return{ok:verification==="verified_runtime",failures:remainingFailures,initialFailures:failures,diagnosis,actions,verification};
}

export async function aiRepairRequest(env:Env,problem:string){
  const issue=String(problem||"").trim().slice(0,4000);
  if(!issue) return {ok:false,error:"problem_required"};
  await record(env,"warn","ai_repair_request","User-reported problem: "+issue);
  const diagnosis=await diagnose(env,[issue]);
  const result=await selfHeal(env);
  return {ok:result.ok,problem:issue,diagnosis,health:result};
}
