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
export const answerHasUnsupportedSpecifics=(answer:string,evidence:SearchResult[],question="")=>{
  const generic=new Set(["the","this","these","those","according","based","however","therefore","overall","summary","conclusion","answer","key","main","important","first","second","third","one","two","three","it","they","he","she","we","you","and","but","because","during","after","before","global","world","health","history","science","technology","economy","politics","sports","travel","art","bayan","من","هو","هي","ما","ماذا","كيف","متى","أين","اين","لماذا","هل","عن","حول","آخر","اخر","أخبار","اخبار","ماهو","ماهي","ماهي","مع","في","إلى","الى","من","the","what","who","when","where","why","how","does","did","is","are","was","were","current","club","player","play","about","explain","tell","me","latest","news"]);
  const normalizeDigits=(value:string)=>value.replace(/[٠-٩]/g,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/[٬,]/g,"");
  const cleanAnswer=answer.replace(/^\s*\d+[.)]\s/gm,"");
  const sentences=cleanAnswer.split(/[\n.!؟?]+/).map(sentence=>sentence.trim()).filter(Boolean);
  const questionTokens=(question.normalize("NFKC").toLowerCase().match(/[\p{L}\p{N}]+/gu)||[]).filter(token=>!generic.has(token));
  const subjectTokens=questionTokens.length>=2?questionTokens.slice(0,4):[];
  const arabicEntityPatterns=[
    /(?:نادي|فريق|الفريق|المنتخب|المدرب|المغني|المغنية|المطرب|المطربة|الممثل|الممثلة|الفنان|الفنانة|الكاتب|الكاتبة|المؤلف|المؤلفة|الروائي|الروائية)\s+([\u0600-\u06FF]+(?:\s+[\u0600-\u06FF]+){0,1})/g,
    /(?:يلعب(?:\s+حاليًا)?\s+مع|انتقل(?:ت)?\s+إلى|انضم(?:ت)?\s+إلى|تعاقد\s+مع)\s+(?:نادي\s+|فريق\s+)?([\u0600-\u06FF]+(?:\s+[\u0600-\u06FF]+){0,1})/g
  ];
  return sentences.some(sentence=>{
    const names=(sentence.match(/\b[A-Z][A-Za-z0-9&.-]{2,}\b/g)||[]).filter(name=>!generic.has(name.toLowerCase()));
    const numbers=normalizeDigits(sentence).match(/[0-9]+/g)||[];
    const arabicEntities=[];
    for(const pattern of arabicEntityPatterns){
      pattern.lastIndex=0;
      for(const match of sentence.matchAll(pattern)){
        const phrase=(match[1]||"").trim();
        const tail=sentence.slice((match.index||0)+match[0].length);
        const aliasMatch=tail.match(/^\s*\(([A-Za-z][A-Za-z0-9&.-]*(?:\s+[A-Za-z][A-Za-z0-9&.-]*)*)\)/);
        if(phrase&&!new Set(["كرة قدم","كرة القدم","كرة السلة","كرة اليد","الفريق الأول","المنتخب الوطني","فريق العمل","النادي المحلي"]).has(phrase))arabicEntities.push({phrase,hasAlias:Boolean(aliasMatch)});
      }
    }
    if(!names.length&&!numbers.length&&!arabicEntities.length)return false;
    return !evidence.some(item=>{
      const itemText=[item.title,item.summary,...(item.sources||[]).flatMap(source=>[source.title,source.publisher])].filter(Boolean).join(" ").normalize("NFKC").toLowerCase();
      const itemTokens=new Set(itemText.match(/[\p{L}\p{N}&.-]+/gu)||[]);
      const itemNumbers=new Set(normalizeDigits(itemText).match(/[0-9]+/g)||[]);
      const namesSupported=names.every(name=>itemTokens.has(name.toLowerCase()));
      const numbersSupported=numbers.every(number=>itemNumbers.has(number));
      const subjectSupported=!subjectTokens.length||subjectTokens.every(token=>itemTokens.has(token));
      const arabicEntitiesSupported=arabicEntities.every(entity=>entity.hasAlias||entity.phrase.split(/\s+/).every(token=>itemTokens.has(token.toLowerCase())));
      return namesSupported&&numbersSupported&&subjectSupported&&arabicEntitiesSupported;
    });
  });
};
export async function ask(env:Env,question:string,locale:Locale,evidence:SearchResult[]){
  const publishers=new Set(evidence.flatMap(x=>x.sources||[]).map(s=>s.publisher).filter(Boolean));
  if(!evidence.length)return{status:"insufficient" as const,answer:locale==="ar"?"لا أملك أدلة موثقة كافية للإجابة بثقة.":"I do not have enough verified evidence to answer confidently.",sources:[]};
  const evidenceText=JSON.stringify(evidence).slice(0,18000);
  if(env.OPENAI_API_KEY)try{
    const r=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{authorization:"Bearer "+env.OPENAI_API_KEY,"content-type":"application/json"},signal:AbortSignal.timeout(12000),body:JSON.stringify({model:env.OPENAI_MODEL||"gpt-5-mini",messages:[{role:"system",content:locale==="ar"?"أنت BAYAN. أجب بالعربية الفصحى فقط، ولا تضع جملًا إنجليزية أو فقرات بلغة أخرى. استخدم الأدلة المقدمة فقط، ولا تضف اسم شخص أو نادٍ أو مؤسسة أو رقمًا غير موجود في الأدلة. احتفظ بالتهجئة الأصلية للأسماء الخاصة بين قوسين إذا كانت موجودة في المصدر. ابدأ بإجابة مباشرة، ثم نظّم الأفكار في أقسام قصيرة مترابطة عند الحاجة. لا تكرر الفكرة أو الجملة بصياغة أخرى، ولا تخلط بين أشخاص أو أحداث متشابهة. ميّز بين الحقيقة والاستنتاج وعدم اليقين، ولا تخترع معلومة.":"You are BAYAN. Answer in English only. Do not include Arabic sentences or paragraphs. Use only the supplied evidence, and do not introduce any person, club, organization or number that does not appear in the evidence. Start with a direct answer, then organize related ideas into concise sections when useful. Never repeat the same claim in different wording or conflate similar people/events. Distinguish facts from inference and uncertainty, and never invent facts."},{role:"user",content:"Question: "+question+"\nEvidence: "+evidenceText}],temperature:.1})});
    if(r.ok){const d=await r.json<any>();const answer=String(d.choices?.[0]?.message?.content||"").trim();if(answer && languageConsistent(answer,locale) )return{status:publishers.size>=2&&!answerHasUnsupportedSpecifics(answer,evidence,question)?"verified" as const:"mixed" as const,answer,sources:evidence.flatMap(x=>x.sources)}}
  }catch{}
  if(env.AI_SEARCH)try{
    const instance=env.AI_SEARCH.get(env.BAYAN_AI_SEARCH_INSTANCE||"default");
    const r=await instance.chatCompletions({messages:[{role:"user",content:(locale==="ar"?"أجب بالعربية الفصحى فقط. ":"Answer in English only. ")+question}],model:"@cf/meta/llama-3.3-70b-instruct-fp8-fast",ai_search_options:{retrieval:{max_num_results:8}}});
    const answer=String((r as any)?.choices?.[0]?.message?.content||(r as any)?.response||"").trim();
    if(answer && languageConsistent(answer,locale))return{status:publishers.size>=2&&!answerHasUnsupportedSpecifics(answer,evidence,question)?"verified" as const:"mixed" as const,answer,sources:evidence.flatMap(x=>x.sources)}
  }catch{}
  return{status:"mixed" as const,answer:locale==="ar"?"وجدت أدلة يمكن الرجوع إليها، لكن تعذر تشغيل صياغة BAYAN الذكية الآن. راجع الأدلة الظاهرة قبل اتخاذ قرار.":"Relevant evidence was found, but BAYAN's drafting model is temporarily unavailable. Review the evidence before acting.",sources:evidence.flatMap(x=>x.sources)}
}