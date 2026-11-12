# ابدأ من هنا — الوضع الحالي لمشروع بيان (BAYAN)

> آخر تحديث: 6 نوفمبر 2026. هذا الملف هو **أول ما يُقرأ** في أي محادثة أو جلسة جديدة (Claude أو غيره). يلخص ما بُني، والمشاكل وحلولها، وما لم يُنجز، وكل مطالب المالك، وكيف يتصل Claude بالمستودع. الملفات القديمة (`MASTER_PROJECT_REFERENCE_AR.md`, `WORK_STATE.md`, `AUTO_PROJECT_HISTORY_AR.md`) أقدم من معمارية v2 أدناه؛ إذا تعارضت معها فهذا الملف هو الأحدث. لا تضع هنا أسرارًا أو توكنات أبدًا.

<!-- BAYAN_LIVE_STATUS_START -->
## الحالة الحية (تُحدَّث آليًا بعد كل نشر — لا تعدّلها يدويًا)
- آخر تحديث: 2026-11-12T22:52:29.895Z
- V2_BUILD في الشيفرة: `2026-11-13.3`
- آخر نشر: failure للكوميت `7d50cbf2` (https://github.com/TaHa41/BAYAN/actions/runs/43323546415)
- نتائج الـjobs: deploy=success، verify-production=failure
- حالة الذكاء الاصطناعي (إعداد فقط، بلا استدعاء): {"checkedAt":"2026-11-12T22:52:02.333Z","build":"2026-11-13.3","deployedCommit":"7d50cbf2ad1b","probe":"off","gemini":{"configured":true,"keyState":"set","model":"gemini-3.8-flash"},"workersAi":{"configured":true}}
- فحص الإنتاج: news_publication_gap: archive has 200 candidates ready for article drafting but the news sitemap contains no published articles
- خط نشر الأخبار (/api/health/pipeline): {"build":"2026-11-13.3","pipeline":{"enabled":true,"setting":"true","aiDailyLimit":"40"},"providers":{"gemini":true,"openai":true,"workersAi":true},"d1":"ok","breakers":{"openai":{"open":false,"code":"credit_balance_exhausted","until":"2026-10-20T06:06:01"},"gemini":{"open":true,"code":"quota_exceeded","until":"2026-11-13T00:55:51"}}}
- أسباب فشل المزوّدين وميزانية اليوم: budgetToday=2026-11-12:40 | providerFailures: 2026-11-12T18:55:51 ai_provider_failure: Gemini answer: You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: [url] To monitor your current us || 2026-11-12T18:05:57 ai_provider_failure: Gemini answer: You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: [url] To monitor your current us || 2026-11-12T17:56:06 ai_provider_failure: Gemini answer: This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later. || 2026-11-12T16:26:11 ai_provider_failure: Gemini answer: This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later. || 2026-11-12T15:36:16 ai_provider_failure: Gemini answer: This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later. || 2026-11-12T15:26:15 ai_provider_failure: Gemini answer: This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.
- آخر أحداث الصياغة والمزوّدين: 2026-11-12T22:52:08 ai_circuit_breaker: gemini_breaker_open: {"state":"open","code":"quota_exceeded","openedUntil":"2026-11-13T00:55:51.136Z"} || 2026-11-12T22:51:08 news_archive_article_generation: {"status":"attempted_no_publish","id":49805,"language":"ar","searchStatus":"mixed","publishReason":"no_independent_sources","queueStatus":"skipped_low_evidence","publishReasonDe || 2026-11-12T22:44:29 ai_circuit_breaker: gemini_breaker_open: {"state":"open","code":"quota_exceeded","openedUntil":"2026-11-13T00:55:51.136Z"} || 2026-11-12T22:37:59 ai_circuit_breaker: gemini_breaker_open: {"state":"open","code":"quota_exceeded","openedUntil":"2026-11-13T00:55:51.136Z"} || 2026-11-12T22:36:11 news_archive_article_generation: {"status":"attempted_failed","id":49782,"language":"en","publishReason":"ai_unavailable","publishReasonDetail":"all_providers_unavailable","retryMinutes":15,"attemptsPreserved": || 2026-11-12T22:36:10 news_archive_article_generation: ai_unavailable_deferred: {"id":49782,"language":"en","retryMinutes":15,"attemptsPreserved":0} || 2026-11-12T22:36:10 news_ai_budget: daily_ai_budget_exhausted: UTC daily news AI call limit reached (40) || 2026-11-12T22:36:02 ai_circuit_breaker: gemini_breaker_open: {"state":"open","code":"quota_exceeded","openedUntil":"2026-11-13T00:55:51.136Z"} || 2026-11-12T22:26:07 news_archive_article_generation: {"status":"attempted_failed","id":49767,"language":"ar","publishReason":"ai_unavailable","publishReasonDetail":"all_providers_unavailable
- خريطة الأخبار والأرشيف: {"status":200,"contentType":"application/xml; charset=utf-8","urlCount":0,"candidateCount":"0","archiveCandidateCount":"200","archiveReadyForArticleDraftingCount":"200","eligibleCount":"0","rejectedCount":"0","rejectionReasons":"{}","archiveReasons":"{\"never_attempted\":158,\"attempts_0\":200,\"skipped_low_evidence\":31,\"ai_unavailable\":11}","xmlBytes":167}
- أسباب الرجوع للموقع القديم (/api/health/v2): /api/health/v2","s":200,"fb":"{\"build\":\"2026-11-13.3\",\"count\":0,\"recent\":[]}"}]
- أداء الصفحات الحقيقية (بارد/دافئ بالملّي ثانية، كاش، المُرسِم):
  - `/research?title=%22%D9%81%D8%B1%D9%86%D8`: حالة 200، 3588/24، كاش HIT، مُرسِم v2
  - `/article/politics-public-consultation-ar`: حالة 200، 211/22، كاش HIT، مُرسِم v2
  - `/weather`: حالة 200، 714/22، كاش HIT، مُرسِم v2
  - `/prayer`: حالة 200، 747/21، كاش HIT، مُرسِم v2
  - `/trends`: حالة 200، 239/51، كاش HIT، مُرسِم v2
  - `/about`: حالة 200، 32/61، كاش HIT، مُرسِم v2
  - `/search?q=%D9%85%D8%B5%D8%B1`: حالة 200، 3107/1883، كاش MISS، مُرسِم v2
  - `/prices`: حالة 200، 409/34، كاش HIT، مُرسِم v2
  - `/economy`: حالة 200، 430/33، كاش HIT، مُرسِم v2
  - `/health`: حالة 200، 410/32، كاش HIT، مُرسِم v2
  - `/sections`: حالة 200، 49/61، كاش HIT، مُرسِم v2
  - `/`: حالة 200، 230/53، كاش HIT، مُرسِم v2
  - `/news`: حالة 200، 509/58، كاش HIT، مُرسِم v2
  - `/politics`: حالة 200، 541/55، كاش HIT، مُرسِم v2
- آخر الـcommits على main:
  - c779ba4 2026-11-12 docs: automatically record project history
  - 82ffa9a 2026-11-12 AI budget: refund when no provider answered; pipeline status shows provider failures and today's budget; tests;
  - ef146bd 2026-11-12 docs: automatically refresh live status
  - d20ad02 2026-11-12 docs: automatically record project history
  - b762a0f 2026-11-12 Pipeline status: breaker states and provider failure events; CI prints them; V2_BUILD 2026-11-13.2
  - 45bebc0 2026-11-12 docs: automatically refresh live status
  - fb6ca37 2026-11-12 docs: automatically record project history
  - 630fcea 2026-11-12 Public pipeline status (/api/health/pipeline) in CI diagnostics and the live status block; tests; docs; V2_BUIL
  - 6340cc4 2026-11-12 docs: automatically refresh live status
  - a76f008 2026-11-12 docs: automatically record project history
<!-- BAYAN_LIVE_STATUS_END -->

## 1) كيف تبدأ في محادثة جديدة (3 دقائق)
1. اقرأ هذا الملف و`CLAUDE.md` (قواعد الأمان) ثم `docs/WORK_STATE.md` إن لزم.
2. تحقق من الواقع قبل أي ادعاء: آخر commits على `main`، وآخر تشغيل لـ `BAYAN Worker Deploy`، وإشعارات (annotations) فحص الإنتاج. لا تعتمد على الذاكرة.
3. نفّذ بالترتيب في قسم «الخطوات التالية» (رقم 8). كل تغيير: فرع جديد ← اختبارات ← PR ← CI أخضر ← دمج بموافقة المالك ← تحقق من النشر.
4. عند انتهاء الجلسة حدّث هذا الملف (الحالة والخطوات التالية) في نفس الـPR.

أوامر الفحص المحلي (الشبكة داخل بيئة Claude محدودة؛ `npm install` قد يفشل بخطأ arborist، والبديل الذي نجح):
```
npx -y pnpm@9 install --ignore-scripts
node_modules/.bin/tsc --noEmit
node_modules/.bin/vitest run --exclude 'tests/e2e/**'
node scripts/source-contract-smoke.mjs
node scripts/production-smoke-guard-check.mjs
```
قراءة نتائج GitHub Actions: سجلات الـjobs تُحمَّل من نطاق محظور في بيئة Claude، لكن **الـannotations** تُقرأ عبر `GET /repos/TaHa41/BAYAN/check-runs/{job_id}/annotations`. لذلك سكربتات الفحص تطبع أسباب الفشل كـ`::error::` و`::notice::` (مثل `NEWS_SITEMAP_DIAGNOSTICS` و`BAYAN AI status`).

## 2) هوية المشروع
- الموقع: https://bayan.tahaomar411.workers.dev — المستودع: `TaHa41/BAYAN` (الفرع `main` ينشر تلقائيًا).
- التشغيل: Cloudflare Worker اسمه `bayan`، قاعدة بيانات D1 اسمها `bayan-knowledge`، Workers AI، مهمة مجدولة (cron) كل 5 دقائق.
- المبدأ: **المعلومة أولًا، والدليل قبل الادعاء.** عربي (RTL، الافتراضي) وإنجليزي (LTR).
- التوقيع المطلوب في كل صفحة: `Created by Taha Omar`.

## 3) المعمارية الحالية: v1 + جسر v2 (Strangler)
- **v1** (`src/**`): الـWorker الأصلي: واجهات `/api/*`، الإدارة، دورة الأخبار والمقالات (cron)، البحث، الـsitemaps/robots/ads.txt، التحليلات، الإصلاح الذاتي. ما زال هو المصدر الوحيد للبيانات والمنطق الثقيل.
- **v2** (`v2/src/**`): صفحات تُبنى كاملة على الخادم (SSR) بدون حزمة JavaScript للواجهة. تُخدم من نفس الـWorker عبر `src/v2-bridge.ts`، فتبقى كل الأسرار والـbindings والـcron كما هي.
- **ما يخدمه v2 اليوم (GET):** `/`، الأقسام الـ15، `/article/:slug`، `/news` (+`?archive=ID`)، `/trends`، `/search`، `/research`، `/wiki/:title`، `/prices`، `/weather`، `/prayer`، `/about`، `/methodology`، `/privacy`، `/terms`، `/contribute` (GET و POST)، `/api/health/ai`، و`/api/admin/ai-test` و`/api/admin/diagnose` (يتطلبان `Authorization: Bearer <BAYAN_AI_MANAGER_TOKEN>`، يفشلان مغلقين).
- **ما بقي على v1 (غير مرتبط علنًا):** `/admin`، `/saved`، `/ask`، كل `/api/*` الأخرى، `/sitemap.xml`, `/news-sitemap.xml`, `/robots.txt`, `/ads.txt`.
- **الجسر:** إذا أرجع v2 غير 200 (مقال غير معروف، خطأ) يسقط الطلب إلى v1. ذاكرة Cache API لصفحات GET (5 دقائق). الرأس `x-bayan-renderer: v2` و`x-bayan-v2-build` يدلان على من خدم الصفحة وأي إصدار.
- **فخ مهم:** workflow النشر `deploy-worker.yml` يراقب `src/**` وغيرها **وليس `v2/**`**. لذلك أي تعديل في `v2/` يجب أن يرفق بتغيير `V2_BUILD` في `src/v2-bridge.ts` (صيغة `YYYY-MM-DD.n`) وإلا لن يُنشر. الحل الدائم (يحتاج صلاحية Workflows): إضافة `v2/**` إلى `paths:`.
- **الخدمات الخارجية المستخدمة:** ويكيبيديا/ويكي بيانات/كومنز (الموسوعة)، Open-Meteo (الطقس)، AlAdhan (المواقيت)، Frankfurter/ExchangeRate (العملات)، مزودو الذهب، RSS الأخبار، Gemini ثم Workers AI.

## 4) قواعد لا تُكسر (من المالك + CLAUDE.md)
- لا حذف لأي توكن أو سر أو أداة قد نحتاجها، ولا لمس للأسرار بدون موافقة. لا حذف لبيانات D1 ولا تعديل لـmigrations مطبقة.
- حد التوثيق: **5 ناشرين مستقلين** على نطاقات HTTPS مختلفة (المجمّعات مثل Google News/MSN لا تُحسب). لا يُخفَّف أبدًا.
- لا اختلاق لأخبار أو صور أو مصادر أو أرقام. عند تعذر البيانات: رسالة صريحة بدل رقم تقديري.
- لا مقال بدون صورة https مرتبطة بمضمونه؛ الغلاف العام لموقع المصدر (cover/logo/default…) لا يُعد صورة.
- لا Supabase ولا خدمات مدفوعة بدون موافقة؛ OpenAI المدفوع معطّل افتراضيًا.
- كل تغيير على فرع + PR + اختبارات. النشر فقط عبر GitHub Actions بعد الدمج.

## 5) مطالب المالك (كلها، مجمّعة)
محتوى: موسوعة كاملة ومتجددة (أقسام غنية لا مقالين)؛ مقالات منظمة ومفصلة ومن عدة مصادر مع صورة مرتبطة؛ كل بحث أو قراءة تُضاف تلقائيًا لقسمها (سياسة→سياسة، سيرة→شخصيات…)؛ حكمة متغيرة؛ بحث احترافي داخل الموقع وخارجه بمعلومة موثقة ومفصلة؛ أسعار محدّثة دائمًا؛ مواقيت صلاة وطقس لأي مدينة/دولة.
تصميم: موقع إخباري كبير متناسق، بأنيميشن، بأيقونات وأقسام وأسماء ونصوص مكتوبة من جديد، **بدون أي رابط يقود للتصميم القديم**؛ التصميم الحالي مقبول وتُطوَّر أجزاء منه بالطلب (آخر طلب: تصميم قسم الأقسام).
تقني: ذكاء اصطناعي كمهندس تقني يفهم الموقع ويشخّص ويصلح؛ إحصاءات تستبعد زيارات المالك والإدارة والذكاء الاصطناعي؛ جاهزية للإعلانات لاحقًا؛ فهرسة جيدة على Google؛ لوحة إدارة شاملة؛ نشر بدون أخطاء.
أسلوب العمل: استهلاك رصيد أقل (دفعات كبيرة بدل ردود صغيرة، وهذا الملف بدل المراجعة من المحادثة)، وعدم ضياع الجهد بين المحادثات.

## 6) المشاكل التي واجهتنا وكيف حُلّت
| المشكلة | السبب الجذري | الحل |
|---|---|---|
| ~160 «مقالًا» منشورًا هي هياكل (جملة مكررة، غلاف عام، مصدر «Reference») وكانت تتصدر الرئيسية | بذور قديمة بلا جودة | بوابة جودة `v2/src/quality.ts`: جسم يزيد عن الملخص بـ1200+ حرف، ناشران مستقلان على الأقل، صورة غير عامة. الهياكل خارج القوائم والـsitemap وصفحاتها `noindex` مع تنبيه. لا حذف بيانات |
| الأقسام شبه فارغة | المحتوى يعتمد على دورة الأخبار المتوقفة | موسوعة بيان: مداخل حية من ويكيبيديا/كومنز (نسبة CC BY-SA وترخيص الصور)، 12–18 موضوعًا لكل قسم، «الأكثر قراءة اليوم» |
| أخبار الرئيسية غير مصنفة | لا تصنيف | مصنِّف شفاف بالكلمات المفتاحية `v2/src/classify.ts`: العنوان أولًا، والملخص يحتاج كلمتين مفتاحيتين |
| ظهور وسوم HTML في ملخصات RSS | الملخصات تأتي بوسوم أو كيانات مشفّرة | `plain()` في `v2/src/ui.ts` |
| تعديلات v2 لا تُنشر | مسارات workflow | `V2_BUILD` (انظر الفخ أعلاه) |
| اختبارات الرئيسية تتجاوز 5 ثوانٍ على CI | تتصل بالإنترنت فعلًا | `fetch` معزول في الاختبارات، و`wikiApi` يقرأ `fetch` عند الاستدعاء، وحدود زمن للكتل الاختيارية (3 ثوانٍ) |
| طقس لا يعرف «القاهرة» | geocoding بالإنجليزية ونتيجة واحدة | geocoding بلغة المدخل، 5 نتائج، تطابق الاسم أولًا، إعادة محاولة |
| إحصاءات تشمل زحّافات الذكاء الاصطناعي | قائمة UA ناقصة | أُضيفت GPTBot وClaudeBot وغيرها (`src/security.ts`) |
| توقف الأخبار `news_publication_gap` | 200 مرشح لم يُصغ منهم شيء؛ الذكاء الاصطناعي غير متاح | تشخيص حتى السبب: `GEMINI_API_KEY` غير مضبوط في الإنتاج (انظر 7). أضيف اكتشاف ذاتي لنموذج Gemini وإشارة `/api/health/ai` |
| «Discovered – not indexed» (203 صفحة) في Search Console | sitemap فيه هياكل، وتعارض canonical للرئيسية، ودومين workers.dev ضعيف السلطة | الـsitemap يعرض المكتمل فقط، canonical العربية = الجذر `/`. الدومين الخاص مطلوب |
| `apple-app-site-association` 404 | أجهزة آبل تتفقده | تجاهل: لا تطبيق iOS |
| فشل `Workers Builds: bayan24` | تكامل Cloudflare لـWorker غير موجود | حذفه المالك |
| سجلات Actions لا تُقرأ من بيئة Claude | نطاق blob محظور | قراءة الـannotations بدل السجلات |
| نتائج `web_fetch` قديمة أحيانًا | كاش الأداة | تحقق بصفحة لم تُجلب من قبل أو انتظر دقائق |

## 7) الحالة الراهنة (3 نوفمبر 2026)
**منجز ومنشور:** التصميم التحريري الموحد (رأس كحلي وشريط أقسام وشريط أخبار متحرك وحركة بالتمرير وشريط تقدم القراءة، وضع داكن تلقائي)، كل الصفحات العامة أعلاه، الموسوعة، الأرشيف التلقائي للأقسام (`status='ARCHIVE'` في جدول `articles`، لا يظهر كمقال)، الأخبار الحية مصنفة في الأقسام، الأسعار والطقس والمواقيت، الصفحات القانونية بنص صادق، البحث الكامل بتصميم جديد، المساهمة، sitemap بجودة، اكتشاف نموذج Gemini، أدوات تشخيص الذكاء الاصطناعي، حماية `/ads.txt` (يُخدم فقط من متغير `ADS_TXT`).
**آخر قياس للإنتاج:** `/api/health/ai` أظهر `gemini.configured:false` و`error:missing_key` (النموذج الافتراضي في الكود `gemini-3.8-flash`)، وWorkers AI مربوط. من 200 مرشح خبر: 145 لم يُحاول، 40 نقص أدلة، 15 الذكاء الاصطناعي غير متاح. فحص `verify-production` يفشل بسبب `news_publication_gap`، وهذا متوقع حتى يُصلح المفتاح.
**ما يحتاج المالك وحده:**
1. إضافة السر **`GEMINI_API_KEY`** في Cloudflare (Secret بهذا الاسم تمامًا؛ سبق ظهور اسم خاطئ `Gemini_API_Key_2`) واختباره في Google AI Studio. بعدها `/api/health/ai` يجب أن يعرض `ok:true`. اضبط `GEMINI_MODEL` فقط إن أردت نموذجًا محددًا.
2. تحويل `SEARCH_API_KEY` من متغير نصي إلى Secret.
3. ربط دومين خاص بالموقع (أقوى عامل للفهرسة).
4. إعطاء التوكن صلاحية Workflows وإضافة `v2/**` لـ`deploy-worker.yml`.
5. سحب (Revoke) أي توكن GitHub شُورك في محادثة.
**مشاكل مفتوحة بلا سبب مؤكد:** بطء الصفحات (يُرجَّح انتظار `news()` وويكيبيديا عند البداية الباردة؛ الحل المقترح stale-while-revalidate في الجسر)، وتكرار رسالة «تعذر تحضير معالجة مفصلة» في `/research` (يُرجَّح فشل منشئ المقال بسبب غياب مفتاح Gemini؛ أعد القياس بعد إصلاحه).

## 8) الخطوات التالية (بالترتيب)
1. بعد ضبط `GEMINI_API_KEY`: راقب `BAYAN AI status` و`NEWS_SITEMAP_DIAGNOSTICS` في إشعارات النشر، وتأكد أن `ai_unavailable` يتراجع وأن مقالات تُنشر.
2. أداء: stale-while-revalidate في `src/v2-bridge.ts` (عرض النسخة المخزنة فورًا وتحديثها بالخلفية)، وتقليل انتظار `news()` عند الرئيسية.
3. لوحة الإدارة بتصميم جديد (حاليًا v1 القديم، غير مرتبطة علنًا) مع إحصاءات تستبعد المالك/الإدارة/الذكاء الاصطناعي.
4. نقل `/saved` و`/ask` أو إلغاؤهما، ثم حذف كود v1 الميت (واجهة JS القديمة `public/app-*.js`) بعد التحقق أن لا مسار يستخدمها.
5. إضافة «سير» تلقائية للأشخاص الذين يُقرأ عنهم (قسم شخصيات) من الموسوعة، وتحسين جودة المقالات الجديدة بعد عودة الذكاء الاصطناعي.
6. إعلانات: بعد الدومين الخاص ومراجعة سياسة الخصوصية (جاهزية `ads.txt` موجودة).

## 9) كيف يتصل Claude بالمستودع (وكيف تعيده في محادثة جديدة)
**ما حدث في هذه المحادثات:** Claude في الدردشة لا يملك اتصالًا مدمجًا بـGitHub. استُخدم **توكن شخصي Fine-grained** أعطاه المالك، وبه نُفّذ `git clone/push` واستُدعيت واجهة GitHub REST من بيئة Claude (النطاقات المسموحة: github.com وapi.github.com). صلاحيات التوكن المستخدم: Contents وPull requests (قراءة وكتابة) على مستودع BAYAN فقط، **بدون Workflows وبدون Actions**؛ لذلك لا يستطيع تعديل `.github/workflows` ولا تشغيل workflow يدويًا.
**إنشاء توكن:** GitHub ← Settings ← Developer settings ← Personal access tokens ← Fine-grained tokens ← Generate new token ← مدة قصيرة ← Only select repositories: `BAYAN` ← صلاحيات Contents وPull requests (Read and write). أضف Workflows وActions فقط إن أردت أن يعدّل Claude الـworkflows أو يشغّلها. اللصق في المحادثة يكشفه فيها، فاسحبه بعد الانتهاء.
**الطريقة الأفضل والدائمة (بدون لصق توكن):** استخدم **Claude Code** المتصل بالمستودع (الجلسات السحابية على الويب عبر تطبيق GitHub الخاص بـClaude، أو Claude Code محليًا في المجلد). هذه الأدوات تقرأ `CLAUDE.md` تلقائيًا، وتشغّل الاختبارات على الكود الحقيقي وتفتح PRs بصلاحيات حسابك. تفاصيل التثبيت الحالية في توثيق Anthropic (docs.claude.com)، لأنها تتغير.
**سطر البداية لمحادثة جديدة (انسخه):**
> اقرأ `docs/START_HERE_AR.md` و`CLAUDE.md` في مستودع TaHa41/BAYAN، تحقق من حالة `main` وآخر نشر، ثم أكمل من قسم «الخطوات التالية». لا تحذف أي توكن أو سر ولا تخفف شرط الأدلة، واعمل بفروع وPRs واختبارات، ولا تبدأ من الصفر.

---
# الجزء الثاني: خريطة الكود والمتغيرات وسجل القرارات

## 10) خريطة الكود (أين يوجد كل شيء)
| المسار | الدور |
|---|---|
| `src/index.ts` | نقطة دخول الـWorker: حارس حصة D1، ثم `serveV2` (الجسر)، ثم مسارات v1 والـSHELL القديم |
| `src/v2-bridge.ts` | الجسر: `V2_BUILD`، ملكية المسارات `v2Owns`، كاش الصفحات، ربط خدمات v1 بـv2 (الأخبار، البحث، المقال المعمّق، المساهمة، الأسعار، حالة الذكاء الاصطناعي) |
| `src/routes/api.ts` | واجهات v1: `/api/search`, `/api/news/article`, `/api/section`, `/api/contribute`, `/api/health`, الإدارة |
| `src/services/` | `news.ts` (RSS)، `live.ts` (عملات/ذهب/طقس/مواقيت)، `search.ts`، `gemini.ts` (مع اكتشاف النموذج)، `editorial.ts`، `repair.ts`، `news-article-publisher.ts`، `section-archive.ts` |
| `src/seo.ts` | robots وsitemap (ببوابة جودة) وnews sitemap وads.txt |
| `src/security.ts` | استبعاد التحليلات (المالك، الإدارة، البوتات، زحّافات الذكاء الاصطناعي) |
| `v2/src/worker.ts` | موجّه v2 (كل الصفحات وAPI التشخيص)، قابل للاختبار بحقن الاعتماديات |
| `v2/src/ui.ts` | نظام التصميم (CSS) وكل قوالب الصفحات والنصوص العربية/الإنجليزية |
| `v2/src/store.ts` | قراءة D1 للقراءة فقط (مقالات منشورة، أرشيف، أخبار الأرشيف) |
| `v2/src/wiki.ts`, `topics.ts` | الموسوعة: ويكيبيديا/كومنز، وبذور المواضيع لكل قسم |
| `v2/src/quality.ts`, `classify.ts`, `evidence.ts` | بوابة الجودة، تصنيف الأخبار، قاعدة 5 ناشرين مستقلين |
| `v2/src/ai.ts`, `engineer.ts` | طبقة الذكاء الاصطناعي بأنواع أخطاء، وقواعد التشخيص |
| `v2/src/pages.ts`, `icons.ts`, `sections.ts` | الصفحات الثابتة، الأيقونات، الأقسام والأدوات |
| `v2/wrangler.jsonc` | إعداد معاينة منفصلة `bayan-v2` (غير منشورة؛ ملف workflow الخاص بها يحتاج صلاحية Workflows) |
| `migrations_v1/` | هجرات D1 (آخرها 0039). لا تُعدَّل المطبقة؛ أضف جديدة فقط |
| `scripts/` | فحوص الإنتاج (`production-health.mjs` يطبع حالة الذكاء الاصطناعي)، `news-sitemap-diagnostics.mjs`، `source-contract-smoke.mjs` |
| `.github/workflows/` | `deploy-worker.yml` (يُنشر عند تغيّر `src/**` وغيرها فقط)، `production-smoke.yml` (مراقبة كل 6 ساعات)، CI، E2E |
| `public/` | حزم JS القديمة `app-*.js` (لم تعد تخدم الصفحات العامة)، `styles.css`، رسوم الأقسام `sections/*.svg` |

## 11) أسماء المتغيرات التي يقرؤها الكود (بدون قيم أبدًا)
Bindings: `DB` (D1)، `AI` (Workers AI)، `AI_SEARCH`، `ASSETS`.
أسرار/إعدادات: `GEMINI_API_KEY`، `GEMINI_MODEL`، `BAYAN_AI_MANAGER_TOKEN`، `ADMIN_PASSWORD`، `ADMIN_SESSION_SECRET`، `ADS_TXT`، `NEWS_AI_DAILY_LIMIT`، `NEWS_AI_MODEL`، `NEWS_PIPELINE_ENABLED`، `BAYAN_AI_SEARCH_INSTANCE`، `BAYAN_ALLOW_PAID_AI`، `OPENAI_API_KEY`/`OPENAI_ENABLED`/`OPENAI_MODEL` (اختياري ومعطّل افتراضيًا)، `GNEWS_API_KEY`، `GOLD_API_KEY`، `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID`، `WIKIMEDIA_ENTERPRISE_USERNAME`/`WIKIMEDIA_ENTERPRISE_REFRESH_TOKEN`، `SEARCH_API_KEY` (مخزّن كنص عادي ويجب تحويله Secret). المصدر الرسمي للقائمة: `src/types.ts`. التحقق من وجودها يتم عبر إشارات الفحص (مثل `/api/health/ai`) وليس بقراءة القيم.

## 12) كيف تضيف صفحة جديدة في v2 (وصفة)
1. قالب الصفحة (دالة `...Body`) في `v2/src/ui.ts`، ونصوصها عبر `T(lang, ar, en)` بالعربية والإنجليزية.
2. المسار في `v2/src/worker.ts` (استخدم `page(...)` وحقن أي مصدر بيانات خارجي عبر `Deps`، وغلّف الخارجي بـ`soft(promise, ms, fallback)` حتى لا تعلق الصفحة).
3. إن كانت تحتاج خدمة من v1، اربطها في `src/v2-bridge.ts`، وأضف المسار إلى `v2Owns`.
4. ارفع `V2_BUILD` (وإلا لن يُنشر).
5. اختبارات في `v2/tests/worker.test.ts` وجدول المسارات في `tests/v2-bridge.test.ts`. الاختبارات **بلا شبكة** (`fetch` مُحاكى).
6. فرع ← PR ← CI ← دمج ← قراءة annotations النشر.

## 13) سجل الـPRs المهمة (للرجوع)
#550 صفحات الأشخاص الكاملة + إصلاح الإصلاح الذاتي + `/ads.txt` · #552 استبعاد زحّافات الذكاء الاصطناعي · #553 طقس بأسماء عربية · #564–566 إظهار أسباب فشل الفحص في annotations · #567 ربط حزمة الهيرو · #568 أسباب الأرشيف · #569 تصميم v3 القديم (أُلغي أثره لاحقًا) · #572 أرشيف الأقسام التلقائي · #573 جسر v2 (التحويل التدريجي) · #574 صفحة الأخبار · #575 تنظيف HTML · #576 `V2_BUILD` · #580 بوابة الجودة والرئيسية بالأخبار · #581 الموسوعة · #582 تنسيق المداخل · #583 الأسعار والطقس والمواقيت والحركة · #584 المصنّف · #585 sitemap وcanonical · #586 الصفحات الثابتة والبحث · #587 كل الصفحات + اكتشاف نموذج Gemini + أدوات التشخيص · #588 إشارة `/api/health/ai` · #590 تصميم الأقسام + هذا المرجع.

## 14) قرارات معمارية وأسبابها
- **SSR بدل SPA:** معظم أعطال الموقع القديم كانت في حزمة JS كبيرة تعتمد على عشرات الـAPI؛ الصفحة المبنية على الخادم أسرع وأسهل فهرسة ولا تنهار بصمت.
- **جسر تدريجي (Strangler) وليس إعادة كتابة دفعة واحدة:** الإنتاج ينشر من `main` تلقائيًا؛ استبدال كامل بدون تكافؤ كان سيُسقط الإدارة ودورة الأخبار والأسرار.
- **موسوعة من ويكيبيديا:** محتوى حقيقي ومرخّص ومتجدد بلا ذكاء اصطناعي ولا تكلفة؛ صفحاتها `noindex` وخارج الـsitemap لأنها مرآة نص ويكيبيديا (محتوى مكرر)، مع نسبة وترخيص CC BY-SA إلزاميين.
- **الأرشيف بحالة `ARCHIVE`:** يملأ الأقسام بنتائج بحث حقيقية دون أن يُعد مقالًا ولا يمس شرط الأدلة؛ كل استعلام عام يقرأ `PUBLISHED` فقط.
- **تصنيف بالكلمات المفتاحية:** شفاف وقابل للاختبار بدل قرار غامض من نموذج؛ العنوان يحسم.
- **لم يُحذف كود v1 بعد:** يُحذف جزءًا جزءًا بعد إثبات أن لا مسار يستخدمه (الخطوة 4 في القسم 8).

## 15) أسئلة مفتوحة للمالك
اسم السر الفعلي لمفتاح Gemini في Cloudflare (إن كان غير `GEMINI_API_KEY` يمكن إضافة اسم بديل في الكود)؛ الدومين الخاص المرغوب؛ هل تُنقل لوحة الإدارة لتصميم جديد الآن؛ مصير `/saved` و`/ask`.

---
# الجزء الثالث: العمل الجاري عند آخر تسليم (4 نوفمبر 2026)

## 16) تسريع الصفحات وتحسين الظهور (`feat/seo-speed`) — اكتمل في PR هذه الجلسة
- **Stale-while-revalidate** في `src/v2-bridge.ts`: HIT ضمن `s-maxage`، وSTALE حتى 6 أضعافه (يُقدَّم فورًا ويُحدَّث بالخلفية، دون تحديثين متزامنين لنفس الصفحة)، وMISS لما هو أقدم. الرأس `x-bayan-cache` يعرض الحالة. `V2_BUILD` = `2026-11-05.1`.
- **إصلاحان أُضيفا في هذه الجلسة (كانا عيبين في نسخة الفرع القديمة):** (1) النسخة المخزنة كانت تُرجَع للمتصفح بـ`cache-control` الطويل (6 أضعاف)؛ أصبح يُرجَع `cache-control` الأصلي للصفحة وتُحذف الرؤوس الداخلية `x-bayan-cc/cached-at/smax/cached-build`. (2) لم يعد مفتاح الكاش يحمل `V2_BUILD`، فصارت النسخة المخزنة تحمل `x-bayan-cached-build` ولا تُقدَّم إن اختلف عن البناء الحالي (يظهر أي تصميم جديد فور النشر).
- **sitemap (`src/seo.ts`):** إضافة `/weather` و`/prayer`، وبوابة `articleQuality` على المقالات المدمجة.
- **JSON-LD:** `WebSite`+`SearchAction`+`Organization` للرئيسية، و`CollectionPage`+`BreadcrumbList` للأقسام (`siteJsonLd`, `sectionJsonLd`).
- **الاختبارات المضافة (10، المجموع 415):** `tests/v2-swr.test.ts` (دورة MISS/HIT/STALE/MISS، رأس cache-control، بناء قديم، POST، تحديث خلفي واحد)، وJSON-LD في `v2/tests/worker.test.ts`، و`/weather` و`/prayer` وبوابة المدمجة في `tests/sitemap-quality.test.ts`.
- **المتبقي بعد الدمج (تحقق حي لم يُنفَّذ بعد):** نجاح job `deploy`، ثم طلب صفحة حقيقية مرتين وقراءة `x-bayan-cache` (MISS ثم HIT) و`x-bayan-v2-build: 2026-11-05.1`.

## 17) حالة الإنتاج الآن
- (6 نوفمبر) `/api/health/ai` صار يعرض `keyState` (`absent` = لا يوجد binding، `empty` = موجود بقيمة فارغة، `set`) و`build` و`deployedCommit`، ولا يخزّن نتيجة «مفتاح غير موجود» بالكاش. استخدمه لتمييز سبب `missing_key`.
- تصميم الأقسام الجديد منشور (PR #592). النشر ينجح، وفحص `verify-production` يفشل بسبب `news_publication_gap` (متوقع حتى يعمل الذكاء الاصطناعي).
- `GEMINI_API_KEY` غير مضبوط في الإنتاج (إشارة `/api/health/ai`)، وهو سبب توقف الأخبار الجديدة ورسائل «تعذر تحضير معالجة مفصلة».

## 18) الظهور في Google (ما تم وما لا يمكن بالكود)
**تم:** sitemap يعرض المكتمل فقط، وcanonical الرئيسية العربية = `/`، وhreflang، وJSON-LD للمقالات (والرئيسية والأقسام في الفرع أعلاه)، وrobots سليم، وبنية روابط داخلية من الرئيسية (HTML كامل على الخادم). **لا يمكن بالكود:** حالة «اكتُشفت ولم تُفهرس» سببها الأساسي ضعف سلطة النطاق `workers.dev` وحداثة الموقع. **أنت:** اربط دومينًا خاصًا من Cloudflare، ثم في Search Console أضف الدومين الجديد كموقع، أرسل `sitemap.xml`، اضغط «التحقق من الإصلاح»، واطلب الفهرسة لأهم 10 صفحات (الرئيسية والأقسام). متوقع أن تأخذ الفهرسة أسابيع.

## 19) أولويات الجلسة القادمة
1) تحقق من نشر `feat/seo-speed` (القسم 16، البند الأخير). 2) تأكد من ضبط `GEMINI_API_KEY` ثم راقب `BAYAN AI status` وتقدم الأخبار. 3) لوحة الإدارة بتصميم جديد. 4) حذف كود v1 الميت تدريجيًا. 5) سير تلقائية لقسم الشخصيات.

---
# الجزء الرابع: جلسة 6 نوفمبر 2026

## 20) ما تم
- دُمج `feat/seo-speed` (PR #594): SWR بالكاش، sitemap، JSON-LD. ودُمج PR #595: `/api/health/ai` يعرض `keyState` و`build` و`deployedCommit`.
- **سبب `missing_key` الذي استمر:** `GEMINI_API_KEY` أُضيف كـSecret لكن النسخة الشغالة لم تكن تحمله؛ بعد نشر الكود صار `keyState:"set"`. **المشكلة الحالية: Gemini يردّ `quota` (429)** (حصة المشروع أو النموذج `gemini-3.8-flash` غير متاح على الخطة). المطلوب من المالك: فحص الحصة في Google AI Studio أو ضبط `GEMINI_MODEL` على نموذج له حصة. حتى ذلك الحين: «تعذر تحضير معالجة مفصلة» و`news_publication_gap` متوقعان.
- **مركز الأقسام الجديد:** صفحة `/sections` (روابط قفز، 4 مجموعات مرقّمة تغطي الأقسام الـ15 مرة واحدة كل قسم، وأدوات الأسعار والطقس والمواقيت، وJSON-LD من نوع ItemList) وتصميم جديد لبطاقات الأقسام في الرئيسية. اختبار يضمن أن كل قسم في مجموعة واحدة بالضبط. ملاحظة تسمية: القسم ذو الـslug `arab` اسمه «رأي»، و`egypt` اسمه «مجتمع».

## 21) المتبقي من طلب المالك (لم يُنفَّذ بعد، بالترتيب المقترح)
1. **لوحة إدارة v2** (SSR) تحلّ محل `/admin` القديمة: الدخول بـ`ADMIN_PASSWORD`/`ADMIN_SESSION_SECRET` (دون تغيير الأسرار)، مقالات (نشر/إلغاء/حذف/صورة/مراجعات)، مساهمات، حالة الذكاء الاصطناعي والتشخيص، إحصاءات بلا زيارات المالك/الإدارة/الذكاء الاصطناعي. الواجهات الموجودة: `/api/admin/article*`, `/api/admin/contributions`, `/api/admin/ai-test`, `/api/admin/diagnose`.
2. نقل `/saved` و`/ask` أو إلغاؤهما بقرار المالك، و`/people/*` و`/review/*` (تحويل 301 إلى مساراتها في v2).
3. **حذف كود v1 الميت** (`public/app-*.js` والـSHELL في `src/index.ts`) فقط بعد 1 و2 وبعد إثبات أن لا مسار يستخدمه؛ لا حذف لبيانات D1 ولا للـmigrations ولا لدورة الأخبار.
4. أداء: قياس زمن الصفحات الباردة الفعلي بعد SWR، وتقليل انتظار `news()` في الرئيسية.
5. الفهرسة: دومين خاص (المالك)، ثم Search Console كما في القسم 18.

## 22) سبب البطء الجذري وإصلاحه (6 نوفمبر)
- **السبب:** على `*.workers.dev` لا يعمل `caches.default` (Cache API) فعليًا؛ فكان الكاش الذي بُني في `feat/seo-speed` بلا أثر، وكل زيارة تنتظر `news()` (حتى 6 ثوانٍ) وويكيبيديا (حتى 3 ثوانٍ) وقراءات D1 من جديد.
- **الإصلاح (`perf/isolate-caches`):** (1) مخزن صفحات داخل الـisolate (حتى 120 صفحة) فوق Cache API، بنفس منطق HIT/STALE/MISS. (2) `swr()` في `src/v2-bridge.ts` للعناوين الحية (طازجة 2 دقيقة، قديمة حتى 20 دقيقة مع تحديث بالخلفية، والعزلة الباردة تنتظر 2.5 ثانية فقط ويكتمل الجلب في الخلفية) ولنداءات ويكيبيديا (30 دقيقة/6 ساعات). النتائج الفارغة لا تُخزَّن. `V2_BUILD` = `2026-11-06.3`.
- **حد معروف:** الذاكرة داخل isolate واحد؛ أول زيارة لكل isolate جديدة لا تزال باردة. الحل الكامل (كاش حافة مشترك) يتطلب **دومينًا خاصًا** على Cloudflare.
- **التحقق الحي المطلوب:** `curl -sI https://bayan.tahaomar411.workers.dev/about` مرتين: الثانية `x-bayan-cache: HIT`، مع `x-bayan-v2-build: 2026-11-06.3`.

## 22ب) أداء الموقع والخطأ 1102 (6 نوفمبر)
- **الاكتشاف:** `caches.default` (Cache API) لا يعمل على نطاقات `*.workers.dev`، فكل صفحة كانت تُرسم من جديد مع كل زيارة. والأخطر أن `news()` كان يتحوّل إلى الجلب الحي (7 مصادر RSS + بدائل) كلما كان كاش الأخبار أقل من 3 عناصر موثّقة، أي عند أي زائر؛ وهذا أرجح سبب الخطأ **1102 (Worker exceeded resource limits)** وبطء الموقع على الخطة المجانية (حد المعالج ~10ms).
- **الإصلاح (V2_BUILD 2026-11-06.4):** (1) خيار `cacheOnly` في `news()`: كل مسار يصل إليه الزائر يقرأ الكاش فقط ولا يبدأ جلبًا حيًا أبدًا؛ التحديث الحي للـcron وسير self-heal فقط (`forceRefresh`). (2) كاش صفحات داخل ذاكرة الـisolate (طبقة فوق Cache API) مع stale-while-revalidate. (3) `swr()` للعناوين (طازج دقيقتان، قديم حتى 20 دقيقة، والتحميل البارد ينتظر 2.5 ثانية فقط) ولاستدعاءات الموسوعة (طازج 30 دقيقة، قديم حتى 6 ساعات).
- **قياس محلي:** رسم الصفحة الواحدة 0.6 إلى 3ms (Node، دافئ).
- **قرار للمالك:** خطة Workers المجانية تحدّ المعالج بـ10ms وD1 بحدّ قراءات يومي، وهذا يعيد الخطأ 1102 مع أي حمل. الحل الدائم: Workers Paid (حوالي 5 دولارات شهريًا) وإضافة دومين خاص (يفعّل كاش الحافة ويخدم الفهرسة).

## 23) سقوط Gemini إلى نموذج بديل (6 نوفمبر)
- النتيجة الحية: `gemini.ok:false`, `error:"quota"`, 429 على `gemini-3.8-flash` (حصة الخطة المجانية لكل نموذج منفصلة).
- `callGemini` صار يجرّب `gemini-2.5-flash` ثم `gemini-2.5-flash-lite` عند 429 أو 503 (مرة واحدة لكل نموذج)، ويتذكّر النموذج الناجح 10 دقائق، ولا يعيد المحاولة عند أخطاء المفتاح. إن فشلت كل النماذج يُعاد الخطأ الأصلي. اختبارات في `tests/gemini-fallback.test.ts`. لا يغيّر `GEMINI_MODEL` ولا الأسرار.

## 23ب) نماذج Gemini والخطأ 1102 المستمر (6 نوفمبر)
- `callGemini` صار يجرّب `gemini-2.5-flash` ثم `gemini-2.5-flash-lite` عند 429 أو 503 على النموذج المضبوط (الحصة المجانية لكل نموذج منفصلة)، ويتذكر النموذج الناجح 10 دقائق. أخطاء المصادقة لا تُعاد.
- **1102 ما زال يظهر بعد بناء 2026-11-06.4** (الزائر لم يحدد المسار). لم يُحسم السبب لأن سجلات Cloudflare غير متاحة لنا. المطلوب من المالك: من Workers Logs نسخ سطر الاستثناء (فيه المسار و`cpuTime`)، ونوع الخطة، ومنحنى CPU time للـWorker. الفرضيات: ردّ بارد لأول زائر على isolate جديد (جلب الموسوعة وتحليل JSON وبناء HTML أكثر من 10ms على الخطة المجانية)، أو مسار v1 غير الذي صُحّح. لا نعدّل أكثر بالتخمين.

## 24) حصة Gemini المجانية (6 نوفمبر): السبب الفعلي لـ«تعذر تحضير معالجة»
- صفحة Rate limit في AI Studio تقول: النموذج `Gemini 3.8 Flash` على الخطة المجانية حدّه **20 طلبًا في اليوم (RPD)** وقد استُهلك (23/20). لا تظهر نماذج 2.5 لهذا المشروع.
- كان `/api/health/ai` نفسه يستهلك هذه الحصة (استدعاء حي لكل isolate جديد كل 10 دقائق، إضافة لفحوص verify). **أصبح لا يستدعي Gemini إطلاقًا** (يعرض الإعداد فقط، `probe:"off"`). للاختبار الحي استخدم `/api/admin/ai-test`.
- الحصة اليومية تنفد مع أي استخدام فعلي للخط (20 طلبًا فقط). الحل الحقيقي: تفعيل الفوترة في Google للمشروع، أو الاعتماد على OpenAI/Workers AI (مسارات الاحتياط في `src/services/ai.ts`).

## 25) مقال كامل دائمًا، وبدائل لا تظهر للقارئ (6 نوفمبر، V2_BUILD 2026-11-06.6)
- **صفحة الخبر `/research`** لم تعد تعرض أي رسالة اعتذار ولا «حاول مرة أخرى». إن غابت المعالجة المفصلة تُبنى فورًا صفحة كاملة ومنظمة من مواد حقيقية فقط: الخلاصة، أبرز النقاط (جمل المصدر نفسه)، «كيف تناولته المصادر» (أخبار الناشرين الآخرين عن نفس الخبر من العناوين الحية بتشابه الكلمات، بلا تكرار لناشر)، وقائمة المصادر. لا تُضاف معلومة من خارج المصادر.
- **الانتظار:** المعالجة المفصلة تُنتظر 14 ثانية فقط (كانت 45)، وتستمر بعد الرد عبر `waitUntil` ليُعاد استخدام ناتجها (كاش المقالات) في الزيارة التالية. العناوين الحية تنتظر 2.5 ثانية.
- **سلسلة المزوّدين:** Gemini ثم OpenAI ثم Workers AI. وWorkers AI صار يجرّب ثلاثة نماذج بالترتيب (المضبوط ثم `llama-3.3-70b-instruct-fp8-fast` ثم `mistral-small-3.1-24b-instruct`) عبر `runWorkersAi`، ويتخطى النموذج الفاشل أو الفارغ.
- **اختبارات:** `tests/complete-articles.test.ts` (لا اعتذار أبدًا، البنية، المصادر المتعددة، ناشر واحد، سلسلة النماذج).

## 26) نقل لوحة الإدارة و`/saved` و`/ask` إلى v2 (7 نوفمبر، V2_BUILD 2026-11-07.1)
- **`/admin` الجديدة** (`v2/src/admin.ts`): بنفس التصميم الجديد، `no-store` و`noindex`. الدخول برمز المدير (`x-bayan-manager-token`) الذي يكتبه المالك ويُحفظ في `sessionStorage` فقط؛ لم نغيّر أي سر ولا واجهة. ست تبويبات: نظرة عامة (زيارات وجودة المحتوى وأكثر الصفحات)، المقالات (نشر/مسودة/أرشفة/حذف/تعديل/مراجعات واستعادة/مسودة موسّعة بالذكاء الاصطناعي)، المساهمات (قبول/رفض)، النظام والإصلاح (فحص، تيليجرام، إصلاح بالذكاء الاصطناعي، أحداث التشغيل وسجل الإصلاحات)، عمليات البحث، الإعدادات. تستدعي نفس `/api/admin/*` الموجودة (لم تتغير).
- **`/saved`**: قائمة محفوظات في المتصفح فقط (`bayan-saved`)، وزر «احفظ للقراءة لاحقًا» في صفحة المقال وصفحة الخبر.
- **`/ask`**: نموذج يرسل السؤال إلى `/api/ask`؛ إن لم تعد إجابة مدعومة بأدلة يُحوَّل الزائر مباشرة إلى نتائج `/search` الحقيقية (لا رسالة اعتذار).
- **ما لم يُحذف بعد:** كود v1 (`SHELL` في `src/index.ts` و`public/app-*.js`) بقي لأن `/people/*` و`/review/*` ما زالا تخدمهما v1. الحذف يحتاج تحويلهما أولًا ثم إثبات أن لا مسار يستخدم الكود القديم.
- **تشخيص الإنتاج:** خطوة CI جديدة `scripts/page-diagnostics.mjs` (غير مانعة) تطبع بعد كل نشر حالة وزمن (بارد/دافئ) وحجم وعلامات محتوى كل صفحة رئيسية، وكشف الخطأ 1102؛ اقرأ annotations باسم `PAGE ...` في job `verify-production`.

## 27) إصلاحات من قياس الإنتاج (7 نوفمبر، V2_BUILD 2026-11-07.2)
- **صفحة الصحة لم تكن تفتح:** مسار `/health` كان يعيد JSON (`bayan-v2`) فيحجب قسم «صحة». صار مسار الفحص `/healthz`، و`/health` صفحة القسم.
- **صفحات كانت تذهب للموقع القديم:** صارت v2 تملك كل صفحة HTML (حتى الـ404 بالتصميم الجديد)؛ يبقى للنواة فقط `/api/*` والملفات ذات الامتداد (sitemap وrobots والصور) و`/.well-known`. `/tools` ← `/sections`، و`/people/:x` ← `/wiki/:x`، و`/review*` ← `/admin` (301).
- **بطء البحث (4.8 ثانية، بلا كاش):** يبدأ بحث الموسوعة الاحتياطي فورًا بالتوازي، وللبحث الكامل 6 ثوانٍ فقط (كان 25)، ونتائج الاستعلام المتكرر تُخزَّن في الـisolate 10 دقائق (قديمة حتى ساعة).
- **التشخيص:** annotations صارت ملخصة (3 صفحات لكل إشعار) لأن GitHub يعرض 10 فقط لكل خطوة، مع صفحة خبر ومقال حقيقيين.
- **قياسات 6 نوفمبر (CI):** الرئيسية 39ms دافئة (HIT)، الأقسام 160-350ms، `/search` 4.8 ثانية (عولج)، ولا 1102 على أي صفحة.

## 28) إعادة تصميم كاملة من الصفر (7 نوفمبر، V2_BUILD 2026-11-07.3)
- **التصميم القديم** كان طبقات أنماط متراكمة (وأنا أضفت عليه ترقيعات) فأنتج عدم تناسق. استُبدل بالكامل بنظام تصميم واحد في `v2/src/styles.ts`: mobile-first، خصائص منطقية (RTL وLTR)، وضع فاتح وداكن تلقائي، شبكات `auto-fill` بـ`min(100%, …)` فلا يوجد تمرير أفقي، أحجام نص مرنة بـ`clamp`، مساحات آمنة للجوال (notch)، `prefers-reduced-motion`، وطباعة.
- **التحقق:** الصفحات الـ13 الرئيسية (الرئيسية، الأقسام، قسم، الصحة، الأخبار، مقال، خبر، عن بيان، الإدارة، المحفوظات، اسأل، المساهمة، الإنجليزية) رُسمت في Chromium حقيقي على 390 و768 و1366 بكسل: لا تمرير أفقي في أي منها (وُجدت مشكلة واحدة في حقل المصيدة بصفحة المساهمة وأُصلحت بالفئة `.hp`).
- **اختبارات التصميم:** `v2/tests/worker.test.ts` (viewport وsafe-area وgrids مرنة وعدم وجود عروض ثابتة أكبر من 320px ووجود كل الفئات المستخدمة).
- **سرعة:** كاش `public, max-age=60, s-maxage=300` لصفحات الأقسام والأخبار (كانت 150-300ms في كل زيارة)، وميزانية البحث الكامل 3 ثوانٍ مع بدائل فورية.
- **قياس CI (PR #603):** `/health` صار يفتح (200، 14 بطاقة)، الرئيسية HIT، الأقسام 150-300ms، `/search` بارد 4.9 ثانية (عولج بالميزانية).

## 29) صفحة الخبر كانت تأخذ 14 ثانية (قياس CI بعد إعادة التصميم، V2_BUILD 2026-11-07.4)
- قياس الإنتاج: `/research` بارد **14033ms ودافئ 14032ms** (MISS في الاثنين): الانتظار الكامل للمعالجة المفصلة التي لا تنجح حاليًا (حصة Gemini) ثم `no-store`. الإصلاح: ميزانية **3.5 ثانية** ثم الصفحة المنظمة الكاملة فورًا، ورأس كاش `s-maxage=300` (مقال مفصّل فعلي: 1800) ليُخزَّن في الـisolate؛ المعالجة تكمل بالخلفية وتُستخدم في الزيارة التالية.
- لوحظ أن صفحات (`/economy` `/health` `/politics` `/news` `/sections` `/trends` `/weather` `/prices`) تعرض `x-bayan-cache` فارغًا في القياس رغم أن العامل يعيد `s-maxage` (اختبار محلي يؤكد). أُضيفت إلى التشخيص حقول `rd` (المُرسِم) و`cc` (cache-control) و`ag` (Age) لمعرفة السبب من القياس التالي.
- قياسات بعد إعادة التصميم: الرئيسية 100ms بارد/46 دافئ (HIT)، `/search` 3067ms بارد (الميزانية 3 ثوانٍ)، ولا 1102.

## 30) ما طلبه المالك مقابل ما تم (مراجعة من المرجع، 8 نوفمبر 2026)
**مكتمل ومنشور على main:** إكمال `feat/seo-speed` (SWR وsitemap وJSON-LD) · مركز الأقسام `/sections` وتصميم بطاقات جديد · لوحة إدارة v2 كاملة (6 تبويبات) · `/saved` و`/ask` في v2 · تحويلات `/tools` و`/people/*` و`/review*` · صفحة الصحة (`/health` لم يكن يفتح لأن JSON الفحص حجبه، صار `/healthz`) · v2 تملك كل صفحات HTML بما فيها الـ404 · لا رسالة «تعذر تحضير…» أبدًا (صفحة خبر منظمة كاملة من مصادر حقيقية: الخلاصة، النقاط، تغطية الناشرين، المصادر) · إعادة تصميم كاملة mobile-first (فُحصت في Chromium على 390/768/1366 بلا تمرير أفقي) · سلسلة بدائل الذكاء الاصطناعي (Gemini ← OpenAI ← Workers AI بثلاثة نماذج، وGemini يجرّب نماذج احتياطية عند 429/503) · لا استدعاء حي لـGemini من صفحة الصحة (حصته المجانية 20 طلبًا يوميًا).

**منشور لكنه ينتظر تحقق حي:** سبب «بعض الصفحات تدخل على الموقع القديم» (الحقيقي): تخزين `Response` في ذاكرة الـisolate يرمي «Cannot perform I/O on behalf of a different request» في الطلب الثاني فتسقط الصفحة إلى v1. أُصلح (V2_BUILD 2026-11-08.1) بتخزين بايتات خام. **التحقق:** في الكتلة الحية أعلاه يجب أن يظهر كاش `HIT` ومُرسِم `v2` لكل صفحة، وأن يكون `/api/health/v2` عدّاده لا يزيد.

**لم يُنفَّذ بعد:** حذف كود v1 (`SHELL` في `src/index.ts` و`public/app-*.js`) — شرطه أن يثبت `/api/health/v2` أن لا صفحة تسقط إلى v1 لمدة يوم، ثم PR واحد صغير. · أقسام «رأي» (`arab`) و«مجتمع» (`egypt`) تعرض معرفة وأخبارًا لكن لا كتّاب؛ يحتاج قرار تحريري.

**ينتظر المالك (لا أستطيع من هنا):** تفعيل Workers Paid (حد المعالج 10ms والـD1 يوميًا يسببان 1102 تحت الحمل) · دومين خاص (يفعّل كاش الحافة ويحل الفهرسة، ثم Search Console كما في القسم 18) · Gemini: فوترة المشروع أو إضافة مفتاح OpenAI، وضبط `GEMINI_MODEL` · سحب توكن GitHub الذي لُصق في المحادثات.

**قاعدة الجلسة القادمة:** ابدأ بقراءة «الحالة الحية» في أعلى هذا الملف (تتجدد آليًا بعد كل نشر عبر `.github/workflows/auto-live-status.yml` و`scripts/update-live-status.mjs`)، لا بالمحادثة.

## 31) لماذا لا تُنشر مقالات الأخبار؟ (13 نوفمبر، V2_BUILD 2026-11-13.1)
- القياس: الأرشيف فيه ~200 مرشح جاهز للصياغة لكن `attempts_0` = 199 تقريبًا (لم تُجرَّب صياغتهم)؛ والـcron لا يصوغ إلا إذا كان `NEWS_PIPELINE_ENABLED === "true"` (يُضبط في لوحة Cloudflare فقط، ليس في `wrangler.jsonc`)، ويتوقف كليًا إن كان حجب D1 اليومي مفعّلًا، ويصوغ صفًّا واحدًا لكل دورة.
- أُضيف `/api/health/pipeline` (عام بلا أسرار): حالة المفتاح (`absent`/`not_true`/`true`)، حد الذكاء الاصطناعي، المزوّدون المضبوطون (Gemini وOpenAI وWorkers AI)، وآخر 5 نتائج مجدولة. يُطبع في CI بعنوان `PIPELINE` ويظهر في «الحالة الحية» أعلى الملف مع تشخيص خريطة الأخبار.
- **المطلوب من المالك إن ظهر `setting: "absent"` أو `"not_true"`:** في Cloudflare → Workers → bayan → Settings → Variables: اضبط `NEWS_PIPELINE_ENABLED` على `true` (متغير نصي) ثم Deploy.

## 32) السبب الحقيقي لتوقف نشر الأخبار (13 نوفمبر، V2_BUILD 2026-11-13.3)
- من `/api/health/pipeline` (الإنتاج): الخط مفعّل وكل المزوّدين مضبوطون وD1 يعمل، لكن **كل محاولات الصياغة تفشل بـ`all_providers_unavailable`**: Gemini قاطعه مفتوح `quota_exceeded` (الحصة المجانية)، وOpenAI آخر خطأ مسجّل `credit_balance_exhausted` (رصيد الحساب منتهٍ)، وWorkers AI يفشل أيضًا (سبب فشله يُطبع الآن في `PIPELINE_PROVIDERS`).
- **ثم تُستهلك ميزانية اليوم (40) على محاولات فاشلة** فيتوقف الخط حتى لو عاد مزوّد: حدث `daily_ai_budget_exhausted` الساعة 22:26 UTC. الإصلاح: `refundDailyNewsAiCall` يعيد الوحدة المحجوزة عندما لا يجيب أي مزوّد (الفشل لا يكلّف شيئًا).
- **المطلوب من المالك لتعود المقالات فعلًا (لا يمكن إصلاحه بالشيفرة):** مزوّد واحد على الأقل بحصة: (1) شحن رصيد OpenAI، أو (2) تفعيل الفوترة لمشروع Gemini، أو (3) إصلاح Workers AI (انظر سببه في الحالة الحية).

