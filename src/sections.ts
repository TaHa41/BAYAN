export type Locale = "ar" | "en";
export type Section = {slug:string;ar:string;en:string;descriptionAr:string;descriptionEn:string;icon:string};
export const sections: Section[] = [
{slug:"egypt",ar:"نبض مصر",en:"Egypt in Focus",descriptionAr:"أهم ما يخص مصر من أخبار ومعلومات وبيانات وشخصيات.",descriptionEn:"News, knowledge, data and people connected to Egypt.",icon:"🇪🇬"},
{slug:"arab",ar:"المشهد العربي",en:"Arab Scene",descriptionAr:"أحداث وقضايا وقصص من العالم العربي مع سياقها ومصادرها.",descriptionEn:"Events, issues and stories from the Arab world with context and sources.",icon:"✦"},
{slug:"world",ar:"حول العالم",en:"Around the World",descriptionAr:"أحداث وقصص ومعلومات دولية تتجاوز الخبر إلى الفهم.",descriptionEn:"Global events, stories and knowledge beyond the headline.",icon:"◉"},
{slug:"science",ar:"اكتشف",en:"Discover",descriptionAr:"علوم وفضاء وطبيعة واكتشافات وشرح مبسط قائم على الأدلة.",descriptionEn:"Science, space, nature and discoveries explained with evidence.",icon:"✧"},
{slug:"economy",ar:"اقتصاد وحياة",en:"Economy & Life",descriptionAr:"مال وأسواق وأسعار وقرارات اقتصادية وتأثيرها على الحياة اليومية.",descriptionEn:"Money, markets, prices and how economic decisions affect daily life.",icon:"◆"},
{slug:"politics",ar:"المشهد السياسي",en:"The Political Scene",descriptionAr:"سياسة وشأن عام مع فصل الوقائع عن التحليل والادعاءات.",descriptionEn:"Politics and public affairs with facts separated from analysis and claims.",icon:"◇"},
{slug:"technology",ar:"عالم التقنية",en:"Tech & AI",descriptionAr:"ذكاء اصطناعي وتقنية وبرمجة وابتكار وحلول عملية.",descriptionEn:"AI, technology, software, innovation and practical solutions.",icon:"⌘"},
{slug:"health",ar:"صحة الإنسان",en:"Human Health",descriptionAr:"صحة وطب وتغذية ومعلومات طبية مع حدود واضحة للدليل.",descriptionEn:"Health, medicine and nutrition with clear evidence limits.",icon:"+"},
{slug:"history",ar:"ذاكرة وثقافة",en:"History & Culture",descriptionAr:"تاريخ وفنون وتراث وثقافة لفهم الحاضر من جذوره.",descriptionEn:"History, arts, heritage and culture that put the present in context.",icon:"▱"},
{slug:"people",ar:"وجوه وحكايات",en:"People & Stories",descriptionAr:"شخصيات مؤثرة وسير وقصص وتجارب تستحق المعرفة.",descriptionEn:"Influential people, biographies and stories worth knowing.",icon:"●"},
{slug:"sports",ar:"رياضة بالأرقام",en:"Sports & Numbers",descriptionAr:"أخبار ونتائج وإحصاءات وسجلات رياضية قابلة للتحقق.",descriptionEn:"Sports news, results, statistics and verifiable records.",icon:"△"},
{slug:"travel",ar:"اكتشف العالم",en:"Explore",descriptionAr:"وجهات وأماكن وتجارب سفر ومعلومات عملية من مصادر موثوقة.",descriptionEn:"Destinations, places and practical travel knowledge from reliable sources.",icon:"✈"},
{slug:"trends",ar:"على الرادار",en:"On the Radar",descriptionAr:"ما يشغل الناس واتجاهات الاهتمام، منفصلًا عن الأخبار المؤكدة.",descriptionEn:"Public interests and trends, kept separate from verified news.",icon:"↗"},
{slug:"prices",ar:"بيانات الآن",en:"Live Data",descriptionAr:"طقس وعملات وذهب وأسعار ومؤشرات تتغير باستمرار.",descriptionEn:"Weather, currencies, gold, prices and continuously changing indicators.",icon:"◈"}
];
export const sectionBySlug = (slug:string) => sections.find(s=>s.slug===slug);
