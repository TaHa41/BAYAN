// Static pages (about, methodology, privacy, terms), written to state only what the site actually does.
import type { Lang } from "./sections";

export type StaticSlug = "about" | "methodology" | "privacy" | "terms";
export interface StaticPage { title: string; description: string; blocks: { h?: string; p?: string; ul?: string[] }[] }
export const STATIC_SLUGS: StaticSlug[] = ["about", "methodology", "privacy", "terms"];

const PAGES: Record<StaticSlug, Record<Lang, StaticPage>> = {
  about: {
    ar: { title: "عن بيان", description: "بيان موقع معرفة وأخبار يعرض المعلومة مع مصدرها ودليلها.", blocks: [
      { p: "بيان موقع عربي وإنجليزي للمعرفة والأخبار والبيانات الحية، قائم على فكرة واحدة: المعلومة أولًا، والدليل قبل الادعاء." },
      { h: "ماذا نقدّم", ul: ["أخبار حديثة مجمّعة من مصادر معلنة، موزعة على الأقسام، وبروابط تفتح المصدر.", "موسوعة بيان: مداخل مأخوذة مباشرة من ويكيبيديا مع نسبة النص والصور وتراخيصها، وتتجدد تلقائيًا.", "بحث في الإنترنت يعرض نتائج لها روابط حقيقية فقط، ويقول بوضوح عند عدم وجود نتائج.", "أسعار العملات والذهب، والطقس لأي مدينة، ومواقيت الصلاة لأي مدينة ودولة، مع مصدر كل رقم ووقت تحديثه."] },
      { h: "ما لا نفعله", ul: ["لا نختلق أخبارًا ولا صورًا ولا مصادر.", "لا نعرض مادة على أنها مقال مكتمل إلا إذا استوفت شروط الجودة: نص مفصّل، ومصدران مستقلان على الأقل، وصورة مرتبطة بالموضوع.", "لا نعرض رقمًا تقديريًا عند تعذر جلب البيانات، بل نوضح أن المصدر غير متاح."] },
      { h: "من وراء بيان", p: "Created by Taha Omar" },
    ] },
    en: { title: "About BAYAN", description: "BAYAN is a knowledge and news site that shows information together with its source and evidence.", blocks: [
      { p: "BAYAN is an Arabic and English site for knowledge, news and live data, built on one idea: information first, evidence before claims." },
      { h: "What we offer", ul: ["Current news gathered from named sources, filed into sections, with links that open the source.", "The BAYAN encyclopedia: entries taken directly from Wikipedia, with text and images attributed and licensed, refreshed automatically.", "Web search that shows only results with real links, and says plainly when nothing was found.", "Currency and gold prices, weather for any city and prayer times for any city and country, each with its source and update time."] },
      { h: "What we do not do", ul: ["We do not invent news, images or sources.", "We do not present anything as a complete article unless it meets the quality rules: detailed text, at least two independent sources and an image that belongs to the topic.", "We do not show estimated figures when data cannot be fetched; we say the source is unavailable."] },
      { h: "Who is behind BAYAN", p: "Created by Taha Omar" },
    ] },
  },
  methodology: {
    ar: { title: "المنهجية", description: "كيف نجمع المعلومة ونتحقق منها ونصنّفها قبل عرضها.", blocks: [
      { p: "نفصل في بيان بين ما ثبت بالدليل وما هو مرجعي أو غير كافٍ، ونكتب ذلك بوضوح في الصفحة." },
      { h: "١. الجمع", p: "نجمع العناوين من مصادر أخبار معلنة، والمعلومات الموسوعية من ويكيبيديا، والأسعار والطقس والمواقيت من مزودي بيانات مفتوحة." },
      { h: "٢. التصنيف", p: "يُوزَّع كل خبر على قسمه بقواعد كلمات مفتاحية واضحة، والعنوان هو الأساس. وإذا لم يطابق أي قسم يبقى في قسم الأخبار فقط." },
      { h: "٣. التوثيق", p: "لا نعتبر الخبر موثقًا إلا بوجود خمسة ناشرين مستقلين على الأقل على نطاقات مختلفة. المواقع المجمّعة والنسخ المكررة لا تُحسب مصادر مستقلة." },
      { h: "٤. المقال المكتمل", ul: ["نص مفصّل يضيف إلى الملخص.", "مصدران مستقلان على الأقل.", "صورة مرتبطة بالموضوع، لا غلاف عام للموقع المصدر."] },
      { h: "٥. الصور والتراخيص", p: "تُنسب صور ويكيميديا كومنز إلى أصحابها مع الترخيص. وإذا لم تتوفر صورة مناسبة لا نضع صورة بديلة على أنها صورة الموضوع." },
      { h: "٦. التصحيح", p: "إذا وجدت خطأ، أرسل تصحيحًا عبر صفحة المساهمة وستُراجع قبل أي تعديل." },
    ] },
    en: { title: "Methodology", description: "How we gather, verify and classify information before showing it.", blocks: [
      { p: "BAYAN separates what is backed by evidence from what is reference-only or insufficient, and says so on the page." },
      { h: "1. Gathering", p: "We collect headlines from named news sources, encyclopedic information from Wikipedia, and prices, weather and prayer times from open data providers." },
      { h: "2. Classification", p: "Each story is filed into a section with transparent keyword rules, the title being decisive. If no section matches, it stays in News only." },
      { h: "3. Verification", p: "A story counts as verified only with at least five independent publishers on distinct domains. Aggregators and duplicated copies are not counted as independent sources." },
      { h: "4. A complete article", ul: ["Detailed text that adds to the summary.", "At least two independent sources.", "An image that belongs to the topic, not a generic cover of the source site."] },
      { h: "5. Images and licenses", p: "Wikimedia Commons images are credited to their authors with the license. When no suitable image exists we do not substitute another one as the topic's image." },
      { h: "6. Corrections", p: "If you find a mistake, send a correction through the contribution page; it is reviewed before any change." },
    ] },
  },
  privacy: {
    ar: { title: "الخصوصية", description: "ما نستخدمه من بيانات وما لا نفعله بها.", blocks: [
      { p: "نستخدم الحد الأدنى اللازم لتشغيل الخدمة وقياس الاستخدام التقني." },
      { h: "ما نعالجه", ul: ["نصوص البحث وأسماء المدن التي تكتبها، لإرجاع النتائج، وقد تُرسل إلى مزودي البيانات (مثل ويكيبيديا ومزودي الطقس والمواقيت) لجلب الإجابة.", "عدّادات زيارات تقنية لفهم أي الصفحات تُقرأ. تُستبعد زيارات الإدارة والبوتات وأدوات الذكاء الاصطناعي من الإحصاءات، وتبقى الإحصاءات خاصة بالمسؤول."] },
      { h: "ما لا نفعله", ul: ["لا نبيع بيانات الزوار.", "لا نطلب حسابًا لقراءة الموقع."] },
      { h: "الإعلانات", p: "لا يعرض الموقع إعلانات حاليًا. وإذا أضفنا إعلانات مستقبلًا فسنحدّث هذه الصفحة بما تجمعه الشبكة الإعلانية وبخيارات الموافقة المطلوبة." },
      { h: "المصادر الخارجية", p: "الروابط الخارجية تخضع لسياسات أصحابها." },
    ] },
    en: { title: "Privacy", description: "What data we use and what we do not do with it.", blocks: [
      { p: "We use only what is needed to run the service and measure technical usage." },
      { h: "What we process", ul: ["The search text and city names you type, to return results; they may be sent to data providers (such as Wikipedia and the weather and prayer-time providers) to fetch the answer.", "Technical visit counters to understand which pages are read. Administrator, bot and AI-tool visits are excluded from statistics, which remain private to the administrator."] },
      { h: "What we do not do", ul: ["We do not sell visitor data.", "We do not require an account to read the site."] },
      { h: "Advertising", p: "The site does not show ads at present. If ads are added later, this page will be updated with what the ad network collects and the consent options required." },
      { h: "External sources", p: "External links are governed by their owners' policies." },
    ] },
  },
  terms: {
    ar: { title: "الشروط", description: "شروط استخدام المحتوى والخدمات.", blocks: [
      { p: "المحتوى المعروض للمعلومات العامة، ولا يغني عن التحقق المستقل أو المشورة المتخصصة (الطبية أو القانونية أو المالية) عند الحاجة." },
      { h: "المحتوى والمصادر", ul: ["تعود حقوق الأخبار والصور المعروضة إلى أصحابها، ونعرض عنوانها وملخصها مع رابط المصدر.", "نصوص الموسوعة مأخوذة من ويكيبيديا ومرخّصة بموجب CC BY-SA 4.0، ويلزم عند إعادة استخدامها نسبتها وإبقاء الترخيص نفسه."] },
      { h: "الدقة والإتاحة", p: "نبذل جهدنا في التحقق، لكننا لا نضمن خلو المحتوى من الخطأ، ولا استمرار توفر الخدمة أو المصادر الخارجية. الأسعار والطقس والمواقيت مرجعية وتُجلب من مزودين خارجيين." },
      { h: "التعديل", p: "قد نعدّل المحتوى أو الشروط أو نزيل مادة عند الحاجة." },
    ] },
    en: { title: "Terms", description: "Terms for using the content and services.", blocks: [
      { p: "Content is provided for general information and does not replace independent verification or professional (medical, legal or financial) advice when needed." },
      { h: "Content and sources", ul: ["Rights to the news and images shown belong to their owners; we show the headline and a summary with a link to the source.", "Encyclopedia text is taken from Wikipedia and licensed under CC BY-SA 4.0; reuse requires attribution and keeping the same license."] },
      { h: "Accuracy and availability", p: "We do our best to verify, but we do not guarantee the content is error-free, nor that the service or external sources remain available. Prices, weather and prayer times are reference values fetched from external providers." },
      { h: "Changes", p: "We may change content or these terms, or remove material, when needed." },
    ] },
  },
};
export const staticPage = (slug: StaticSlug, lang: Lang): StaticPage => PAGES[slug][lang];
