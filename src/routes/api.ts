import{safePublicImageUrl}from"../image-url";import{isD1QuotaError,logD1QuotaOncePerHour,persistD1Block}from"../services/d1-guard";
import{bundledArticlesForSection}from"../fallback-content";import{recordRuntimeEventLimited}from"../runtime-events";
import type{Env,Locale,Source}from"../types";import{json,locale,body}from"../http";import{search,isolateArticleSubject}from"../services/search";import{externalSearchRecovery}from"../services/search-recovery";import{weather,fx,gold,prayerTimes}from"../services/live";import{news,findRelatedImage}from"../services/news";import{ask}from"../services/ai";import{addContribution,getArticle,listArticles,reviewContribution,track,analyticsStats,publishVerifiedResearch}from"../db";import{analyticsExcluded,clean,manager,visitorId}from"../security";import{notify}from"../services/telegram";import{sectionBySlug}from"../sections";import{articlePromptForTopic,sectionForOpenedStory as editorialSectionForOpenedStory,isContentForSection}from"../services/editorial";import{wisdomFor}from"../wisdom";import{archiveResearch,archiveSearchResults,listSectionArchive}from"../services/section-archive";import{selfHeal,aiRepairRequest}from"../services/repair";const bounded=<T,>(promise:Promise<T>,ms:number):Promise<T>=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error("operation_timeout")),ms);promise.then(value=>{clearTimeout(timer);resolve(value)},error=>{clearTimeout(timer);reject(error)})});const storyImage=(value:unknown)=>{const image=safePublicImageUrl(value);return image&&!/\/sections\/[^/?#]+\.svg(?:[?#]|$)/i.test(image)?image:undefined};const sourceDescription=async(url:string,lang:"ar"|"en")=>{try{const u=new URL(url),hosts=["aljazeera.net","aljazeera.com","bbc.com","bbc.co.uk","france24.com","dw.com","apnews.com","reuters.com","theguardian.com","skynewsarabia.com","independentarabia.com","aawsat.com","news.google.com","wikipedia.org","wikidata.org","openalex.org","who.int","un.org","worldbank.org","imf.org","ourworldindata.org","britannica.com","nature.com","science.org","kooora.com","goal.com","btolat.com","youm7.com","yallakora.com","filgoal.com","kingfut.com","cafonline.com","premierleague.com","liverpoolfc.com","uefa.com","fifa.com","masrawy.com","almasryalyoum.com","alarabiya.net","egypttoday.com"];if(u.protocol!=="https:"||!hosts.some(host=>u.hostname===host||u.hostname.endsWith("."+host)))return"";const r=await fetch(u.toString(),{signal:AbortSignal.timeout(3500),headers:{accept:"text/html"}});if(!r.ok)return"";const html=(await r.text()).slice(0,600000);const raw=html.match(/<meta[^>]+(?:property|name)=["\x27](?:og:description|description)["\x27][^>]+content=["\x27]([^"\x27]+)["\x27]/i)?.[1]||html.match(/<meta[^>]+content=["\x27]([^"\x27]+)["\x27][^>]+(?:property|name)=["\x27](?:og:description|description)["\x27]/i)?.[1]||"";const value=String(raw).replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim().slice(0,1500);const arabic=/[\u0600-\u06ff]/.test(value);return value&&(lang==="ar"?arabic:!arabic)?value:""}catch{return""}};
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
const sourceExcerpt=(value:string,max=1000)=>{const text=String(value||"").replace(/\s+/g," ").trim();if(text.length<=max)return text;const head=text.slice(0,max);const boundary=Math.max(head.lastIndexOf("。"),head.lastIndexOf("."),head.lastIndexOf("؟"),head.lastIndexOf("?"),head.lastIndexOf("!"));if(boundary>=Math.floor(max*0.55))return head.slice(0,boundary+1).trim();const space=head.lastIndexOf(" ");return (head.slice(0,space>0?space:head.length).trimEnd()+"…");};
const structuredSourceOnlyBiography=(name:string,rawText:string,sources:any[],lang:Locale)=>{
 const excerpt=sourceExcerpt(rawText,900);
 const sourceLines=(Array.isArray(sources)?sources:[]).filter((source:any)=>/^https:\/\//i.test(String(source?.url||""))).slice(0,6);
 const evidence=sourceLines.length?sourceLines.map((source:any)=>"- "+String(source.publisher||"Source")+": "+String(source.title||name)).join("\n"):(lang==="ar"?"لم تُرفق روابط مصادر قابلة للتحقق مع هذه النتيجة.":"No verifiable source links were attached to this result.");
 const missing=lang==="ar"?"لا تتضمن الأدلة المتاحة معلومات مستقلة كافية لتأكيد تفاصيل هذا الجانب؛ لذلك لا يضيف بيان وقائع أو تواريخ أو إنجازات غير موجودة في المصادر.":"The available evidence does not independently establish details for this section, so BAYAN does not add facts, dates, or achievements absent from the sources.";
 return [
  "## "+(lang==="ar"?"خلاصة":"Overview"),excerpt||missing,
  "## "+(lang==="ar"?"النشأة والبدايات":"Early life and beginnings"),missing,
  "## "+(lang==="ar"?"المسيرة والبطولات الكبرى":"Career and major milestones"),missing,
  "## "+(lang==="ar"?"الجوائز والإنجازات الموثقة":"Documented awards and achievements"),missing,
  "## "+(lang==="ar"?"الأثر والمكانة العامة":"Public impact and standing"),missing,
  "## "+(lang==="ar"?"كيف نقرأ مسيرته بدقة؟":"How to read this profile accurately?"),lang==="ar"?"ينبغي التمييز بين المعلومات الواردة في المقتطف والتفاصيل التي لم تثبتها المصادر المستقلة. هذا عرض منظم للمعلومات المتاحة وليس سيرة مكتملة أو تأكيدًا مستقلًا لكل ادعاء.":"Distinguish information present in the excerpt from details not established by independent sources. This is a structured presentation of available information, not a complete biography or independent confirmation of every claim.",
  "## "+(lang==="ar"?"الأدلة والمصادر":"Evidence and sources"),evidence
 ].join("\n\n");
};
const looksLikePersonBiography=(title:string,summary:string)=>{
 const value=String(title||"").trim();
 if(/سيرة|من هو|من هي|biography|profile of|who is/i.test(value))return true;
 const arabicName=/^[\u0600-\u06FF]+(?:\s+[\u0600-\u06FF]+){1,3}$/.test(value);
 const englishName=/^[A-Z][\p{L}'’.-]+(?:\s+[A-Z][\p{L}'’.-]+){1,3}$/u.test(value);
 return (arabicName||englishName)&&/(?:لاعب|لاعبة|كاتب|كاتبة|رئيس|ممثل|ممثلة|مغن|مغنية|athlete|footballer|writer|actor|president|singer|born|career|player|Egyptian|Brazilian|Argentinian)/i.test(String(summary||""));
};
const articleEvidenceQuality=(sources:any[])=>{
 const rows=Array.isArray(sources)?sources:[];
 const hosts=new Set<string>(),publishers=new Set<string>();
 for(const source of rows){try{const url=new URL(String(source?.url||""));if(url.protocol!=="https:")continue;hosts.add(url.hostname.toLowerCase().replace(/^www\./,""));const publisher=String(source?.publisher||"").trim().toLowerCase();if(publisher)publishers.add(publisher);}catch(error){void error}}
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
  const stop=new Set(["the","and","for","with","from","that","this","over","after","before","about","into","amid","says","said","new","latest","today","news","على","في","من","إلى","عن","هذا","هذه","الذي","التي","مع","بعد","قبل","بين","حول","أمام","أثناء","قال","تقول","يدعو","تدعو","وصف","بـ","قائمة","إنجازات","إنجاز","أبرز","كل","حول","نبذة","سيرة","من هو","من هي","list","achievements","achievement","career","profile","biography","who","what","complete","greatest"]);
  const normalize=(value:string)=>String(value||"").normalize("NFKC").toLowerCase().replace(/[\u064B-\u065F\u0670]/g,"").replace(/[^\p{L}\p{N}]+/gu," ").split(/\s+/).map(token=>token.length>4&&token.startsWith("ال")?token.slice(2):token).filter(token=>token.length>2&&!stop.has(token));
  const tokens=Array.from(new Set(normalize(headline)));
  const titleText=normalize(String(candidate?.title||"")).join(" ");
  const summaryText=normalize(String(candidate?.summary||"")).join(" ");
  if(!tokens.length||!summaryText)return false;
  const titleHits=tokens.filter(token=>titleText.includes(token));
  const summaryHits=tokens.filter(token=>summaryText.includes(token));
  // A matching headline alone is not proof that the attached excerpt belongs to it.
  // Require the evidence text itself to mention at least one meaningful query term.
  if(!summaryHits.length)return false;
  return tokens.length===1?summaryHits.length===1:summaryHits.length/Math.min(tokens.length,5)>=0.2||titleHits.length>=2&&summaryHits.length>=1;
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
    const mainMatch=html.match(/<(article|main)\b[^>]*>([\s\S]*?)<\/\1>/i);const main=mainMatch?.[2]||html;
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
   image=await bounded(findRelatedImage(title,firstSource?.url,"",env),3500).catch(async error=>{await recordRuntimeEventLimited(env,"article_image_lookup","initial_image_lookup_failed",error);return undefined})||"";
   if(!/^https:\/\//i.test(image))image=await bounded(findRelatedImage(title+" "+summary.slice(0,180),"","",env),3500).catch(async error=>{await recordRuntimeEventLimited(env,"article_image_lookup","summary_image_lookup_failed",error);return undefined})||"";
  }
  if(!/^https:\/\//i.test(image))return null;
  const section=editorialSectionForOpenedStory(title,summary);
  if(!isContentForSection(section,title,summary))return null;
  return await publishVerifiedResearch(env,{title,summary,body:normalizedBody.body,section,language:lang,sources,imageUrl:image,imageAlt:title});
 }catch{return null}
};
export async function api(request:Request,env:Env,ctx?:ExecutionContext){const u=new URL(request.url),lang=locale(request),ownerExcluded=analyticsExcluded(request),vid=ownerExcluded?"owner-excluded":await visitorId(request);if(u.pathname==="/api/health"){try{if(!env.DB)throw new Error("database_binding_missing");await env.DB.prepare("SELECT 1 AS ready").first()}catch(error){if(isD1QuotaError(error)){await persistD1Block();logD1QuotaOncePerHour(error)}return json({ok:false,service:"BAYAN",version:"1.2.0",database:false,error:isD1QuotaError(error)?"d1_quota_exhausted":"database_unavailable",degraded:isD1QuotaError(error),checkedAt:new Date().toISOString()},503)}try{await env.DB.prepare("SELECT id,article_slug,language,title,summary,body,section,status,image_url,image_alt,sources_json,action,editor,before_json,after_json,created_at FROM article_revision_history LIMIT 0").all()}catch{return json({ok:false,service:"BAYAN",version:"1.2.0",database:true,newsArchiveRead:false,articleRevisionHistory:false,error:"article_revision_schema_unavailable",checkedAt:new Date().toISOString()},503)}try{await env.DB.prepare("SELECT id FROM news_archive LIMIT 1").first<any>()}catch(error){const detail=String(error instanceof Error?error.message:error||"unknown").replace(/https?:\/\/[^\s]+/g,"[url]").replace(/\b(?:sk-[A-Za-z0-9_-]{8,}|Bearer\s+\S+)\b/gi,"[redacted]").slice(0,180);console.warn("BAYAN_HEALTH_NEWS_ARCHIVE_READ_FAILED",detail);return json({ok:false,service:"BAYAN",version:"1.2.0",database:true,newsArchiveRead:false,articleRevisionHistory:true,error:"news_archive_read_unavailable",checkedAt:new Date().toISOString()},503)}return json({ok:true,service:"BAYAN",version:"1.2.0",database:true,newsArchiveRead:true,articleRevisionHistory:true,checkedAt:new Date().toISOString()})}if(u.pathname==="/api/features")return json({version:"1.2.0",evidenceFirst:true,locales:["ar","en"],capabilities:["search","news","live-data","ask-bayan","contribute","saved","admin","self-healing","rotating-wisdom","private-analytics","content-management"]});if(u.pathname==="/api/search"){const q=clean(u.searchParams.get("q")||"",500);if(!q)return json({error:"query_required"},400);let r:any;try{r=await search(env,q,lang,ctx?{background:(task)=>ctx.waitUntil(task)}:{})}catch(error){const failure=String(error instanceof Error?error.message:error).slice(0,180);await recordRuntimeEventLimited(env,"external_search_unhandled_exception","search_handler_failed","language="+lang+" queryLength="+q.length+" error="+failure);r={query:q,locale:lang,results:[],providers:[],providerAttempted:["external_search_unhandled_exception: "+failure],status:"insufficient",message:lang==="ar"?"تعذّر إكمال البحث بسبب خطأ داخلي أثناء جمع النتائج. سُجل سبب العطل دون حفظ نص الاستعلام؛ لم تُعرض نتائج غير متحقق من صلتها بالطلب. حاول مرة أخرى بعد قليل.":"Search could not complete because an internal error occurred while collecting results. The failure was logged without storing the query text; unverified or unrelated results were not shown. Please try again shortly."}}if(!Array.isArray(r?.results)||r.results.length===0){const blocked=(r?.providers||[]).includes("BAYAN content safety");if(!blocked){const recovery=await externalSearchRecovery(q,lang).catch(error=>({results:[],providers:[],providerAttempted:["External recovery: "+String(error instanceof Error?error.message:error).slice(0,120)]}));const providers=[...new Set([...(r?.providers||[]),...(recovery.providers||[])])];const providerAttempted=[...new Set([...(r?.providerAttempted||[]),...(recovery.providerAttempted||[])])];if(recovery.results?.length){r={...r,query:q,locale:lang,results:recovery.results,providers,providerAttempted,status:"mixed",message:undefined,answer:undefined,answerStatus:undefined};}else{r={...r,query:q,locale:lang,results:[],providers,providerAttempted,status:"insufficient",message:r.message||(lang==="ar"?"تعذّر الحصول على نتائج خارجية ذات صلة في هذه المحاولة. لم يُستبدل البحث بمحتوى داخلي أو بنتائج غير مرتبطة؛ أُعيدت المحاولة عبر مصادر مستقلة، ويمكنك إعادة المحاولة بعد قليل.":"External providers did not return relevant results for this attempt. The search was not replaced with internal content or unrelated results; independent providers were retried. Please try again shortly.")};}}}if(Array.isArray(r?.results)){
 let imageBudget=3;
 r.results=await Promise.all(r.results.map(async(item:any)=>{
  let image=storyImage(item?.imageUrl);
  if(!image&&imageBudget>0){
   imageBudget--;
   image=await bounded(findRelatedImage(String(item?.title||""),undefined,String(item?.summary||""),env),1400).catch((error)=>{void recordRuntimeEventLimited(env,"search_image_enrichment","image_lookup_failed",error);return undefined;});
   image=storyImage(image);
  }
  const sectionSlug=sectionBySlug(String(item?.section||""))?String(item.section):undefined;
  // Never attach a section illustration as if it depicted the searched story.
  return {...item,imageUrl:image||null,imageAlt:image?String(item?.imageAlt||item?.title||""):undefined,imageFallback:!image,section:sectionSlug||item?.section};
 }));
}
const providerFailures=Array.isArray(r?.providerAttempted)?r.providerAttempted.filter((item:any)=>/(?:timeout|connection_failure|invalid_response|request_failure|http_\d{3})/i.test(String(item))).slice(0,20):[];if(providerFailures.length){try{await env.DB.prepare("INSERT INTO runtime_events(level,kind,message,created_at) VALUES(?,?,?,?)").bind("WARN","external_search_provider_failures",JSON.stringify({language:lang,queryLength:q.length,failures:providerFailures}),new Date().toISOString()).run()}catch(error){await recordRuntimeEventLimited(env,"api_suppressed_failure","operation_failed",error)}}if(Array.isArray(r?.results))r.results=r.results.map((item:any)=>({...item,imageUrl:storyImage(item.imageUrl),sources:Array.isArray(item.sources)?item.sources.map((source:any)=>({...source,imageUrl:storyImage(source.imageUrl)})):[]}));try{await track(env,vid,"search","/search",lang)}catch(error){await recordRuntimeEventLimited(env,"api_suppressed_failure","operation_failed",error)}{const filing=archiveSearchResults(env,r.results,lang).catch(error=>recordRuntimeEventLimited(env,"section_archive","search_filing_failed",error));if(ctx)ctx.waitUntil(filing);else await filing}return json(r)}if(u.pathname==="/api/news/article"){
  if(request.method!=="GET")return json({error:"method_not_allowed"},405);
  const title=clean(u.searchParams.get("title")||"",500);let image=""; // Resolve images from the exact matched subject, never from a client-supplied card URL.
  const summary=clean(u.searchParams.get("summary")||"",1500),storyUrl=clean(u.searchParams.get("url")||"",2000),publisher=clean(u.searchParams.get("publisher")||"",200),publishedAt=clean(u.searchParams.get("publishedAt")||"",100);
  if(!title)return json({error:"title_required"},400);
  if(hasMixedPersonIdentities(title,summary))return json({error:"article_identity_ambiguous",status:"insufficient",message:lang==="ar"?"نتائج هذا الاسم تجمع بين أشخاص مختلفين؛ لم نعرضها كسيرة واحدة. أضف معلومة مميزة مثل المهنة أو النادي لتحديد الشخص المقصود.":"These results mix people with the same name, so they were not shown as one biography. Add a distinguishing detail such as profession or club."},422);
  if(isVideoUrl(storyUrl))return json({error:"video_source_not_article",kind:"video",message:lang==="ar"?"هذا رابط فيديو، وليس مقالًا مكتوبًا. افتح الفيديو كمصدر منفصل، ولا تُنشئ منه مقالًا دون نص موثوق ومصادر مكتوبة مستقلة.":"This is a video, not a written article. Open it as a separate source; do not draft an article without a reliable transcript and independent written sources."},422);
  try{
    let found:any={results:[],status:"insufficient"};
    try{found=await bounded(search(env,title,lang,{publish:false,draft:false,images:false}),11000)}catch(error){await recordRuntimeEventLimited(env,"news_article_evidence_search","evidence_search_failed",error)}
    found.results=isolateArticleSubject(title,(Array.isArray(found.results)?found.results:[]).filter((candidate:any)=>newsArticleEvidenceRelevant(title,candidate)&&!hasMixedPersonIdentities(title,String(candidate.summary||""))&&!isVideoUrl(String(candidate.url||candidate.sources?.[0]?.url||""))) as any);
    // Whenever the first pass lacks independent evidence, make a bounded, query-derived
    // recovery pass to find independent reporting or primary sources. A single RSS result
    // must not end the article flow with only a headline and one-sentence summary. This is
    // generic: it uses the evidence context returned for the requested subject,
    // never a hard-coded person, club, or topic.
    const initialSources=found.results.flatMap((candidate:any)=>Array.isArray(candidate.sources)?candidate.sources:[]);
    const initialHasIndependentSources=articleEvidenceQuality(initialSources);
    const initialHasOnlyReferenceResults=found.results.length>0&&found.results.every((candidate:any)=>{
      const sources=Array.isArray(candidate.sources)?candidate.sources:[];
      return sources.every((source:any)=>/wikipedia|wikidata|ويكيبيديا|ويكي بيانات/i.test(String(source.publisher||"")));
    });
    if(!initialHasIndependentSources){
      const context=String(found.results.find((candidate:any)=>String(candidate.summary||"").trim())?.summary||summary||"");
      const contextTerms=context.normalize("NFKC").replace(/[^\p{L}\p{N}\s]/gu," ").split(/\s+/).filter((word:string)=>word.length>=4&&!/^(the|this|that|with|from|about|where|which|were|their|there|من|في|على|عن|هذا|هذه|الذي|التي|كان|كانت|حيث|وهو|وهي)$/i.test(word)).slice(0,5).join(" ");
      const recoveryQuery=[title,contextTerms].filter(Boolean).join(" ").slice(0,300);
      if(recoveryQuery&&recoveryQuery!==title){
        const recovered:any=await bounded(search(env,recoveryQuery,lang,{publish:false,draft:false,images:false}),6500).catch(()=>({results:[]}));
        const recoveredResults=isolateArticleSubject(title,(Array.isArray(recovered?.results)?recovered.results:[]).filter((candidate:any)=>newsArticleEvidenceRelevant(title,candidate)&&!hasMixedPersonIdentities(title,String(candidate.summary||""))&&!isVideoUrl(String(candidate.url||candidate.sources?.[0]?.url||""))) as any);
        const externalResults=recoveredResults.filter((candidate:any)=>{
          const sources=Array.isArray(candidate.sources)?candidate.sources:[];
          return sources.some((source:any)=>! /wikipedia|wikidata|ويكيبيديا|ويكي بيانات/i.test(String(source.publisher||"")));
        });
        const seen=new Set<string>();
        found.results=[...externalResults,...found.results].filter((candidate:any)=>{
          const key=String(candidate.url||candidate.sources?.[0]?.url||candidate.title||"").trim().toLowerCase();
          if(!key||seen.has(key))return false;
          seen.add(key);return true;
        }).slice(0,12);
      }
    }
    if(!found.results.length&&(summary||storyUrl)){
      const safeUrl=storyUrl.startsWith("https://")?storyUrl:"";
      const sourceSummary=(lang==="ar"?/[؀-ۿ]/.test(summary):!/[؀-ۿ]/.test(summary))?summary:"";
      // Never pair a valid title with an unrelated snippet merely because the primary search failed.
      if(!sourceSummary||!newsArticleEvidenceRelevant(title,{title:"",summary:sourceSummary}))return json({error:"article_subject_mismatch",status:"insufficient",message:lang==="ar"?"تعذر تأكيد أن النص والمصدر يخصان العنوان نفسه؛ لم نعرض محتوى مختلطًا. أعد البحث عن الموضوع.":"The available snippet could not be matched to this title, so unrelated content was withheld. Search for the topic again."},422);
      if(!image&&safeUrl){image=await bounded(findRelatedImage(title,safeUrl,sourceSummary,env),2200).catch(async error=>{await recordRuntimeEventLimited(env,"article_image_lookup","safe_url_image_lookup_failed",error);return undefined})||"";}
      const sources=safeUrl?[{title,publisher:publisher||(lang==="ar"?"مصدر إخباري":"News source"),url:safeUrl,publishedAt,imageUrl:image||undefined} as Source]:[];
      const article={title,summary:sourceSummary||title,body:sourceSummary||title,sources,image:image||null,status:"source_only",providerCount:sources.length?1:0,publishedAt};
      return json({ok:true,article:{...article,section:editorialSectionForOpenedStory(title,article.summary)}});
    }
    if(!found.results.length){
      const live=await bounded(news(env,lang),7000);
      const story=live.items?.find((x:any)=>String(x.title).trim()===title.trim())||live.items?.find((x:any)=>String(x.title).includes(title.slice(0,80)));
      if(!story)return json({error:"article_source_unavailable",status:"insufficient"},503);
      if(!image)image=story.imageUrl||await bounded(findRelatedImage(story.title||title,"","",env),3500).catch(async error=>{await recordRuntimeEventLimited(env,"article_image_lookup","story_image_lookup_failed",error);return undefined})||"";
      const article={title:story.title,summary:story.summary||"",body:story.summary||story.title,sources:story.sources||[],image:image||null,status:"source_only",providerCount:1,publishedAt:story.publishedAt};const savedSlug=await persistOpenedNewsArticle(env,article,lang);const openedSection=editorialSectionForOpenedStory(story.title,story.summary||"");if(!savedSlug)await archiveResearch(env,{title:article.title,summary:article.summary||article.body,sources:article.sources,section:openedSection,language:lang,imageUrl:article.image});return json({ok:true,article:{...article,section:openedSection,savedSlug}});
    }
    // Enrich short snippets with readable text from a few independent, allow-listed source pages.
    // Publisher failures remain non-fatal; a failed fetch falls back to the original search snippet.
    const articleEvidenceUrls:string[]=[];
    const articleEvidenceHosts=new Set<string>();
    const articleReadableHosts=["aljazeera.net","aljazeera.com","bbc.com","bbc.co.uk","france24.com","dw.com","apnews.com","reuters.com","theguardian.com","skynewsarabia.com","independentarabia.com","aawsat.com","news.google.com","wikipedia.org","wikidata.org","openalex.org","who.int","un.org","worldbank.org","imf.org","ourworldindata.org","britannica.com","nature.com","science.org","kooora.com","goal.com","btolat.com","youm7.com","yallakora.com","filgoal.com","kingfut.com","cafonline.com","premierleague.com","liverpoolfc.com","uefa.com","fifa.com","masrawy.com","almasryalyoum.com","alarabiya.net","egypttoday.com"];
    for(const candidate of found.results as any[]){
      const candidateUrls=[candidate.url,...(Array.isArray(candidate.sources)?candidate.sources.map((item:any)=>item?.url):[])];
      for(const candidateUrl of candidateUrls){
        try{
          const parsed=new URL(String(candidateUrl||""));
          const host=parsed.hostname.toLowerCase().replace(/^www\./,"");
          const readable=articleReadableHosts.some(allowed=>host===allowed||host.endsWith("."+allowed));
          if(parsed.protocol!=="https:"||!readable||articleEvidenceHosts.has(host)||articleEvidenceUrls.includes(parsed.toString()))continue;
          articleEvidenceHosts.add(host);articleEvidenceUrls.push(parsed.toString());break;
        }catch(error){await recordRuntimeEventLimited(env,"article_source_url","candidate_source_url_invalid",error)}
      }
      if(articleEvidenceUrls.length>=5)break;
    }
    const articleEvidenceText=await Promise.all(articleEvidenceUrls.map(url=>bounded(sourceArticleText(url,lang),4500).catch(async error=>{await recordRuntimeEventLimited(env,"article_source_fetch","source_article_fetch_failed",error);return ""})));
    const evidenceByUrl=new Map(articleEvidenceUrls.map((url,index)=>[url,articleEvidenceText[index]]));
    found.results=found.results.map((candidate:any)=>{
      const candidateUrls=[candidate.url,...(Array.isArray(candidate.sources)?candidate.sources.map((item:any)=>item?.url):[])].map((value:any)=>String(value||""));
      const extra=candidateUrls.map(url=>evidenceByUrl.get(url)||"").find(value=>value.length>=160)||"";
      return extra?{...candidate,summary:[String(candidate.summary||"").trim(),extra].filter(Boolean).join("\n\n").slice(0,5000)}:candidate;
    });
    let generated:{status:string;answer?:string;sources?:Source[]}={status:"mixed"};
    try{generated=await bounded(ask(env,articlePromptForTopic(title,lang,found.results),lang,found.results),14000)}catch(error){await recordRuntimeEventLimited(env,"article_draft_generation","draft_generation_failed",error)}
    const evidenceBody=String(found.results[0]?.summary||"").trim();
    const evidenceSources=found.results.flatMap((x:any)=>x.sources||[]).filter(Boolean);
    const hasIndependentSources=articleEvidenceQuality(evidenceSources);
    const rawGeneratedBody=String(generated.answer||"").trim();
    const quality=articleBodyQuality(rawGeneratedBody);
    let generatedBody=quality.body;
    let hasFullAnalysis=quality.ok&&generated.status==="verified"&&hasIndependentSources;
    if(!hasFullAnalysis&&hasIndependentSources&&generatedBody.length>0){try{const stricter=await bounded(ask(env,articlePromptForTopic(title,lang,found.results)+"\n\n"+(lang==="ar"?"مراجعة تحريرية إلزامية: اكتب مقالًا مترابطًا لا يقل عن 700 كلمة إذا كانت الأدلة تسمح، بأربعة عناوين فرعية على الأقل وخمس فقرات مختلفة. اشرح ما حدث، خلفيته، ما تؤكده المصادر، وما لا يزال غير محسوم. انسب الادعاءات للمصادر ولا تكرر الملخص ولا تخترع تفاصيل.":"Mandatory editorial pass: write a coherent 700-word article when evidence allows, with at least four subheadings and five distinct paragraphs. Explain what happened, context, what sources confirm, and what remains unresolved. Attribute claims and never invent details."),lang,found.results),6500);const retry=articleBodyQuality(String(stricter.answer||""));if(retry.ok&&hasIndependentSources){generatedBody=retry.body;hasFullAnalysis=stricter.status==="verified";generated=stricter as any;}}catch(error){await recordRuntimeEventLimited(env,"api_suppressed_failure","operation_failed",error)}}
    if(!hasFullAnalysis&&hasIndependentSources&&generatedBody.length>=900&&(generatedBody.match(/^#{1,3}\\s+.+$/gm)||[]).length>=2){
      // Useful, evidence-linked drafts may be shown to readers without pretending they
      // passed the full verification bar. They are not saved/published as verified news.
      if(!image)image=await bounded(findRelatedImage(title,found.results[0]?.url,found.results[0]?.summary||summary,env),2500).catch(async error=>{await recordRuntimeEventLimited(env,"article_image_fallback","related_image_lookup_failed",error);return undefined})||"";
      const articleSources=evidenceSources.filter((source:any)=>/^https:\/\//i.test(String(source?.url||""))).slice(0,12);
      return json({ok:true,article:{title,summary:String(found.results[0]?.summary||summary||""),body:generatedBody,sources:articleSources,image:storyImage(image)||null,status:"source_only",providerCount:new Set(articleSources.map((source:any)=>source.publisher).filter(Boolean)).size,section:editorialSectionForOpenedStory(title,found.results[0]?.summary||summary)}});
    }
    if(!hasFullAnalysis){
      const referenceCandidate=(found.results as any[]).find((item:any)=>String(item.summary||"").trim().length>0&&newsArticleEvidenceRelevant(title,item));
      // Sources belong to the selected evidence item; never pool citations from unrelated search results.
      const referenceSources=(Array.isArray(referenceCandidate?.sources)?referenceCandidate.sources:[]).filter((source:any)=>/^https:\/\//i.test(String(source?.url||""))).filter((source:any,index:number,all:any[])=>all.findIndex((other:any)=>{try{return new URL(String(other.url)).hostname===new URL(String(source.url)).hostname}catch{return false}})===index).slice(0,6);
      const referenceSummary=sourceExcerpt(String(referenceCandidate?.summary||""),1000);
      // Preserve the headline the visitor actually opened instead of silently replacing it with another result.
      const referenceTitle=String(title).trim().slice(0,500);
      if(referenceCandidate&&referenceSummary&&referenceSources.length>=2){
        // A single encyclopedia excerpt is not enough to build a pseudo-article; return the explicit insufficient-evidence response below instead.
        if(!image)image=String(referenceCandidate.imageUrl||"")||await bounded(findRelatedImage(referenceTitle,referenceCandidate.url,referenceSummary,env),2500).catch(async error=>{await recordRuntimeEventLimited(env,"article_image_lookup","reference_image_lookup_failed",error);return undefined})||"";
        const section=editorialSectionForOpenedStory(referenceTitle,referenceSummary);
        // A source-only result must show only the excerpt actually supported by its sources.
        // Do not manufacture biography headings with repeated "insufficient evidence" filler.
        const bodyText=referenceSummary;
        const articleImage=storyImage(image)||null;
        return json({ok:true,article:{title:referenceTitle,summary:referenceSummary,body:bodyText,sources:referenceSources,image:articleImage,status:"source_only",providerCount:referenceSources.length,section,publishedAt}});
      }
      return json({error:"article_evidence_insufficient",status:"insufficient",message:lang==="ar"?"لم تتوفر مصادر مستقلة كافية لإعداد مقال موثق.":"There were not enough independent sources to prepare a verified article."},422);
    }
    const articleBody=generatedBody;
    const sources=evidenceSources.slice(0,12);const exactSubject=found.results.find((x:any)=>identityNormalized(String(x.title||""))===identityNormalized(title));if(!image)image=storyImage(exactSubject?.imageUrl)||storyImage(exactSubject?.sources?.find((source:any)=>/^https:\/\//i.test(String(source.imageUrl||"")) )?.imageUrl)||await bounded(findRelatedImage(title,exactSubject?.url||exactSubject?.sources?.[0]?.url,exactSubject?.summary||"",env),3500).catch(async error=>{await recordRuntimeEventLimited(env,"article_image_lookup","verified_article_image_lookup_failed",error);return undefined})||"";
    const articleSection=editorialSectionForOpenedStory(title,found.results[0]?.summary||"");
    const articleImage=storyImage(image)||null;
    const articleSummary=String(exactSubject?.summary||exactSubject?.sources?.[0]?.title||"");const article={title,summary:articleSummary,body:articleBody,sources,image:articleImage,status:hasFullAnalysis?generated.status:"source_only",providerCount:new Set(sources.map((s:any)=>s.publisher).filter(Boolean)).size};const savedSlug=await persistOpenedNewsArticle(env,article,lang);if(!savedSlug)await archiveResearch(env,{title:article.title,summary:article.summary||article.body,sources:article.sources,section:articleSection,language:lang,imageUrl:article.image});return json({ok:true,article:{...article,section:articleSection,savedSlug}});
  }catch(error){await track(env,vid,"news_article_error","/news",lang);return json({error:"news_article_failed",status:"unavailable"},502)}
}if(u.pathname==="/api/news/archive"){
  const q=clean(u.searchParams.get("q")||"",300);
  const section=clean(u.searchParams.get("section")||"all",80);
  const archiveId=Math.max(0,Number(u.searchParams.get("id")||0));
  const limit=Math.max(1,Math.min(50,Number(u.searchParams.get("limit")||24)));
  const like="%"+q.replace(/[%_]/g,"")+"%";
  const cacheable=!q&&archiveId===0;
  const cacheUrl=new URL(u.toString());cacheUrl.searchParams.set("lang",lang);
  const cacheKey=new Request(cacheUrl.toString(),{method:"GET"});
  if(cacheable){try{const cached=await (caches as unknown as {default:Cache}).default.match(cacheKey);if(cached)return cached;}catch(error){console.warn("news_archive_cache_read_failed",String(error).slice(0,120))}}
  try{
    const where=["language=?"];const params:any[]=[lang];
    if(section!=="all"){where.push("section=?");params.push(section);}
    if(q){where.push("(title LIKE ? OR summary LIKE ?)");params.push(like,like);}
    if(archiveId){where.push("id=?");params.push(archiveId);}
    params.push(limit);
    const rows=await env.DB.prepare("SELECT id,url,language,title,summary,publisher,published_at,image_url,image_alt,section,fetched_at FROM news_archive WHERE "+where.join(" AND ")+" ORDER BY published_at DESC,fetched_at DESC LIMIT ?").bind(...params).all<any>();
    const items=(rows.results||[]).map((row:any)=>({id:Number(row.id),title:String(row.title||""),summary:String(row.summary||""),url:String(row.url||""),publisher:String(row.publisher||""),publishedAt:row.published_at||null,imageUrl:storyImage(row.image_url),imageAlt:String(row.image_alt||row.title||""),section:String(row.section||"news"),language:lang,archivedAt:String(row.fetched_at||""),sources:[{title:String(row.title||""),publisher:String(row.publisher||""),url:String(row.url||""),publishedAt:row.published_at||undefined,imageUrl:storyImage(row.image_url)}]}));
    const response=json({ok:true,language:lang,section,items,count:items.length},200,cacheable?"public, max-age=60, stale-while-revalidate=300":"no-store");
    if(cacheable){try{await (caches as unknown as {default:Cache}).default.put(cacheKey,response.clone())}catch(error){console.warn("news_archive_cache_write_failed",String(error).slice(0,120))}}
    return response;
  }catch(error){
    await recordRuntimeEventLimited(env,"news_archive_read","archive_read_failed",error)
    // D1's daily free read quota can be exhausted while live news still works.
    // Do not turn an unavailable archive into an HTTP 503 or invent archived items.
    return json({ok:true,language:lang,section,items:[],count:0,degraded:true,archiveAvailable:false,message:lang==="ar"?"الأرشيف المحفوظ غير متاح مؤقتًا؛ يمكنك متابعة الأخبار المتحققة المباشرة.":"The saved archive is temporarily unavailable; verified live news may still be available."},200,"no-store");
  }
}if(u.pathname==="/api/news"){try{return json(await news(env,lang),200,"public, max-age=45, stale-while-revalidate=180")}catch{return json({items:[],degraded:true,message:lang==="ar"?"الأخبار الحية غير متاحة مؤقتًا؛ لن نعرض أخبارًا غير متحققة.":"Live news is temporarily unavailable; unverified stories will not be shown."},200,"public, max-age=30")}}if(u.pathname==="/api/image"){const q=clean(u.searchParams.get("q")||"",500);if(!q)return json({error:"query_required"},400);const cacheKey=new Request(u.origin+"/__bayan-image-cache/"+encodeURIComponent(q.toLowerCase().replace(/\\s+/g," ").trim()));let imageCache:Cache|undefined;try{imageCache=await caches.open("bayan-image-cache-v1");const cached=await imageCache.match(cacheKey);if(cached)return new Response(cached.body,{status:cached.status,headers:cached.headers});}catch{/* Cache API is optional; keep image lookup available if caching fails. */}const imageUrl=storyImage(await findRelatedImage(q,undefined,"",env));const response=json({ok:true,imageUrl:imageUrl||null},200,imageUrl?"public, max-age=3600, stale-while-revalidate=86400":"public, max-age=300");if(imageCache){try{const pending=imageCache.put(cacheKey,response.clone());if(ctx)ctx.waitUntil(pending);else await pending;}catch{/* Cache API is optional; keep image lookup available if caching fails. */}}return response;}if(u.pathname==="/api/wisdom"){const section=clean(u.searchParams.get("section")||"world",80);if(!sectionBySlug(section))return json({error:"invalid_section"},400);return json({section,wisdom:wisdomFor(section,lang)});}if(u.pathname==="/api/section"){const section=clean(u.searchParams.get("section")||"",80);if(!section||!sectionBySlug(section))return json({error:"invalid_section"},400);if(section==="news"){
  let live:any;try{live=await news(env,lang)}catch{return json({section,items:[],degraded:true},200,"public, max-age=30")}
  const items=(live.items||[]).map((story:any)=>({...story,section:"news",kind:"news",body:String(story.summary||story.title||""),sources:[]}));
  try{
    const archived=await env.DB.prepare("SELECT id,title,summary,publisher,published_at,image_url,image_alt,section,fetched_at FROM news_archive WHERE language=? AND section='news' ORDER BY fetched_at DESC LIMIT 24").bind(lang).all<any>();
    for(const row of archived.results||[]){
      if(items.some((item:any)=>String(item.title||"").trim().toLowerCase()===String(row.title||"").trim().toLowerCase()))continue;
      items.push({id:Number(row.id),title:String(row.title||""),summary:String(row.summary||""),publisher:String(row.publisher||""),publishedAt:row.published_at||null,imageUrl:storyImage(row.image_url),imageAlt:String(row.image_alt||row.title||""),section:"news",kind:"news_archive",body:String(row.summary||""),slug:"",href:"/news?archive="+encodeURIComponent(String(row.id))+"&lang="+lang,sources:[],archivedAt:String(row.fetched_at||"")});
    }
  }catch(error){await recordRuntimeEventLimited(env,"section_news_archive","section_archive_query_failed",error)}
  return json({section,items:items.map((item:any)=>{const verifiedImage=storyImage(item.imageUrl);return{...item,imageUrl:verifiedImage||undefined,imageAlt:verifiedImage?String(item.imageAlt||item.title||""):(lang==="en"?"BAYAN news illustration":"رسم توضيحي للأخبار"),imageFallback:!verifiedImage}})})
}let items:any[]=await listArticles(env,section,lang,24);
const hasArabic=(value:unknown)=>/[\u0600-\u06ff]/.test(String(value||""));
const localeSafeItem=(x:any)=>{const title=String(x?.title||""),summary=String(x?.summary||""),bodyText=String(x?.body||"");return articleLocaleSafe(title,lang)&&(!summary||articleLocaleSafe(summary,lang))&&(!bodyText||articleLocaleSafe(bodyText,lang));};
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
 art:/(\barts?\b|book|books|novel|novels|author|writer|poetry|poet|painting|visual art|literature|literary|film|cinema|music|theatre|theater|song|museum|cultural|فن|سينما|موسيقى|مسرح|فيلم|أغنية|أدب|رواية|روايات|شعر|شاعر|كاتب|مؤلف|لوحة|لوحات|ثقافة|فنان)/i,
 trends:/(trend|viral|popular|social media|survey|poll|data|اتجاه|ترند|متداول|رائج|استطلاع|بيانات|شبكات اجتماعية)/i,
 egypt:/(community|communities|society|social issue|public service|daily life|housing|family|cost of living|مجتمع|مجتمعات|قضية اجتماعية|قضايا اجتماعية|خدمة عامة|خدمات عامة|الحياة اليومية|السكن|الأسرة|تكلفة المعيشة|المعيشة|السكان)/i,
 arab:/(idea|ideas|debate|philosophy|philosophical|argument|ethics|critical thinking|viewpoint|opinion|أفكار|فكرة|نقاش|نقاشات|فلسفة|فلسفي|جدل|حجة|أخلاقيات|تفكير نقدي|وجهة نظر|رأي|آراء|قضية فكرية|حوار فكري)/i,
 world:/(world|global|international|united nations|international relations|global risk|عالمي|دولي|العالم|الأمم المتحدة|علاقات دولية|حرب|نزاع|داعش|تنظيم الدولة|سوريا|العراق|أوكرانيا|غزة|إيران|اليمن|الحوثيين|كييف|دولية)/i
};
const sectionTerms:Record<string,string[]>={
 science:["science","scientific","space","nasa","physics","chemistry","biology","astronomy","discovery","discoveries","علم","علوم","العلوم","علمي","علمية","فضاء","الفضاء","ناسا","فيزياء","كيمياء","أحياء","فلك","اكتشاف","اكتشافات"],
 technology:["technology","technologies","artificial","intelligence","software","computing","cybersecurity","computer","تقنية","تقنيات","تكنولوجيا","الذكاء","اصطناعي","برمجيات","حوسبة","حاسوب","سيبراني","معلومات"],
 economy:["economy","economic","inflation","market","markets","finance","financial","currency","bank","trade","gdp","unemployment","اقتصاد","الاقتصاد","اقتصادي","الاقتصادي","اقتصادية","الاقتصادية","تضخم","التضخم","سوق","السوق","أسواق","تمويل","التمويل","مالي","المالي","مالية","المالية","عملة","العملة","بنك","البنوك","تجارة","التجارة","ناتج","بطالة","البطالة"],
 politics:["politics","political","government","election","elections","parliament","constitution","diplomacy","president","minister","policy","سياسة","السياسة","سياسي","سياسية","حكومة","الحكومة","انتخابات","الانتخابات","برلمان","البرلمان","دستور","دبلوماسية","رئيس","وزير"],
 health:["health","medical","medicine","disease","hospital","drug","treatment","prevention","صحة","الصحة","صحي","الصحي","صحية","الصحية","معلومات","المعلومات","طب","الطب","طبي","طبية","الطبية","مرض","المرض","مستشفى","دواء","علاج","وقاية","الرعاية","الدليل","الأدلة"],
 history:["history","historical","historian","historians","primary","source","sources","archive","archives","chronology","context","civilization","civilizations","ancient","archaeology","تاريخ","التاريخ","تاريخي","تاريخية","حضارة","حضارات","آثار","قديم","قديمة","المؤرخ","المؤرخون","مؤرخ","مؤرخون","مصدر","مصادر","المصدر","المصادر","أولية","الأولية","وثيقة","وثائق","السياق","سياق","أحداث","الأحداث","أرشيف","الأرشيف"],
 people:["biography","biographical","public figure","writer","author","novelist","footballer","scientist","president","poet","artist","inventor","actor","personality","career biography","سيرة ذاتية","سيرة شخصية","ترجمة شخصية","الشخصية العامة","شخصية عامة","سيرة","السيرة","كاتب","الكاتب","روائي","الروائية","روائية","لاعب كرة","عالم في","شاعر","فنان","الفنان","الفنانة","مؤلف","أديب","رئيس","ممثل","مخترع","النشأة","نجيب","محفوظ","مغني","مغنية","مطرب","مطربة"],
 sports:["sport","sports","football","soccer","basketball","tennis","league","championship","match","athlete","رياضة","رياضي","كرة","دوري","بطولة","مباراة","لاعب","فريق"],
 travel:["travel","tourism","destination","airport","hotel","visa","trip","سفر","السفر","سياحة","السياحة","سياحي","السياحي","سياحية","السياحية","وجهة","الوجهة","وجهات","الوجهات","مطار","المطار","فندق","الفندق","فنادق","الفنادق","تأشيرة","التأشيرة","تأشيرات","رحلة","رحلات"],
 art:["art","arts","artist","artists","book","books","novel","novels","author","writer","poetry","poet","painting","paintings","visual","literature","literary","film","cinema","music","theatre","theater","song","museum","cultural","فن","الفن","سينما","السينما","موسيقى","الموسيقى","مسرح","المسرح","فيلم","أغنية","أغاني","غناء","مغني","مغنية","مطرب","مطربة","ممثلة","فنان","الفنان","الفنانة","فنانين","أدب","الأدب","رواية","روايات","شعر","شاعر","كاتب","مؤلف","لوحة","لوحات","ثقافة","الثقافة"],
 trends:["trend","trends","viral","popular","social","media","survey","poll","data","اتجاه","اتجاهات","ترند","متداول","رائج","استطلاع","استطلاعات","بيانات","اجتماعي","اجتماعية","التواصل","رأي","آراء"],
 egypt:["community","communities","society","social issue","public service","daily life","housing","family","cost of living","مجتمع","مجتمعات","قضية اجتماعية","قضايا اجتماعية","خدمة عامة","خدمات عامة","الحياة اليومية","السكن","الأسرة","تكلفة المعيشة","المعيشة","السكان"],
 arab:["idea","ideas","debate","philosophy","philosophical","argument","ethics","critical thinking","viewpoint","opinion","أفكار","فكرة","نقاش","نقاشات","فلسفة","فلسفي","جدل","حجة","أخلاقيات","تفكير نقدي","وجهة نظر","رأي","آراء","قضية فكرية","حوار فكري"],
 world:["world","global","international","united","nations","war","conflict","climate","supply","chain","globalization","worldwide","عالمي","عالمية","دولي","دولية","العالم","الأمم","المتحدة","علاقات","حرب","نزاع","سوريا","العراق","أوكرانيا","غزة","إيران","اليمن","داعش","تنظيم","الدولة","الإرهاب","الإرهابي","إقليمية","دول","المناخ","المناخي","المناخية","التغير","سلاسل","الإمداد","التوريد","الشحن","الموانئ"]
};
const sectionRelevant=(x:any)=>{
 const title=String(x?.title||""),summary=String(x?.summary||"");
 const text=title+" "+summary;
 if(section==="sports"&&/(video game|لعبة فيديو|ألعاب فيديو)/i.test(text))return false;
 // Animal behaviour and wildlife-photo stories are not human biographies.
 if(section==="people"&&/(\belephants?\b|\bwildlife\b|\banimals?\b|\bconservation\b|فيل|أفيال|حيوان|حيوانات|الحياة البرية|صغير نافق|أنثى فيل)/i.test(text))return false;
 const terms=sectionTerms[section],pattern=sectionPatterns[section];
 if(!terms)return !pattern||pattern.test(text);
 const words=(value:string)=>new Set(value.normalize("NFKC").toLowerCase().replace(/[\u064B-\u065F\u0670]/g,"").split(/[^\p{L}\p{N}]+/u).filter(Boolean));
 const titleWords=words(title),summaryWords=words(summary);
 // Do not classify a general story as a biography using vague summary-only word matches.
 if(section==="people"&&!terms.some(term=>titleWords.has(term)))return false;
 if(terms.some(term=>titleWords.has(term)))return true;
 return terms.filter(term=>summaryWords.has(term)).length>=2;
};
items=items.filter((item:any)=>String(item.section||"")===section);

items=items.filter((x:any)=>{const title=String(x.title||""),summary=String(x.summary||"");return (x.slug?String(x.section||"")===section&&isContentForSection(section,title,summary):sectionRelevant(x)&&isContentForSection(section,title,summary))&&(x.kind==="evidence"||(articleBodyQuality(String(x.body||"")).ok&&articleEvidenceQuality(x.sources)))&&localeSafeItem(x);});
items=items.filter((x:any)=>x.kind==="evidence"||/^https:\/\//i.test(String(x.imageUrl||"")));
if(items.length<2&&section!=="prices"){
 try{
  let cachedEvidence:any[]=[];
  try{
   const since=new Date(Date.now()-7*86400000).toISOString();
   const cached=await env.DB.prepare("SELECT results_json FROM searches WHERE language=? AND topic_section=? AND created_at>=? ORDER BY created_at DESC LIMIT 4").bind(lang,section,since).all<any>();
   const seenCached=new Set<string>();
   for(const row of cached.results||[]){
    let parsed:any[]=[];try{const value=JSON.parse(String(row.results_json||"[]"));if(Array.isArray(value))parsed=value;}catch(error){await recordRuntimeEventLimited(env,"search_cache_parse","section_cached_results_invalid",error)}
    for(const item of parsed){
     const title=String(item?.title||""),summary=String(item?.summary||"");
     const key=title.normalize("NFKC").toLowerCase().trim();
     if(!title||!summary||!key||seenCached.has(key))continue;
     if(!localeSafeItem(item)||!isContentForSection(section,title,summary)||!storyImage(item.imageUrl))continue;
     seenCached.add(key);cachedEvidence.push({...item,section,kind:"evidence"});
     if(cachedEvidence.length>=8)break;
    }
    if(cachedEvidence.length>=8)break;
   }
  }catch(error){await recordRuntimeEventLimited(env,"section_cached_evidence","cached_section_evidence_failed",error)}
  items=[...items,...cachedEvidence];
  const refreshed=await listArticles(env,section,lang,24);
  const existingSlugs=new Set(items.map((x:any)=>String(x.slug||"")).filter(Boolean));
  const refreshedComplete=refreshed.filter((x:any)=>x.slug&&!existingSlugs.has(String(x.slug))&&articleBodyQuality(String(x.body||"")).ok&&localeSafeItem(x)&&String(x.section||"")===section&&isContentForSection(section,String(x.title||""),String(x.summary||""))&&/^https:\/\//i.test(String(x.imageUrl||"")));
  items=[...items,...refreshedComplete];

 }catch(error){await recordRuntimeEventLimited(env,"section_article_refresh","section_article_refresh_failed",error)}
}
if(section!=="people"){
try{
  const newsCutoff=new Date(Date.now()-72*60*60*1000).toISOString();
  const newsFuture=new Date(Date.now()+5*60*1000).toISOString();
  const archived=await env.DB.prepare("SELECT id,title,summary,publisher,published_at,image_url,image_alt,section,fetched_at FROM news_archive WHERE language=? AND fetched_at>=? AND published_at>=? AND published_at<=? AND length(summary)>=120 AND image_url IS NOT NULL AND trim(image_url)<>'' ORDER BY published_at DESC LIMIT 30").bind(lang,newsCutoff,newsCutoff,newsFuture).all<any>();
  for(const row of archived.results||[]){
    const title=String(row.title||""),summary=String(row.summary||""),imageUrl=storyImage(row.image_url);
    if(!title||summary.length<120||!imageUrl||!localeSafeItem({title,summary})||!isContentForSection(section,title,summary)||items.some((item:any)=>String(item.title||"").trim().toLowerCase()===title.trim().toLowerCase()))continue;
    items.push({id:Number(row.id),title,summary,publisher:String(row.publisher||""),publishedAt:row.published_at||null,imageUrl,imageAlt:String(row.image_alt||title),section,kind:"news_archive",body:summary,slug:"",href:"/news?archive="+encodeURIComponent(String(row.id))+"&lang="+lang,sources:[],archivedAt:String(row.fetched_at||"")});
  }
}catch(error){await recordRuntimeEventLimited(env,"section_news_archive","section_news_archive_query_failed",error)}
}
if(section==="people")items=items.filter((item:any)=>String(item.content_type||"")==="biography"||String(item.kind||"")==="biography"||/^who-is-[a-z0-9-]+-(?:ar|en)$/i.test(String(item.slug||"")));
if(items.length<2&&section!=="news"&&section!=="prices"){
 const existingSlugs=new Set(items.map((item:any)=>String(item.slug||"")).filter(Boolean));
 const existingTitles=new Set(items.map((item:any)=>String(item.title||"").normalize("NFKC").toLowerCase().trim()).filter(Boolean));
 const bundled=bundledArticlesForSection(section,lang,24).filter((item:any)=>item.slug&&!existingSlugs.has(String(item.slug))&&!existingTitles.has(String(item.title||"").normalize("NFKC").toLowerCase().trim())&&localeSafeItem(item)&&articleBodyQuality(String(item.body||"")).ok&&articleEvidenceQuality(item.sources)&&String(item.section||"")===section&&(!item.imageUrl||/^https:\/\//i.test(String(item.imageUrl||""))));
 items=[...items,...bundled.map((item:any)=>{const verifiedImage=storyImage(item.imageUrl);return{...item,kind:"article",fallbackMode:true,section,language:lang,imageUrl:verifiedImage||undefined,imageAlt:verifiedImage?String(item.imageAlt||item.title||""):(lang==="en"?"BAYAN section illustration":"رسم توضيحي لقسم بيان")}})];
}
if(section==="people")items=items.filter((item:any)=>String(item.content_type||"")==="biography"||String(item.kind||"")==="biography"||/^who-is-[a-z0-9-]+-(?:ar|en)$/i.test(String(item.slug||"")));
items=items.filter((item:any)=>localeSafeItem(item)&&(()=>{const text=String(item?.body||item?.summary||"");return lang==="ar"?/[؀-ۿ]/.test(text):!/[؀-ۿ]/.test(text)})());
try{const knownTitles=new Set(items.map((item:any)=>String(item.title||"").trim().toLowerCase()));for(const entry of await listSectionArchive(env,section,lang,24))if(!knownTitles.has(entry.title.trim().toLowerCase()))items.push(entry)}catch(error){if(!isD1QuotaError(error))await recordRuntimeEventLimited(env,"section_archive","list_failed",error)}
return json({section,degraded:items.some((item:any)=>Boolean(item.fallbackMode)),items:items.map((item:any)=>{const verifiedImage=storyImage(item.imageUrl);return{...item,imageUrl:verifiedImage||undefined,imageAlt:verifiedImage?String(item.imageAlt||item.title||""):(lang==="en"?"BAYAN section illustration":"رسم توضيحي لقسم بيان"),imageFallback:!verifiedImage}})});}if(u.pathname==="/api/article"){const slug=clean(u.searchParams.get("slug")||"",200);if(!slug)return json({error:"slug_required"},400);let article=await getArticle(env,slug,lang);if(article&&hasMixedPersonIdentities(String(article.title||""),String(article.body||""))){try{await env.DB.prepare("UPDATE articles SET status='ARCHIVED',updated_at=? WHERE slug=? AND language=?").bind(new Date().toISOString(),slug,lang).run()}catch(error){await recordRuntimeEventLimited(env,"article_archive_update","identity_mismatch_archive_failed",error)}return json({error:"article_identity_ambiguous",message:lang==="ar"?"تم إيقاف المقال القديم لأنه يخلط بين أشخاص مختلفين؛ أعد البحث لعرض النتائج الصحيحة.":"This legacy article mixed different people and was archived; search again for correct results."},422)};if(article&&!articleLocaleSafe(String(article.body||""),lang))return json({error:"article_language_mismatch",message:lang==="ar"?"هذا المقال لا يحتوي على محتوى عربي متسق بعد؛ لم نعرض نصًا بلغة أخرى.":"This article does not contain consistent English content yet; content in another language was not displayed."},422);if(article&&articleHasNamesakeContamination(String(article.title||""),String(article.body||""),article.sources||[])){try{await env.DB.prepare("UPDATE articles SET status='ARCHIVED',updated_at=? WHERE slug=? AND language=?").bind(new Date().toISOString(),slug,lang).run()}catch(error){await recordRuntimeEventLimited(env,"article_archive_update","namesake_contamination_archive_failed",error)}return json({error:"article_subject_mismatch",message:lang==="ar"?"تم إيقاف المقال القديم لأنه يجمع أشخاصًا مختلفين يحملون اسمًا متشابهًا؛ أعد البحث لعرض النتائج الصحيحة.":"This legacy article mixed namesakes and was archived; search again for correct results."},422)};if(article&&!articleBodyQuality(String(article.body||"")).ok)return json({error:"article_incomplete",message:lang==="ar"?"هذا المقال لا يستوفي شروط الاكتمال والتحقق، لذلك لم نعرضه كمقال منشور.":"This article does not meet the completeness and verification requirements, so it was not shown as a published article."},422);if(article&&!articleEvidenceQuality(article.sources))return json({error:"article_evidence_insufficient",message:lang==="ar"?"هذا المقال لا يحتوي على مصدرين مستقلين كحد أدنى، لذلك لم نعرضه كمقال موثق.":"This article does not have at least two independent sources, so it was not shown as a verified article."},422);if(article&&!storyImage(article.imageUrl)){try{const exactSubjectSource=(article.sources||[]).find((source:any)=>identityNormalized(String(source.title||""))===identityNormalized(String(article!.title||""))&&/^https:\/\//i.test(String(source.url||"")));const imageUrl=await bounded(findRelatedImage(article!.title,exactSubjectSource?.url),3500);if(imageUrl){await env.DB.prepare("UPDATE articles SET image_url=?,image_alt=?,updated_at=? WHERE slug=? AND language=? AND (image_url IS NULL OR trim(image_url)='')").bind(imageUrl,article!.title,new Date().toISOString(),slug,lang).run();article={...article!,imageUrl,imageAlt:article!.title}}}catch(error){await recordRuntimeEventLimited(env,"api_suppressed_failure","operation_failed",error)}}if(article){const verifiedImage=storyImage(article.imageUrl);article={...article,imageUrl:verifiedImage||undefined,imageAlt:verifiedImage?String(article.imageAlt||article.title||""):(lang==="en"?"BAYAN section illustration":"رسم توضيحي لقسم بيان"),imageFallback:!verifiedImage};await track(env,vid,"article","/article/"+slug,lang)}return article?json(article):json({error:"not_found"},404)}if(u.pathname==="/api/verify-claim"){
  if(request.method!=="POST")return json({error:"method_not_allowed"},405);
  const b=await body<{claim?:string}>(request),claim=clean(b?.claim||"",500);
  if(claim.length<6)return json({error:"claim_required"},400);
  let found:any={results:[],status:"insufficient"};
  try{found=await bounded(search(env,claim,lang,{publish:false,draft:false,images:false}),9000)}catch(error){await recordRuntimeEventLimited(env,"verify_claim_search","evidence_search_failed",error)}
  const evidence=(Array.isArray(found?.results)?found.results:[]).filter((item:any)=>String(item.title||"").trim()&&String(item.summary||"").trim()).slice(0,8);
  const sources=evidence.flatMap((item:any)=>Array.isArray(item.sources)?item.sources:[]).filter((source:any)=>{try{return new URL(String(source.url||"")).protocol==="https:"}catch{return false}}).reduce((out:any[],source:any)=>{const url=String(source.url||"").trim();if(url&&!out.some((x:any)=>x.url===url))out.push({title:String(source.title||""),publisher:String(source.publisher||""),url,publishedAt:source.publishedAt||undefined});return out},[]).slice(0,8);
  const insufficient=(message:string)=>json({ok:true,claim,verdict:"unverified",summary:message,breakdown:{verified:[],contested:[],unconfirmed:[claim]},sources});
  if(!evidence.length||!articleEvidenceQuality(sources))return insufficient(lang==="ar"?"الأدلة المتاحة لا تكفي لتأكيد الادعاء؛ لا يُعد غياب الدليل إثباتًا للنفي.":"Available evidence is insufficient to confirm this claim; absence of evidence is not proof of the opposite.");
  const prompt=lang==="ar"
    ? "أنت مدقق حقائق في بيان. قارن الادعاء بالأدلة المرفقة فقط. لا تضف حقائق من ذاكرتك ولا تعتبر تكرار المصدر نفسه تأييدًا مستقلًا. أخرج JSON فقط بالمفاتيح verdict (verified|misleading|outside_context|unverified), summary, verifiedFacts[], contestedClaims[], unconfirmedRumors[]. لا تستخدم verified إلا إذا كانت الأدلة تدعم الادعاء مباشرة.\nالادعاء: "+claim+"\nالأدلة: "+JSON.stringify(evidence.map((x:any)=>({title:x.title,summary:x.summary,sources:(x.sources||[]).map((s:any)=>({publisher:s.publisher,title:s.title,url:s.url}))})))
    : "You are BAYAN's fact checker. Compare the claim only with the supplied evidence. Do not add facts from memory or treat repeated coverage of one source as independent confirmation. Return JSON only with verdict (verified|misleading|outside_context|unverified), summary, verifiedFacts[], contestedClaims[], unconfirmedRumors[]. Use verified only when the evidence directly supports the claim.\nClaim: "+claim+"\nEvidence: "+JSON.stringify(evidence.map((x:any)=>({title:x.title,summary:x.summary,sources:(x.sources||[]).map((s:any)=>({publisher:s.publisher,title:s.title,url:s.url}))})));
  let answer:any;
  try{answer=await bounded(ask(env,prompt,lang,evidence),12000)}catch(error){await recordRuntimeEventLimited(env,"verify_claim_ai","fact_check_failed",error);return insufficient(lang==="ar"?"تعذر إكمال التحليل الآلي؛ لا تتوفر نتيجة تحقق موثوقة في هذه المحاولة.":"Automated analysis could not be completed; no reliable verdict is available for this attempt.")}
  let parsed:any={verdict:"unverified",summary:lang==="ar"?"لم تنتج الأدلة حكمًا حاسمًا.":"The available evidence did not produce a conclusive verdict.",verifiedFacts:[],contestedClaims:[],unconfirmedRumors:[claim]};
  try{const match=String(answer?.answer||"").match(/\{[\s\S]*\}/);if(match){const candidate=JSON.parse(match[0]);if(candidate&&typeof candidate==="object")parsed={...parsed,...candidate}}}catch(error){await recordRuntimeEventLimited(env,"verify_claim_ai","fact_check_json_invalid",error)}
  const allowed=new Set(["verified","misleading","outside_context","unverified"]);
  let verdict=allowed.has(String(parsed.verdict))?String(parsed.verdict):"unverified";
  if(verdict==="verified"&&!articleEvidenceQuality(sources))verdict="unverified";
  const list=(value:any)=>Array.isArray(value)?value.map((x:any)=>clean(String(x||""),500)).filter(Boolean).slice(0,6):[];
  const summary=clean(String(parsed.summary||""),1200)|| (lang==="ar"?"لا تسمح الأدلة المتاحة بحكم حاسم.":"The available evidence does not support a conclusive verdict.");
  return json({ok:true,claim,verdict,summary,breakdown:{verified:list(parsed.verifiedFacts),contested:list(parsed.contestedClaims),unconfirmed:list(parsed.unconfirmedRumors)},sources});
}
if(u.pathname==="/api/live/weather")return json(await weather(clean(u.searchParams.get("city")||"Hurghada",100),env),200,"public, max-age=60, stale-while-revalidate=300");if(u.pathname==="/api/live/prayer")return json(await prayerTimes(clean(u.searchParams.get("city")||"Hurghada",100),clean(u.searchParams.get("country")||"Egypt",100),env),200,"public, max-age=300, stale-while-revalidate=900");if(u.pathname==="/api/live/fx")return json(await fx(env),200,"public, max-age=60, stale-while-revalidate=300");if(u.pathname==="/api/live/gold")return json(await gold(env),200,"public, max-age=60, stale-while-revalidate=300");if(u.pathname==="/api/ask"){if(request.method!=="POST")return json({error:"method_not_allowed"},405);const b=await body<{question?:string}>(request),q=clean(b?.question||"",4000);if(!q)return json({error:"question_required"},400);let s:any;try{s=await search(env,q,lang)}catch(error){await recordRuntimeEventLimited(env,"ask_evidence_search","ask_evidence_search_failed",error);s={query:q,locale:lang,results:[],providers:[],providerAttempted:["primary_search_failed"],status:"insufficient"}}if(!Array.isArray(s?.results)||s.results.length===0){const recovery=await externalSearchRecovery(q,lang).catch(error=>({results:[],providers:[],providerAttempted:["External recovery: "+String(error instanceof Error?error.message:error).slice(0,120)]}));s={...s,results:Array.isArray(recovery.results)?recovery.results:[],providers:[...new Set([...(s.providers||[]),...(recovery.providers||[])])],providerAttempted:[...new Set([...(s.providerAttempted||[]),...(recovery.providerAttempted||[])])],status:recovery.results?.length?"mixed":"insufficient"}}try{await track(env,vid,"ask","/ask",lang)}catch(error){console.warn("ask_analytics_tracking_failed",error instanceof Error?error.name:"unknown")}let drafted:any;if(s.answer)drafted={status:s.answerStatus||s.status,answer:s.answer,sources:s.results.flatMap((item:any)=>item.sources||[])};else if(!s.results.length)drafted={status:"insufficient",answer:lang==="ar"?"لم أعثر على نتائج موثوقة كافية لهذا السؤال. جرّب صياغة أدق أو أعد المحاولة لاحقًا.":"I could not find enough reliable results for this question. Try a more specific query or check again later.",sources:[]};else try{drafted=await ask(env,q,lang,s.results)}catch(error){console.warn("ask_generation_failed",error instanceof Error?error.name:"unknown");drafted={status:"insufficient",answer:lang==="ar"?"عُثر على مصادر، لكن تعذّر إنشاء ملخص موثوق الآن. راجع المصادر المتاحة وأعد المحاولة لاحقًا.":"Sources were found, but a reliable summary could not be generated right now. Review the available sources and try again later.",sources:s.results.flatMap((item:any)=>item.sources||[])};}return json({...drafted,evidence:s.results,searchStatus:s.status,providers:s.providers})}if(u.pathname==="/api/contribute"){if(request.method!=="POST")return json({error:"method_not_allowed"},405);const b=await body<{title?:string;body?:string;source?:string;section?:string}>(request),title=clean(b?.title||"",300),text=clean(b?.body||"",12000),source=clean(b?.source||"",1000),section=clean(b?.section||"world",80);if(title.length<4||text.length<20||!sectionBySlug(section)||section==="news")return json({error:"invalid_submission"},400);await addContribution(env,title,text,source,section,lang);const delivered=await notify(env,"BAYAN: مساهمة جديدة للمراجعة\n"+title);if(!delivered){try{await env.DB.prepare("INSERT INTO runtime_events(level,kind,message,created_at) VALUES(?,?,?,?)").bind("WARN","telegram_contribution_delivery","Contribution saved, but Telegram notification was not delivered. Check TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.",new Date().toISOString()).run()}catch(error){await recordRuntimeEventLimited(env,"api_suppressed_failure","operation_failed",error)}}else{try{await env.DB.prepare("INSERT INTO runtime_events(level,kind,message,created_at) VALUES(?,?,?,?)").bind("INFO","telegram_contribution_delivery","Telegram notification delivered for contribution: "+title.slice(0,160),new Date().toISOString()).run()}catch(error){await recordRuntimeEventLimited(env,"api_suppressed_failure","operation_failed",error)}}return json({ok:true,status:"PENDING",notification:delivered?"sent":"failed"})}if(u.pathname==="/api/save"){if(request.method!=="POST"&&request.method!=="DELETE")return json({error:"method_not_allowed"},405);const b=await body<{slug?:string}>(request),slug=clean(b?.slug||"",200);if(!slug)return json({error:"slug_required"},400);if(request.method==="DELETE"){await env.DB.prepare("DELETE FROM saved_articles WHERE visitor_id=? AND slug=?").bind(vid,slug).run();return json({ok:true,removed:true})}await env.DB.prepare("INSERT OR IGNORE INTO saved_articles(visitor_id,slug,created_at) VALUES(?,?,?)").bind(vid,slug,new Date().toISOString()).run();return json({ok:true})}if(u.pathname==="/api/saved"){const r=await env.DB.prepare("SELECT slug,created_at FROM saved_articles WHERE visitor_id=? ORDER BY created_at DESC LIMIT 100").bind(vid).all();return json({items:r.results||[]})}if(u.pathname==="/api/like"){if(request.method!=="POST")return json({error:"method_not_allowed"},405);const b=await body<{key?:string}>(request),key=clean(b?.key||"",500);if(!key)return json({error:"key_required"},400);const existing=await env.DB.prepare("SELECT 1 AS found FROM article_likes WHERE visitor_id=? AND item_key=? LIMIT 1").bind(vid,key).first<any>();let liked=!existing;if(existing)await env.DB.prepare("DELETE FROM article_likes WHERE visitor_id=? AND item_key=?").bind(vid,key).run();else await env.DB.prepare("INSERT OR IGNORE INTO article_likes(visitor_id,item_key,created_at) VALUES(?,?,?)").bind(vid,key,new Date().toISOString()).run();const total=await env.DB.prepare("SELECT COUNT(*) AS count FROM article_likes WHERE item_key=?").bind(key).first<any>();return json({ok:true,liked,count:Number(total?.count||0)})}if(u.pathname.startsWith("/api/admin/")){if(!manager(request,env))return json({error:"unauthorized"},401);if(u.pathname==="/api/admin/telegram-test"&&request.method==="POST"){const configured=!!env.TELEGRAM_BOT_TOKEN&&!!env.TELEGRAM_CHAT_ID;if(!configured)return json({ok:false,error:"telegram_not_configured"},503);const sent=await notify(env,"BAYAN: اختبار اتصال تيليجرام ناجح.\nوقت الاختبار: "+new Date().toISOString());return json({ok:sent,error:sent?null:"telegram_delivery_failed"},sent?200:502)}if(u.pathname==="/api/admin/repair")return json(await selfHeal(env));if(u.pathname==="/api/admin/ai-repair"&&request.method==="POST"){const b=await body<{problem?:string}>(request);return json(await aiRepairRequest(env,clean(b?.problem||"",4000)));}if(u.pathname==="/api/admin/articles"&&request.method==="GET"){const r=await env.DB.prepare("SELECT slug,language,title,summary,body,section,status,image_url,image_alt,created_at,updated_at FROM articles ORDER BY updated_at DESC LIMIT 200").all();return json({items:r.results||[]})}
if(u.pathname==="/api/admin/article/expand"&&request.method==="POST"){
  const b=await body<{slug?:string;language?:string}>(request),slug=clean(b?.slug||"",200),language=b?.language==="en"?"en":"ar";
  if(!slug)return json({error:"invalid_article"},400);
  const row=await env.DB.prepare("SELECT slug,language,title,summary,body,section,sources_json FROM articles WHERE slug=? AND language=? LIMIT 1").bind(slug,language).first<any>();
  if(!row)return json({error:"article_not_found"},404);
  let storedSources:any[]=[];try{storedSources=JSON.parse(String(row.sources_json||"[]"))}catch(error){await recordRuntimeEventLimited(env,"article_sources_parse","stored_article_sources_invalid",error)}
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
  const generated=await bounded(ask(env,articlePromptForTopic(String(row.title),language,useful),language,useful),10000).catch(()=>({answer:"",status:"insufficient",sources:[]}));
  const draft=String(generated.answer||"").trim();
  if(draft.length<1800||generated.status==="insufficient")return json({ok:false,error:"draft_not_substantial",message:language==="ar"?"لم ينتج الذكاء الاصطناعي مسودة كاملة موثقة. لم يتم تغيير المقال.":"The AI did not produce a substantial evidence-based draft. The article was not changed."},502);
  return json({ok:true,draft,bodyLength:draft.length,sourceCount:domains.size,status:"DRAFT_REVIEW_REQUIRED",message:language==="ar"?"هذه مسودة للمراجعة فقط؛ راجعها ثم احفظها يدويًا.":"This is a review draft only; inspect it and save manually."});
}if(u.pathname==="/api/admin/article/revisions"&&request.method==="GET"){
 const slug=clean(u.searchParams.get("slug")||"",200),language=u.searchParams.get("language")==="en"?"en":"ar";
 if(!slug)return json({error:"slug_required"},400);
 const rows=await env.DB.prepare("SELECT id,article_slug,language,title,summary,section,status,image_url,image_alt,action,editor,created_at FROM article_revision_history WHERE article_slug=? AND language=? ORDER BY id DESC LIMIT 20").bind(slug,language).all<any>();
 return json({ok:true,revisions:rows.results||[]});
}
if(u.pathname==="/api/admin/article/restore"&&request.method==="POST"){
 const b=await body<{slug?:string;language?:string;revisionId?:number}>(request),slug=clean(b?.slug||"",200),language=b?.language==="en"?"en":"ar",revisionId=Number(b?.revisionId||0);
 if(!slug||!Number.isInteger(revisionId)||revisionId<1)return json({error:"invalid_revision"},400);
 const revision=await env.DB.prepare("SELECT * FROM article_revision_history WHERE id=? AND article_slug=? AND language=?").bind(revisionId,slug,language).first<any>();
 if(!revision)return json({error:"revision_not_found"},404);
 const current=await env.DB.prepare("SELECT * FROM articles WHERE slug=? AND language=?").bind(slug,language).first<any>();
 const now=new Date().toISOString(),title=String(revision.title||""),summary=String(revision.summary||""),articleBody=String(revision.body||""),section=String(revision.section||"world"),imageUrl=String(revision.image_url||""),imageAlt=String(revision.image_alt||""),sourcesJson=String(revision.sources_json||"[]");
 const after={slug,language,title,summary,body:articleBody,section,status:"DRAFT",image_url:imageUrl||null,image_alt:imageAlt||null,sources_json:sourcesJson,updated_at:now};
 const snapshot=current||after;
 const revisionRecord=env.DB.prepare("INSERT INTO article_revision_history(article_slug,language,title,summary,body,section,status,image_url,image_alt,sources_json,action,editor,before_json,after_json,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(slug,language,String(snapshot.title||""),String(snapshot.summary||""),String(snapshot.body||""),String(snapshot.section||"world"),String(snapshot.status||"DRAFT"),snapshot.image_url||null,snapshot.image_alt||null,String(snapshot.sources_json||"[]"),"RESTORE","BAYAN_MANAGER",current?JSON.stringify(current):null,JSON.stringify(after),now);
 if(current){
  await env.DB.batch([
   env.DB.prepare("UPDATE articles SET title=?,summary=?,body=?,section=?,status='DRAFT',image_url=?,image_alt=?,sources_json=?,updated_at=? WHERE slug=? AND language=?").bind(title,summary,articleBody,section,imageUrl||null,imageAlt||null,sourcesJson,now,slug,language),
   revisionRecord
  ]);
 }else{
  await env.DB.batch([
   env.DB.prepare("INSERT INTO articles(slug,section,language,title,summary,body,sources_json,status,image_url,image_alt,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)").bind(slug,section,language,title,summary,articleBody,sourcesJson,"DRAFT",imageUrl||null,imageAlt||null,now,now),
   revisionRecord
  ]);
 }
 return json({ok:true,slug,language,status:"DRAFT",message:language==="ar"?"تمت استعادة النسخة كمسودة للمراجعة قبل النشر.":"Revision restored as a draft for review before publishing."});
}
if(u.pathname==="/api/admin/article"&&request.method==="POST"){
 const b=await body<{slug?:string;language?:string;title?:string;summary?:string;articleBody?:string;section?:string;status?:string;imageUrl?:string;imageAlt?:string}>(request),slug=clean(b?.slug||"",200),language=b?.language==="en"?"en":"ar",title=clean(b?.title||"",500),summary=clean(b?.summary||"",2000),articleBody=clean(b?.articleBody||"",30000),section=clean(b?.section||"",80),status=["PUBLISHED","DRAFT","ARCHIVED"].includes(b?.status||"")?String(b?.status):"DRAFT",imageUrl=clean(b?.imageUrl||"",2000),imageAlt=clean(b?.imageAlt||"",300);
 if(!slug||title.length<3||!sectionBySlug(section)||!articleBody)return json({error:"invalid_article"},400);
 const before=await env.DB.prepare("SELECT * FROM articles WHERE slug=? AND language=?").bind(slug,language).first<any>();
 if(!before)return json({error:"article_not_found"},404);
 const now=new Date().toISOString(),after={...before,title,summary,body:articleBody,section,status,image_url:imageUrl||null,image_alt:imageAlt||null,updated_at:now};
 await env.DB.batch([
  env.DB.prepare("UPDATE articles SET title=?,summary=?,body=?,section=?,status=?,image_url=?,image_alt=?,updated_at=? WHERE slug=? AND language=?").bind(title,summary,articleBody,section,status,imageUrl||null,imageAlt||null,now,slug,language),
  env.DB.prepare("INSERT INTO article_revision_history(article_slug,language,title,summary,body,section,status,image_url,image_alt,sources_json,action,editor,before_json,after_json,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(slug,language,String(before.title||""),String(before.summary||""),String(before.body||""),String(before.section||"world"),String(before.status||"DRAFT"),before.image_url||null,before.image_alt||null,String(before.sources_json||"[]"),"EDIT","BAYAN_MANAGER",JSON.stringify(before),JSON.stringify(after),now)
 ]);
 return json({ok:true,revisionSaved:true});
}
if(u.pathname==="/api/admin/article/delete"&&request.method==="POST"){
 const b=await body<{slug?:string;language?:string}>(request),slug=clean(b?.slug||"",200),language=b?.language==="en"?"en":"ar";
 if(!slug)return json({error:"invalid_article"},400);
 const before=await env.DB.prepare("SELECT * FROM articles WHERE slug=? AND language=?").bind(slug,language).first<any>();
 if(!before)return json({ok:false});
 const now=new Date().toISOString();
 await env.DB.batch([
  env.DB.prepare("DELETE FROM articles WHERE slug=? AND language=?").bind(slug,language),
  env.DB.prepare("INSERT INTO article_revision_history(article_slug,language,title,summary,body,section,status,image_url,image_alt,sources_json,action,editor,before_json,after_json,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(slug,language,String(before.title||""),String(before.summary||""),String(before.body||""),String(before.section||"world"),String(before.status||"DRAFT"),before.image_url||null,before.image_alt||null,String(before.sources_json||"[]"),"DELETE","BAYAN_MANAGER",JSON.stringify(before),null,now)
 ]);
 return json({ok:true,revisionSaved:true});
}
if(u.pathname==="/api/admin/article/status"&&request.method==="POST"){
 const b=await body<{slug?:string;language?:string;status?:string}>(request),slug=clean(b?.slug||"",200),language=b?.language==="en"?"en":"ar",status=["PUBLISHED","DRAFT","ARCHIVED"].includes(b?.status||"")?String(b?.status):"";
 if(!slug||!status)return json({error:"invalid_status"},400);
 const before=await env.DB.prepare("SELECT * FROM articles WHERE slug=? AND language=?").bind(slug,language).first<any>();
 if(!before)return json({ok:false});
 const now=new Date().toISOString(),after={...before,status,updated_at:now};
 await env.DB.batch([
  env.DB.prepare("UPDATE articles SET status=?,updated_at=? WHERE slug=? AND language=?").bind(status,now,slug,language),
  env.DB.prepare("INSERT INTO article_revision_history(article_slug,language,title,summary,body,section,status,image_url,image_alt,sources_json,action,editor,before_json,after_json,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(slug,language,String(before.title||""),String(before.summary||""),String(before.body||""),String(before.section||"world"),String(before.status||"DRAFT"),before.image_url||null,before.image_alt||null,String(before.sources_json||"[]"),"STATUS","BAYAN_MANAGER",JSON.stringify(before),JSON.stringify(after),now)
 ]);
 return json({ok:true,revisionSaved:true});
}
if(u.pathname==="/api/admin/article-image"&&request.method==="POST"){
 const b=await body<{slug?:string;language?:string;imageUrl?:string;imageAlt?:string}>(request),slug=clean(b?.slug||"",200),language=b?.language==="en"?"en":"ar",imageUrl=clean(b?.imageUrl||"",2000),imageAlt=clean(b?.imageAlt||"",300);
 if(!slug||!imageUrl)return json({error:"invalid_image_update"},400);
 const before=await env.DB.prepare("SELECT * FROM articles WHERE slug=? AND language=? AND status='PUBLISHED'").bind(slug,language).first<any>();
 if(!before)return json({error:"article_not_found"},404);
 const now=new Date().toISOString(),after={...before,image_url:imageUrl,image_alt:imageAlt||null,updated_at:now};
 await env.DB.batch([
  env.DB.prepare("UPDATE articles SET image_url=?,image_alt=?,updated_at=? WHERE slug=? AND language=? AND status='PUBLISHED'").bind(imageUrl,imageAlt||null,now,slug,language),
  env.DB.prepare("INSERT INTO article_revision_history(article_slug,language,title,summary,body,section,status,image_url,image_alt,sources_json,action,editor,before_json,after_json,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(slug,language,String(before.title||""),String(before.summary||""),String(before.body||""),String(before.section||"world"),String(before.status||"PUBLISHED"),before.image_url||null,before.image_alt||null,String(before.sources_json||"[]"),"IMAGE","BAYAN_MANAGER",JSON.stringify(before),JSON.stringify(after),now)
 ]);
 return json({ok:true,revisionSaved:true});
}
if(u.pathname==="/api/admin/contributions"){const r=await env.DB.prepare("SELECT id,title,body,source,section,status,reviewer_note,created_at FROM contributions ORDER BY created_at DESC LIMIT 100").all();return json({items:r.results||[]})}if(u.pathname==="/api/admin/contributions/review"&&request.method==="POST"){const b=await body<{id?:number;action?:"APPROVE"|"REJECT";note?:string}>(request);if(!b?.id||!b.action)return json({error:"invalid_review"},400);await reviewContribution(env,b.id,b.action,clean(b.note||"",2000));await notify(env,"BAYAN: مساهمة "+b.id+" → "+b.action);return json({ok:true})}if(u.pathname==="/api/admin/searches"){const r=await env.DB.prepare("SELECT * FROM searches ORDER BY created_at DESC LIMIT 100").all();return json({items:r.results||[]})}if(u.pathname==="/api/admin/runtime"){const r=await env.DB.prepare("SELECT * FROM runtime_events ORDER BY created_at DESC LIMIT 100").all();return json({items:r.results||[]})}if(u.pathname==="/api/admin/repairs"){const r=await env.DB.prepare("SELECT * FROM repair_jobs ORDER BY updated_at DESC LIMIT 100").all();return json({items:r.results||[]})}if(u.pathname==="/api/admin/analytics"){const stats=await analyticsStats(env,lang);const recent=await env.DB.prepare("SELECT event,path,language,created_at FROM analytics ORDER BY created_at DESC LIMIT 50").all();return json({...stats,recent:recent.results||[]})}if(u.pathname==="/api/admin/settings"){if(request.method==="GET"){const r=await env.DB.prepare("SELECT key,value,updated_at FROM admin_settings ORDER BY key").all();return json({items:r.results||[]})}if(request.method==="POST"){const b=await body<{key?:string;value?:string}>(request);const allowed=new Set(["min_sources","max_sources","image_required","image_fallback","auto_repair","news_items","search_timeout_ms","source_wikipedia","source_wikidata","source_gdelt","source_openalex","source_ai_search"]);if(!b?.key||!allowed.has(b.key)||typeof b.value!=="string")return json({error:"invalid_setting"},400);await env.DB.prepare("INSERT INTO admin_settings(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at").bind(b.key,clean(b.value,100),new Date().toISOString()).run();return json({ok:true,key:b.key,value:b.value})}}}return json({error:"not_found"},404)}