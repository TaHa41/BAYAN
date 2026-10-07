export type Locale="ar"|"en";
export type Section={slug:string;ar:string;en:string;descriptionAr:string;descriptionEn:string;icon:string};
export const sections:Section[]=[
{slug:"science",ar:"علوم وفهم",en:"Science & Understanding",descriptionAr:"علوم واكتشافات وشرح مبني على الأدلة.",descriptionEn:"Science, discoveries and evidence-based explanations.",icon:"⚗"},
{slug:"technology",ar:"تقنية وذكاء اصطناعي",en:"Technology & AI",descriptionAr:"التقنية والذكاء الاصطناعي والابتكار.",descriptionEn:"Technology, artificial intelligence and innovation.",icon:"⌘"},
{slug:"economy",ar:"اقتصاد ومال",en:"Economy & Money",descriptionAr:"الاقتصاد والأسواق والمال والقرارات المالية.",descriptionEn:"Economics, markets, money and financial decisions.",icon:"◈"},
{slug:"politics",ar:"سياسة وشأن عام",en:"Politics & Public Affairs",descriptionAr:"السياسات والقرارات والشأن العام.",descriptionEn:"Politics, public policy and public affairs.",icon:"▣"},
{slug:"health",ar:"صحة وطب",en:"Health & Medicine",descriptionAr:"الصحة والطب والمعلومات الصحية الموثقة.",descriptionEn:"Health, medicine and evidence-based health information.",icon:"+"},
{slug:"history",ar:"تاريخ وثقافة",en:"History & Culture",descriptionAr:"التاريخ والثقافة والتراث.",descriptionEn:"History, culture and heritage.",icon:"▱"},
{slug:"people",ar:"أشخاص وسير",en:"People & Biographies",descriptionAr:"الأشخاص والسير والقصص الموثقة.",descriptionEn:"People, biographies and sourced stories.",icon:"●"},
{slug:"sports",ar:"رياضة وبيانات",en:"Sports & Data",descriptionAr:"الرياضة والنتائج والإحصاءات والبيانات.",descriptionEn:"Sports, results, statistics and data.",icon:"△"},
{slug:"travel",ar:"سفر وأماكن",en:"Travel & Places",descriptionAr:"السفر والوجهات والأماكن والمعلومات العملية.",descriptionEn:"Travel, destinations, places and practical information.",icon:"✈"},
{slug:"art",ar:"فن وترفيه",en:"Arts & Entertainment",descriptionAr:"الفن والترفيه والثقافة الشعبية.",descriptionEn:"Arts, entertainment and popular culture.",icon:"✦"},
{slug:"news",ar:"أخبار موثقة",en:"Verified News",descriptionAr:"أخبار حديثة تُعرض بعد التحقق من مصادرها.",descriptionEn:"Current news presented after source verification.",icon:"◉"},
{slug:"trends",ar:"اهتمام واتجاهات",en:"Interest & Trends",descriptionAr:"ما يلفت اهتمام الناس واتجاهات النقاش، مع فصلها عن الأخبار الموثقة.",descriptionEn:"What captures attention and discussion trends, kept separate from verified news.",icon:"↗"},
{slug:"prices",ar:"أسعار وبيانات مباشرة",en:"Prices & Live Data",descriptionAr:"الأسعار والطقس والعملات والبيانات الحية.",descriptionEn:"Prices, weather, currencies and live data.",icon:"◌"},
{slug:"egypt",ar:"مصر",en:"Egypt",descriptionAr:"المعرفة والأخبار والبيانات المتعلقة بمصر.",descriptionEn:"Knowledge, news and data about Egypt.",icon:"🇪🇬"},
{slug:"arab",ar:"العالم العربي",en:"Arab World",descriptionAr:"المعرفة والأخبار والسياق في العالم العربي.",descriptionEn:"Knowledge, news and context across the Arab world.",icon:"◇"},
{slug:"world",ar:"العالم",en:"World",descriptionAr:"المعرفة والأخبار والسياق من أنحاء العالم.",descriptionEn:"Knowledge, news and context from around the world.",icon:"◆"}
];
export const sectionBySlug=(slug:string)=>sections.find(s=>s.slug===slug);
