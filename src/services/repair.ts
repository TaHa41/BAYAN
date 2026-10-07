import type{Env}from"../types";import{now}from"../config";import{notify}from"./telegram";import{findRelatedImage}from"./news";

const CANONICAL_SECTIONS=["science","technology","economy","politics","health","history","people","sports","travel","art","news","trends","prices","egypt","arab","world"] as const;
const CONTENT_SECTIONS=["science","technology","economy","politics","health","history","people","sports","travel","art","trends","egypt","arab","world"] as const;

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
