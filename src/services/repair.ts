import type{Env}from"../types";import{now}from"../config";import{notify}from"./telegram";import{findRelatedImage}from"./news";

const CANONICAL_SECTIONS=["egypt","arab","world","science","economy","politics","technology","health","history","people","sports","travel"] as const;

export async function record(env:Env,level:string,kind:string,message:string){
  try{await env.DB.prepare("INSERT INTO runtime_events(level,kind,message,created_at) VALUES(?,?,?,?)").bind(level,kind,message.slice(0,4000),now()).run()}catch{}
}

async function diagnose(env:Env,failures:string[]){
  const prompt="BAYAN self-healing diagnostic. Confirmed failing checks: "+failures.join(", ")+". Return evidence, likely cause, and one safest reversible action. Never propose destructive SQL, authentication changes, secret exposure, or unverified code mutation.";
  if(env.OPENAI_API_KEY)try{
    const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{authorization:"Bearer "+env.OPENAI_API_KEY,"content-type":"application/json"},signal:AbortSignal.timeout(12000),body:JSON.stringify({model:env.OPENAI_MODEL||"gpt-5-mini",instructions:"You are a conservative reliability engineer. Separate evidence from hypothesis.",input:prompt,store:false})});
    if(r.ok){const d=await r.json<any>();return String(d.output_text||"").slice(0,3000)}
  }catch{}
  if(env.AI)try{const d=await env.AI.run("@cf/meta/llama-3.1-8b-instruct",{prompt});return String((d as any)?.response||"").slice(0,3000)}catch{}
  return"AI diagnostic unavailable; deterministic health evidence recorded.";
}

async function repairTaxonomy(env:Env){
  const actions:string[]=[];
  const fixes=[
    ["egypt","egypt-%"],["arab","arab-%"],["world","world-%"],["science","science-%"],["economy","economy-%"],
    ["politics","politics-%"],["technology","technology-%"],["health","health-%"],["history","history-%"],
    ["people","people-%"],["sports","sports-%"],["travel","travel-%"]
  ];
  for(const [section,pattern] of fixes){
    try{await env.DB.prepare("UPDATE articles SET section=? WHERE slug LIKE ?").bind(section,pattern).run()}catch{}
  }
  const legacy=[
    ["people",["who-is-naguib-mahfouz-ar","who-is-naguib-mahfouz-en"]],
    ["economy",["what-is-inflation-ar","what-is-inflation-en"]],
    ["technology",["how-ai-works-ar","how-ai-works-en","how-to-debug-web-ar","how-to-debug-web-en"]],
    ["science",["why-sky-blue-ar","why-sky-blue-en"]],
    ["health",["what-is-public-health-ar","what-is-public-health-en"]],
    ["history",["world-war-two-overview-ar","world-war-two-overview-en"]],
    ["sports",["what-is-a-news-story-ar","what-is-a-news-story-en","how-stories-are-built-ar","how-stories-are-built-en"]],
    ["world",["egypt-at-a-glance-ar","egypt-at-a-glance-en"]]
  ] as const;
  for(const [section,slugs] of legacy)for(const slug of slugs)try{await env.DB.prepare("UPDATE articles SET section=? WHERE slug=?").bind(section,slug).run()}catch{}
  actions.push("canonical taxonomy repair applied");
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
  if(failures.includes("articles"))try{
    const row=await env.DB.prepare("SELECT COUNT(*) count FROM articles WHERE status='PUBLISHED'").first<any>();
    if(Number(row?.count||0)===0)actions.push("no published articles; deployment/content seed review required");
  }catch{}
  if(failures.includes("sections"))try{
    const rows=await env.DB.prepare("SELECT section,language,COUNT(*) count FROM articles WHERE status='PUBLISHED' GROUP BY section,language").all<any>();
    const missing=CANONICAL_SECTIONS.flatMap(section=>["ar","en"].filter(language=>!Number((rows.results||[]).find((r:any)=>r.section===section&&r.language===language)?.count||0)).map(language=>section+"_"+language));
    if(missing.length)actions.push("missing section content: "+missing.join(", "));
  }catch{}
  if(failures.includes("images"))try{
    const rows=await env.DB.prepare("SELECT id,title,summary FROM articles WHERE status='PUBLISHED' AND (image_url IS NULL OR image_url='') LIMIT 6").all<any>();
    let filled=0;
    for(const row of rows.results||[])try{const url=await findRelatedImage(String(row.title)+" "+String(row.summary||""));if(url){await env.DB.prepare("UPDATE articles SET image_url=?,updated_at=? WHERE id=?").bind(url,now(),row.id).run();filled++}}catch{}
    actions.push("image repair attempted for "+filled+" article(s)");
  }catch{}
  return actions;
}

async function sectionHealth(env:Env){
  const rows=await env.DB.prepare("SELECT section,language,COUNT(*) count FROM articles WHERE status='PUBLISHED' GROUP BY section,language").all<any>();
  const missing=CANONICAL_SECTIONS.flatMap(section=>["ar","en"].filter(language=>!Number((rows.results||[]).find((r:any)=>r.section===section&&r.language===language)?.count||0)).map(language=>section+"_"+language));
  return missing;
}

export async function selfHeal(env:Env){
  const checks:[string,()=>Promise<boolean>][]=[
    ["database",async()=>{await env.DB.prepare("SELECT 1").first();return true}],
    ["articles",async()=>{const r=await env.DB.prepare("SELECT COUNT(*) count FROM articles WHERE status='PUBLISHED'").first<any>();return Number(r?.count||0)>0}],
    ["sections",async()=>{return (await sectionHealth(env)).length===0}],
    ["contributions",async()=>{await env.DB.prepare("SELECT 1 FROM contributions LIMIT 1").first();return true}],
    ["repair_state",async()=>{await env.DB.prepare("SELECT 1 FROM repair_jobs LIMIT 1").first();return true}],
    ["settings",async()=>{await env.DB.prepare("SELECT key FROM admin_settings LIMIT 1").first();return true}]
  ];
  const failures:string[]=[];
  for(const[c,fn]of checks)try{if(!(await fn())){failures.push(c);await record(env,"error","health",c+" check failed")}}catch(e){failures.push(c);await record(env,"error","health",c+" failed: "+String(e))}
  if(!failures.length){await record(env,"info","health","AI self-healing checks passed");return{ok:true,failures:[],actions:[],verification:"healthy",message:"All runtime checks passed; no repair was necessary."}}
  const diagnosis=await diagnose(env,failures);
  const actions=await repairRuntime(env,failures);
  let verification="repair_attempted";
  try{
    const db=await env.DB.prepare("SELECT 1").first();
    const article=await env.DB.prepare("SELECT COUNT(*) count FROM articles WHERE status='PUBLISHED'").first<any>();
    const missing=await sectionHealth(env);
    verification=db&&Number(article?.count||0)>0&&missing.length===0?"verified_runtime":"needs_deployment_or_manual_review";
  }catch{verification="verification_failed"}
  const signature=failures.join(",");
  try{await env.DB.prepare("INSERT INTO repair_jobs(signature,status,diagnosis,action,verification,created_at,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(signature) DO UPDATE SET status=excluded.status,diagnosis=excluded.diagnosis,action=excluded.action,verification=excluded.verification,updated_at=excluded.updated_at").bind(signature,verification==="verified_runtime"?"REPAIRED":"REVIEW",diagnosis,actions.join("; ")||"No safe runtime action available",verification,now(),now()).run()}catch{}
  await record(env,verification==="verified_runtime"?"info":"error","self_heal",JSON.stringify({failures,actions,verification}).slice(0,3800));
  await notify(env,"BAYAN AI Self-Healing\nFailures: "+failures.join(", ")+"\nAction: "+(actions.join("; ")||"none")+"\nVerification: "+verification);
  return{ok:verification==="verified_runtime",failures,diagnosis,actions,verification};
}
