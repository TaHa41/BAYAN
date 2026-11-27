import type {Env} from "../types";

/**
 * Workers AI neuron governor (docs/START_HERE_AR.md, section 50).
 *
 * The free allocation is 10,000 neurons per UTC day. Before this module nothing measured what was spent, so the day's
 * budget disappeared into 70B drafts and retries and the provider then answered 4006 until the next reset. The governor
 * meters every Workers AI call, keeps a reserve, and degrades to cheaper models instead of failing.
 */

/** Neurons per million tokens, from Cloudflare's Workers AI pricing page (checked 2026-11-25). */
export const NEURON_RATES: Readonly<Record<string,{in:number;out:number}>>={
  "@cf/meta/llama-3.3-70b-instruct-fp8-fast":{in:26668,out:204805},
  "@cf/meta/llama-3.1-70b-instruct-fp8-fast":{in:26668,out:204805},
  "@cf/meta/llama-3.1-8b-instruct-fp8":{in:13778,out:26128},
  "@cf/meta/llama-3.1-8b-instruct-fp8-fast":{in:4119,out:34868},
  "@cf/mistralai/mistral-small-3.1-24b-instruct":{in:31876,out:50488},
  "@cf/qwen/qwen3-30b-a3b-fp8":{in:4625,out:30475},
  "@cf/meta/llama-4-scout-17b-16e-instruct":{in:24545,out:77273},
  "@cf/openai/gpt-oss-120b":{in:31818,out:68182},
};
/** An unlisted model is metered at the most expensive text rate we use, so an unknown model can never hide spending. */
export const UNKNOWN_MODEL_RATE={in:26668,out:204805} as const;
export const FREE_DAILY_NEURONS=10_000;
/** Background drafting may spend this share of the day; the rest is reserve for visitors, probes and estimate error. */
export const BACKGROUND_SHARE=0.7;
export const FOREGROUND_SHARE=0.92;
/** A "large" (expensive-output) model is only chosen while the remaining budget covers this many of its calls. */
export const LARGE_MODEL_HEADROOM=3;
export const NEURON_COUNTER_KEY="workers_ai_neurons_daily";

export type AiPriority="foreground"|"background";
export interface NeuronBudget{used:number|null;cap:number;total:number;remaining:number;allowed:boolean;known:boolean;resetsAt:string}

export const rateFor=(model:string)=>NEURON_RATES[model]??UNKNOWN_MODEL_RATE;
export const isLargeModel=(model:string)=>rateFor(model).out>=100_000;

/** Conservative token estimate: Arabic costs more tokens per character than Latin text. */
export function estimateTokens(text:string):number{
  const value=String(text||"");
  let arabic=0;
  for(const ch of value)if(ch>="\u0600"&&ch<="\u06ff")arabic++;
  return Math.ceil(arabic/2.5+(value.length-arabic)/3.5);
}

export function inputText(input:any):string{
  if(typeof input?.prompt==="string")return input.prompt;
  if(Array.isArray(input?.messages))return input.messages.map((m:any)=>String(m?.content??"")).join("\n");
  return "";
}

export const neuronsFor=(model:string,promptTokens:number,completionTokens:number):number=>{
  const rate=rateFor(model);
  return Math.max(1,Math.ceil((Math.max(0,promptTokens)*rate.in+Math.max(0,completionTokens)*rate.out)/1_000_000));
};

/** Cost to reserve before a call: measured input plus 70% of the allowed output (articles rarely fill max_tokens). */
export function estimateCallNeurons(model:string,input:any):number{
  const maxTokens=Math.max(16,Number(input?.max_tokens)||512);
  return neuronsFor(model,estimateTokens(inputText(input)),Math.ceil(maxTokens*0.7));
}

/** Actual cost: the provider's own usage numbers when present, otherwise an estimate from the text. */
export function neuronsFromResponse(model:string,input:any,response:any,responseText:string):number{
  const usage=response?.usage??response?.result?.usage;
  const prompt=Number(usage?.prompt_tokens),completion=Number(usage?.completion_tokens);
  if(Number.isFinite(prompt)&&Number.isFinite(completion)&&prompt>=0&&completion>=0)return neuronsFor(model,prompt,completion);
  return neuronsFor(model,estimateTokens(inputText(input)),estimateTokens(responseText));
}

export const utcDay=(ms:number=Date.now())=>new Date(ms).toISOString().slice(0,10);
/** Workers AI neurons reset at 00:00 UTC. The extra minute avoids retrying inside the reset second. */
export const nextUtcMidnight=(now:number=Date.now()):number=>{const d=new Date(now);return Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()+1,0,1)};

const pacificOffsetMinutes=(ms:number):number=>{
  try{
    const label=new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",timeZoneName:"shortOffset"}).formatToParts(ms).find(part=>part.type==="timeZoneName")?.value||"GMT-8";
    const match=/GMT([+-])(\d+)(?::(\d+))?/.exec(label);
    return match?(match[1]==="-"?-1:1)*(Number(match[2])*60+Number(match[3]||0)):-480;
  }catch{return -480}
};
/** Gemini API daily quotas reset at midnight Pacific time. */
export const nextPacificMidnight=(now:number=Date.now()):number=>{
  const offset=pacificOffsetMinutes(now);
  const dayStart=Math.floor((now+offset*60_000)/86_400_000)*86_400_000;
  let utc=dayStart+86_400_000-offset*60_000;
  const after=pacificOffsetMinutes(utc);
  if(after!==offset)utc=dayStart+86_400_000-after*60_000;
  return utc+60_000;
};

export function neuronCaps(env:{WORKERS_AI_NEURON_BUDGET?:string}):{total:number;background:number;foreground:number}{
  const configured=Number(env.WORKERS_AI_NEURON_BUDGET);
  const total=Number.isFinite(configured)&&configured>=1000?Math.min(Math.floor(configured),10_000_000):FREE_DAILY_NEURONS;
  return{total,background:Math.floor(total*BACKGROUND_SHARE),foreground:Math.floor(total*FOREGROUND_SHARE)};
}

export async function readNeuronsUsed(env:Pick<Env,"DB">,now:number=Date.now()):Promise<number|null>{
  try{
    const row=await env.DB.prepare("SELECT value FROM admin_settings WHERE key=? LIMIT 1").bind(NEURON_COUNTER_KEY).first<{value:string}>();
    const value=String(row?.value||"");
    if(!value||value.slice(0,10)!==utcDay(now))return 0;
    const used=Number(value.slice(11));
    return Number.isFinite(used)&&used>=0?used:0;
  }catch{return null}
}

/** Adds to today's counter in one statement (a new UTC day starts again from the added amount). */
export async function chargeNeurons(env:Pick<Env,"DB">,neurons:number,now:number=Date.now()):Promise<boolean>{
  const amount=Math.max(1,Math.floor(neurons));
  const stamp=new Date(now).toISOString();
  try{
    await env.DB.prepare("INSERT INTO admin_settings(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=CASE WHEN substr(admin_settings.value,1,10)=substr(excluded.value,1,10) THEN substr(admin_settings.value,1,11)||CAST(CAST(substr(admin_settings.value,12) AS INTEGER)+CAST(substr(excluded.value,12) AS INTEGER) AS TEXT) ELSE excluded.value END,updated_at=excluded.updated_at")
      .bind(NEURON_COUNTER_KEY,utcDay(now)+":"+amount,stamp).run();
    return true;
  }catch{return false}
}

/** An unreadable counter never blocks a call: the provider's own quota still protects the account (fail open, no outage). */
export async function neuronBudget(env:Pick<Env,"DB"|"WORKERS_AI_NEURON_BUDGET">,priority:AiPriority,now:number=Date.now()):Promise<NeuronBudget>{
  const caps=neuronCaps(env);
  const cap=priority==="background"?caps.background:caps.foreground;
  const used=await readNeuronsUsed(env,now);
  const resetsAt=new Date(nextUtcMidnight(now)).toISOString();
  if(used===null)return{used:null,cap,total:caps.total,remaining:cap,allowed:true,known:false,resetsAt};
  const remaining=Math.max(0,cap-used);
  return{used,cap,total:caps.total,remaining,allowed:remaining>0,known:true,resetsAt};
}

export interface WorkersAiMeter{
  /** Whether a call to this model, estimated at this many neurons, fits in the remaining budget. */
  allow(model:string,estimate:number):Promise<boolean>;
  charge(model:string,neurons:number):Promise<void>;
}

export function createWorkersAiMeter(env:Pick<Env,"DB"|"WORKERS_AI_NEURON_BUDGET">,priority:AiPriority):WorkersAiMeter{
  return{
    async allow(model,estimate){
      const budget=await neuronBudget(env,priority);
      if(!budget.known)return true;
      const needed=isLargeModel(model)?estimate*LARGE_MODEL_HEADROOM:estimate;
      return budget.remaining>=needed;
    },
    async charge(_model,neurons){await chargeNeurons(env,neurons)},
  };
}
