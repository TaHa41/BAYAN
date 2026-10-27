export type Locale="ar"|"en";
export type Section={slug:string;ar:string;en:string;descriptionAr:string;descriptionEn:string;icon:string};
export const sections:Section[]=[
{slug:"science",ar:"علوم",en:"Science",descriptionAr:"اكتشافات وأبحاث وشرح مبسّط مبني على الأدلة.",descriptionEn:"Discoveries, research and clear explanations backed by evidence.",icon:"⚗"},
{slug:"technology",ar:"تقنية",en:"Technology",descriptionAr:"الذكاء الاصطناعي والابتكار وأخبار التقنية.",descriptionEn:"AI, innovation and technology news.",icon:"⌘"},
{slug:"economy",ar:"اقتصاد",en:"Economy",descriptionAr:"الأسواق والمال والقرارات الاقتصادية.",descriptionEn:"Markets, money and economic decisions.",icon:"◈"},
{slug:"politics",ar:"سياسة",en:"Politics",descriptionAr:"السياسات والقرارات والشأن العام بمصادر واضحة.",descriptionEn:"Policy, decisions and public affairs with clear sourcing.",icon:"▣"},
{slug:"health",ar:"صحة",en:"Health",descriptionAr:"معلومات صحية وطبية موثقة.",descriptionEn:"Verified health and medical information.",icon:"+"},
{slug:"history",ar:"تاريخ",en:"History",descriptionAr:"التاريخ والتراث والثقافة.",descriptionEn:"History, heritage and culture.",icon:"▱"},
{slug:"people",ar:"شخصيات",en:"People",descriptionAr:"سير وشخصيات موثقة المصادر.",descriptionEn:"Sourced biographies and profiles.",icon:"●"},
{slug:"sports",ar:"رياضة",en:"Sports",descriptionAr:"النتائج والإحصاءات وأخبار الرياضة.",descriptionEn:"Results, statistics and sports news.",icon:"△"},
{slug:"travel",ar:"سفر",en:"Travel",descriptionAr:"وجهات وأماكن ومعلومات عملية للسفر.",descriptionEn:"Destinations, places and practical travel information.",icon:"✈"},
{slug:"art",ar:"فنون",en:"Arts",descriptionAr:"الفن والسينما والموسيقى والثقافة الشعبية.",descriptionEn:"Art, film, music and popular culture.",icon:"✦"},
{slug:"news",ar:"الأخبار",en:"News",descriptionAr:"أخبار حديثة بعد التحقق من مصادرها.",descriptionEn:"Current news, published after source verification.",icon:"◉"},
{slug:"trends",ar:"اتجاهات",en:"Trends",descriptionAr:"ما يشغل الناس الآن، منفصلًا عن الأخبار الموثقة.",descriptionEn:"What people are talking about, kept separate from verified news.",icon:"↗"},
{slug:"prices",ar:"الأسواق",en:"Markets",descriptionAr:"العملات والذهب والطاقة والأسواق لحظة بلحظة.",descriptionEn:"Currencies, gold, energy and markets, live.",icon:"◌"},
{slug:"egypt",ar:"مجتمع",en:"Society",descriptionAr:"حياة الناس والخدمات والمجتمع بمعلومات موثقة.",descriptionEn:"Everyday life, services and society, grounded in evidence.",icon:"⌂"},
{slug:"arab",ar:"رأي",en:"Opinion",descriptionAr:"وجهات نظر ونقاشات بسياق ومصادر واضحة.",descriptionEn:"Viewpoints and debates with context and clear sources.",icon:"☷"},
{slug:"world",ar:"العالم",en:"World",descriptionAr:"تحولات عالمية وتأثيرها على الاقتصاد والتقنية والمجتمع.",descriptionEn:"Global shifts and their impact on economy, technology and society.",icon:"◎"}
];
export const sectionBySlug=(slug:string)=>sections.find(s=>s.slug===slug);
