// Files a live headline under a content section using transparent keyword rules (Arabic + English).
// First match wins, in priority order; no match means the story only appears in the News section.
// This is deliberately simple and testable: nothing here guesses beyond what the title/summary says.
const RULES: [string, RegExp][] = [
  ["sports", /(كرة القدم|كرة السلة|الدوري|مباراة|لاعب|المنتخب|الكرة الذهبية|أبطال آسيا|أبطال أوروبا|كأس|بطولة|الهلال|النصر|الأهلي|الزمالك|برشلونة|ريال مدريد|ليفربول|football|soccer|premier league|champions league|tennis|nba|olympic|world cup)/i],
  ["art", /(فيلم|سينما|مسلسل|مهرجان|موسيقى|ألبوم|الأوسكار|حفل غنائي|فنان|ممثل|ممثلة|مغني|film|movie|series|festival|album|oscars|singer|actor|actress)/i],
  ["health", /(صحة|مرض|فيروس|لقاح|مستشفى|علاج|وباء|سرطان|دواء|الصحة العالمية|health|vaccine|disease|hospital|virus|cancer|medicine|who warns)/i],
  ["science", /(علماء|دراسة علمية|اكتشاف علمي|الفضاء|ناسا|المناخ|الغازات الدفيئة|كوكب|الفيزياء|الجينات|scientists|study finds|space|nasa|climate|physics|genome|research shows)/i],
  ["technology", /(الذكاء الاصطناعي|رقائق|تقنية|التقنية|تطبيق|سيبراني|هجوم إلكتروني|إلكتروني|آبل|غوغل|مايكروسوفت|إنفيديا|تيك توك|artificial intelligence|\bai\b|chips?\b|cyber|software|startup|smartphone|openai|nvidia|apple|google)/i],
  ["economy", /(اقتصاد|أرباح|أسهم|البورصة|الفائدة|التضخم|بنك|المصارف|الفيدرالي|النفط|الذهب|الموازنة|استثمار|الأسواق|الدولار|العملة|economy|inflation|stocks?\b|shares|profit|bank|oil prices|budget|interest rates?|markets?\b|gdp)/i],
  ["politics", /(انتخابات|حكومة|رئيس الوزراء|البرلمان|الكنيست|مجلس الشيوخ|مجلس النواب|قانون|وزير|وزارة|سفير|الرئيس|الائتلاف|المعارضة|election|government|parliament|minister|senate|president|coalition|law)/i],
  ["world", /(حرب|غزة|إيران|أوكرانيا|الأمم المتحدة|مجلس الأمن|هجوم|قصف|غارات|صواريخ|war\b|gaza|iran|ukraine|united nations|security council|airstrikes?|missiles?)/i],
];

export function classifyStory(title: string, summary = ""): string | null {
  const text = `${title} ${summary}`;
  for (const [section, re] of RULES) if (re.test(text)) return section;
  return null;
}
