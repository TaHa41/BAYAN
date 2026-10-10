import type{Env,Locale,Source}from"../types";import{json,locale,body}from"../http";import{search,isolateArticleSubject}from"../services/search";import{weather,fx,gold,prayerTimes}from"../services/live";import{news,findRelatedImage}from"../services/news";import{ask}from"../services/ai";import{addContribution,getArticle,listArticles,reviewContribution,track,analyticsStats,publishVerifiedResearch}from"../db";import{clean,manager,visitorId}from"../security";import{notify}from"../services/telegram";import{sectionBySlug}from"../sections";import{wisdomFor}from"../wisdom";import{selfHeal,aiRepairRequest}from"../services/repair";const bounded=<T,>(promise:Promise<T>,ms:number):Promise<T>=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error("operation_timeout")),ms);promise.then(value=>{clearTimeout(timer);resolve(value)},error=>{clearTimeout(timer);reject(error)})});const sourceDescription=async(url:string,lang:"ar"|"en")=>{try{const u=new URL(url),hosts=["aljazeera.net","aljazeera.com","bbc.com","bbc.co.uk","france24.com","dw.com","apnews.com","reuters.com","theguardian.com","skynewsarabia.com","independentarabia.com","aawsat.com","news.google.com","wikipedia.org","wikidata.org","openalex.org","who.int","un.org","worldbank.org","imf.org","ourworldindata.org","britannica.com","nature.com","science.org"];if(u.protocol!=="https:"||!hosts.some(host=>u.hostname===host||u.hostname.endsWith("."+host)))return"";const r=await fetch(u.toString(),{signal:AbortSignal.timeout(3500),headers:{accept:"text/html"}});if(!r.ok)return"";const html=(await r.text()).slice(0,600000);const raw=html.match(/<meta[^>]+(?:property|name)=["\x27](?:og:description|description)["\x27][^>]+content=["\x27]([^"\x27]+)["\x27]/i)?.[1]||html.match(/<meta[^>]+content=["\x27]([^"\x27]+)["\x27][^>]+(?:property|name)=["\x27](?:og:description|description)["\x27]/i)?.[1]||"";const value=String(raw).replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim().slice(0,1500);const arabic=/[\u0600-\u06ff]/.test(value);return value&&(lang==="ar"?arabic:!arabic)?value:""}catch{return""}};
const articleHasNamesakeContamination=(title:string,bodyText:string,sources:any[])=>{
 const normalized=(value:string)=>String(value||"").normalize("NFKC").toLowerCase().replace(/[\u064B-\u065F\u0670]/g,"").replace(/[^\p{L}\p{N}]+/gu," ").trim();
 const subject=normalized(title);
 const arabicName=/^[\u0600-\u06FF]+(?:\s+[\u0600-\u06FF]+){1,3}$/.test(String(title||"").trim())&&!/(?:ما هو|ما هي|تاريخ|علوم|تقنية|اقتصاد|سياسة|رياضة|ذكاء اصطناعي|تغير المناخ|الفضاء|الطاقة|الصحة|السياحة|البرمجة|مصر|العالم العربي)/.test(title);
 if(!arabicName||!subject)return false;
 const wikipediaNamesakes=(Array.isArray(sources)?sources:[]).filter(source=>{
  const sourceTitle=normalized(String(source?.title||""));
  const publisher=String(source?.publisher||"");
  return /wikipedia|ويكيبيديا/i.test(publisher)&&sourceTitle.startsWith(subject+" ")&&!/(?:تحدث|يتحدث|قال|يقول|انتقال|مباراة|هدف|إحصائيات|stats|news|profile|statistics)/i.test(String(source?.title||""));
 });
 const bodyHasDisambiguation=/(?:صفحة توضيح|محمد صلاح\s*\(توضيح\)|قد يشير إلى عدة أشخاص|قد تشير إلى عدة أشخاص|people with the name|disambiguation)/i.test(String(bodyText||""));
 return bodyHasDisambiguation||wikipediaNamesakes.length>=2;
};
const articlePrompt=(title:string,lang:Locale)=>lang==="ar"?"اكتب مقالًا معرفيًا تحليليًا أصليًا وشاملًا باللغة العربية الفصحى عن الموضوع التالي: "+title+"\nاكتب مقالًا مترابطًا من 700 إلى 1000 كلمة عندما تسمح الأدلة، ولا تكرر الفكرة بصيغ مختلفة. قبل الكتابة رتّب الأدلة في مخطط، ثم اكتب مقدمة واحدة، وأقسامًا مستقلة لكل فكرة، وانتقالات منطقية بينها، وخاتمة لا تعيد المقدمة. استخدم عناوين Markdown واضحة (##) تشمل: خلاصة مركزة، الخلفية والسياق، شرح التفاصيل أو التسلسل الزمني عند ملاءمته، ما تؤكده المصادر، مقارنة نقاط الاتفاق والاختلاف بين المصادر، التأثيرات والأهمية، ما لا نعرفه أو ما يزال محل خلاف، وخلاصة عملية. اربط كل ادعاء مهم بالأدلة المقدمة ولا تعرض الاستنتاج كأنه حقيقة مؤكدة. لا تكرر الفكرة أو الجملة أو الفقرة بصياغة أخرى، ولا تخلط بين أشخاص أو أحداث متشابهة. لا تنسخ المصادر حرفيًا، ولا تخترع أرقامًا أو أسماء أو تواريخ أو اقتباسات أو روابط. إذا كانت الأدلة لا تدعم مقالًا طويلًا، اذكر النواقص بوضوح ولا تملأها بالتخمين.":"Write a comprehensive original knowledge article in English about: "+title+"\nAim for a coherent 700–1000-word article when evidence supports it. Plan the argument before writing. Use one introduction, distinct sections with logical transitions, and a conclusion that adds no repeated summary. Use Markdown (##) subheadings covering: concise overview, background and context, detailed explanation or timeline where appropriate, what sources confirm, agreement and disagreement across sources, implications and significance, what remains unknown or disputed, and a practical conclusion. Tie important claims to supplied evidence; never present inference as confirmed fact. Do not repeat the same claim in different wording, merge unrelated people/events, copy source text verbatim, or invent figures, names, dates, quotations, or links. If evidence cannot support a long article, state the gaps clearly instead of filling them with guesses.";
const normalizeArticleBody=(value:string)=>{
 const seen=new Set<string>();
 const paragraphs=String(value||"").replace(/\r/g,"").split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean);
 const output:string[]=[];
 const key=(s:string)=>s.normalize("NFKC").toLowerCase().replace(/[\u064B-\u065F\u0670]/g,"").replace(/[^\p{L}\p{N}]+/gu," ").trim();
 for(const paragraph of paragraphs){
  if(/^#{1,4}\s/.test(paragraph)||/^([-*+] |\d+[.)] )/.test(paragraph)){output.push(paragraph);continue;}
  const normalized=key(paragraph);
  if(normalized.length<12||seen.has(normalized))continue;
  const words=new Set(normalized.split(/\s+/).filter(w=>w.length>2));
  const nearDuplicate=output.some(existing=>{
   if(/^#{1,4}\s/.test(existing)||/^([-*+] |\d+[.)] )/.test(existing))return false;
   const prior=key(existing),priorWords=new Set(prior.split(/\s+/).filter(w=>w.length>2));
   if(Math.min(words.size,priorWords.size)<8)return false;
   let overlap=0;for(const word of words)if(priorWords.has(word))overlap++;
   return overlap/Math.max(1,Math.min(words.size,priorWords.size))>=0.88;
  });
  if(nearDuplicate)continue;
  seen.add(normalized);output.push(paragraph);
 }
 return output.join("\n\n").trim();
};
const articleEvidenceQuality=(sources:any[])=>{
 const rows=Array.isArray(sources)?sources:[];
 const hosts=new Set<string>(),publishers=new Set<string>();
 for(const source of rows){try{const url=new URL(String(source?.url||""));if(url.protocol!=="https:")continue;hosts.add(url.hostname.toLowerCase().replace(/^www\./,""));const publisher=String(source?.publisher||"").trim().toLowerCase();if(publisher)publishers.add(publisher);}catch{}}
 return hosts.size>=2&&publishers.size>=2;
};
const articleBodyQuality=(value:string)=>{
 const body=normalizeArticleBody(value);
 const headings=(body.match(/^#{1,3}\s+.+$/gm)||[]).length;
 const paragraphs=body.split(/\n\s*\n/).map(p=>p.trim()).filter(p=>p.length>=65&&!/^#{1,4}\s/.test(p)&&!/^([-*+] |\d+[.)] )/.test(p));
 const unique=new Set(paragraphs.map(p=>p.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").trim()));
 return {body,ok:body.length>=1800&&headings>=4&&paragraphs.length>=5&&unique.size>=5};
};
const identityNormalized=(value:string)=>String(value||"").normalize("NFKC").toLowerCase().replace(/[\u064B-\u065F\u0670]/g,"").replace(/[^\p{L}\p{N}]+/gu," ").replace(/\s+/g," ").trim();
const hasMixedPersonIdentities=(title:string,body:string)=>{
 const name=identityNormalized(title),text=identityNormalized(body),words=name.split(" ").filter(Boolean);
 if(words.length<2||words.length>4)return false;
 const explicit=/(?:صفحة توضيح|قد يشير إلى عدة أشخاص|قد تشير إلى عدة أشخاص|people with the name|disambiguation)/i.test(String(body||""));
 const variants=new Set<string>(),ignored=new Set(["محمد","صلاح","حامد","محروس","غالي","لاعب","اللاعب","من","هو","هي","الذي","التي","توضيح","في","على","عن","إلى","الى","مع","ثم","بدأ","بدأت","انتقل","انتقلت","حقق","يعد","كان","كانت","يلعب","لعب","حصل","فاز","شار","انضم","سجل","قاد","قائد","مصري","المصري","كرة","قدم","نادي","الفريق","منتخب","الموسم","عام","حيث","كما","بعد","قبل","وهو","وهي","له","لها","ولد","مواليد","أحد","أبرز","مسيرته"]);
 let pos=text.indexOf(name);
 while(pos>=0){
  const suffix=text.slice(pos+name.length).trim().split(" ")[0]||"";
  if(suffix&&!ignored.has(suffix)&&/^[\u0600-\u06FF]{3,}$/.test(suffix))variants.add(suffix);
  pos=text.indexOf(name,pos+name.length);
 }
 return (explicit&&variants.size>=2)||variants.size>=3;
};
const isVideoUrl=(value:string)=>{
 try{return /(^|\.)((youtube\.com)|(youtu\.be)|(vimeo\.com))$/i.test(new URL(value).hostname.replace(/^www\./i,""))||/^(www\.)?(youtube\.com|youtu\.be|vimeo\.com)$/i.test(new URL(value).hostname)}catch{return false}
};

const newsArticleEvidenceRelevant=(headline:string,candidate:any)=>{
  const stop=new Set(["the","and","for","with","from","that","this","over","after","before","about","into","amid","says","said","new","latest","today","news","على","في","من","إلى","عن","هذا","هذه","الذي","التي","مع","بعد","قبل","بين","حول","أمام","أثناء","قال","تقول","يدعو","تدعو","وصف","بـ"]);
  const tokens=Array.from(new Set(String(headline||"").normalize("NFKC").toLowerCase().replace(/[\u064B-\u065F\u0670]/g,"").replace(/[^\p{L}\p{N}]+/gu," ").split(/\s+/).map((token)=>token.length>4&&token.startsWith("ال")?token.slice(2):token).filter((token)=>token.length>2&&!stop.has(token))));
  if(!tokens.length)return false;
  const evidence=(String(candidate?.title||"")+" "+String(candidate?.summary||"")).normalize("NFKC").toLowerCase().replace(/[\u064B-\u065F\u0670]/g,"");
  const hits=tokens.filter((token)=>evidence.includes(token)).length;
  return tokens.length===1?hits===1:hits>=2&&hits/Math.min(tokens.length,5)>=0.4;
};
const articleLocaleSafe=(value:string,lang:Locale)=>{
  if(!value.trim())return false;
  if(lang==="en")return !/[\u0600-\u06ff]/.test(value);
  if(!/[\u0600-\u06ff]/.test(value))return false;
  const sentences=value.split(/[\n.!؟?]+/).map(part=>part.trim()).filter(Boolean);
  return sentences.every(part=>/[\u0600-\u06ff]/.test(part)||!/[A-Za-z]{5,}/.test(part));
};
const sourceArticleText=async(url:string,lang:"ar"|"en")=>{
  try{
    const u=new URL(url),hosts=["aljazeera.net","aljazeera.com","bbc.com","bbc.co.uk","france24.com","dw.com","apnews.com","reuters.com","theguardian.com","skynewsarabia.com","independentarabia.com","aawsat.com","news.google.com","wikipedia.org","wikidata.org","openalex.org","who.int","un.org","worldbank.org","imf.org","ourworldindata.org","britannica.com","nature.com","science.org"];
    if(u.protocol!=="https:"||!hosts.some(host=>u.hostname===host||u.hostname.endsWith("."+host)))return "";
    const r=await fetch(u.toString(),{signal:AbortSignal.timeout(4500),headers:{accept:"text/html"}});
    if(!r.ok)return "";
    let html=(await r.text()).slice(0,800000);
    html=html.replace(/<(script|style|nav|header|footer|aside|form)\b[\s\S]*?<\/\1>/gi," ");
    const main=html.match(/<(?:article|main)\b[^>]*>([\s\S]*?)<\/(?:article|main)>/i)?.[1]||html;
    const paragraphs=[...main.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(m=>String(m[1]||"").replace(/<[^>]+>/g," ").replace(/&nbsp;/gi," ").replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/\s+/g," ").trim()).filter(p=>p.length>=70);
    const relevant=paragraphs.filter(p=>lang==="ar"?/[\u0600-\u06ff]/.test(p):! /[\u0600-\u06ff]/.test(p));
    return relevant.slice(0,10).join("\n\n").slice(0,7000);
  }catch{return ""}
};;const sectionForOpenedStory=(title:string,summary:string)=>{
 const s=(title+" "+summary).toLowerCase();
 if(/football|soccer|match|league|championship|tournament|goal|player|coach|رياضة|مباراة|الدوري|بطولة|منتخب|لاعب|مدرب|هدف/i.test(s))return "sports";
 if(/health|medical|medicine|hospital|disease|vaccine|doctor|صحة|طب|مستشفى|مرض|لقاح|طبيب|علاج/i.test(s))return "health";
 if(/technology|artificial intelligence|software|cyber|chip|robot|تقنية|ذكاء اصطناعي|برمجيات|رقائق|روبوت|سيبراني/i.test(s))return "technology";
 if(/economy|economic|market|stock|inflation|currency|bank|trade|اقتصاد|اقتصادي|سوق|أسهم|تضخم|عملة|بنك|تجارة|ذهب|دولار/i.test(s))return "economy";
 if(/election|president|parliament|government|minister|policy|politics|انتخابات|رئيس|برلمان|حكومة|وزير|سياسة|قرار حكومي/i.test(s))return "politics";
 if(/science|scientific|research|discovery|space|nasa|astronomy|planet|universe|علم|بحث علمي|اكتشاف|فضاء|فلك|كوكب|الكون/i.test(s))return "science";
 if(/history|historical|heritage|archaeology|تاريخ|تاريخي|تراث|آثار|حضارة/i.test(s))return "history";
 if(/film|movie|music|actor|actress|celebrity|artist|الفن|فيلم|سينما|موسيقى|ممثل|ممثلة|فنان|مشهور/i.test(s))return "art";
 if(/travel|tourism|airport|flight|hotel|destination|سفر|سياحة|مطار|رحلة|فندق|وجهة/i.test(s))return "travel";
 if(/people|biography|profile|born|career|من هو|من هي|سيرة|مسيرة|ولد|ولدت|شخصية/i.test(s))return "people";
 return "world";
};
const persistOpenedNewsArticle=async(env:Env,article:{title:string;summary:string;body:string;sources:Source[];image?:string|null;publishedAt?:string;status?:string},lang:Locale)=>{
 try{
  const title=String(article.title||"").trim().slice(0,300),summary=String(article.summary||"").trim().slice(0,500),bodyText=String(article.body||"").trim();
  if(article.status!=="verified"||title.length<8||summary.length<40||bodyText.length<1800||!Array.isArray(article.sources)||hasMixedPersonIdentities(title,bodyText))return null;
  const normalizedBody=articleBodyQuality(bodyText);
  if(!normalizedBody.ok)return null;
  const hasArabic=(v:string)=>/[\u0600-\u06ff]/.test(v);
  if(lang==="ar"?(!hasArabic(title)||!hasArabic(summary)||!hasArabic(bodyText)): (hasArabic(title)||hasArabic(summary)||hasArabic(bodyText)))return null;
  const sources=article.sources.filter(s=>{try{return new URL(String(s.url||"")).protocol==="https:"}catch{return false}});
  const hosts=new Set(sources.map(s=>{try{return new URL(String(s.url)).hostname.toLowerCase().replace(/^www\./,"")}catch{return""}}).filter(Boolean));
  const publishers=new Set(sources.map(s=>String(s.publisher||"").trim().toLowerCase()).filter(Boolean));
  if(hosts.size<2||publishers.size<2)return null;
  let image=String(article.image||"").trim();
  const imageFromEvidence=sources.some(s=>String(s.imageUrl||"").trim()===image);
  if(!/^https:\/\//i.test(image)||!imageFromEvidence){
   const firstSource=sources.find(s=>/^https:\/\//i.test(String(s.url||"")));
   image=await bounded(findRelatedImage(title,firstSource?.url),3500).catch(()=>undefined)||"";
   if(!/^https:\/\//i.test(image))image=await bounded(findRelatedImage(title+" "+summary.slice(0,180)),3500).catch(()=>undefined)||"";
  }
  if(!/^https:\/\//i.test(image))return null;
  return await publishVerifiedResearch(env,{title,summary,body:normalizedBody.body,section:sectionForOpenedStory(title,summary),language:lang,sources,imageUrl:image,imageAlt:title});
 }catch{return null}
};
export async function api(request:Request,env:Env){const u=new URL(request.url),lang=locale(request),ownerExcluded=(request.headers.get("cookie")||"").split(";").some(part=>part.trim()==="bayan_exclude_analytics=1"),vid=ownerExcluded?"owner-excluded":await visitorId(request);if(u.pathname==="/api/health")return json({ok:true,service:"BAYAN",version:"1.2.0",database:!!env.DB});if(u.pathname==="/api/features")return json({version:"1.2.0",evidenceFirst:true,locales:["ar","en"],capabilities:["search","news","live-data","ask-bayan","contribute","saved","admin","self-healing","rotating-wisdom","private-analytics","content-management"]});if(u.pathname==="/api/search"){const q=clean(u.searchParams.get("q")||"",500);if(!q)return json({error:"query_required"},400);let r:any;try{r=await search(env,q,lang)}catch{r={query:q,locale:lang,results:[],providers:[],providerAttempted:["BAYAN Knowledge Base","Wikipedia","Wikidata","GDELT","OpenAlex","Cloudflare AI Search","DuckDuckGo"],status:"insufficient",message:lang==="ar"?"لم تُرجع المسارات الأولى نتائج؛ يجري استخدام مسارات البحث الاحتياطية.":"Primary search paths returned no results; fallback search paths will be used."}}try{await track(env,vid,"search","/search",lang)}catch{}return json(r)}if(u.pathname==="/api/news/article"){
  if(request.method!=="GET")return json({error:"method_not_allowed"},405);
  const title=clean(u.searchParams.get("title")||"",500);let image=clean(u.searchParams.get("image")||"",2000);const summary=clean(u.searchParams.get("summary")||"",1500),storyUrl=clean(u.searchParams.get("url")||"",2000),publisher=clean(u.searchParams.get("publisher")||"",200),publishedAt=clean(u.searchParams.get("publishedAt")||"",100);
  if(!title)return json({error:"title_required"},400);
  if(hasMixedPersonIdentities(title,summary))return json({error:"article_identity_ambiguous",status:"insufficient",message:lang==="ar"?"نتائج هذا الاسم تجمع بين أشخاص مختلفين؛ لم نعرضها كسيرة واحدة. أضف معلومة مميزة مثل المهنة أو النادي لتحديد الشخص المقصود.":"These results mix people with the same name, so they were not shown as one biography. Add a distinguishing detail such as profession or club."},422);
  if(isVideoUrl(storyUrl))return json({error:"video_source_not_article",kind:"video",message:lang==="ar"?"هذا رابط فيديو، وليس مقالًا مكتوبًا. افتح الفيديو كمصدر منفصل، ولا تُنشئ منه مقالًا دون نص موثوق ومصادر مكتوبة مستقلة.":"This is a video, not a written article. Open it as a separate source; do not draft an article without a reliable transcript and independent written sources."},422);
  try{
    let found:any={results:[],status:"insufficient"};
    try{found=await bounded(search(env,title,lang),7000)}catch{}
    found.results=isolateArticleSubject(title,(Array.isArray(found.results)?found.results:[]).filter((candidate:any)=>newsArticleEvidenceRelevant(title,candidate)&&!hasMixedPersonIdentities(title,String(candidate.summary||""))&&!isVideoUrl(String(candidate.url||candidate.sources?.[0]?.url||""))) as any);
    if(!found.results.length&&(summary||storyUrl)){const extracted=storyUrl?await bounded(sourceArticleText(storyUrl,lang),5000).catch(()=> ""):"";const description=summary||await bounded(sourceDescription(storyUrl,lang),3500).catch(()=> "")||title;const articleSummary=(lang==="ar"?/[\u0600-\u06ff]/.test(description):!/[\u0600-\u06ff]/.test(description))?description:title;if(!image)image=await bounded(findRelatedImage(title,storyUrl||undefined,summary),3500).catch(()=>undefined)||"";const evidenceText=(lang==="ar"?/[\u0600-\u06ff]/.test(extracted):!/[\u0600-\u06ff]/.test(extracted))?extracted:articleSummary;const safeUrl=storyUrl.startsWith("https://")?storyUrl:"";const sources=safeUrl?[{title,publisher:publisher||(lang==="ar"?"مصدر إخباري":"News source"),url:safeUrl,publishedAt,imageUrl:image||undefined} as Source]:[];let generated:any={};try{generated=await bounded(ask(env,articlePrompt(title,lang),lang,[{title,summary:evidenceText,section:"news",kind:"web",evidence:"mixed",sources} as any]),7500)}catch{}const rawGeneratedBody=String(generated.answer||"").trim();const quality=articleBodyQuality(rawGeneratedBody);let generatedBody=quality.body;let hasFullAnalysis=quality.ok&&generated.status==="verified"&&new Set(sources.map((source:any)=>String(source.publisher||"").trim().toLowerCase()).filter(Boolean)).size>=2;if(!hasFullAnalysis&&generatedBody.length>0){try{const stricter=await bounded(ask(env,articlePrompt(title,lang)+"\n\n"+(lang==="ar"?"مراجعة تحريرية إلزامية: احذف التكرار، تأكد من ترابط الفقرات، واستخدم أربعة عناوين فرعية على الأقل.":"Mandatory editorial pass: remove repetition, ensure logical transitions, and use at least four subheadings."),lang,[{title,summary:evidenceText,section:"news",kind:"web",evidence:"mixed",sources} as any]),6500);const retry=articleBodyQuality(String(stricter.answer||""));if(retry.ok&&stricter.status==="verified"&&new Set(sources.map((source:any)=>String(source.publisher||"").trim().toLowerCase()).filter(Boolean)).size>=2){generatedBody=retry.body;hasFullAnalysis=true;generated= stricter as any;}}catch{}}if(!hasFullAnalysis)return json({error:"article_evidence_insufficient",status:"insufficient",message:lang==="ar"?"لم تتوفر مصادر مستقلة ونص موثوق كافٍ لإعداد مقال كامل؛ لم نعرض ملخص المصدر على أنه مقال.":"There is not enough independent evidence and source text for a complete article; the source snippet was not presented as an article."},422);const articleBody=generatedBody;const article={title,summary:articleSummary,body:articleBody,sources,image:image||null,status:generated.status,providerCount:sources.length?1:0,publishedAt};const savedSlug=await persistOpenedNewsArticle(env,article,lang);return json({ok:true,article:{...article,section:sectionForOpenedStory(title,articleSummary),savedSlug}})}
    if(!found.results.length){
      const live=await bounded(news(env,lang),7000);
      const story=live.items?.find((x:any)=>String(x.title).trim()===title.trim())||live.items?.find((x:any)=>String(x.title).includes(title.slice(0,80)));
      if(!story)return json({error:"article_source_unavailable",status:"insufficient"},503);
      if(!image)image=story.imageUrl||await bounded(findRelatedImage(story.title||title),3500).catch(()=>undefined)||"";
      const article={title:story.title,summary:story.summary||"",body:story.summary||story.title,sources:story.sources||[],image:image||null,status:"source_only",providerCount:1,publishedAt:story.publishedAt};const savedSlug=await persistOpenedNewsArticle(env,article,lang);return json({ok:true,article:{...article,section:sectionForOpenedStory(story.title,story.summary||""),savedSlug}});
    }
    let generated:{status:string;answer?:string;sources?:Source[]}={status:"mixed"};
    try{generated=await bounded(ask(env,articlePrompt(title,lang),lang,found.results),8000)}catch{}
    const evidenceBody=String(found.results[0]?.summary||"").trim();
    const evidenceSources=found.results.flatMap((x:any)=>x.sources||[]).filter(Boolean);
    const independentPublisherCount=new Set(evidenceSources.map((source:any)=>String(source.publisher||"").trim().toLowerCase()).filter(Boolean)).size;
    const rawGeneratedBody=String(generated.answer||"").trim();
    const quality=articleBodyQuality(rawGeneratedBody);
    let generatedBody=quality.body;
    let hasFullAnalysis=quality.ok&&generated.status==="verified"&&independentPublisherCount>=2;
    if(!hasFullAnalysis&&generatedBody.length>0){try{const stricter=await bounded(ask(env,articlePrompt(title,lang)+"\n\n"+(lang==="ar"?"مراجعة تحريرية إلزامية: احذف التكرار، تأكد من ترابط الفقرات، واستخدم أربعة عناوين فرعية على الأقل.":"Mandatory editorial pass: remove repetition, ensure logical transitions, and use at least four subheadings."),lang,found.results),6500);const retry=articleBodyQuality(String(stricter.answer||""));if(retry.ok&&stricter.status==="verified"&&independentPublisherCount>=2){generatedBody=retry.body;hasFullAnalysis=true;generated=stricter as any;}}catch{}}
    if(!hasFullAnalysis)return json({error:"article_evidence_insufficient",status:"insufficient",message:lang==="ar"?"لم يجتز المقال فحص الاكتمال أو لم تتوفر مصادر مستقلة كافية؛ لم نعرض نصًا ناقصًا كمقال كامل.":"The article did not pass completeness checks or lacked independent sources; incomplete text was not shown as a full article."},422);
    const articleBody=generatedBody;
    const sources=evidenceSources.slice(0,12);const exactSubject=found.results.find((x:any)=>identityNormalized(String(x.title||""))===identityNormalized(title));if(!image)image=exactSubject?.imageUrl||exactSubject?.sources?.find((source:any)=>/^https:\/\//i.test(String(source.imageUrl||"")) )?.imageUrl||found.results.find((x:any)=>/^https:\/\//i.test(String(x.imageUrl||"")) )?.imageUrl||sources.find((source:any)=>/^https:\/\//i.test(String(source.imageUrl||"")) )?.imageUrl||await bounded(findRelatedImage(title,exactSubject?.url||exactSubject?.sources?.[0]?.url,found.results[0]?.summary||""),3500).catch(()=>undefined)||"";
    const article={title,summary:found.results[0]?.summary||"",body:articleBody,sources,image:image||null,status:hasFullAnalysis?generated.status:"source_only",providerCount:new Set(sources.map((s:any)=>s.publisher).filter(Boolean)).size};const savedSlug=await persistOpenedNewsArticle(env,article,lang);return json({ok:true,article:{...article,section:sectionForOpenedStory(title,article.summary),savedSlug}});
  }catch(error){await track(env,vid,"news_article_error","/news",lang);return json({error:"news_article_failed",status:"unavailable"},502)}
}if(u.pathname==="/api/news")return json(await news(env,lang),200,"public, max-age=45, stale-while-revalidate=180");if(u.pathname==="/api/image"){const q=clean(u.searchParams.get("q")||"",500);if(!q)return json({error:"query_required"},400);return json({ok:true,imageUrl:await findRelatedImage(q)});}if(u.pathname==="/api/wisdom"){const section=clean(u.searchParams.get("section")||"world",80);if(!sectionBySlug(section))return json({error:"invalid_section"},400);return json({section,wisdom:wisdomFor(section,lang)});}if(u.pathname==="/api/section"){const section=clean(u.searchParams.get("section")||"",80);if(!section||!sectionBySlug(section))return json({error:"invalid_section"},400);if(section==="news"){const live=await news(env,lang);const items=(live.items||[]).map((story:any)=>({...story,section:"news",kind:"news",body:String(story.summary||story.title||""),sources:[]}));return json({section,items})}let items=await listArticles(env,section,lang,24);
const hasArabic=(value:unknown)=>/[\u0600-\u06ff]/.test(String(value||""));
const localeSafeItem=(x:any)=>{const title=String(x?.title||""),summary=String(x?.summary||""),bodyText=String(x?.body||"");return lang==="ar"?hasArabic(title)&&(!summary||hasArabic(summary))&&(!bodyText||hasArabic(bodyText)):!hasArabic(title)&&!hasArabic(summary)&&!hasArabic(bodyText);};
const sectionPatterns:Record<string,RegExp>={
 science:/(science|scientific|space|nasa|physics|chemistry|biology|علم|فضاء|ناسا|فيزياء|كيمياء|أحياء|اكتشاف)/i,
 technology:/(technology|artificial intelligence|software|computing|cyber|تقنية|تكنولوجيا|ذكاء اصطناعي|برمج|حوسبة|أمن المعلومات)/i,
 economy:/(econom|inflation|market|finance|currency|bank|trade|gdp|اقتصاد|تضخم|أسواق|سوق|مال|عملة|بنك|تجارة|ناتج|بطالة)/i,
 politics:/(politic|government|election|parliament|constitution|diplomac|president|minister|policy|سياس|حكومة|انتخابات|برلمان|دستور|دبلوماس|رئيس|وزير|سياسة|مؤسسات الحكم)/i,
 health:/(health|medical|medicine|disease|hospital|drug|public health|صحة|طب|مرض|طبي|مستشفى|دواء|علاج|وقاية)/i,
 history:/(history|historical|civilization|ancient|تاريخ|حضارة|تاريخي|قديم|آثار)/i,
 people:/(biograph|writer|author|novelist|player|scientist|president|poet|artist|inventor|actor|شخصية|سيرة|كاتب|روائي|لاعب|عالم|شاعر|فنان|مؤلف|أديب|رئيس|ممثل|مخترع|شكسبير|محفوظ)/i,
 sports:/(sport|football|soccer|basketball|tennis|league|championship|match|athlete|رياضة|كرة|دوري|بطولة|مباراة|لاعب|سوكر)/i,
 travel:/(travel|tourism|destination|airport|hotel|visa|trip|سفر|سياحة|وجهة|مطار|فندق|تأشيرة|رحلة|سياحي)/i,
 art:/(\barts?\b|film|cinema|music|theatre|theater|song|literature|museum|فن|سينما|موسيقى|مسرح|فيلم|أغنية|أدب|ثقافة|فنان)/i,
 trends:/(trend|viral|popular|social media|survey|poll|data|اتجاه|ترند|متداول|رائج|استطلاع|بيانات|شبكات اجتماعية)/i,
 egypt:/(egypt|egyptian|cairo|alexandria|nile|aswan|luxor|suez|sinai|red sea|مصر|المصري|القاهرة|الإسكندرية|النيل|أسوان|الأقصر|السويس|سيناء|البحر الأحمر)/i,
 arab:/(arab|arabic|arab league|العرب|عربي|العالم العربي|جامعة الدول العربية)/i,
 world:/(world|global|international|united nations|international relations|global risk|عالمي|دولي|العالم|الأمم المتحدة|علاقات دولية|حرب|نزاع|داعش|تنظيم الدولة|سوريا|العراق|أوكرانيا|غزة|إيران|اليمن|الحوثيين|كييف|دولية)/i
};
const sectionTerms:Record<string,string[]>={
 science:["science","scientific","space","nasa","physics","chemistry","biology","astronomy","discovery","discoveries","علم","علوم","العلوم","علمي","علمية","فضاء","الفضاء","ناسا","فيزياء","كيمياء","أحياء","فلك","اكتشاف","اكتشافات"],
 technology:["technology","technologies","artificial","intelligence","software","computing","cybersecurity","computer","تقنية","تقنيات","تكنولوجيا","الذكاء","اصطناعي","برمجيات","حوسبة","حاسوب","سيبراني","معلومات"],
 economy:["economy","economic","inflation","market","markets","finance","financial","currency","bank","trade","gdp","unemployment","اقتصاد","الاقتصاد","اقتصادي","الاقتصادي","اقتصادية","الاقتصادية","تضخم","التضخم","سوق","السوق","أسواق","تمويل","التمويل","مالي","المالي","مالية","المالية","عملة","العملة","بنك","البنوك","تجارة","التجارة","ناتج","بطالة","البطالة"],
 politics:["politics","political","government","election","elections","parliament","constitution","diplomacy","president","minister","policy","سياسة","السياسة","سياسي","سياسية","حكومة","الحكومة","انتخابات","الانتخابات","برلمان","البرلمان","دستور","دبلوماسية","رئيس","وزير"],
 health:["health","medical","medicine","disease","hospital","drug","treatment","prevention","صحة","الصحة","صحي","الصحي","صحية","الصحية","معلومات","المعلومات","طب","الطب","طبي","طبية","الطبية","مرض","المرض","مستشفى","دواء","علاج","وقاية","الرعاية","الدليل","الأدلة"],
 history:["history","historical","civilization","civilizations","ancient","archaeology","تاريخ","التاريخ","تاريخي","تاريخية","حضارة","حضارات","آثار","قديم","قديمة","المؤرخ","المؤرخون","مؤرخ","مؤرخون","مصدر","مصادر","المصدر","المصادر","أولية","الأولية","وثيقة","وثائق","السياق","سياق","أحداث","الأحداث","أرشيف","الأرشيف"],
 people:["biography","biographical","writer","author","novelist","player","scientist","president","poet","artist","inventor","actor","personality","life","legacy","career","works","شخصية","الشخصية","شخصيات","سيرة","السيرة","كاتب","الكاتب","روائي","الروائية","روائية","لاعب","عالم","شاعر","فنان","الفنان","الفنانة","مؤلف","أديب","رئيس","ممثل","مخترع","حياة","حياته","حياتها","مسيرة","مسيرته","مسيرتها","أعمال","أعماله","أعمالها","النشأة","نجيب","محفوظ","مغني","مغنية","مطرب","مطربة"],
 sports:["sport","sports","football","soccer","basketball","tennis","league","championship","match","athlete","رياضة","رياضي","كرة","دوري","بطولة","مباراة","لاعب","فريق"],
 travel:["travel","tourism","destination","airport","hotel","visa","trip","سفر","السفر","سياحة","السياحة","سياحي","السياحي","سياحية","السياحية","وجهة","الوجهة","وجهات","الوجهات","مطار","المطار","فندق","الفندق","فنادق","الفنادق","تأشيرة","التأشيرة","تأشيرات","رحلة","رحلات"],
 art:["art","arts","film","cinema","music","theatre","theater","song","literature","museum","فن","الفن","سينما","السينما","موسيقى","الموسيقى","مسرح","المسرح","فيلم","أغنية","أغاني","غناء","مغني","مغنية","مطرب","مطربة","ممثلة","فنان","الفنان","الفنانة","فنانين","أدب","الأدب","ثقافة","الثقافة"],
 trends:["trend","trends","viral","popular","social","media","survey","poll","data","اتجاه","اتجاهات","ترند","متداول","رائج","استطلاع","استطلاعات","بيانات","اجتماعي","اجتماعية","التواصل","رأي","آراء"],
 egypt:["egypt","egyptian","cairo","alexandria","nile","aswan","luxor","suez","sinai","مصر","المصري","المصرية","القاهرة","الإسكندرية","النيل","أسوان","الأقصر","السويس","سيناء","البحر","الأحمر"],
 arab:["arab","arabic","arabian","العرب","عربي","العربية","عربيّة","الجامعة","الدول"],
 world:["world","global","international","united","nations","war","conflict","climate","supply","chain","globalization","worldwide","عالمي","عالمية","دولي","دولية","العالم","الأمم","المتحدة","علاقات","حرب","نزاع","سوريا","العراق","أوكرانيا","غزة","إيران","اليمن","داعش","تنظيم","الدولة","الإرهاب","الإرهابي","إقليمية","دول","المناخ","المناخي","المناخية","التغير","سلاسل","الإمداد","التوريد","الشحن","الموانئ"]
};
const sectionRelevant=(x:any)=>{
 const title=String(x?.title||""),summary=String(x?.summary||"");
 const text=title+" "+summary;
 if(section==="sports"&&/(video game|لعبة فيديو|ألعاب فيديو)/i.test(text))return false;
 const terms=sectionTerms[section],pattern=sectionPatterns[section];
 if(!terms)return !pattern||pattern.test(text);
 const words=(value:string)=>new Set(value.normalize("NFKC").toLowerCase().replace(/[\u064B-\u065F\u0670]/g,"").split(/[^\p{L}\p{N}]+/u).filter(Boolean));
 const titleWords=words(title),summaryWords=words(summary);
 if(terms.some(term=>titleWords.has(term)))return true;
 return terms.filter(term=>summaryWords.has(term)).length>=2;
};
items=items.filter((x:any)=>sectionRelevant(x)&&(x.kind==="evidence"||(articleBodyQuality(String(x.body||"")).ok&&articleEvidenceQuality(x.sources)))).filter(localeSafeItem);
const imageCandidates=items.filter((x:any)=>x.slug&&!/^https:\/\//i.test(String(x.imageUrl||""))).slice(0,3);
await Promise.all(imageCandidates.map(async(item:any)=>{try{const imageUrl=await bounded(findRelatedImage(String(item.title||"")),2000);if(imageUrl&&/^https:\/\//i.test(imageUrl)){item.imageUrl=imageUrl;item.imageAlt=String(item.title||"");await env.DB.prepare("UPDATE articles SET image_url=?,image_alt=?,updated_at=? WHERE slug=? AND language=? AND (image_url IS NULL OR trim(image_url)='')").bind(imageUrl,item.imageAlt,new Date().toISOString(),item.slug,lang).run();}}catch{}}));
items=items.filter((x:any)=>x.kind==="evidence"||/^https:\/\//i.test(String(x.imageUrl||"")));
if(items.length<2&&section!=="prices"){
 try{
  const queries:Record<string,{ar:string;en:string}>={
   science:{ar:"اكتشافات علمية وشرح مبادئ العلوم من مصادر موثوقة",en:"science discoveries and evidence-based explanations of science"},
   technology:{ar:"تقنيات الذكاء الاصطناعي والحوسبة وأمن المعلومات",en:"artificial intelligence computing and information security explained"},
   economy:{ar:"شرح التضخم والأسواق والاقتصاد من مصادر موثوقة",en:"economics inflation markets and financial systems explained"},
   politics:{ar:"الانتخابات والبرلمان والحكومة والسياسة العامة في مصر والعالم العربي",en:"politics elections parliaments and government policy in Egypt and the Arab world"},
   health:{ar:"الصحة العامة والطب المبني على الأدلة من مصادر طبية",en:"public health and evidence-based medicine from medical sources"},
   history:{ar:"أحداث تاريخية وحضارات وسياق تاريخي من مصادر موثوقة",en:"historical events civilizations and historical context from reliable sources"},
   people:{ar:"سيرة ذاتية لشخصيات عامة موثقة وحياتهم وأعمالهم",en:"biography and life stories of public figures from reliable sources"},
   sports:{ar:"كرة القدم والبطولات الرياضية والنتائج والإحصاءات",en:"football leagues sports results and competition statistics"},
   travel:{ar:"السياحة ووجهات السفر وإرشادات التأشيرات الرسمية",en:"travel destinations tourism and official visa guidance"},
   art:{ar:"السينما المصرية والموسيقى العربية والفنون التشكيلية والمسرح",en:"Egyptian cinema Arabic music visual arts and theatre"},
   trends:{ar:"ترندات مواقع التواصل الاجتماعي واستطلاعات الرأي والبيانات الاجتماعية",en:"social media trends public opinion surveys and current data"},
   egypt:{ar:"مصر: الجغرافيا والمدن ونهر النيل والمعلومات العامة",en:"Egypt geography cities the Nile and public information"},
   arab:{ar:"العالم العربي والجامعة العربية والبلدان العربية والثقافة العربية",en:"the Arab world Arab League Arab countries and Arabic culture"},
   world:{ar:"قضايا عالمية وتحولات دولية وتأثيراتها بمصادر موثوقة",en:"global issues international changes and their impacts from reliable sources"}
  };
  const meta=sectionBySlug(section)!;
  const q=queries[section]?.[lang]||(lang==="ar"?meta.descriptionAr:meta.descriptionEn);
  let found:any={results:[]};
  let cachedEvidence:any[]=[];
  try{
   const since=new Date(Date.now()-7*86400000).toISOString();
   const cached=await env.DB.prepare("SELECT results_json FROM searches WHERE language=? AND topic_section=? AND created_at>=? ORDER BY created_at DESC LIMIT 4").bind(lang,section,since).all<any>();
   const seenCached=new Set<string>();
   for(const row of cached.results||[]){
    let parsed:any[]=[];try{const value=JSON.parse(String(row.results_json||"[]"));if(Array.isArray(value))parsed=value;}catch{}
    for(const item of parsed){
     const title=String(item?.title||""),summary=String(item?.summary||"");
     const key=title.normalize("NFKC").toLowerCase().trim();
     if(!title||!summary||!key||seenCached.has(key))continue;
     const safe=lang==="ar"?hasArabic(title)&&hasArabic(summary):!hasArabic(title)&&!hasArabic(summary);
     if(!safe||!sectionRelevant(item))continue;
     seenCached.add(key);cachedEvidence.push({...item,section,kind:"evidence"});
     if(cachedEvidence.length>=8)break;
    }
    if(cachedEvidence.length>=8)break;
   }
  }catch{}
  items=[...items,...cachedEvidence];
  if(cachedEvidence.length<2){
   try{found=await bounded(search(env,q,lang),5500);}catch{found={results:[]};}
  }
  const refreshed=await listArticles(env,section,lang,24);
  const existingSlugs=new Set(items.map((x:any)=>String(x.slug||"")).filter(Boolean));
  const refreshedComplete=refreshed.filter((x:any)=>x.slug&&!existingSlugs.has(String(x.slug))&&articleBodyQuality(String(x.body||"")).ok&&localeSafeItem(x)&&sectionRelevant(x)&&/^https:\/\//i.test(String(x.imageUrl||"")));
  items=[...items,...refreshedComplete];
  const completeCount=items.filter((x:any)=>x.slug&&articleBodyQuality(String(x.body||"")).ok&&/^https:\/\//i.test(String(x.imageUrl||""))).length;
  if(completeCount<2){
   const existingTitles=new Set(items.map((x:any)=>String(x.title||"").normalize("NFKC").toLowerCase().trim()));
   const fallback=(found.results||[]).filter((x:any)=>{const title=String(x?.title||""),summary=String(x?.summary||""),body=String(x?.body||"");return title&&summary&&!existingTitles.has(title.normalize("NFKC").toLowerCase().trim())&&sectionRelevant(x)&&(lang==="ar"?hasArabic(title)&&hasArabic(summary)&&(!body||hasArabic(body)):!hasArabic(title)&&!hasArabic(summary)&&!hasArabic(body));}).slice(0,12).map((x:any)=>({...x,section:section,kind:"evidence"}));
   items=[...items,...fallback];
  }
 }catch{}
}
items=items.filter(localeSafeItem);
return json({section,items});}if(u.pathname==="/api/article"){const slug=clean(u.searchParams.get("slug")||"",200);if(!slug)return json({error:"slug_required"},400);let article=await getArticle(env,slug,lang);if(article&&hasMixedPersonIdentities(String(article.title||""),String(article.body||"")))return json({error:"article_identity_ambiguous",message:lang==="ar"?"هذا المقال يخلط بين أشخاص يحملون اسمًا متشابهًا؛ تم إيقاف عرضه حتى تُراجع الهوية والمصادر.":"This article mixes people with similar names; display is blocked until identity and sources are reviewed."},422);if(article&&!articleLocaleSafe(String(article.body||""),lang))return json({error:"article_language_mismatch",message:lang==="ar"?"هذا المقال لا يحتوي على محتوى عربي متسق بعد؛ لم نعرض نصًا بلغة أخرى.":"This article does not contain consistent English content yet; content in another language was not displayed."},422);if(article&&articleHasNamesakeContamination(String(article.title||""),String(article.body||""),article.sources||[]))return json({error:"article_subject_mismatch",message:lang==="ar"?"لم نعرض هذا الملف لأن الأدلة تجمع أشخاصًا مختلفين يحملون اسمًا متشابهًا. أعد البحث عن الشخصية المقصودة بمعلومة إضافية.":"This file was withheld because its evidence mixes different people with similar names. Search again with an additional identifying detail."},422);if(article&&!articleBodyQuality(String(article.body||"")).ok)return json({error:"article_incomplete",message:lang==="ar"?"هذا المقال لا يستوفي شروط الاكتمال والتحقق، لذلك لم نعرضه كمقال منشور.":"This article does not meet the completeness and verification requirements, so it was not shown as a published article."},422);if(article&&!articleEvidenceQuality(article.sources))return json({error:"article_evidence_insufficient",message:lang==="ar"?"هذا المقال لا يحتوي على مصدرين مستقلين كحد أدنى، لذلك لم نعرضه كمقال موثق.":"This article does not have at least two independent sources, so it was not shown as a verified article."},422);if(article&&!article.imageUrl){try{const exactSubjectSource=(article.sources||[]).find((source:any)=>identityNormalized(String(source.title||""))===identityNormalized(String(article!.title||""))&&/^https:\/\//i.test(String(source.url||"")));const imageUrl=await bounded(findRelatedImage(article!.title,exactSubjectSource?.url),3500);if(imageUrl){await env.DB.prepare("UPDATE articles SET image_url=?,image_alt=?,updated_at=? WHERE slug=? AND language=? AND (image_url IS NULL OR trim(image_url)='')").bind(imageUrl,article!.title,new Date().toISOString(),slug,lang).run();article={...article!,imageUrl,imageAlt:article!.title}}}catch{}}if(article&&!/^https:\/\//i.test(String(article.imageUrl||"")))return json({error:"article_image_unavailable",message:lang==="ar"?"تعذر العثور على صورة مناسبة موثوقة لهذا المقال، لذلك لم يتم عرض المقال دون صورة.":"A relevant image could not be verified for this article, so it was not displayed without one."},422);if(article)await track(env,vid,"article","/article/"+slug,lang);return article?json(article):json({error:"not_found"},404)}if(u.pathname==="/api/live/weather")return json(await weather(clean(u.searchParams.get("city")||"Hurghada",100)),200,"public, max-age=60, stale-while-revalidate=300");if(u.pathname==="/api/live/prayer")return json(await prayerTimes(clean(u.searchParams.get("city")||"Hurghada",100),clean(u.searchParams.get("country")||"Egypt",100)),200,"public, max-age=300, stale-while-revalidate=900");if(u.pathname==="/api/live/fx")return json(await fx(),200,"public, max-age=60, stale-while-revalidate=300");if(u.pathname==="/api/live/gold")return json(await gold(env),200,"public, max-age=60, stale-while-revalidate=300");if(u.pathname==="/api/ask"){if(request.method!=="POST")return json({error:"method_not_allowed"},405);const b=await body<{question?:string}>(request),q=clean(b?.question||"",4000);if(!q)return json({error:"question_required"},400);let s;try{s=await search(env,q,lang)}catch{return json({status:"insufficient",answer:lang==="ar"?"تعذر جمع الأدلة من مزودات البحث الآن.":"Evidence retrieval is temporarily unavailable.",evidence:[]},503)}await track(env,vid,"ask","/ask",lang);const drafted=s.answer?{status:s.answerStatus||s.status,answer:s.answer,sources:s.results.flatMap((item:any)=>item.sources||[])}:await ask(env,q,lang,s.results);return json({...drafted,evidence:s.results,searchStatus:s.status,providers:s.providers})}if(u.pathname==="/api/contribute"){if(request.method!=="POST")return json({error:"method_not_allowed"},405);const b=await body<{title?:string;body?:string;source?:string;section?:string}>(request),title=clean(b?.title||"",300),text=clean(b?.body||"",12000),source=clean(b?.source||"",1000),section=clean(b?.section||"world",80);if(title.length<4||text.length<20||!sectionBySlug(section)||section==="news")return json({error:"invalid_submission"},400);await addContribution(env,title,text,source,section,lang);const delivered=await notify(env,"BAYAN: مساهمة جديدة للمراجعة\n"+title);if(!delivered){try{await env.DB.prepare("INSERT INTO runtime_events(level,kind,message,created_at) VALUES(?,?,?,?)").bind("WARN","telegram_contribution_delivery","Contribution saved, but Telegram notification was not delivered. Check TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.",new Date().toISOString()).run()}catch{}}else{try{await env.DB.prepare("INSERT INTO runtime_events(level,kind,message,created_at) VALUES(?,?,?,?)").bind("INFO","telegram_contribution_delivery","Telegram notification delivered for contribution: "+title.slice(0,160),new Date().toISOString()).run()}catch{}}return json({ok:true,status:"PENDING",notification:delivered?"sent":"failed"})}if(u.pathname==="/api/save"){if(request.method!=="POST"&&request.method!=="DELETE")return json({error:"method_not_allowed"},405);const b=await body<{slug?:string}>(request),slug=clean(b?.slug||"",200);if(!slug)return json({error:"slug_required"},400);if(request.method==="DELETE"){await env.DB.prepare("DELETE FROM saved_articles WHERE visitor_id=? AND slug=?").bind(vid,slug).run();return json({ok:true,removed:true})}await env.DB.prepare("INSERT OR IGNORE INTO saved_articles(visitor_id,slug,created_at) VALUES(?,?,?)").bind(vid,slug,new Date().toISOString()).run();return json({ok:true})}if(u.pathname==="/api/saved"){const r=await env.DB.prepare("SELECT slug,created_at FROM saved_articles WHERE visitor_id=? ORDER BY created_at DESC LIMIT 100").bind(vid).all();return json({items:r.results||[]})}if(u.pathname==="/api/like"){if(request.method!=="POST")return json({error:"method_not_allowed"},405);const b=await body<{key?:string}>(request),key=clean(b?.key||"",500);if(!key)return json({error:"key_required"},400);const existing=await env.DB.prepare("SELECT 1 AS found FROM article_likes WHERE visitor_id=? AND item_key=? LIMIT 1").bind(vid,key).first<any>();let liked=!existing;if(existing)await env.DB.prepare("DELETE FROM article_likes WHERE visitor_id=? AND item_key=?").bind(vid,key).run();else await env.DB.prepare("INSERT OR IGNORE INTO article_likes(visitor_id,item_key,created_at) VALUES(?,?,?)").bind(vid,key,new Date().toISOString()).run();const total=await env.DB.prepare("SELECT COUNT(*) AS count FROM article_likes WHERE item_key=?").bind(key).first<any>();return json({ok:true,liked,count:Number(total?.count||0)})}if(u.pathname.startsWith("/api/admin/")){if(!manager(request,env))return json({error:"unauthorized"},401);if(u.pathname==="/api/admin/telegram-test"&&request.method==="POST"){const configured=!!env.TELEGRAM_BOT_TOKEN&&!!env.TELEGRAM_CHAT_ID;if(!configured)return json({ok:false,error:"telegram_not_configured"},503);const sent=await notify(env,"BAYAN: اختبار اتصال تيليجرام ناجح.\nوقت الاختبار: "+new Date().toISOString());return json({ok:sent,error:sent?null:"telegram_delivery_failed"},sent?200:502)}if(u.pathname==="/api/admin/repair")return json(await selfHeal(env));if(u.pathname==="/api/admin/ai-repair"&&request.method==="POST"){const b=await body<{problem?:string}>(request);return json(await aiRepairRequest(env,clean(b?.problem||"",4000)));}if(u.pathname==="/api/admin/articles"&&request.method==="GET"){const r=await env.DB.prepare("SELECT slug,language,title,summary,body,section,status,image_url,image_alt,created_at,updated_at FROM articles ORDER BY updated_at DESC LIMIT 200").all();return json({items:r.results||[]})}
if(u.pathname==="/api/admin/article/expand"&&request.method==="POST"){
  const b=await body<{slug?:string;language?:string}>(request),slug=clean(b?.slug||"",200),language=b?.language==="en"?"en":"ar";
  if(!slug)return json({error:"invalid_article"},400);
  const row=await env.DB.prepare("SELECT slug,language,title,summary,body,section,sources_json FROM articles WHERE slug=? AND language=? LIMIT 1").bind(slug,language).first<any>();
  if(!row)return json({error:"article_not_found"},404);
  let storedSources:any[]=[];try{storedSources=JSON.parse(String(row.sources_json||"[]"))}catch{}
  const discovery=await bounded(search(env,String(row.title),language,{publish:false}),7000).catch(()=>({results:[] as any[]}));
  const discovered=Array.isArray(discovery.results)?discovery.results.slice(0,5):[];
  const combinedSources=[...storedSources,...discovered.flatMap((item:any)=>item.sources||[])];
  const seenUrls=new Set<string>(),seenDomains=new Set<string>();
  const sources=combinedSources.filter((source:any)=>{
    const url=String(source.url||"");
    if(!url.startsWith("https://")||seenUrls.has(url))return false;
    let domain="";try{domain=new URL(url).hostname.replace(/^www\./,"")}catch{return false}
    if(!domain||seenDomains.has(domain))return false;
    seenUrls.add(url);seenDomains.add(domain);return true;
  }).slice(0,5);
  const domains=new Set(sources.map((source:any)=>{try{return new URL(source.url).hostname.replace(/^www\./,"")}catch{return ""}}).filter(Boolean));
  if(sources.length<2||domains.size<2)return json({ok:false,error:"insufficient_sources",message:language==="ar"?"تعذر العثور على مصدرين مستقلين صالحين لهذا المقال. لم يتم تغيير المحتوى.":"Could not find two independent valid sources for this article. No content was changed."},422);
  const sourceEvidence=await Promise.all(sources.map(async(source:any)=>{
    const url=String(source.url||"");
    const extracted=await bounded(sourceArticleText(url,language),4500).catch(()=>"");
    const description=String(source.summary||"")||await bounded(sourceDescription(url,language),2500).catch(()=>"");
    const descriptionMatches=language==="ar"?/[\u0600-\u06ff]/.test(description):! /[\u0600-\u06ff]/.test(description);
    const summary=extracted||(descriptionMatches?description:"");
    return {title:String(source.title||row.title),summary,section:String(row.section||"world"),kind:"web",evidence:"mixed",sources:[source]} as any;
  }));
  const searchEvidence=discovered.filter((item:any)=>String(item.summary||"").trim().length>=120);
  const useful=[...searchEvidence,...sourceEvidence].filter((item:any)=>String(item.summary||"").trim().length>=120).slice(0,8);
  if(useful.length<2)return json({ok:false,error:"insufficient_source_text",message:language==="ar"?"تعذر استخراج نص كافٍ من مصدرين؛ لم يتغير المقال.":"Could not extract enough text from two sources; the article was not changed."},422);
  const generated=await bounded(ask(env,articlePrompt(String(row.title),language),language,useful),10000).catch(()=>({answer:"",status:"insufficient",sources:[]}));
  const draft=String(generated.answer||"").trim();
  if(draft.length<1800||generated.status==="insufficient")return json({ok:false,error:"draft_not_substantial",message:language==="ar"?"لم ينتج الذكاء الاصطناعي مسودة كاملة موثقة. لم يتم تغيير المقال.":"The AI did not produce a substantial evidence-based draft. The article was not changed."},502);
  return json({ok:true,draft,bodyLength:draft.length,sourceCount:domains.size,status:"DRAFT_REVIEW_REQUIRED",message:language==="ar"?"هذه مسودة للمراجعة فقط؛ راجعها ثم احفظها يدويًا.":"This is a review draft only; inspect it and save manually."});
}if(u.pathname==="/api/admin/article"&&request.method==="POST"){const b=await body<{slug?:string;language?:string;title?:string;summary?:string;articleBody?:string;section?:string;status?:string;imageUrl?:string;imageAlt?:string}>(request),slug=clean(b?.slug||"",200),language=b?.language==="en"?"en":"ar",title=clean(b?.title||"",500),summary=clean(b?.summary||"",2000),articleBody=clean(b?.articleBody||"",30000),section=clean(b?.section||"",80),status=["PUBLISHED","DRAFT","ARCHIVED"].includes(b?.status||"")?String(b?.status):"DRAFT",imageUrl=clean(b?.imageUrl||"",2000),imageAlt=clean(b?.imageAlt||"",300);if(!slug||title.length<3||!sectionBySlug(section)||!articleBody)return json({error:"invalid_article"},400);const r=await env.DB.prepare("UPDATE articles SET title=?,summary=?,body=?,section=?,status=?,image_url=?,image_alt=?,updated_at=? WHERE slug=? AND language=?").bind(title,summary,articleBody,section,status,imageUrl||null,imageAlt||null,new Date().toISOString(),slug,language).run();if(!(r.meta?.changes))return json({error:"article_not_found"},404);return json({ok:true})}
if(u.pathname==="/api/admin/article/delete"&&request.method==="POST"){const b=await body<{slug?:string;language?:string}>(request),slug=clean(b?.slug||"",200),language=b?.language==="en"?"en":"ar";if(!slug)return json({error:"invalid_article"},400);const r=await env.DB.prepare("DELETE FROM articles WHERE slug=? AND language=?").bind(slug,language).run();return json({ok:!!r.meta?.changes})}
if(u.pathname==="/api/admin/article/status"&&request.method==="POST"){const b=await body<{slug?:string;language?:string;status?:string}>(request),slug=clean(b?.slug||"",200),language=b?.language==="en"?"en":"ar",status=["PUBLISHED","DRAFT","ARCHIVED"].includes(b?.status||"")?String(b?.status):"";if(!slug||!status)return json({error:"invalid_status"},400);const r=await env.DB.prepare("UPDATE articles SET status=?,updated_at=? WHERE slug=? AND language=?").bind(status,new Date().toISOString(),slug,language).run();return json({ok:!!r.meta?.changes})}if(u.pathname==="/api/admin/article-image"&&request.method==="POST"){const b=await body<{slug?:string;language?:string;imageUrl?:string;imageAlt?:string}>(request),slug=clean(b?.slug||"",200),language=b?.language==="en"?"en":"ar",imageUrl=clean(b?.imageUrl||"",2000),imageAlt=clean(b?.imageAlt||"",300);if(!slug||!imageUrl)return json({error:"invalid_image_update"},400);await env.DB.prepare("UPDATE articles SET image_url=?,image_alt=?,updated_at=? WHERE slug=? AND language=? AND status='PUBLISHED'").bind(imageUrl,imageAlt||null,new Date().toISOString(),slug,language).run();return json({ok:true})}if(u.pathname==="/api/admin/contributions"){const r=await env.DB.prepare("SELECT id,title,body,source,section,status,reviewer_note,created_at FROM contributions ORDER BY created_at DESC LIMIT 100").all();return json({items:r.results||[]})}if(u.pathname==="/api/admin/contributions/review"&&request.method==="POST"){const b=await body<{id?:number;action?:"APPROVE"|"REJECT";note?:string}>(request);if(!b?.id||!b.action)return json({error:"invalid_review"},400);await reviewContribution(env,b.id,b.action,clean(b.note||"",2000));await notify(env,"BAYAN: مساهمة "+b.id+" → "+b.action);return json({ok:true})}if(u.pathname==="/api/admin/searches"){const r=await env.DB.prepare("SELECT * FROM searches ORDER BY created_at DESC LIMIT 100").all();return json({items:r.results||[]})}if(u.pathname==="/api/admin/runtime"){const r=await env.DB.prepare("SELECT * FROM runtime_events ORDER BY created_at DESC LIMIT 100").all();return json({items:r.results||[]})}if(u.pathname==="/api/admin/repairs"){const r=await env.DB.prepare("SELECT * FROM repair_jobs ORDER BY updated_at DESC LIMIT 100").all();return json({items:r.results||[]})}if(u.pathname==="/api/admin/analytics"){const stats=await analyticsStats(env,lang);const recent=await env.DB.prepare("SELECT event,path,language,created_at FROM analytics ORDER BY created_at DESC LIMIT 50").all();return json({...stats,recent:recent.results||[]})}if(u.pathname==="/api/admin/settings"){if(request.method==="GET"){const r=await env.DB.prepare("SELECT key,value,updated_at FROM admin_settings ORDER BY key").all();return json({items:r.results||[]})}if(request.method==="POST"){const b=await body<{key?:string;value?:string}>(request);const allowed=new Set(["min_sources","max_sources","image_required","image_fallback","auto_repair","news_items","search_timeout_ms","source_wikipedia","source_wikidata","source_gdelt","source_openalex","source_ai_search"]);if(!b?.key||!allowed.has(b.key)||typeof b.value!=="string")return json({error:"invalid_setting"},400);await env.DB.prepare("INSERT INTO admin_settings(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at").bind(b.key,clean(b.value,100),new Date().toISOString()).run();return json({ok:true,key:b.key,value:b.value})}}}return json({error:"not_found"},404)}