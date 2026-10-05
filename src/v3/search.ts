import type {Env} from "./types";
import {listArticles} from "./db";
export async function search(env:Env,q:string,lang:"ar"|"en"){
 const articles=await listArticles(env,lang);
 const terms=q.toLowerCase().split(/\s+/).filter(Boolean);
 const ranked=articles.map(a=>({a,score:terms.reduce((s,t)=>s+((a.title+" "+a.summary+" "+a.body).toLowerCase().includes(t)?1:0),0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,10);
 return {query:q,answer:ranked[0]?.a.summary||"",items:ranked.map(x=>x.a),sources:ranked.flatMap(x=>x.a.evidence).slice(0,10),sufficient:ranked.length>0};
}
