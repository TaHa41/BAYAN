export type Locale="ar"|"en";
export type Section={slug:string;ar:string;en:string;descriptionAr:string;descriptionEn:string;icon:string};
export const sections:Section[]=[
{slug:"egypt",ar:"مصر الآن",en:"Egypt Now",descriptionAr:"أخبار ومعرفة وبيانات موثقة عن مصر.",descriptionEn:"Verified news, knowledge and data about Egypt.",icon:"🇪🇬"},
{slug:"arab",ar:"العرب",en:"The Arab World",descriptionAr:"الأحداث والمعرفة والسياق في العالم العربي.",descriptionEn:"Events, knowledge and context across the Arab world.",icon:"◇"},
{slug:"world",ar:"حول العالم",en:"Around the World",descriptionAr:"أهم الأحداث والمعرفة والسياق من العالم.",descriptionEn:"Major events, knowledge and context from around the world.",icon:"◆"},
{slug:"science",ar:"اكتشاف وعلوم",en:"Discovery & Science",descriptionAr:"اكتشافات وعلوم وحقائق مبنية على الأدلة.",descriptionEn:"Discoveries, science and evidence-based facts.",icon:"⚗"},
{slug:"economy",ar:"مال وأعمال",en:"Money & Business",descriptionAr:"الاقتصاد والأسواق والمال وقرارات الأعمال.",descriptionEn:"Economics, markets, money and business decisions.",icon:"◈"},
{slug:"politics",ar:"سياسة عامة",en:"Public Policy",descriptionAr:"السياسات والقرارات والقوى المؤثرة في الشأن العام.",descriptionEn:"Policies, decisions and forces shaping public affairs.",icon:"▣"},
{slug:"technology",ar:"تقنية وذكاء اصطناعي",en:"Technology & AI",descriptionAr:"التقنية والذكاء الاصطناعي والابتكار.",descriptionEn:"Technology, artificial intelligence and innovation.",icon:"⌘"},
{slug:"health",ar:"الصحة",en:"Health",descriptionAr:"معلومات صحية موثقة وشرح واضح.",descriptionEn:"Verified health information explained clearly.",icon:"+"},
{slug:"history",ar:"تاريخ وثقافة",en:"History & Culture",descriptionAr:"التاريخ والثقافة والفنون والتراث.",descriptionEn:"History, culture, arts and heritage.",icon:"▱"},
{slug:"people",ar:"شخصيات وقصص",en:"People & Stories",descriptionAr:"شخصيات وقصص وسير مبنية على مصادر.",descriptionEn:"People, stories and sourced biographies.",icon:"●"},
{slug:"sports",ar:"رياضة وأرقام",en:"Sports & Numbers",descriptionAr:"الرياضة والنتائج والإحصاءات والسجلات.",descriptionEn:"Sports, results, statistics and records.",icon:"△"},
{slug:"travel",ar:"وجهات وسفر",en:"Destinations & Travel",descriptionAr:"الوجهات والمعلومات العملية للسفر.",descriptionEn:"Destinations and practical travel knowledge.",icon:"✈"}
];
export const sectionBySlug=(slug:string)=>sections.find(s=>s.slug===slug);
