export type Locale = "ar" | "en";
export type Section = {slug:string;ar:string;en:string;descriptionAr:string;descriptionEn:string;icon:string};
export const sections: Section[] = [
{slug:"egypt",ar:"مصر",en:"Egypt",descriptionAr:"ملفات مصر ومعلوماتها وأحداثها وشخصياتها وبياناتها.",descriptionEn:"Egyptian knowledge, events, people and data.",icon:"🇪🇬"},
{slug:"arab",ar:"العالم العربي",en:"Arab World",descriptionAr:"ملفات دول العالم العربي وأحداثها وسياقها ومصادرها.",descriptionEn:"Arab-world countries, events, context and sources.",icon:"✦"},
{slug:"world",ar:"العالم",en:"World",descriptionAr:"دول وأحداث وقضايا عالمية مع معلومات قابلة للتحقق.",descriptionEn:"Countries, global events and verifiable knowledge.",icon:"◉"},
{slug:"science",ar:"علوم واكتشافات",en:"Science & Discoveries",descriptionAr:"علوم واكتشافات وشرح مبسط مبني على الأدلة.",descriptionEn:"Science, discoveries and evidence-based explanations.",icon:"✧"},
{slug:"economy",ar:"اقتصاد ومال",en:"Economy & Money",descriptionAr:"اقتصاد وأسواق وأموال وأسعار وبيانات مالية.",descriptionEn:"Economy, markets, money, prices and financial data.",icon:"◆"},
{slug:"politics",ar:"سياسة وشأن عام",en:"Politics & Public Affairs",descriptionAr:"أخبار السياسة والشأن العام مع فصل الخبر عن التحليل.",descriptionEn:"Politics and public affairs, separating news from analysis.",icon:"◇"},
{slug:"technology",ar:"التقنية والذكاء الاصطناعي",en:"Technology & AI",descriptionAr:"تقنية وذكاء اصطناعي وبرمجة وحلول عملية.",descriptionEn:"Technology, AI, coding and practical solutions.",icon:"⌘"},
{slug:"health",ar:"صحة وطب",en:"Health & Medicine",descriptionAr:"معلومات صحية وطبية موثوقة مع حدود الدليل.",descriptionEn:"Reliable health and medical information with evidence limits.",icon:"+"},
{slug:"history",ar:"التاريخ والثقافة",en:"History & Culture",descriptionAr:"تاريخ وثقافة وفنون وتراث في صفحات مترابطة.",descriptionEn:"History, culture, arts and heritage in connected pages.",icon:"▱"},
{slug:"people",ar:"شخصيات",en:"People",descriptionAr:"ملفات الشخصيات وسيرهم وإنجازاتهم وأهم الأحداث المرتبطة بهم.",descriptionEn:"People, biographies, achievements and related events.",icon:"●"},
{slug:"sports",ar:"رياضة وإحصاءات",en:"Sports & Statistics",descriptionAr:"رياضة ونتائج وإحصاءات وسجلات قابلة للتحقق.",descriptionEn:"Sports, results, statistics and verifiable records.",icon:"△"},
{slug:"travel",ar:"سفر ووجهات",en:"Travel & Destinations",descriptionAr:"وجهات وأماكن ونصائح سفر مبنية على مصادر.",descriptionEn:"Destinations, places and source-based travel guidance.",icon:"✈"},
{slug:"trends",ar:"اهتمامات واتجاهات",en:"Interests & Trends",descriptionAr:"ما يهتم به الناس واتجاهات البحث، منفصلًا عن الأخبار الموثقة.",descriptionEn:"Public interests and search trends, separate from verified news.",icon:"↗"},
{slug:"prices",ar:"بيانات وأسعار مباشرة",en:"Live Data & Prices",descriptionAr:"طقس وعملات وذهب وأسعار وبيانات تتغير باستمرار.",descriptionEn:"Weather, currencies, gold, prices and changing live data.",icon:"◈"}
];
export const sectionBySlug = (slug:string) => sections.find(s=>s.slug===slug);
