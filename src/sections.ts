export type Locale = "ar" | "en";

export type Section = {
  slug: string;
  ar: string;
  en: string;
  descriptionAr: string;
  descriptionEn: string;
  icon: string;
};

export const sections: Section[] = [
  {slug:"news",ar:"الأخبار",en:"News",descriptionAr:"أخبار موثقة ومحدثة مع السياق والصورة والمصدر.",descriptionEn:"Verified, current stories with context, imagery and source metadata.",icon:"◈"},
  {slug:"people",ar:"الأشخاص",en:"People",descriptionAr:"صفحات شخصيات تجمع السيرة والإنجازات والأحداث والمصادر.",descriptionEn:"Modern person pages combining biography, work, events and sources.",icon:"◎"},
  {slug:"topics",ar:"المواضيع",en:"Topics",descriptionAr:"ملفات مرتبة تجمع كل ما نعرفه عن موضوع أو قضية.",descriptionEn:"Structured topic pages that bring together the full picture.",icon:"◇"},
  {slug:"stories",ar:"القصص",en:"Stories",descriptionAr:"قصص وحكايات وملفات سردية مبنية على الأدلة.",descriptionEn:"Evidence-based stories, timelines and narrative explainers.",icon:"✦"},
  {slug:"guides",ar:"الشرح والأدلة",en:"Guides & How-to",descriptionAr:"إجابات عملية: كيف تفعل، تصلح، تتعلم أو تحل مشكلة.",descriptionEn:"Practical answers for doing, fixing, learning and solving problems.",icon:"✓"},
  {slug:"technology",ar:"التقنية والبرمجة",en:"Technology & Coding",descriptionAr:"تقنية وذكاء اصطناعي وبرمجة وحلول عملية محدثة.",descriptionEn:"Technology, AI, coding and practical technical solutions.",icon:"⌘"},
  {slug:"science",ar:"العلوم",en:"Science",descriptionAr:"شرح علمي واضح للأفكار والاكتشافات والظواهر.",descriptionEn:"Clear, evidence-based explanations of science and discoveries.",icon:"◌"},
  {slug:"health",ar:"الصحة",en:"Health",descriptionAr:"معلومات صحية موثوقة مع توضيح حدود الدليل.",descriptionEn:"Reliable health information with evidence limits made clear.",icon:"＋"},
  {slug:"economy",ar:"الاقتصاد والأسعار",en:"Economy & Prices",descriptionAr:"اقتصاد وأسعار وذهب وعملات وبيانات حية.",descriptionEn:"Economy, prices, gold, currencies and live data.",icon:"₿"},
  {slug:"world",ar:"العالم والأماكن",en:"World & Places",descriptionAr:"دول ومدن وأماكن وأحداث حول العالم، مع فلاتر جغرافية.",descriptionEn:"Countries, cities, places and global events with geographic filters.",icon:"⌖"},
  {slug:"history-culture",ar:"التاريخ والثقافة",en:"History & Culture",descriptionAr:"تاريخ وثقافة وفنون وتراث في صفحات مترابطة.",descriptionEn:"History, culture, arts and heritage in connected pages.",icon:"▱"},
  {slug:"sports",ar:"الرياضة والبيانات",en:"Sports & Data",descriptionAr:"رياضة ونتائج وإحصاءات وسجلات قابلة للفهم والتحقق.",descriptionEn:"Sports, results, statistics and records presented with evidence.",icon:"△"}
];

export const sectionBySlug = (slug: string) => sections.find(s => s.slug === slug);
