import type{Env,Locale,SearchResult}from"../types";
const aiFailureDetail=(error:unknown)=>String((error as {message?:string})?.message||error||"unknown").replace(/https?:\/\/[^\s]+/g,"[url]").replace(/\b(?:sk-[A-Za-z0-9_-]{8,}|Bearer\s+\S+)\b/gi,"[redacted]").slice(0,300);
async function recordAiFailure(env:Env,provider:string,detail:string){try{await env.DB.prepare("INSERT INTO runtime_events(level,kind,message,created_at) VALUES(?,?,?,?)").bind("WARN","ai_generation",(provider+": "+detail).replace(/https?:\/\/[^\s]+/g,"[url]").slice(0,350),new Date().toISOString()).run()}catch{}}

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
    return !evidence.some(item=>{
      const itemText=[item.title,item.summary,...(item.sources||[]).flatMap(source=>[source.title,source.publisher])].filter(Boolean).join(" ").normalize("NFKC").toLowerCase();
      const itemTokens=new Set(itemText.match(/[\p{L}\p{N}&.-]+/gu)||[]);
      const itemNumbers=new Set(normalizeDigits(itemText).match(/[0-9]+/g)||[]);
      const namesSupported=names.every(name=>itemTokens.has(name.toLowerCase()));
      const numbersSupported=numbers.every(number=>itemNumbers.has(number));
      const subjectSupported=!arabicEntities.length||!subjectTokens.length||subjectTokens.every(token=>itemTokens.has(token));
      const arabicEntitiesSupported=arabicEntities.every(entity=>entity.hasAlias||entity.phrase.split(/\s+/).every(token=>itemTokens.has(token.toLowerCase())));
      return namesSupported&&numbersSupported&&subjectSupported&&arabicEntitiesSupported;
    });
  });
};
const independentSourceCount=(evidence:SearchResult[])=>new Set(evidence.flatMap(item=>item.sources||[]).map(source=>{
  try{const host=new URL(String(source.url||"")).hostname.toLowerCase().replace(/^www\./,"");if(host)return host}catch{}
  return String(source.publisher||"").trim().toLowerCase();
}).filter(Boolean)).size;

export async function draftArticle(env:Env,question:string,locale:Locale,evidence:SearchResult[]){
  if(evidence.length<2)return{status:"insufficient" as const,answer:"",sources:evidence.flatMap(item=>item.sources||[])};
  const compactEvidence=evidence.slice(0,12).map((item,index)=>({
    title:String(item.title||"").slice(0,240),
    summary:String(item.summary||"").slice(0,1400),
    section:String(item.section||""),
    sources:(item.sources||[]).slice(0,4).map(source=>({title:String(source.title||"").slice(0,180),publisher:String(source.publisher||"").slice(0,120),url:String(source.url||"").slice(0,500)}))
  }));
  const evidenceText=JSON.stringify(compactEvidence).slice(0,20000);
  const system=locale==="ar"
    ?"أنت محرر معرفي في بيان. اكتب مقالًا عربيًا فصيحًا متكاملًا ومفيدًا، لا مجرد ملخص أو مقتطف. ابدأ بمقدمة تجيب عن الموضوع، ثم استخدم أربعة عناوين فرعية على الأقل وفقرات مترابطة تغطي الخلفية، والحقائق الأساسية، والسياق، والأثر أو الاستخدامات، والحدود أو ما لا يزال غير محسوم، وخلاصة واضحة. استهدف مقالًا تفصيليًا يقارب 700 إلى 1000 كلمة عندما تسمح الأدلة. استخدم الأدلة المرفقة فقط، ولا تضف اسمًا أو رقمًا أو تاريخًا أو ادعاءً محددًا غير مدعوم. لا تكرر الفكرة، ولا تخلط بين أشخاص أو أحداث متشابهة. إذا لم تكف الأدلة لتفصيل معين، فقل ذلك بوضوح بدل اختلاقه. لا تذكر أنك نموذج ذكاء اصطناعي ولا تضع روابط خارجية داخل متن المقال؛ تحفظ المصادر منفصلة في بيان."
    :"You are a BAYAN knowledge editor. Write a genuinely useful, comprehensive English article, not a short answer or source excerpt. Begin with a direct introduction, then use at least four meaningful section headings and connected paragraphs covering background, established facts, context, impact or practical use, limitations or unresolved questions, and a clear conclusion. Aim for roughly 700–1000 words when the evidence supports it. Use only the supplied evidence; do not invent names, numbers, dates, quotations, or specific claims. Do not repeat ideas or conflate similar people/events. Clearly state when evidence does not establish a detail. Do not mention being an AI and do not put external URLs in the article body; BAYAN stores sources separately.";
  const messages=[{role:"system",content:system},{role:"user",content:"Topic/question: "+question+"\nEvidence (source records are authoritative; summaries may be incomplete): "+evidenceText}];
  if(env.OPENAI_API_KEY)try{
    const response=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{authorization:"Bearer "+env.OPENAI_API_KEY,"content-type":"application/json"},signal:AbortSignal.timeout(9000),body:JSON.stringify({model:env.OPENAI_MODEL||"gpt-5-mini",messages,temperature:.1,max_tokens:2200})});
    if(response.ok){
      const data=await response.json<any>();
      const answer=String(data.choices?.[0]?.message?.content||"").trim();
      if(answer&&languageConsistent(answer,locale))return{status:independentSourceCount(evidence)>=2&&!answerHasUnsupportedSpecifics(answer,evidence,question)?"verified" as const:"mixed" as const,answer,sources:evidence.flatMap(item=>item.sources||[])};
      await recordAiFailure(env,"OpenAI draft",answer?"language_mismatch":"empty_response");
    }else await recordAiFailure(env,"OpenAI draft","http_"+response.status);
  }catch(error){await recordAiFailure(env,"OpenAI draft",aiFailureDetail(error));}
  if(env.AI)try{
    const response=await env.AI.run("@cf/meta/llama-3.1-8b-instruct",{messages,max_tokens:1800,temperature:.1});
    const answer=String((response as any)?.response||"").trim();
    if(answer&&languageConsistent(answer,locale))return{status:independentSourceCount(evidence)>=2&&!answerHasUnsupportedSpecifics(answer,evidence,question)?"verified" as const:"mixed" as const,answer,sources:evidence.flatMap(item=>item.sources||[])};
    await recordAiFailure(env,"Workers AI draft",answer?"language_mismatch":"empty_response");
  }catch(error){await recordAiFailure(env,"Workers AI draft",aiFailureDetail(error));}
  return{status:"mixed" as const,answer:"",sources:evidence.flatMap(item=>item.sources||[]),reason:"ai_unavailable" as const};
}
export async function ask(env:Env,question:string,locale:Locale,evidence:SearchResult[]){
  if(!evidence.length)return{status:"insufficient" as const,answer:locale==="ar"?"لا أملك أدلة موثقة كافية للإجابة بثقة.":"I do not have enough verified evidence to answer confidently.",sources:[]};
  const evidenceText=JSON.stringify(evidence).slice(0,18000);
  if(env.OPENAI_API_KEY)try{
    const r=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{authorization:"Bearer "+env.OPENAI_API_KEY,"content-type":"application/json"},signal:AbortSignal.timeout(12000),body:JSON.stringify({model:env.OPENAI_MODEL||"gpt-5-mini",messages:[{role:"system",content:locale==="ar"?"أنت BAYAN. أجب بالعربية الفصحى فقط، ولا تضع جملًا إنجليزية أو فقرات بلغة أخرى. استخدم الأدلة المقدمة فقط، ولا تضف اسم شخص أو نادٍ أو مؤسسة أو رقمًا غير موجود في الأدلة. احتفظ بالتهجئة الأصلية للأسماء الخاصة بين قوسين إذا كانت موجودة في المصدر. ابدأ بإجابة مباشرة، ثم نظّم الأفكار في أقسام قصيرة مترابطة عند الحاجة. لا تكرر الفكرة أو الجملة بصياغة أخرى، ولا تخلط بين أشخاص أو أحداث متشابهة. ميّز بين الحقيقة والاستنتاج وعدم اليقين، ولا تخترع معلومة.":"You are BAYAN. Answer in English only. Do not include Arabic sentences or paragraphs. Use only the supplied evidence, and do not introduce any person, club, organization or number that does not appear in the evidence. Start with a direct answer, then organize related ideas into concise sections when useful. Never repeat the same claim in different wording or conflate similar people/events. Distinguish facts from inference and uncertainty, and never invent facts."},{role:"user",content:"Question: "+question+"\nEvidence: "+evidenceText}],temperature:.1})});
    if(r.ok){const d=await r.json<any>();const answer=String(d.choices?.[0]?.message?.content||"").trim();if(answer && languageConsistent(answer,locale) )return{status:independentSourceCount(evidence)>=2&&!answerHasUnsupportedSpecifics(answer,evidence,question)?"verified" as const:"mixed" as const,answer,sources:evidence.flatMap(x=>x.sources)};await recordAiFailure(env,"OpenAI answer",answer?"language_mismatch":"empty_response")}
  }else await recordAiFailure(env,"OpenAI answer","http_"+r.status);
  }catch(error){await recordAiFailure(env,"OpenAI answer",aiFailureDetail(error));}
  // AI_SEARCH is a retrieval binding, not the text-generation runtime.
  // Use the Workers AI binding for drafting when OpenAI is unavailable; keep
  // retrieval evidence supplied above and never ask the model to invent sources.
  if(env.AI)try{
    const system=locale==="ar"
      ?"أنت بيان. أجب بالعربية الفصحى فقط وبالاعتماد على الأدلة المرفقة وحدها. لا تخترع أسماء أو أرقامًا أو مصادر. ميّز الحقائق من الاستنتاجات، واذكر بوضوح ما لا تثبته الأدلة."
      :"You are BAYAN. Answer in English only using only the supplied evidence. Do not invent names, numbers, or sources. Distinguish facts from inference and state clearly what the evidence does not establish.";
    const r=await env.AI.run("@cf/meta/llama-3.1-8b-instruct",{messages:[{role:"system",content:system},{role:"user",content:"Question: "+question+"\nEvidence: "+evidenceText}],max_tokens:1200,temperature:0.1});
    const answer=String((r as any)?.response||"").trim();
    if(answer && languageConsistent(answer,locale))return{status:independentSourceCount(evidence)>=2&&!answerHasUnsupportedSpecifics(answer,evidence,question)?"verified" as const:"mixed" as const,answer,sources:evidence.flatMap(x=>x.sources)};
    await recordAiFailure(env,"Workers AI answer",answer?"language_mismatch":"empty_response");
  }catch(error){await recordAiFailure(env,"Workers AI answer",aiFailureDetail(error));}
  return{status:"mixed" as const,answer:locale==="ar"?"وجدت أدلة يمكن الرجوع إليها، لكن تعذر تشغيل صياغة BAYAN الذكية الآن. راجع الأدلة الظاهرة قبل اتخاذ قرار.":"Relevant evidence was found, but BAYAN's drafting model is temporarily unavailable. Review the evidence before acting.",sources:evidence.flatMap(x=>x.sources),reason:"ai_unavailable" as const}
}