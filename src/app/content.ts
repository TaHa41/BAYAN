export type ContentType = "knowledge" | "news" | "explainer" | "profile" | "guide" | "data";
export type Language = "ar" | "en";

export interface ContentItem {
  id: string;
  type: ContentType;
  language: Language;
  title: string;
  slug: string;
  summary: string;
  category: string;
  updatedAt: string;
  sources: string[];
}

export type LocalizedLabel = readonly [slug: string, ar: string, en: string];

export const sections: readonly LocalizedLabel[] = [
  ["egypt","مصر","Egypt"],["arab","العالم العربي","Arab World"],["world","العالم","World"],
  ["science","العلوم","Science"],["economy","الاقتصاد","Economy"],["politics","السياسة","Politics"],
  ["technology","التكنولوجيا","Technology"],["health","الصحة","Health"],["history-culture","التاريخ والثقافة","History & Culture"],
  ["people","الشخصيات","People"],["sports","الرياضة","Sports"],["travel","السفر","Travel"],
  ["arts","الفنون والترفيه","Arts & Entertainment"],["news","الأخبار","News"],
  ["trending","الأكثر تداولًا","Trending"],["prices","الأسعار","Prices"],["search","البحث","Search"]
] as const;

export const wisdom: readonly [string,string,string,string][] = [
  ["التعلّم","كل معرفة تبدأ بسؤال جيد.","Learning","Every piece of knowledge begins with a good question."],
  ["الصبر","النتائج الكبيرة تُبنى بخطوات صغيرة متراكمة.","Patience","Large results are built from small accumulated steps."],
  ["العلم","الدليل لا يضعف الفكرة؛ بل يجعلها أقوى.","Science","Evidence does not weaken an idea; it makes it stronger."],
  ["الوقت","ما تقيسه بوضوح تستطيع تحسينه بوعي.","Time","What you measure clearly, you can improve deliberately."]
];

export function getSection(slug: string): LocalizedLabel | undefined {
  return sections.find((section) => section[0] === slug);
}

export function sectionLabel(slug: string, language: Language): string {
  const section = getSection(slug);
  return section ? section[language === "en" ? 2 : 1] : slug;
}

export function categoryFor(path: string): string {
  const hit = sections.find((section) => path === `/${section[0]}`);
  return hit?.[0] ?? (path.startsWith("/search") ? "search" : path.startsWith("/person/") ? "people" : "world");
}
