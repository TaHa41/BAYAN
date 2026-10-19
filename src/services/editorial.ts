import type {Locale,SearchResult} from "../types";

const normalized=(value:string)=>String(value||"").normalize("NFKC").toLowerCase().replace(/[\u064B-\u065F\u0670]/g,"").replace(/[^\p{L}\p{N}\s]/gu," ").replace(/\s+/g," ").trim();

/** Classify the article by the subject actually evidenced, not just the search query. */
export function sectionForOpenedStory(title:string,summary:string){
 const t=normalized(title),s=normalized(summary),all=t+" "+s;
 const biographyIntent=/(?:biography|biographical|who is|who was|life and work|life of|career of|born in|born on|من هو|من هي|سيرة|حياته|حياتها|نشأته|نشأتها|ولد|ولدت|مسيرته|مسيرتها|إرثه|إرثها|حياتها وأبحاثها|حياته وأعماله)/i.test(t);
 const focused= t+" "+s;
 if(/(?:public consultation|public consultations|citizen participation|public affairs|public institutions|governance|public decision|المشاورات العامة|المشاركة العامة|المشاركة المدنية|المؤسسات العامة|القرار العام|القرارات العامة|الشأن العام)/i.test(focused))return "politics";
 if(/(?:primary sources|historian|historians|historical source|المصادر الأولية|مصادر أولية|المؤرخون|المؤرخ|وثائق تاريخية)/i.test(focused))return "history";
 if(/(?:public opinion polls?|opinion polls?|polling methodology|استطلاعات الرأي العام|استطلاع الرأي العام)/i.test(focused))return "trends";
 const biographicalEvidence=/(?:biography|biographical|physicist|chemist|novelist|writer|author|scientist|poet|inventor|actor|actress|politician|footballer|born in|born on|award winner|سيرة|فيزيائي|فيزيائية|كيميائي|كيميائية|روائي|روائية|كاتب|كاتبة|عالم|عالمة|شاعر|شاعرة|مخترع|مخترعة|ممثل|ممثلة|ولد في|ولدت في|حصل على جائزة|حصلت على جائزة|جائزة نوبل|مسيرته|مسيرتها)/i.test(s);
 if(biographyIntent||(biographicalEvidence&&/(?:^|[:—-])/.test(String(title))&&t.split(" ").length<=12))return "people";
 if(/(?:global shift|systemic shift|cross border transformation|cross-border transformation|global supply chains|international system change|تحولات كبرى|تحول عالمي|تغيرات عابرة للحدود|تحول في النظام الدولي)/i.test(all))return "unclassified";
 if(/(?:football|soccer|basketball|tennis|league|championship|tournament|match|goal|athlete|coach|sports?|رياضة|مباراة|الدوري|بطولة|منتخب|لاعب|مدرب|هدف|نتيجة المباراة|إحصاءات رياضية)/i.test(all))return "sports";
 if(/(?:health|medical|medicine|hospital|disease|vaccine|doctor|symptom|treatment|clinical trial|hypertension|blood pressure|cardiology|ضغط الدم|ارتفاع ضغط الدم|صحة|طب|مستشفى|مرض|لقاح|طبيب|أعراض|علاج|تجربة سريرية|دواء|وقاية)/i.test(all))return "health";
 if(/(?:technology|artificial intelligence|software|cybersecurity|chip|robot|programming|algorithm|تقنية|تكنولوجيا|ذكاء اصطناعي|برمجيات|أمن سيبراني|رقائق|روبوت|برمجة|خوارزمية)/i.test(all))return "technology";
 if(/(?:live price|current price|exchange rate|currency rate|gold price today|stock quote|live market data|current temperature|weather now|أسعار مباشرة|سعر الصرف|سعر الذهب اليوم|أسعار الآن|الأسعار الآن|سعر الدولار اليوم|سعر السهم|بيانات السوق المباشرة|درجة الحرارة الآن|الطقس الآن)/i.test(all))return "prices";
 if(/(?:economy|economic|market|stock|inflation|currency|bank|trade|gdp|finance|gold price|ipo|initial public offering|shares|share listing|food inflation|rice|sugar|imf|economics meeting|اقتصاد|اقتصادي|سوق|أسهم|تضخم|عملة|بنك|تجارة|ناتج محلي|تمويل|سعر الذهب|دولار|طرح أسهم|طرح عام أولي|إدراج أسهم|تضخم غذائي|الأرز|السكر|صندوق النقد)/i.test(all))return "economy";
 if(/(?:election|president|parliament|government|minister|policy|politics|diplomacy|legislation|sanction|انتخابات|رئيس|برلمان|حكومة|وزير|سياسة|دبلوماسية|تشريع|عقوبات|قانون جديد)/i.test(all))return "politics";
 if(/(?:science|scientific|research|discovery|space|nasa|astronomy|physics|chemistry|biology|planet|universe|study finds|علم|بحث علمي|اكتشاف|فضاء|ناسا|فلك|فيزياء|كيمياء|أحياء|كوكب|الكون|دراسة علمية)/i.test(all))return "science";
 if(/(?:history|historical|heritage|archaeology|civilization|ancient|تاريخ|تاريخي|تراث|آثار|حضارة|قديم|العصور الوسطى)/i.test(all))return "history";
 if(/(?:film|movie|music|actor|actress|celebrity|artist|book review|novel|poetry|painting|theatre|cinema|الفن|فيلم|سينما|موسيقى|ممثل|ممثلة|فنان|كتاب|رواية|شعر|لوحة|مسرح|أدب)/i.test(all))return "art";
 if(/(?:travel|tourism|airport|flight|hotel|destination|visa|trip|سفر|سياحة|مطار|رحلة|فندق|وجهة|تأشيرة|إقامة سياحية)/i.test(all))return "travel";
 if(/(?:trend|viral|popular on social media|survey|poll|public opinion|ترند|متداول|رائج|استطلاع|رأي عام|انتشار على وسائل التواصل)/i.test(all))return "trends";
 
 if(/(?:idea|ideas|debate|philosophy|philosophical|argument|ethics|ethical dilemma|critical thinking|viewpoint|opinion piece|intellectual discussion|أفكار|فكرة|نقاش|نقاشات|فلسفة|فلسفي|جدل|حجة|أخلاقيات|معضلة أخلاقية|تفكير نقدي|وجهة نظر|رأي|آراء|قضية فكرية|حوار فكري)/i.test(all))return "arab";
 if(/(?:community|communities|society|social issue|public service|daily life|housing|family policy|cost of living|مجتمع|مجتمعات|قضية اجتماعية|قضايا اجتماعية|خدمة عامة|خدمات عامة|الحياة اليومية|السكن|الأسرة|تكلفة المعيشة|المعيشة|السكان)/i.test(all))return "egypt";
 if(/(?:breaking|latest|today|reported|announced|statement|press release|عاجل|آخر التطورات|اليوم|أعلنت|أعلن|بيان رسمي|تطورات جديدة)/i.test(all))return "news";
 return "world";
}

/**
 * Strict display/persistence gate. Unknown or merely generic material must not
 * be assigned to a specialist section; "world" is reserved for evidenced
 * cross-border/systemic changes rather than acting as a catch-all.
 */
export function isContentForSection(section:string,title:string,summary:string){
 const t=normalized(title),s=normalized(summary),all=t+" "+s;
 if(!section||!t||!s)return false;
 const inferred=sectionForOpenedStory(title,summary);
 if(inferred!==section){
  if(section==="travel"&&/(?:transit|transport|transportation|commute|public transport|تنقل|مواصلات|النقل|وسائل النقل)/i.test(all))return true;
  return false;
 }
 if(section==="world")return /(?:global|worldwide|cross border|cross-border|international system|systemic change|global shift|climate change|supply chain|عالمي|عالمية|عبر الحدود|تحولات كبرى|تغير المناخ|سلاسل الإمداد|النظام الدولي|تحول عالمي)/i.test(all);
 if(section==="news")return /(?:breaking|latest|today|reported|announced|statement|press release|عاجل|آخر التطورات|اليوم|أعلنت|أعلن|بيان رسمي|تطورات جديدة)/i.test(all);
 return true;
}

const templates:Record<string,{ar:string;en:string}>={
 people:{
  ar:"استخدم بنية سيرة شخصية مناسبة للأدلة: تعريف موجز بالشخص وهويته، النشأة والتعليم، المسار المهني أو العلمي، الأعمال والإنجازات المثبتة، الجوائز أو المحطات المهمة إن وُجدت، السياق التاريخي، الإرث والتقييمات المنسوبة لأصحابها. لا تفترض أن كل شخصية لها كل هذه المحطات. ميّز الوقائع المؤرخة عن التقييمات، ولا تخلط بين أصحاب الأسماء المتشابهة.",
  en:"Use a biography structure suited to the evidence: identity and concise overview, early life and education, professional or scientific path, documented works and achievements, awards or milestones where applicable, historical context, and legacy with attributed assessments. Do not assume every person has every milestone. Separate dated facts from interpretation and never merge namesakes."
 },
 news:{
  ar:"استخدم بنية خبرية تفسيرية: ماذا حدث، متى وأين، الأطراف المعنية، التسلسل الزمني، ما تؤكده المصادر المستقلة، ما يختلف عليه الناشرون، السياق والأثر المحتمل، وما لم يتأكد بعد. احتفظ بتاريخ الحدث وتاريخ النشر منفصلين. لا تعرض خبرًا قديمًا كأنه جديد، ولا تحول التوقعات إلى وقائع.",
  en:"Use an explanatory news structure: what happened, when and where, parties involved, timeline, facts corroborated by independent sources, disagreements between publishers, context and possible impact, and what remains unconfirmed. Distinguish event date from publication date. Never present old news as current or predictions as facts."
 },
 health:{
  ar:"استخدم بنية صحية مسؤولة: الموضوع وتعريفه، ما تقوله الأدلة الطبية، الأعراض أو عوامل الخطر إذا كانت ذات صلة، طرق الوقاية أو العلاج المدروسة، حدود الدراسات والمخاطر، ومتى يلزم الرجوع إلى مختص. لا تشخّص القارئ، ولا تقدم جرعات أو توصيات علاجية شخصية، ولا تساوِ بين دراسة أولية وإجماع طبي.",
  en:"Use a responsible health structure: topic and definition, what medical evidence says, symptoms or risk factors when relevant, studied prevention or treatment options, limitations and risks, and when to consult a qualified clinician. Do not diagnose readers or provide personalized dosing. Do not equate a preliminary study with medical consensus."
 },
 science:{
  ar:"استخدم بنية علمية: السؤال أو الظاهرة، الخلفية، المنهج أو طريقة القياس إن توفرت، النتائج التي تدعمها المصادر، الفرق بين النتيجة والتفسير، القيود وعدم اليقين، وما الذي يحتاج إلى بحث إضافي. اذكر نوع الدليل ولا تخترع أرقامًا أو تفاصيل منهجية.",
  en:"Use a scientific structure: question or phenomenon, background, method or measurement when available, findings supported by sources, distinction between result and interpretation, limitations and uncertainty, and open research questions. Identify the type of evidence; do not invent numbers or methodological details."
 },
 technology:{
  ar:"استخدم بنية تقنية: ما التقنية وما المشكلة التي تعالجها، كيف تعمل بمستوى مفهوم، التطبيقات الفعلية، المزايا والقيود، الأمن والخصوصية أو الأثر الاجتماعي عند الصلة، ومقارنة البدائل إذا دعمتها الأدلة. افصل بين الميزات المعلنة والميزات المختبرة فعليًا.",
  en:"Use a technology structure: what the technology is and the problem it addresses, how it works at an accessible level, real applications, benefits and limitations, security/privacy or social impact where relevant, and evidence-backed comparisons. Separate advertised capabilities from independently tested performance."
 },
 economy:{
  ar:"استخدم بنية اقتصادية: تعريف المؤشر أو القضية، الفترة والمكان، الأرقام مع مصدرها ووحداتها، الاتجاه مقارنة بالفترات السابقة، العوامل المحتملة، الأثر على الفئات المختلفة، وحدود البيانات. ميّز الارتباط عن السببية ولا تخلط بين الأسعار الاسمية والحقيقية أو بين التوقعات والنتائج.",
  en:"Use an economic structure: define the indicator or issue, specify time period and geography, report figures with source and units, compare trends over time, explain plausible drivers, discuss impacts across groups, and state data limitations. Distinguish correlation from causation, nominal from real values, and forecasts from outcomes."
 },
 politics:{
  ar:"استخدم بنية للشأن العام: القرار أو القضية، الخلفية القانونية والسياسية، الجهات ومواقفها المنسوبة إلى مصادر، التسلسل الزمني، ما تغير فعليًا وما يزال مقترحًا، الآثار المحتملة، والنقاط المختلف عليها. لا تنسب نوايا غير موثقة ولا تقدم ادعاءات طرف واحد باعتبارها حقيقة مستقلة.",
  en:"Use a public-affairs structure: the decision or issue, legal and political background, stakeholders and attributed positions, timeline, what has actually changed versus what is proposed, potential implications, and disputed points. Do not infer undocumented motives or present one party's claim as independently established fact."
 },
 sports:{
  ar:"استخدم بنية رياضية: المسابقة أو الحدث وتاريخه، الفرق أو اللاعبون، النتيجة والإحصاءات مع مصدرها، سياق الأداء، أثر النتيجة في الترتيب أو المسيرة، وما لم يتأكد من انتقالات أو إصابات. اربط الإحصاءات بالموسم أو المباراة المحددة ولا تفترض النادي الحالي من معلومات قديمة.",
  en:"Use a sports structure: competition/event and date, teams or athletes, sourced score and statistics, performance context, impact on standings or career, and unconfirmed transfer or injury information. Tie statistics to a specific match or season and never infer a current club from outdated information."
 },
 history:{
  ar:"استخدم بنية تاريخية: الفترة والمكان، السياق السابق، التسلسل الزمني، الشخصيات والمؤسسات، الأدلة التاريخية الأساسية، تفسيرات المؤرخين عند وجودها، وما لا يزال محل خلاف. افصل بين الوثيقة التاريخية والتفسير اللاحق وتجنب إسقاط مفاهيم الحاضر بلا سياق.",
  en:"Use a historical structure: period and place, preceding context, chronology, key people and institutions, primary historical evidence, historians' interpretations where available, and remaining disputes. Separate historical documents from later interpretation and avoid anachronism."
 },
 art:{
  ar:"استخدم بنية ثقافية أو نقدية: تعريف العمل أو الفنان، السياق والإنتاج، السمات الفنية، الأعمال أو الأمثلة ذات الصلة، الاستقبال النقدي مع نسب الآراء إلى أصحابها، التأثير والإرث، وما هو رأي نقدي لا حقيقة قابلة للقياس.",
  en:"Use a cultural or critical structure: identify the work or artist, production and context, artistic characteristics, relevant examples, reception with opinions attributed to critics, influence and legacy, and distinguish criticism from verifiable fact."
 },
 travel:{
  ar:"استخدم بنية عملية للمكان أو السفر: الموقع والخصائص، أفضل وقت بحسب الأدلة المناخية، الوصول والتنقل، المعالم والخدمات، التكاليف أو شروط الدخول إذا توفرت مصادر حديثة، السلامة وإمكانية الوصول، وما يتغير بمرور الوقت. لا تخترع أسعارًا أو متطلبات تأشيرة.",
  en:"Use a practical destination structure: location and characteristics, best time based on climate evidence, access and transport, sights and services, costs or entry rules only when supported by current sources, safety and accessibility, and details that change over time. Never invent prices or visa requirements."
 },
 trends:{
  ar:"استخدم بنية للاتجاهات: ما الظاهرة، الفترة والبيانات المتاحة، حجم العينة والمنهج إن وُجدا، من يتبناها ومن لا يتبناها، التفسيرات البديلة، والفرق بين الانتشار على منصة واحدة والرأي العام. لا تعتبر التفاعل الرقمي ممثلًا تلقائيًا للمجتمع.",
  en:"Use a trends structure: define the phenomenon, time period and available data, sample and method when known, who participates and who does not, alternative explanations, and the distinction between activity on one platform and public opinion. Online engagement is not automatically representative of society."
 },
 world:{
  ar:"استخدم بنية تفسيرية مناسبة للموضوع: خلاصة، خلفية وسياق، شرح أو تسلسل زمني، ما تؤكده المصادر، نقاط الاتفاق والاختلاف، الأثر والأهمية، حدود الأدلة والأسئلة المفتوحة، وخاتمة تضيف معنى ولا تكرر المقدمة.",
  en:"Use a topic-appropriate explainer structure: overview, background and context, explanation or chronology, what sources establish, areas of agreement and disagreement, implications and significance, evidence limits and open questions, and a conclusion that adds meaning rather than repeating the introduction."
 },
 egypt:{ar:"ضع الموضوع في سياق المجتمع المصري فقط عندما تؤيده المصادر؛ اشرح المكان والفئات المتأثرة والخدمات أو السياسات ذات الصلة، وافصل بين البيانات الرسمية والتجارب الفردية. لا تعمم من حالة واحدة على جميع المصريين.",en:"Place the topic in Egyptian social context only when evidence supports it; explain affected communities, services or policies, and distinguish official data from individual experiences. Do not generalize from one case to all Egyptians."},
 arab:{ar:"اعرض السياق العربي مع توضيح اختلاف البلدان والمؤسسات والتجارب؛ انسب الآراء لأصحابها، ولا تفترض أن الدول أو المجتمعات العربية تتبنى موقفًا واحدًا.",en:"Present Arab-region context while distinguishing countries, institutions and experiences. Attribute viewpoints and never assume Arab countries or communities share one position."}
};

export function articlePromptForTopic(title:string,language:Locale,evidence:SearchResult[]=[]){
 const evidenceText=evidence.slice(0,8).map(item=>String(item.title||"")+" "+String(item.summary||"")).join(" ");
 const inferred=sectionForOpenedStory(title,evidenceText);
 const healthEvidence=/(?:health|medical|medicine|hospital|disease|vaccine|doctor|symptom|treatment|clinical trial|hypertension|blood pressure|cardiology|ضغط الدم|ارتفاع ضغط الدم|صحة|طب|مستشفى|مرض|لقاح|طبيب|أعراض|علاج|تجربة سريرية|دواء|وقاية)/i.test(normalized(title+" "+evidenceText));
 const section=healthEvidence?"health":inferred;
 const lang=language==="ar"?"ar":"en";
 const structure=(templates[section]||templates.world)[lang];
 const lead=lang==="ar"
  ?"اكتب مقالًا معرفيًا أصليًا ومترابطًا باللغة العربية الفصحى عن: "
  :"Write a coherent, original knowledge article in English about: ";
 const rules=lang==="ar"
  ?"\nقواعد إلزامية: استهدف 700 إلى 1000 كلمة عندما تسمح الأدلة، واستخدم 4 عناوين فرعية أو أكثر، وفقرات مترابطة غير مكررة، ومقدمة وخاتمة واضحتين. استند فقط إلى الأدلة المرفقة؛ اربط الادعاءات المهمة بمصدر محدد في النص بصياغة واضحة مثل (وفقًا لـ...). لا تخترع أسماء أو تواريخ أو أرقامًا أو اقتباسات أو روابط. إذا تعارض مصدران فاشرح التعارض وانسب كل قول لمصدره. إذا لم تدعم الأدلة معلومة فلا تعرضها كحقيقة؛ اذكر أن التحقق غير مكتمل. حافظ على لغة عربية خالصة دون خلط غير ضروري بالإنجليزية، ولا تنسخ فقرات المصادر حرفيًا."
  :"\nMandatory rules: aim for 700–1000 words when the evidence supports that length; use at least four subheadings, connected non-repetitive paragraphs, and a clear introduction and conclusion. Use only the supplied evidence; tie important claims to a specific source in prose. Never invent names, dates, numbers, quotations, or URLs. If sources conflict, explain the conflict and attribute each claim. If evidence does not support a detail, do not state it as fact; mark verification incomplete. Keep the article in English and do not copy source paragraphs verbatim.";
 return lead+title+"\n\n"+structure+rules;
}
