import type{Env,Locale,SearchResult}from"../types";
const languageConsistent=(answer:string,locale:Locale)=>{
  if(!answer.trim())return false;
  if(locale==="en")return !/[\u0600-\u06ff]/.test(answer);
  if(!/[\u0600-\u06ff]/.test(answer))return false;
  // Reject English-only sentences in Arabic responses rather than allowing a
  // single Arabic word to make an otherwise English answer pass validation.
  const sentences=answer.split(/[\n.!؟?]+/).map(x=>x.trim()).filter(Boolean);
  return sentences.every(sentence=>/[\u0600-\u06ff]/.test(sentence)||!/[A-Za-z]{5,}/.test(sentence));
};
export async function ask(env:Env,question:string,locale:Locale,evidence:SearchResult[]){
  const publishers=new Set(evidence.flatMap(x=>x.sources||[]).map(s=>s.publisher).filter(Boolean));
  if(!evidence.length)return{status:"insufficient" as const,answer:locale==="ar"?"لا أملك أدلة موثقة كافية للإجابة بثقة.":"I do not have enough verified evidence to answer confidently.",sources:[]};
  const evidenceText=JSON.stringify(evidence).slice(0,18000);
  if(env.OPENAI_API_KEY)try{
    const r=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{authorization:"Bearer "+env.OPENAI_API_KEY,"content-type":"application/json"},signal:AbortSignal.timeout(12000),body:JSON.stringify({model:env.OPENAI_MODEL||"gpt-5-mini",messages:[{role:"system",content:locale==="ar"?"أنت BAYAN. أجب بالعربية الفصحى فقط، ولا تضع جملًا إنجليزية أو فقرات بلغة أخرى. استخدم الأدلة المقدمة فقط. ابدأ بإجابة مباشرة، ثم نظّم الأفكار في أقسام قصيرة مترابطة عند الحاجة. لا تكرر الفكرة أو الجملة بصياغة أخرى، ولا تخلط بين أشخاص أو أحداث متشابهة. ميّز بين الحقيقة والاستنتاج وعدم اليقين، ولا تخترع معلومة.":"You are BAYAN. Answer in English only. Do not include Arabic sentences or paragraphs. Use only the supplied evidence. Start with a direct answer, then organize related ideas into concise sections when useful. Never repeat the same claim in different wording or conflate similar people/events. Distinguish facts from inference and uncertainty, and never invent facts."},{role:"user",content:"Question: "+question+"\nEvidence: "+evidenceText}],temperature:.1})});
    if(r.ok){const d=await r.json<any>();const answer=String(d.choices?.[0]?.message?.content||"").trim();if(answer && languageConsistent(answer,locale) )return{status:publishers.size>=2?"verified" as const:"mixed" as const,answer,sources:evidence.flatMap(x=>x.sources)}}
  }catch{}
  if(env.AI_SEARCH)try{
    const instance=env.AI_SEARCH.get(env.BAYAN_AI_SEARCH_INSTANCE||"default");
    const r=await instance.chatCompletions({messages:[{role:"user",content:(locale==="ar"?"أجب بالعربية الفصحى فقط. ":"Answer in English only. ")+question}],model:"@cf/meta/llama-3.3-70b-instruct-fp8-fast",ai_search_options:{retrieval:{max_num_results:8}}});
    const answer=String((r as any)?.choices?.[0]?.message?.content||(r as any)?.response||"").trim();
    if(answer && languageConsistent(answer,locale))return{status:publishers.size>=2?"verified" as const:"mixed" as const,answer,sources:evidence.flatMap(x=>x.sources)}
  }catch{}
  return{status:publishers.size>=2?"verified" as const:"mixed" as const,answer:locale==="ar"?"وجدت أدلة يمكن الرجوع إليها، لكن تعذر تشغيل صياغة BAYAN الذكية الآن. راجع الأدلة الظاهرة قبل اتخاذ قرار.":"Relevant evidence was found, but BAYAN's drafting model is temporarily unavailable. Review the evidence before acting.",sources:evidence.flatMap(x=>x.sources)}
}