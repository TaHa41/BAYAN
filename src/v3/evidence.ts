import type {Evidence} from "./types";
const host=(u:string)=>{try{return new URL(u).hostname.replace(/^www\./,"")}catch{return ""}};
export function independentEvidence(items:Evidence[]){
 const seen=new Set<string>();
 return items.filter(x=>{const h=x.host||host(x.url||""); if(!h||seen.has(h)) return false; seen.add(h); return true;});
}
export function publicationGate(items:Evidence[]){
 const independent=independentEvidence(items);
 return {ok:independent.length>=2, count:independent.length, evidence:independent};
}
export function languageContamination(text:string,lang:"ar"|"en"){
 if(lang==="en") return /[\u0600-\u06ff]/.test(text);
 return false;
}
