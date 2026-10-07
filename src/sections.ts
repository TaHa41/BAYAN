export type Locale="ar"|"en";
export type Section={slug:string;ar:string;en:string;descriptionAr:string;descriptionEn:string;icon:string};
export const sections:Section[]=[
{slug:"egypt",ar:"مصر",en:"Egypt",descriptionAr:"أخبار ومعرفة ووقائع موثقة عن مصر.",descriptionEn:"Verified news, knowledge and facts about Egypt.",icon:"🇪🇬"},
{slug:"arab",ar:"العالم العربي",en:"Arab World",descriptionAr:"المعرفة والأحداث والسياق في العالم العربي.",descriptionEn:"Knowledge, events and context across the Arab world.",icon:"◇"},
{slug:"world",ar:"العالم",en:"World",descriptionAr:"أهم الأحداث والمعرفة والسياق من حول العالم.",descriptionEn:"Major events, knowledge and context from around the world.",icon:"◆"},
{slug:"science",ar:"العلوم",en:"Science",descriptionAr:"اكتشافات ونظريات وحقائق علمية موثقة.",descriptionEn:"Documented discoveries, theories and scientific facts.",icon:"⚗"},
{slug:"economy",ar:"الاقتصاد",en:"Economy",descriptionAr:"الاقتصاد والأسواق والأسعار والقرارات المؤثرة.",descriptionEn:"Economics, markets, prices and influential decisions.",icon:"◈"},
{slug:"politics",ar:"السياسة",en:"Politics",descriptionAr:"القرارات والسياسات والقوى التي تصنع المشهد العام.",descriptionEn:"Decisions, policies and forces shaping public affairs.",icon:"▣"},
{slug:"technology",ar:"التقنية والذكاء الاصطناعي",en:"Technology & AI",descriptionAr:"التقنية والذكاء الاصطناعي والابتكار.",descriptionEn:"Technology, AI and innovation.",icon:"⌘"},
{slug:"health",ar:"الصحة",en:"Health",descriptionAr:"معلومات صحية موثقة وشرح واضح بعيدًا عن الادعاءات.",descriptionEn:"Verified health information explained clearly.",icon:"+"},
{slug:"history",ar:"التاريخ والثقافة",en:"History & Culture",descriptionAr:"التاريخ والثقافة والفنون والتراث.",descriptionEn:"History, culture, arts and heritage.",icon:"▱"},
{slug:"people",ar:"الأشخاص",en:"People",descriptionAr:"شخصيات وسير وأعمال صنعت أثرًا موثقًا.",descriptionEn:"People, biographies and documented impact.",icon:"●"},
{slug:"sports",ar:"الرياضة والبيانات",en:"Sports & Data",descriptionAr:"الرياضة والنتائج والإحصاءات والسجلات.",descriptionEn:"Sports, results, statistics and records.",icon:"△"},
{slug:"travel",ar:"السفر",en:"Travel",descriptionAr:"الوجهات والأماكن والمعلومات العملية للسفر.",descriptionEn:"Destinations, places and practical travel knowledge.",icon:"✈"}
];
export const sectionBySlug=(slug:string)=>sections.find(s=>s.slug===slug);