export type Locale = "ar" | "en";
export type Section = {slug:string;ar:string;en:string;descriptionAr:string;descriptionEn:string;icon:string};
export const sections: Section[] = [
{slug:"egypt",ar:"مصر",en:"Egypt",descriptionAr:"المحتوى الموثق عن مصر والأحداث والشخصيات والبيانات.",descriptionEn:"Verified knowledge about Egypt, events, people and data.",icon:"⌂"},
{slug:"arab",ar:"العالم العربي",en:"Arab World",descriptionAr:"أخبار وملفات العالم العربي مع السياق والمصادر.",descriptionEn:"Arab-world news and knowledge with context and sources.",icon:"◇"},
{slug:"world",ar:"العالم",en:"World",descriptionAr:"دول وأحداث وموضوعات عالمية قابلة للتحقق.",descriptionEn:"Countries, global events and verifiable topics.",icon:"⌖"},
{slug:"science",ar:"العلوم",en:"Science",descriptionAr:"شرح علمي واضح للأفكار والاكتشافات والظواهر.",descriptionEn:"Clear, evidence-based explanations of science and discoveries.",icon:"◌"},
{slug:"economy",ar:"الاقتصاد",en:"Economy",descriptionAr:"اقتصاد وأسواق وأسعار وبيانات مالية.",descriptionEn:"Economy, markets, prices and financial data.",icon:"₿"},
{slug:"politics",ar:"السياسة",en:"Politics",descriptionAr:"سياسة وشؤون عامة مع فصل الخبر عن التحليل.",descriptionEn:"Politics and public affairs with news separated from analysis.",icon:"◎"},
{slug:"technology",ar:"التقنية والذكاء الاصطناعي",en:"Technology & AI",descriptionAr:"تقنية وذكاء اصطناعي وبرمجة وحلول عملية.",descriptionEn:"Technology, AI, coding and practical solutions.",icon:"⌘"},
{slug:"health",ar:"الصحة",en:"Health",descriptionAr:"معلومات صحية موثوقة مع حدود الدليل.",descriptionEn:"Reliable health information with evidence limits made clear.",icon:"＋"},
{slug:"history",ar:"التاريخ والثقافة",en:"History & Culture",descriptionAr:"تاريخ وثقافة وفنون وتراث في صفحات مترابطة.",descriptionEn:"History, culture, arts and heritage in connected pages.",icon:"▱"},
{slug:"people",ar:"الأشخاص",en:"People",descriptionAr:"صفحات شخصيات تجمع السيرة والإنجازات والمصادر.",descriptionEn:"People pages combining biography, work, events and sources.",icon:"◎"},
{slug:"sports",ar:"الرياضة والبيانات",en:"Sports & Data",descriptionAr:"رياضة ونتائج وإحصاءات وسجلات قابلة للتحقق.",descriptionEn:"Sports, results, statistics and records with evidence.",icon:"△"},
{slug:"travel",ar:"السفر",en:"Travel",descriptionAr:"وجهات وأماكن ونصائح سفر مبنية على مصادر.",descriptionEn:"Destinations, places and travel guidance based on sources.",icon:"✈"},
{slug:"news",ar:"الأخبار",en:"News",descriptionAr:"أخبار حديثة من مزودات متعددة مع المصدر والوقت والصورة.",descriptionEn:"Current news from multiple providers with source, time and imagery.",icon:"◈"},
{slug:"trends",ar:"الاهتمام والاتجاهات",en:"Interest & Trends",descriptionAr:"ما يهتم به الناس، منفصل عن الأخبار الموثقة.",descriptionEn:"What people are interested in, separated from verified news.",icon:"↗"},
{slug:"prices",ar:"الأسعار والبيانات الحية",en:"Prices & Live Data",descriptionAr:"طقس وعملات وذهب وبيانات حية.",descriptionEn:"Weather, currencies, gold and live data.",icon:"₿"}
];
export const sectionBySlug = (slug:string) => sections.find(s=>s.slug===slug);
