// The 15 public content sections. Slugs are kept from v1 so existing URLs and D1 rows keep working.
// Live prices/markets return as a dedicated module (see README parity list), not as a content section.
export type Lang = "ar" | "en";
export interface Section { slug: string; ar: string; en: string; descAr: string; descEn: string; glyph: string; hue: number }
export const SECTIONS: Section[] = [
  { slug: "news", ar: "الأخبار", en: "News", descAr: "أخبار حديثة بعد التحقق من مصادرها.", descEn: "Current news, published after source verification.", glyph: "◉", hue: 42 },
  { slug: "politics", ar: "سياسة", en: "Politics", descAr: "السياسات والقرارات والشأن العام بمصادر واضحة.", descEn: "Policy, decisions and public affairs with clear sourcing.", glyph: "⚖", hue: 320 },
  { slug: "economy", ar: "اقتصاد", en: "Economy", descAr: "الأسواق والمال والقرارات الاقتصادية.", descEn: "Markets, money and economic decisions.", glyph: "◈", hue: 150 },
  { slug: "technology", ar: "تقنية", en: "Technology", descAr: "الذكاء الاصطناعي والابتكار وأخبار التقنية.", descEn: "AI, innovation and technology news.", glyph: "⌘", hue: 245 },
  { slug: "science", ar: "علوم", en: "Science", descAr: "اكتشافات وأبحاث وشرح مبسّط مبني على الأدلة.", descEn: "Discoveries, research and clear explanations backed by evidence.", glyph: "✦", hue: 190 },
  { slug: "health", ar: "صحة", en: "Health", descAr: "معلومات صحية وطبية موثقة.", descEn: "Verified health and medical information.", glyph: "✚", hue: 350 },
  { slug: "people", ar: "شخصيات", en: "People", descAr: "سير وشخصيات موثقة المصادر.", descEn: "Sourced biographies and profiles.", glyph: "☺", hue: 215 },
  { slug: "sports", ar: "رياضة", en: "Sports", descAr: "النتائج والإحصاءات وأخبار الرياضة.", descEn: "Results, statistics and sports news.", glyph: "◐", hue: 25 },
  { slug: "history", ar: "تاريخ", en: "History", descAr: "التاريخ والتراث والثقافة.", descEn: "History, heritage and culture.", glyph: "❖", hue: 40 },
  { slug: "art", ar: "فنون", en: "Arts", descAr: "الفن والسينما والموسيقى والثقافة الشعبية.", descEn: "Art, film, music and popular culture.", glyph: "✎", hue: 280 },
  { slug: "travel", ar: "سفر", en: "Travel", descAr: "وجهات وأماكن ومعلومات عملية للسفر.", descEn: "Destinations, places and practical travel information.", glyph: "✈", hue: 180 },
  { slug: "egypt", ar: "مجتمع", en: "Society", descAr: "حياة الناس والخدمات والمجتمع بمعلومات موثقة.", descEn: "Everyday life, services and society, grounded in evidence.", glyph: "☷", hue: 140 },
  { slug: "arab", ar: "رأي", en: "Opinion", descAr: "وجهات نظر ونقاشات بسياق ومصادر واضحة.", descEn: "Viewpoints and debates with context and clear sources.", glyph: "❝", hue: 260 },
  { slug: "world", ar: "العالم", en: "World", descAr: "تحولات عالمية وتأثيرها على الاقتصاد والتقنية والمجتمع.", descEn: "Global shifts and their impact on economy, technology and society.", glyph: "◍", hue: 210 },
  { slug: "trends", ar: "اتجاهات", en: "Trends", descAr: "ما يشغل الناس الآن، منفصلًا عن الأخبار الموثقة.", descEn: "What people are talking about, kept separate from verified news.", glyph: "↗", hue: 12 },
];
export const sectionBySlug = (slug: string): Section | undefined => SECTIONS.find((s) => s.slug === slug);
