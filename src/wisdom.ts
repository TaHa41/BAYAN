import type { Locale } from "./types";

/**
 * Curated, original BAYAN wisdom lines.
 * These are editorial prompts, not quotations attributed to real people.
 * Keep each line useful, topic-specific, and short enough for the site footer.
 * Source-contract markers: news:{ar: and art:{ar: remain dedicated topic pools.
 */
const wisdom: Record<string, { ar: string[]; en: string[] }> = {
  egypt: {
    ar: ["المعلومة المحلية تصبح أقوى حين نعرف مصدرها وزمنها.", "ما يهم الناس يبدأ من تفاصيل الحياة اليومية.", "الخبر المفيد لا يكتفي بما حدث؛ يوضح لماذا يهم.", "التفصيل الصغير قد يغيّر فهم مشكلة محلية كاملة.", "لا تقارن خدمتين أو سعرين قبل التأكد من المكان والتاريخ.", "اسأل من يتأثر بالقرار، لا من يتحدث عنه فقط."],
    en: ["Local knowledge gets stronger when its source and timing are clear.", "What matters to people often starts with everyday details.", "Useful news does more than say what happened; it explains why it matters.", "A small detail can change how a local issue is understood.", "Do not compare services or prices before checking place and date.", "Ask who is affected by a decision, not only who is talking about it."]
  },
  arab: {
    ar: ["فهم المنطقة يحتاج إلى أكثر من عنوان واحد.", "السياق يغيّر معنى الخبر.", "مقارنة الروايات تكشف ما تثبته الأدلة وما لا تثبته.", "التشابه بين المجتمعات لا يلغي اختلاف ظروفها.", "الخبر الإقليمي يحتاج إلى صوت محلي ومصدر قابل للفحص.", "افصل بين ما حدث فعلًا وما يُقال إنه يعنيه."],
    en: ["Understanding a region takes more than one headline.", "Context can change the meaning of a story.", "Comparing accounts shows what the evidence does and does not establish.", "Similarities between societies do not erase their different circumstances.", "Regional news needs local perspectives and checkable sources.", "Separate what happened from what people say it means."]
  },
  world: {
    ar: ["العالم مترابط؛ خبر بعيد قد يصنع أثرًا قريبًا.", "السرعة لا تعني دائمًا الدقة.", "كل حدث كبير يحتاج إلى سياق قبل الحكم عليه.", "اختلاف الروايات سبب للفحص، لا مبرر لاختيار الأسهل.", "المعلومة العابرة للحدود تحتاج إلى تاريخ ومكان واضحين.", "افهم الصورة الأوسع قبل تعميم حالة واحدة."],
    en: ["The world is connected; a distant event can create a local effect.", "Speed does not always mean accuracy.", "Every major event needs context before judgment.", "Conflicting accounts call for checking, not choosing the easiest one.", "Cross-border information needs a clear date and place.", "Understand the wider picture before generalizing from one case."]
  },
  news: {
    ar: ["عنوان الخبر بداية الفحص وليس نهايته.", "تاريخ النشر جزء من صدق الخبر.", "قارن المصادر قبل أن تعتمد رواية واحدة.", "تكرار الخبر في مواقع كثيرة لا يعني تعدد مصادره.", "ابحث عن الوثيقة أو التصريح الأصلي متى أمكن.", "إذا غاب الدليل، يجب أن يظهر هذا النقص بوضوح."],
    en: ["A headline begins verification; it does not finish it.", "Publication time is part of a story’s credibility.", "Compare sources before relying on a single account.", "A story repeated by many sites does not necessarily have many sources.", "Look for the original document or statement when possible.", "When evidence is missing, make that limitation clear."]
  },
  art: {
    ar: ["الفن يُفهم بسياقه كما يُفهم بأثره.", "الذوق يختلف، لكن نسبة العمل إلى صاحبه حقيقة قابلة للتحقق.", "قراءة العمل تبدأ بمعرفة زمنه وظروفه.", "ميّز بين رأيك في العمل والمعلومة عن صاحبه.", "الاقتباس لا يغني عن ذكر صاحبه ومصدره.", "السياق يثري التفسير ولا يفرض قراءة واحدة."],
    en: ["Art is understood through context as well as impact.", "Taste differs, but authorship is a verifiable fact.", "Understanding a work begins with its time and circumstances.", "Separate your opinion of a work from facts about its creator.", "A quotation does not replace crediting its author and source.", "Context enriches interpretation without requiring a single reading."]
  },
  science: {
    ar: ["السؤال الجيد بداية المعرفة، والدليل هو ما يختبرها.", "الاكتشاف لا يصبح حقيقة لمجرد انتشاره.", "النتيجة العلمية أقوى عندما يمكن فحص طريقتها ومصدرها.", "الارتباط بين شيئين لا يثبت وحده أن أحدهما سبب الآخر.", "غياب الدليل ليس دائمًا دليلًا على الغياب.", "النتيجة القوية تذكر حدودها بوضوح."],
    en: ["A good question starts knowledge; evidence tests it.", "A discovery is not a fact simply because it spreads.", "Scientific findings are stronger when their method and source can be examined.", "An association alone does not prove that one thing caused another.", "Absence of evidence is not always evidence of absence.", "A strong finding states its limits clearly."]
  },
  economy: {
    ar: ["الرقم بلا تاريخ ووحدة وسياق قد يضلل.", "الأسعار تتغير، لذلك الزمن جزء من المعلومة.", "فهم الاقتصاد يبدأ بتمييز الخبر عن التوقع.", "قارن النسب إلى خط أساس واحد قبل استخلاص النتيجة.", "المتوسط قد يخفي فروقًا مهمة بين الناس.", "التوقع الاقتصادي احتمال وليس نتيجة مضمونة."],
    en: ["A number without a date, unit and context can mislead.", "Prices change, so time is part of the information.", "Understanding economics starts by separating news from forecasts.", "Compare percentages against the same baseline before drawing conclusions.", "An average can hide important differences between people.", "An economic forecast is a possibility, not a guaranteed outcome."]
  },
  politics: {
    ar: ["الادعاء السياسي يحتاج إلى مصدر مستقل قبل أن يصبح حقيقة.", "القرار أهم حين نفهم نصه وأثره لا عنوانه فقط.", "الخلاف في السياسة لا يلغي ضرورة التحقق من الوقائع.", "فرّق بين نص القرار وتفسير الأطراف له.", "الوعود ليست نتائج؛ قارنها بما نُفذ فعلًا.", "لا تجعل الانتماء بديلًا عن فحص الدليل."],
    en: ["A political claim needs independent evidence before it becomes a fact.", "A decision matters more when its text and impact are understood, not just its headline.", "Political disagreement does not remove the need to verify facts.", "Separate the text of a decision from how parties interpret it.", "Promises are not outcomes; compare them with what was implemented.", "Do not let affiliation replace examination of evidence."]
  },
  technology: {
    ar: ["التقنية أداة؛ قيمتها في ما تحله لا في ضجيجها.", "الذكاء الاصطناعي يساعد في العمل، لكنه لا يلغي التحقق.", "الميزة الجديدة لا تعني بالضرورة نتيجة أفضل.", "اختبر الأداة على مهمة حقيقية قبل الحكم عليها.", "حماية البيانات جزء من جودة أي منتج رقمي.", "الأتمتة الجيدة تقلل الأخطاء ولا تخفيها."],
    en: ["Technology is a tool; its value lies in what it solves.", "AI can assist work, but it does not remove the need to verify.", "A new feature does not necessarily mean a better outcome.", "Test a tool on a real task before judging it.", "Data protection is part of a digital product’s quality.", "Good automation reduces errors instead of hiding them."]
  },
  health: {
    ar: ["المعلومة الصحية الجيدة تذكر حدود الدليل.", "ليس كل ما ينتشر نصيحة طبية.", "في الصحة، مصدر موثوق أهم من عنوان مثير.", "تختلف الاستجابة للعلاج، فلا تعمم تجربة فردية.", "اسأل عن جودة الدراسة لا عن نتيجتها فقط.", "المعلومات العامة لا تغني عن تقييم مختص للحالة الفردية."],
    en: ["Good health information makes the limits of evidence clear.", "Not everything that spreads is medical advice.", "In health, a reliable source matters more than a dramatic headline.", "Treatment responses differ; do not generalize from one person’s experience.", "Ask about a study’s quality, not only its result.", "General information cannot replace a professional assessment of an individual case."]
  },
  history: {
    ar: ["الماضي لا يتغير، لكن فهمه يتطور مع ظهور الأدلة.", "التاريخ يحتاج إلى مصدر وسياق، لا إلى حكاية واحدة.", "ما بقي من الماضي قد يخبرنا بقدر ما فُقد منه.", "افصل بين الوثيقة الأصلية والرواية اللاحقة عنها.", "ضع الحدث في زمنه قبل تقييمه بمعايير اليوم.", "التفسير التاريخي يقوى حين يواجه الأدلة المخالفة."],
    en: ["The past does not change, but our understanding can improve as evidence appears.", "History needs sources and context, not a single story.", "What survives from the past can tell us as much as what was lost.", "Separate an original document from later accounts of it.", "Place an event in its time before judging it by today’s standards.", "Historical interpretation grows stronger when it confronts contrary evidence."]
  },
  people: {
    ar: ["الشخصية تُفهم من أفعالها الموثقة لا من الصورة المتداولة عنها.", "السيرة الجيدة تفرق بين الحقيقة والانطباع.", "الإنجاز يصبح أوضح عندما نعرف زمنه ومصدره.", "تحقق من الاسم والهوية قبل جمع المعلومات عن شخص.", "لا تختزل حياة طويلة في واقعة واحدة.", "الرأي في الشخص ليس بديلًا عن توثيق سيرته."],
    en: ["A person is understood through documented actions, not just their public image.", "A good biography separates fact from impression.", "An achievement becomes clearer when its date and source are known.", "Verify a person’s identity before combining information about them.", "Do not reduce a long life to one event.", "An opinion about a person is not a substitute for a sourced biography."]
  },
  sports: {
    ar: ["الأرقام الرياضية تحتاج إلى سياق قبل المقارنة.", "النتيجة لحظة؛ السجل قصة أطول.", "الإحصاء الجيد يشرح الأداء بدل أن يستبدل القصة برقم.", "قارن اللاعبين في الموسم والبطولة نفسيهما قدر الإمكان.", "الرقم القياسي يحتاج إلى مصدر وتاريخ وتعريف واضح.", "الأداء لا يُختزل في إحصائية واحدة."],
    en: ["Sports numbers need context before comparison.", "A result is a moment; a record is a longer story.", "Good statistics explain performance rather than replacing the story with a number.", "Compare players in the same season and competition where possible.", "A record needs a source, date and clear definition.", "Performance cannot be reduced to one statistic."]
  },
  travel: {
    ar: ["الرحلة الأفضل تبدأ بمعلومة حديثة.", "الوجهة الجميلة لا تكفي إذا كانت القواعد غير واضحة.", "تفاصيل صغيرة في السفر قد تصنع فرقًا كبيرًا.", "تحقق من ساعات العمل والأسعار قبل الانطلاق.", "تختلف التجربة حسب الموسم والطقس وإمكانية الوصول.", "استخدم أكثر من مصدر عند التخطيط لقرار مهم."],
    en: ["A better trip starts with current information.", "A beautiful destination is not enough if the rules are unclear.", "Small travel details can make a big difference.", "Check opening hours and prices before setting out.", "Experiences differ by season, weather and accessibility.", "Use more than one source when planning an important decision."]
  },
  trends: {
    ar: ["الانتشار دليل على الاهتمام، وليس دليلًا على صحة الادعاء.", "الترند إشارة تستحق الفحص، لا حكمًا نهائيًا.", "قبل مشاركة الرائج، ابحث عن أصله وتاريخه.", "الضجة قد تكبر أسرع من الأدلة.", "ميّز بين عدد المشاهدات ومدى صحة المعلومة.", "الموضوع الرائج يستحق سؤالًا جيدًا لا مشاركة متسرعة."],
    en: ["Popularity signals interest, not truth.", "A trend is a signal worth checking, not a final verdict.", "Before sharing what is trending, check its origin and date.", "Attention can grow faster than evidence.", "Distinguish view counts from the truth of a claim.", "A trending topic deserves a good question, not a rushed share."]
  },
  prices: {
    ar: ["الرقم الحي له قيمة حين نعرف مصدره ووقت تحديثه.", "قارن الأرقام على أساس واحد قبل اتخاذ القرار.", "البيانات تتكلم أفضل عندما نعرف كيف جُمعت.", "السعر المعروض قد يختلف عن السعر النهائي بعد الرسوم.", "لا تقارن عملتين أو سلعتين دون توحيد الوحدة.", "إذا تأخر التحديث، يجب أن يظهر وقت آخر تحديث بوضوح."],
    en: ["Live numbers matter more when their source and update time are clear.", "Compare figures on the same basis before deciding.", "Data speaks more clearly when we know how it was collected.", "The displayed price may differ from the final price after fees.", "Do not compare currencies or goods without aligning the units.", "If an update is delayed, show the last update time clearly."]
  }
};

/**
 * Rotate every 30 seconds, with a larger topic-specific pool.
 * Optional timestamp makes the rotation deterministic and easy to test.
 */
export function wisdomFor(section: string, language: Locale, now?: number): string {
  const set = wisdom[section] || wisdom.world;
  const items = set[language] || set.ar;
  const slot = Math.floor(now === undefined ? Date.now()/1000/30 : now/1000/30);
  const index = ((slot % items.length) + items.length) % items.length;
  return items[index];
}
