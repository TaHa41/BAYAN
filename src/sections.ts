export type Locale = "ar" | "en";
export type Section = {slug:string;ar:string;en:string;descriptionAr:string;descriptionEn:string;icon:string};
export const sections:Section[]=[
{slug:"egypt",ar:"نبض الخبر",en:"News Pulse",descriptionAr:"أهم الوقائع والتطورات التي تمس الحياة والأحداث المحلية.",descriptionEn:"The key developments and facts shaping local life.",icon:"✦"},
{slug:"arab",ar:"مساحة المعرفة",en:"Knowledge Space",descriptionAr:"معرفة موثقة وشرح وسياق يساعد على فهم ما حولنا.",descriptionEn:"Verified knowledge, explanation and context.",icon:"◇"},
{slug:"world",ar:"حركة المال",en:"Money in Motion",descriptionAr:"المال والأسواق والأسعار والقرارات الاقتصادية وتأثيرها.",descriptionEn:"Money, markets, prices and the forces moving the economy.",icon:"◆"},
{slug:"science",ar:"لعبة السياسة",en:"Politics at Play",descriptionAr:"القرارات والسياسات والقوى التي تصنع المشهد العام.",descriptionEn:"Decisions, policies and forces shaping public affairs.",icon:"◈"},
{slug:"economy",ar:"نبض التقنية",en:"Tech Pulse",descriptionAr:"التقنية والذكاء الاصطناعي والابتكار وما يتغير بسرعة.",descriptionEn:"Technology, AI, innovation and fast-moving change.",icon:"⌘"},
{slug:"politics",ar:"حياة أفضل",en:"Better Living",descriptionAr:"الصحة والعادات والمعلومات العملية التي تساعد في الحياة اليومية.",descriptionEn:"Health, habits and practical knowledge for everyday life.",icon:"+"},
{slug:"technology",ar:"ذاكرة المكان",en:"Memory of Place",descriptionAr:"التاريخ والثقافة والفنون والآثار والقصص التي تحفظ الذاكرة.",descriptionEn:"History, culture, arts, heritage and stories that preserve memory.",icon:"▱"},
{slug:"health",ar:"وجوه مؤثرة",en:"People of Impact",descriptionAr:"شخصيات وسير وتجارب وأعمال صنعت أثرًا واضحًا.",descriptionEn:"People, biographies and work that made a documented impact.",icon:"●"},
{slug:"history",ar:"أرقام الملعب",en:"Numbers of the Game",descriptionAr:"الرياضة والنتائج والإحصاءات والسجلات بلغة الأرقام.",descriptionEn:"Sports, results, statistics and records through numbers.",icon:"△"},
{slug:"people",ar:"خارج الخريطة",en:"Beyond the Map",descriptionAr:"السفر والوجهات والأماكن والتجارب والمعلومات العملية.",descriptionEn:"Travel, destinations, places and practical journey knowledge.",icon:"✈"},
{slug:"sports",ar:"عين الاتجاهات",en:"Trend Lens",descriptionAr:"ما يلفت الانتباه ويتغير في اهتمامات الناس، منفصلًا عن الخبر المؤكد.",descriptionEn:"Changing public interests, kept separate from verified news.",icon:"↗"},
{slug:"travel",ar:"لوحة البيانات",en:"Data Board",descriptionAr:"بيانات حية ومؤشرات وأرقام تتغير باستمرار.",descriptionEn:"Live data, indicators and numbers that change continuously.",icon:"◉"},
];
export const sectionBySlug=(slug:string)=>sections.find(s=>s.slug===slug);
