import type {Locale,SearchResult} from "../types";

/**
 * Two-phase article pipeline (docs/START_HERE_AR.md, section 49).
 *
 * Phase 1 (one cron cycle) gathers evidence and runs the independent-publisher gate.
 * When the gate passes, the evidence is parked in admin_settings under PENDING_EVIDENCE_KEY.
 * Phase 2 (a later cycle) drafts and verifies from the parked evidence with no external
 * evidence fetches, so the per-invocation subrequest budget goes to the AI calls and writes.
 *
 * Nothing here relaxes a check: phase 2 re-runs the same independence, verification, image
 * and publication-quality gates on the stored evidence, and never invents evidence.
 */
export const PENDING_EVIDENCE_KEY="news_evidence_pending";
/** Evidence older than this is discarded and re-gathered (news evidence goes stale). */
export const EVIDENCE_TTL_MS=4*60*60*1000;
/** D1 rows are limited to ~2 MB; stay far below it. Oversized evidence is not parked. */
export const EVIDENCE_MAX_BYTES=400_000;

export interface PendingEvidence{
  v:1;
  id:number;
  language:Locale;
  storedAt:string;
  retryAfter?:string;
  results:SearchResult[];
}

export type PendingEvidenceState=
  |{state:"none"}
  |{state:"invalid"}
  |{state:"expired"}
  |{state:"waiting";retryAfter:string}
  |{state:"ready";evidence:PendingEvidence};

const validTime=(value:unknown):number=>{const t=Date.parse(String(value||""));return Number.isFinite(t)?t:NaN};

/** Returns the JSON to store, or null when there is nothing storable or it is too large. */
export function serializePendingEvidence(input:{id:number;language:Locale;results:readonly SearchResult[];storedAt:string;retryAfter?:string}):string|null{
  if(!Number.isInteger(input.id)||input.id<1)return null;
  if(input.language!=="ar"&&input.language!=="en")return null;
  if(!Array.isArray(input.results)||input.results.length===0)return null;
  if(!Number.isFinite(validTime(input.storedAt)))return null;
  const payload:PendingEvidence={v:1,id:input.id,language:input.language,storedAt:input.storedAt,results:[...input.results]};
  if(input.retryAfter&&Number.isFinite(validTime(input.retryAfter)))payload.retryAfter=input.retryAfter;
  const json=JSON.stringify(payload);
  // Count UTF-8 bytes, not UTF-16 units: Arabic text is multi-byte.
  return new TextEncoder().encode(json).length>EVIDENCE_MAX_BYTES?null:json;
}

const wellFormedResult=(item:any):boolean=>
  !!item&&typeof item==="object"&&typeof item.title==="string"&&typeof item.summary==="string"&&Array.isArray(item.sources)&&
  item.sources.every((source:any)=>!!source&&typeof source==="object"&&typeof source.url==="string"&&typeof source.publisher==="string");

export function readPendingEvidence(raw:string|null|undefined,now:number):PendingEvidenceState{
  if(raw===undefined||raw===null||raw==="")return{state:"none"};
  let parsed:any;
  try{parsed=JSON.parse(String(raw))}catch{return{state:"invalid"}}
  if(!parsed||typeof parsed!=="object"||parsed.v!==1)return{state:"invalid"};
  const id=Number(parsed.id);
  if(!Number.isInteger(id)||id<1)return{state:"invalid"};
  if(parsed.language!=="ar"&&parsed.language!=="en")return{state:"invalid"};
  if(!Array.isArray(parsed.results)||parsed.results.length===0||!parsed.results.every(wellFormedResult))return{state:"invalid"};
  const storedAt=validTime(parsed.storedAt);
  if(!Number.isFinite(storedAt)||storedAt>now+5*60*1000)return{state:"invalid"};
  if(now-storedAt>EVIDENCE_TTL_MS)return{state:"expired"};
  const retryAt=parsed.retryAfter===undefined?NaN:validTime(parsed.retryAfter);
  if(Number.isFinite(retryAt)&&retryAt>now)return{state:"waiting",retryAfter:String(parsed.retryAfter)};
  return{state:"ready",evidence:{v:1,id,language:parsed.language,storedAt:String(parsed.storedAt),retryAfter:parsed.retryAfter,results:parsed.results as SearchResult[]}};
}
