export type ContentType = "knowledge" | "news" | "explainer" | "profile" | "guide" | "data";
export interface ContentItem { id:string; type:ContentType; language:"ar"|"en"; title:string; slug:string; summary:string; category:string; updatedAt:string; sources:string[]; }
export const sections = [
["egypt","مصر","Egypt"],["arab","العالم العربي","Arab World"],["world","العالم","World"],["science","العلوم","Science"],["economy","الاقتصاد","Economy"],["politics","السياسة","Politics"],["technology","التكنولوجيا","Technology"],["health","الصحة","Health"],["history-culture","التاريخ والثقافة","History & Culture"],["people","الشخصيات","People"],["sports","الرياضة","Sports"],["travel","السفر","Travel"],["arts","الفنون والترفيه","Arts & Entertainment"],["news","الأخبار","News"],["trending","الأكثر تداولًا","Trending"],["prices","الأسعار","Prices"],["search","البحث","Search"]
] as const;
export const wisdom = [
["التعلّم","كل معرفة تبدأ بسؤال جيد.","Learning","Every piece of knowledge begins with a good question."],
["الصبر","النتائج الكبيرة تُبنى بخطوات صغيرة متراكمة.","Patience","Large results are built from small accumulated steps."],
["العلم","الدليل لا يضعف الفكرة؛ بل يجعلها أقوى.","Science","Evidence does not weaken an idea; it makes it stronger."],
["الوقت","ما تقيسه بوضوح تستطيع تحسينه بوعي.","Time","What you measure clearly, you can improve deliberately."]
];
export function getSection(slug:string){return sections.find(s=>s[0]===slug);}
export function categoryFor(path:string){const hit=sections.find(s=>path===`/${s[0]}`);return hit?.[0]??(path.startsWith("/search")?"search":path.startsWith("/person/")?"people":"world");}
