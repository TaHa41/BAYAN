import type{Env,Locale,SearchResult}from"../types";import{recordRuntimeEventLimited}from"../runtime-events";
const aiFailureDetail=(error:unknown)=>String((error as {message?:string})?.message||error||"unknown").replace(/https?:\/\/[^\s]+/g,"[url]").replace(/\b(?:sk-[A-Za-z0-9_-]{8,}|Bearer\s+\S+)\b/gi,"[redacted]").slice(0,300);
async function recordAiFailure(env:Env,provider:string,detail:string){await recordRuntimeEventLimited(env,"ai_generation","ai_provider_failure",provider+": "+detail);}

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
  const generic=new Set(["the","this","these","those","according","based","however","therefore","overall","summary","conclusion","answer","key","main","important","first","second","third","one","two","three","it","they","he","she","we","you","and","but","because","during","after","before","global","world","health","history","science","technology","economy","politics","sports","travel","art","bayan","من","هو","هي","ما","ماذا","كيف","متى","أين","اين","لماذا","هل","عن","حول","آخر","اخر","أخبار","اخبار","ماهو","ماهي","مع","في","إلى","الى","what","who","when","where","why","how","does","did","is","are","was","were","current","club","player","play","about","explain","tell","me","latest","news"]);
  const normalizeDigits=(value:string)=>value.replace(/[٠-٩]/g,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/[٬,]/g,"");
  const cleanAnswer=answer.replace(/^\s*\d+[.)]\s/gm,"");
  const sentences=cleanAnswer.split(/[\n.!؟?]+/).map(sentence=>sentence.trim()).filter(Boolean);
  const questionTokens=(question.normalize("NFKC").toLowerCase().match(/[\p{L}\p{N}]+/gu)||[]).filter(token=>!generic.has(token));
  const subjectTokens=questionTokens.length>=2?questionTokens.slice(0,4):[];
  // Build one corpus for support checks: a sentence may synthesize separate
  // facts from different evidence records, but every specific must still occur
  // in at least one supplied record. This removes false rejection without
  // allowing unsupported names or numbers.
  const corpus=evidence.map(item=>[item.title,item.summary,...(item.sources||[]).flatMap(source=>[source.title,source.publisher])].filter(Boolean).join(" ")).join(" ").normalize("NFKC").toLowerCase();
  const corpusTokens=new Set(corpus.match(/[\p{L}\p{N}&.-]+/gu)||[]);
  const corpusNumbers=new Set(normalizeDigits(corpus).match(/[0-9]+/g)||[]);
  const arabicEntityPatterns=[
    /(?:نادي|فريق|الفريق|المنتخب|المدرب|المغني|المغنية|المطرب|المطربة|الممثل|الممثلة|الفنان|الفنانة|الكاتب|الكاتبة|المؤلف|المؤلفة|الروائي|الروائية)\s+([\u0600-\u06FF]+(?:\s+[\u0600-\u06FF]+){0,1})/g,
    /(?:يلعب(?:\s+حاليًا)?\s+مع|انتقل(?:ت)?\s+إلى|انضم(?:ت)?\s+إلى|تعاقد\s+مع)\s+(?:نادي\s+|فريق\s+)?([\u0600-\u06FF]+(?:\s+[\u0600-\u06FF]+){0,1})/g
  ];
  return sentences.some(sentence=>{
    const names=(sentence.match(/\b[A-Z][A-Za-z0-9&.-]{2,}\b/g)||[]).filter(name=>!generic.has(name.toLowerCase()));
    const numbers=normalizeDigits(sentence).match(/[0-9]+/g)||[];
    const arabicEntities:{phrase:string;hasAlias:boolean}[]=[];
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
    const namesSupported=names.every(name=>corpusTokens.has(name.toLowerCase()));
    const numbersSupported=numbers.every(number=>corpusNumbers.has(number));
    const subjectSupported=!subjectTokens.length||subjectTokens.every(token=>corpusTokens.has(token));
    const arabicEntitiesSupported=arabicEntities.every(entity=>entity.hasAlias||entity.phrase.split(/\s+/).every(token=>corpusTokens.has(token.toLowerCase())));
    return !(namesSupported&&numbersSupported&&subjectSupported&&arabicEntitiesSupported);
  });
};
const independentSourceCount=(env:Env,evidence:SearchResult[])=>new Set(evidence.flatMap(item=>item.sources||[]).map(source=>{
  try{const host=new URL(String(source.url||"")).hostname.toLowerCase().replace(/^www\./,"");if(host)return host}catch(error){void recordRuntimeEventLimited(env,"ai_source_url","invalid_evidence_source_url",error)}
  return String(source.publisher||"").trim().toLowerCase();
}).filter(Boolean)).size;

export async function draftArticle(env:Env,question:string,locale:Locale,evidence:SearchResult[]){
  if(evidence.length<2)return{status:"insufficient" as const,answer:"",sources:evidence.flatMap(item=>item.sources||[])};
  // Give the model bounded evidence excerpts only. URLs and unrelated result
  // metadata are deliberately excluded from the drafting prompt.
  const compactEvidence=evidence.slice(0,12).map((item,index)=>({
    sourceId:"S"+(index+1),
    title:String(item.title||"").slice(0,240),
    excerpt:String(item.summary||"").slice(0,1400),
    publishers:[...new Set((item.sources||[]).map(source=>String(source.publisher||"").trim()).filter(Boolean))].slice(0,4),
    sourceTitles:(item.sources||[]).map(source=>String(source.title||"").slice(0,180)).filter(Boolean).slice(0,4)
  }));
  const evidenceById=new Map(compactEvidence.map((item,index)=>[item.sourceId,evidence[index]]));
  const evidenceText=JSON.stringify(compactEvidence).slice(0,16000);
  const system=locale==="ar"
    ?"أنت محرر أدلة في بيان. اكتب مقالًا عربيًا مفيدًا اعتمادًا على المقتطفات المرفقة فقط. أخرج JSON صالحًا فقط بالشكل {\\"sections\\":[{\\"heading\\":\\"عنوان\\",\\"sentences\\":[{\\"text\\":\\"جملة واحدة\\",\\"sourceIds\\":[\\"S1\\"]}]}]}. يجب أن تحمل كل جملة sourceIds لمعرف مقتطف واحد على الأقل يدعمها مباشرة. لا تضف أسماء أو أرقامًا أو تواريخ أو حقائق تفصيلية غير موجودة حرفيًا أو بوضوح في المقتطفات المشار إليها. لا تستنتج تفاصيل محددة. لا تضع أكثر من فكرة مستقلة في الجملة. استخدم أربعة عناوين ذات معنى على الأقل عندما تسمح الأدلة. إذا لم تدعم الأدلة جملة مفيدة، فلا تكتبها. لا تضف روابط أو نصًا خارج JSON."
    :"You are BAYAN's evidence editor. Write a useful article using only the supplied excerpts. Output valid JSON only in this shape: {\\"sections\\":[{\\"heading\\":\\"Heading\\",\\"sentences\\":[{\\"text\\":\\"one sentence\\",\\"sourceIds\\":[\\"S1\\"]}]}]}. Every sentence must carry sourceIds for at least one excerpt that directly supports it. Do not add names, numbers, dates, or specific facts unless they are explicitly present in the cited excerpts. Do not infer specific details. Keep each sentence to one independently verifiable claim. Use at least four meaningful headings when evidence permits. Omit claims the evidence cannot support. No URLs and no text outside JSON.";
  const parseDraft=(raw:string)=>{
    try{
      const value=JSON.parse(raw);
      if(!value||!Array.isArray(value.sections))return undefined;
      const sections=value.sections.map((section:any)=>({
        heading:String(section?.heading||"").trim().slice(0,140),
        sentences:(Array.isArray(section?.sentences)?section.sentences:[]).map((sentence:any)=>({
          text:String(sentence?.text||"").replace(/\\s+/g," ").trim().slice(0,900),
          sourceIds:[...new Set((Array.isArray(sentence?.sourceIds)?sentence.sourceIds:[]).map((id:any)=>String(id).trim()).filter((id:string)=>evidenceById.has(id)))].slice(0,4)
        })).filter((sentence:any)=>sentence.text&&sentence.sourceIds.length>0)
      })).filter((section:any)=>section.heading&&section.sentences.length);
      return sections.length?sections:undefined;
    }catch{return undefined;}
  };
  const verifySections=(sections:any[])=>{
    const accepted:any[]=[],rejected:string[]=[];
    for(const section of sections){
      const sentences:any[]=[];
      for(const sentence of section.sentences){
        const cited=sentence.sourceIds.map((id:string)=>evidenceById.get(id)).filter(Boolean) as SearchResult[];
        if(!cited.length||answerHasUnsupportedSpecifics(sentence.text,cited,question)){
          rejected.push(sentence.text.slice(0,180));
          continue;
        }
        sentences.push(sentence);
      }
      if(sentences.length)accepted.push({...section,sentences});
    }
    return{sections:accepted,rejected};
  };
  const generate=async(extraInstruction:string)=>{
    const messages=[{role:"system",content:system},{role:"user",content:"Topic/question: "+question+"\\nEvidence excerpts (only these snippets may be used): "+evidenceText+(extraInstruction?"\\nCorrection required: "+extraInstruction:"")}];
    if(env.OPENAI_API_KEY)try{
      const response=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{authorization:"Bearer "+env.OPENAI_API_KEY,"content-type":"application/json"},signal:AbortSignal.timeout(9000),body:JSON.stringify({model:env.OPENAI_MODEL||"gpt-5-mini",messages,temperature:0,max_tokens:2600,response_format:{type:"json_object"}})});
      if(response.ok){
        const data=await response.json<any>(),answer=String(data.choices?.[0]?.message?.content||"").trim();
        if(answer)return answer;
        await recordAiFailure(env,"OpenAI draft","empty_response");
      }else await recordAiFailure(env,"OpenAI draft","http_"+response.status);
    }catch(error){await recordAiFailure(env,"OpenAI draft",aiFailureDetail(error));}
    if(env.AI)try{
      const response=await env.AI.run("@cf/meta/llama-3.1-8b-instruct-fast",{messages,max_tokens:2200,temperature:0});
      const answer=String((response as any)?.response||"").trim();
      if(answer)return answer;
      await recordAiFailure(env,"Workers AI draft","empty_response");
    }catch(error){await recordAiFailure(env,"Workers AI draft",aiFailureDetail(error));}
    return "";
  };
  let raw=await generate("");
  if(!raw)return{status:"mixed" as const,answer:"",sources:evidence.flatMap(item=>item.sources||[]),reason:"ai_unavailable" as const};
  let sections=parseDraft(raw);
  if(!sections){
    raw=await generate("The prior output was not valid JSON in the required schema. Return only valid JSON with sections, heading, sentences, text, and sourceIds.");
    sections=parseDraft(raw);
  }
  if(!sections)return{status:"mixed" as const,answer:"",sources:evidence.flatMap(item=>item.sources||[]),reason:"draft_not_verified" as const};
  let checked=verifySections(sections);
  // Retry once only when specific unsupported claims were found. Any remaining
  // unsupported sentence is dropped, never allowed through the publication gate.
  if(checked.rejected.length){
    const rejected=checked.rejected.slice(0,8).join(" | ");
    const retryRaw=await generate("Regenerate the article JSON once. The following sentences failed evidence verification and must be omitted or replaced with directly supported claims: "+rejected+". Each sentence must cite valid sourceIds.");
    const retrySections=parseDraft(retryRaw);
    if(retrySections){
      const retryChecked=verifySections(retrySections);
      if(retryChecked.sections.reduce((n,section)=>n+section.sentences.length,0)>checked.sections.reduce((n,section)=>n+section.sentences.length,0))checked=retryChecked;
    }
  }
  const body=checked.sections.map(section=>"## "+section.heading+"\\n\\n"+section.sentences.map((sentence:any)=>sentence.text).join(" ")).join("\\n\\n");
  const sentenceCount=checked.sections.reduce((n,section)=>n+section.sentences.length,0);
  const headings=checked.sections.length;
  const sufficientlyUseful=body.length>=1800&&sentenceCount>=12&&headings>=4;
  const independentlySourced=independentSourceCount(env,evidence)>=2;
  const verified=sufficientlyUseful&&independentlySourced&&languageConsistent(body,locale)&&!answerHasUnsupportedSpecifics(body,evidence,question);
  return{status:verified?"verified" as const:"mixed" as const,answer:body,sources:evidence.flatMap(item=>item.sources||[]),reason:verified?undefined:"draft_not_verified" as const,verification:{sentenceCount,headings,rejectedSentences:checked.rejected.length}};
}
export async function ask(env:Env,question:string,locale:Locale,evidence:SearchResult[]){
  if(!evidence.length)return{status:"insufficient" as const,answer:locale==="ar"?"لا أملك أدلة موثقة كافية للإجابة بثقة.":"I do not have enough verified evidence to answer confidently.",sources:[]};
  const evidenceText=JSON.stringify(evidence).slice(0,18000);
  if(env.OPENAI_API_KEY)try{
    const r=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{authorization:"Bearer "+env.OPENAI_API_KEY,"content-type":"application/json"},signal:AbortSignal.timeout(12000),body:JSON.stringify({model:env.OPENAI_MODEL||"gpt-5-mini",messages:[{role:"system",content:locale==="ar"?"أنت BAYAN. أجب بالعربية الفصحى فقط، ولا تضع جملًا إنجليزية أو فقرات بلغة أخرى. استخدم الأدلة المقدمة فقط، ولا تضف اسم شخص أو نادٍ أو مؤسسة أو رقمًا غير موجود في الأدلة. احتفظ بالتهجئة الأصلية للأسماء الخاصة بين قوسين إذا كانت موجودة في المصدر. ابدأ بإجابة مباشرة، ثم نظّم الأفكار في أقسام قصيرة مترابطة عند الحاجة. لا تكرر الفكرة أو الجملة بصياغة أخرى، ولا تخلط بين أشخاص أو أحداث متشابهة. ميّز بين الحقيقة والاستنتاج وعدم اليقين، ولا تخترع معلومة.":"You are BAYAN. Answer in English only. Do not include Arabic sentences or paragraphs. Use only the supplied evidence, and do not introduce any person, club, organization or number that does not appear in the evidence. Start with a direct answer, then organize related ideas into concise sections when useful. Never repeat the same claim in different wording or conflate similar people/events. Distinguish facts from inference and uncertainty, and never invent facts."},{role:"user",content:"Question: "+question+"\nEvidence: "+evidenceText}],temperature:.1})});
    if(r.ok){const d=await r.json<any>();const answer=String(d.choices?.[0]?.message?.content||"").trim();if(answer && languageConsistent(answer,locale) )return{status:independentSourceCount(env,evidence)>=2&&!answerHasUnsupportedSpecifics(answer,evidence,question)?"verified" as const:"mixed" as const,answer,sources:evidence.flatMap(x=>x.sources)};await recordAiFailure(env,"OpenAI answer",answer?"language_mismatch":"empty_response")}
    else await recordAiFailure(env,"OpenAI answer","http_"+r.status);
  }catch(error){await recordAiFailure(env,"OpenAI answer",aiFailureDetail(error));}
  // AI_SEARCH is a retrieval binding, not the text-generation runtime.
  // Use the Workers AI binding for drafting when OpenAI is unavailable; keep
  // retrieval evidence supplied above and never ask the model to invent sources.
  if(env.AI)try{
    const system=locale==="ar"
      ?"أنت بيان. أجب بالعربية الفصحى فقط وبالاعتماد على الأدلة المرفقة وحدها. لا تخترع أسماء أو أرقامًا أو مصادر. ميّز الحقائق من الاستنتاجات، واذكر بوضوح ما لا تثبته الأدلة."
      :"You are BAYAN. Answer in English only using only the supplied evidence. Do not invent names, numbers, or sources. Distinguish facts from inference and state clearly what the evidence does not establish.";
    const r=await env.AI.run("@cf/meta/llama-3.1-8b-instruct-fast",{messages:[{role:"system",content:system},{role:"user",content:"Question: "+question+"\nEvidence: "+evidenceText}],max_tokens:1200,temperature:0.1});
    const answer=String((r as any)?.response||"").trim();
    if(answer && languageConsistent(answer,locale))return{status:independentSourceCount(env,evidence)>=2&&!answerHasUnsupportedSpecifics(answer,evidence,question)?"verified" as const:"mixed" as const,answer,sources:evidence.flatMap(x=>x.sources)};
    await recordAiFailure(env,"Workers AI answer",answer?"language_mismatch":"empty_response");
  }catch(error){await recordAiFailure(env,"Workers AI answer",aiFailureDetail(error));}
  return{status:"mixed" as const,answer:locale==="ar"?"وجدت أدلة يمكن الرجوع إليها، لكن تعذر تشغيل صياغة BAYAN الذكية الآن. راجع الأدلة الظاهرة قبل اتخاذ قرار.":"Relevant evidence was found, but BAYAN's drafting model is temporarily unavailable. Review the evidence before acting.",sources:evidence.flatMap(x=>x.sources),reason:"ai_unavailable" as const}
}