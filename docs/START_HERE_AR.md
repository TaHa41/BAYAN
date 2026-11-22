# ابدأ من هنا — الوضع الحالي لمشروع بيان (BAYAN)

> آخر تحديث: 6 نوفمبر 2026. هذا الملف هو **أول ما يُقرأ** في أي محادثة أو جلسة جديدة (Claude أو غيره). يلخص ما بُني، والمشاكل وحلولها، وما لم يُنجز، وكل مطالب المالك، وكيف يتصل Claude بالمستودع. الملفات القديمة (`MASTER_PROJECT_REFERENCE_AR.md`, `WORK_STATE.md`, `AUTO_PROJECT_HISTORY_AR.md`) أقدم من معمارية v2 أدناه؛ إذا تعارضت معها فهذا الملف هو الأحدث. لا تضع هنا أسرارًا أو توكنات أبدًا.

<!-- BAYAN_LIVE_STATUS_START -->
## الحالة الحية (تُحدَّث آليًا بعد كل نشر — لا تعدّلها يدويًا)
- آخر تحديث: 2026-11-22T06:39:57.821Z
- V2_BUILD في الشيفرة: `2026-11-22.1`
- آخر نشر: failure للكوميت `e8ef89e2` (https://github.com/TaHa41/BAYAN/actions/runs/44965699060)
- نتائج الـjobs: deploy=success، verify-production=failure
- حالة الذكاء الاصطناعي (إعداد فقط، بلا استدعاء): {"checkedAt":"2026-11-22T00:16:35.221Z","build":"2026-11-22.1","deployedCommit":"e8ef89e293bf","probe":"off","gemini":{"configured":true,"keyState":"set","model":"gemini-3.8-flash"},"workersAi":{"configured":true}}
- فحص الإنتاج: news_publication_gap: archive has 200 candidates ready for article drafting but the news sitemap contains no published articles
- خط نشر الأخبار (/api/health/pipeline): {"build":"2026-11-22.1","pipeline":{"enabled":true,"setting":"true","aiDailyLimit":"40"},"providers":{"gemini":true,"openai":true,"groq":false,"cerebras":false,"openrouter":false,"workersAi":true},"d1":"ok","breakers":{"openai":{"open":false,"code":"credit_balance_exhausted","until":"2026-10-20T06:06:01"},"gemini":{"open":true,"code":"quota_exceeded","until":"2026-11-22T01:00:53"}},"workersAiProbe":{"ok":true,"model":"@cf/meta/llama-3.1-8b-instruct-fp8","ms":271},"lastScheduledTick":"2026-11-22T00:15:40.586Z","writeProbe":{"ok":true}}
- أسباب فشل المزوّدين وميزانية اليوم: budgetToday=2026-11-21:31 | providerFailures: 2026-11-22T00:05:51 ai_provider_failure: Workers AI draft: Too many subrequests by single Worker invocation. To configure this limit, refer to [url] || 2026-11-21T22:26:09 ai_provider_failure: Workers AI answer: 4006: you have used up your daily free allocation of 10,000 neurons, please upgrade to Cloudflare's Workers Paid plan if you would like to continue us || 2026-11-21T22:06:12 ai_provider_failure: Workers AI answer: 4006: you have used up your daily free allocation of 10,000 neurons, please upgrade to Cloudflare's Workers Paid plan if you would like to continue us || 2026-11-21T20:21:08 ai_provider_failure: Workers AI answer: 4006: you have used up your daily free allocation of 10,000 neurons, please upgrade to Cloudflare's Workers Paid plan if you would like to continue us || 2026-11-21T19:56:06 ai_provider_failure: Workers AI answer: 4006: you have used up your daily free allocation of 10,000 neurons, please upgrade to Cloudflare's Workers Paid plan if you would like to continue us || 2026-11-21T19:00:30 ai_provider_failure: Gemini answer: This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.
- آخر أحداث الصياغة والمزوّدين: 2026-11-22T00:16:42 ai_circuit_breaker: gemini_breaker_open: {"state":"open","code":"quota_exceeded","openedUntil":"2026-11-22T01:00:53.369Z"} || 2026-11-22T00:05:51 news_archive_article_generation: {"subs":{"fetch":24,"db":21,"ai":5},"status":"attempted_failed","id":63074,"language":"en","publishReason":"ai_unavailable","publishReasonDetail":"all_providers_unavailable","retryMinutes":15,"attemptsPreserved":0} || 2026-11-22T00:05:51 news_archive_article_generation: ai_unavailable_deferred: {"id":63074,"language":"en","retryMinutes":15,"attemptsPreserved":0} || 2026-11-22T00:05:51 ai_generation: ai_provider_failure: Workers AI draft: Too many subrequests by single Worker invocation. To configure this limit, refer to [url] || 2026-11-22T00:05:45 ai_circuit_breaker: gemini_breaker_open: {"state":"open","code":"quota_exceeded","openedUntil":"2026-11-22T01:00:53.369Z"} || 2026-11-21T23:56:10 news_archive_article_generation: {"subs":{"fetch":22,"db":16,"ai":0},"status":"attempted_no_publish","id":63065,"language":"ar","searchStatus":"mixed","publishReason":"no_independent_sources","queueStatus":"skipped_low_evidence","publishReasonDetail":"independent_evidence_below_threshold:publishers=1;hosts=1;required=5","resultCount":1,"sourceCount":1,"independentPublisherCount":1,"independentHost || 2026-11-21T23:51:09 news_archive_article_generation: {"subs":{"fetch":20,"db":16,"ai":0},"status":"attempted_no_publish","id":63073,"language":"en","searchStatus":"mixed","publishReason":"no_independent_sources","queueStatus":"skipped_low_evidence","publishReasonDetail":"independent_evidence_below_threshold:publishers=1;hosts=1;required=5","resultCount":1,"sourceCount":1,"independentPublisherCount":1,"independentHost || 2026-11-21T23:36:01 news_archive_article_generation: {"subs":{"fetch":24,"db":16,"ai":0},"status":"attempted_no_publish","id":63050,"language":"ar","searchStatus":"mixed","publishReason":"no_independent_sources","queueStatus":"skipped_low_evidence","publishReasonDetail":"independent_evidence_below_threshold:publishers=3;hosts=3;required=5","resultCount":3,"sourceCount":3,"independentPublisherCount":3,"independentHost || 2026-11-21T23:26:04 news_archive_article_generation: {"subs":{"fetch":20,"db":16,"ai":0},"status":"attempted_no_publish","id":62991,"language":"en","searchStatus":"mixed","publishReason":"no_independent_sources","queueStatus":"skipped_low_evidence","publishReasonDetail":"independent_evidence_below_threshold:publishers=1;hosts=1;required=5","resultCount":1,"sourceCount":1,"independentPublisherCount":1,"independentHost || 2026-11-21T23:21:04 news_archive_article_generation: {"subs":{"fetch":24,"db":16,"ai":0},"status":"attempted_no_publish","id":63049,"language":"ar","searchStatus":"mixed","publishReason":"no_independent_sources","queueStatus":"skipped_low_evidence","publishReasonDetail":"independent_evidence_below_threshold:publishers=1;hosts=1;required=5","resultCount":1,"sourceCount":1,"independentPublisherCount":1,"independentHost || 
- خريطة الأخبار والأرشيف: {"status":200,"contentType":"application/xml; charset=utf-8","urlCount":0,"candidateCount":"0","archiveCandidateCount":"200","archiveReadyForArticleDraftingCount":"200","eligibleCount":"0","rejectedCount":"0","rejectionReasons":"{}","archiveReasons":"{\"never_attempted\":135,\"attempts_0\":195,\"skipped_low_evidence\":53,\"ai_unavailable\":8,\"draft_not_verified\":4,\"attempts_1\":5}","xmlBytes":167}
- أسباب الرجوع للموقع القديم (/api/health/v2): /api/health/v2","s":200,"fb":"{\"build\":\"2026-11-22.1\",\"count\":0,\"recent\":[]}"}]
- أداء الصفحات الحقيقية (بارد/دافئ بالملّي ثانية، كاش، المُرسِم):
  - `/research?title=%D9%88%D8%A7%D8%B4%D9%86`: حالة 200، 3545/28، كاش HIT، مُرسِم v2
  - `/article/politics-public-consultation-ar`: حالة 200، 34/32، كاش HIT، مُرسِم v2
  - `/weather`: حالة 200، 808/41، كاش HIT، مُرسِم v2
  - `/prayer`: حالة 200، 529/27، كاش HIT، مُرسِم v2
  - `/world`: حالة 200، 354/43، كاش HIT، مُرسِم v2
  - `/about`: حالة 200، 32/26، كاش HIT، مُرسِم v2
  - `/search?q=%D9%85%D8%B5%D8%B1`: حالة 200، 2059/2033، كاش MISS، مُرسِم v2
  - `/prices`: حالة 200، 454/25، كاش HIT، مُرسِم v2
  - `/economy`: حالة 200، 336/34، كاش HIT، مُرسِم v2
  - `/health`: حالة 200، 307/27، كاش HIT، مُرسِم v2
  - `/sections`: حالة 200، 47/41، كاش HIT، مُرسِم v2
  - `/`: حالة 200، 167/55، كاش HIT، مُرسِم v2
  - `/news`: حالة 200، 361/44، كاش HIT، مُرسِم v2
  - `/politics`: حالة 200، 337/44، كاش HIT، مُرسِم v2
- آخر الـcommits على main:
  - 7916aca 2026-11-22 docs: automatically refresh live status
  - 2e188fb 2026-11-22 docs: automatically record project history
  - 719dbe5 2026-11-22 Free AI provider failover (Groq, Cerebras, OpenRouter) in drafting and answers; tests; docs; V2_BUILD 2026-11-2
  - de617dc 2026-11-21 docs: automatically refresh live status
  - ebb3a85 2026-11-21 docs: automatically refresh live status
  - 967456e 2026-11-21 docs: automatically record project history
  - f45beb2 2026-11-21 Drafts: large Workers AI model first, scaffolding words are not invented names; tests; docs; V2_BUILD 2026-11-2
  - cf7c4c7 2026-11-21 docs: automatically refresh live status
  - 8070690 2026-11-21 docs: automatically refresh live status
  - c7b38e9 2026-11-21 docs: automatically record project history
<!-- BAYAN_LIVE_STATUS_END -->

## الملخص التنفيذي الراهن (21 نوفمبر 2026) — اقرأه بعد «الحالة الحية»
> الأقسام 1–39 أدناه **سجل تاريخي** لما جرى وسببه؛ المرجع الحالي هو: «الحالة الحية» أعلاه + هذا الملخص + الأقسام 40 فما فوق.
- **البنية الآن:** Worker واحد `bayan` على Cloudflare (workers.dev) + D1 + Workers AI. كل صفحات HTML من `v2/` عبر `serveV2` في `src/v2-bridge.ts` (كاش في الـisolate، عدّ زيارات). `src/index.ts` يحتفظ بالـAPI والـsitemap والـcron والملفات الثابتة فقط. **الموقع القديم (v1) حُذف بالكامل.** الأقسام 12 في 3 مجموعات؛ «رأي» و«سفر» و«اتجاهات» حُوّلت (301) إلى `world` و`world` و`news`.
- **المراقبة التلقائية:** كل نشر يشغّل `scripts/page-diagnostics.mjs` (أداء كل صفحة، `/api/health/v2`، `/api/health/pipeline`)، ثم `auto-live-status.yml` يعيد كتابة «الحالة الحية» (وكل 6 ساعات).
- **قواعد العمل:** فرع ← `tsc` و`vitest` و`source-contract` ← PR ← CI أخضر ← دمج ← تحقق من النشر؛ أي تعديل في `v2/` يرفع `V2_BUILD` في `src/v2-bridge.ts`؛ لا تغيير للأسرار؛ لا تخفيف لشرط 5 ناشرين مستقلين؛ لا اختلاق أخبار أو صور أو مصادر أو أرقام.
- **أين نحن:** الصفحات سليمة وسريعة. **العائق الوحيد المتبقي هو نشر مقالات الأخبار**، وحالته الدقيقة في القسم 42.
- **قرارات المالك المعلّقة:** Workers Paid، مزوّد ذكاء اصطناعي بحصة (Gemini فوترة أو OpenAI رصيد)، دومين خاص، سحب توكن GitHub المُلصق في المحادثات. أدوات خارجية مثل claude-mem لا تُضاف للمشروع (تُثبَّت على جهاز المالك فقط).

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

## 33) «الحالة الحية» تتجدد كل 6 ساعات وبعد كل نشر
- `auto-live-status.yml` صار يعمل أيضًا بجدول (`17 */6 * * *`): يقرأ مباشرةً `/api/health/pipeline` و`/api/health/ai` و`/api/health/v2` من الإنتاج ويحدّث الكتلة دون انتظار نشر جديد، فيبقى المرجع حديثًا حتى لو لم يتغير الكود.

## 34) حذف الموقع القديم (v1) نهائيًا (13 نوفمبر، V2_BUILD 2026-11-13.3+)
- **حُذف:** `public/index.html` (الغلاف) و`public/styles.css` (83KB) و11 ملف `public/app-*.js` (~1.3MB، واجهة قديمة) وملف الصورة ذي الاسم المعطوب؛ وفي `src/index.ts` حُذف مُرسِم الصفحات القديم كله (`SHELL` و`SHELL_EN` و`page()` و`isKnownAppPage`)، فنزل الملف من 116KB إلى 22KB. `wrangler.jsonc`: `not_found_handling` صار `404-page` بدل `single-page-application`.
- **ما بقي في `src/index.ts` عمدًا:** الـAPI وsitemap وrobots وllms.txt، والـcron (الأخبار والنشر والإصلاح الذاتي)، وتقديم الملفات الثابتة (`staticAsset`: صور og والـmanifest وملف مفتاح الفهرسة؛ وأي مسار ليس ملفًا حقيقيًا يعطي 404 وليس صفحة).
- **كل صفحة HTML تخدمها v2.** إن تعذّر رسم صفحة تمامًا تظهر `unavailablePage` (503 بالتصميم الجديد مع رابط للرئيسية) بدل الغلاف القديم.
- **عدّ الزيارات** كان في الكود القديم وانتقل للموقع الجديد (`serveV2` في `src/v2-bridge.ts`): حدث `page` واحد لكل صفحة HTML مخدومة، ولا يُعدّ المالك (الكوكي `bayan_exclude_analytics`) ولا `/admin` ولا الـAPI؛ `?bayan_owner=1` يمسح زياراتك السابقة ويعلّم المتصفح، و`?bayan_owner=0` يزيل العلامة، وفتح `/admin` يعلّمه. الكوكيز تُضاف بعد الكاش فلا تُخزَّن أبدًا لزائر آخر.
- **سكربتات الفحص:** حُذفت من `production-smoke.mjs` فحوص الحزمة والستايل القديمين، ومن `package.json` أوامر `node --check public/app-*.js`، وأُحيلت إلى «متقاعدة» 73 فحصًا في `source-contract-smoke.mjs` كانت تصف الواجهة القديمة فقط (ما غطّته صار في اختبارات vitest للموقع الجديد)، وأُضيف فحصان يمنعان رجوع الموقع القديم.

## 35) مشاكل الإنتاج المفتوحة وما فُعل (14 نوفمبر، V2_BUILD 2026-11-14.1)
- **الأخبار لا تُنشر (الأهم):** من الحالة الحية: `all_providers_unavailable`. أحداث الفشل الظاهرة كلها من Gemini (`request timed out` و`high demand` و`quota`)، أما OpenAI فرصيده منتهٍ (`credit_balance_exhausted`)، وWorkers AI لم نكن نعرف هل يجيب. أُضيف إلى `/api/health/pipeline` حقل `workersAiProbe`: نداء واحد صغير (~10 نيورون) كل 15 دقيقة كحد أقصى لكل isolate يُظهر هل المزوّد المجاني يعمل ونموذجه وسبب فشله إن فشل، ويُطبع في `PIPELINE` بالحالة الحية.
  - إن ظهر `workersAiProbe.ok: true` ولم تُنشر مقالات فالسبب في تحقق الصياغة (`draft_not_verified`) لا في توفر المزوّد.
  - إن ظهر `ok: false` فالسبب مكتوب في `error`.
- **البحث البارد:** ميزانية البحث الكامل صارت ثانيتين (كانت 3) مع النتائج الاحتياطية الفورية.
- **سير العمل (Workflows):** 15 ملفًا. `deploy-direct.yml` (نشر يدوي بديل) و`lighthouse-audit` و`strix-security` و`production-acceptance-audit` كلها `workflow_dispatch` فقط، لا تعمل تلقائيًا؛ لم تُحذف لأن فحوص العقد تشير إلى `deploy-direct`.

## 36) السبب الجذري الثاني لتوقف الأخبار: الميزانية تُحجز قبل نجاح أي مزوّد (14 نوفمبر، V2_BUILD 2026-11-14.2)
- **الاكتشاف من الإنتاج:** `workersAiProbe` يثبت أن Workers AI يعمل (429ms، نموذج `llama-3.1-8b`). ومع ذلك كل محاولة صياغة إنجليزية تنتهي بـ`all_providers_unavailable` لأن **`budgetToday` = 40/40**: كانت كل محاولة تحجز وحدة من الميزانية اليومية *قبل* نداء المزوّد (وكذلك قبل بحث OpenAI المدفوع الذي رصيده منتهٍ)، فتُستهلك الـ40 على محاولات فاشلة ثم تُحجب الصياغة كلها وتُسمّى خطأً «المزوّدون غير متاحين».
- **الإصلاح:** الميزانية صارت تُفحص فقط (`dailyNewsAiBudgetAvailable`، قراءة بلا كتابة) وتُخصم (`chargeDailyNewsAiCall`) **بعد أن يجيب مزوّد فعلًا** — في الصياغة (Gemini ثم OpenAI ثم Workers AI) وفي بحث OpenAI. الفشل لا يكلّف شيئًا؛ والعدّاد صار «عدد التوليدات الناجحة اليوم».
- **السبب الثاني (قاعدة وليس عطلًا):** المحاولات العربية تنتهي بـ`no_independent_sources` / `skipped_low_evidence`: شرط 5 ناشرين مستقلين، وهو مقصود ولا يُخفَّف. مرشحون أكثر مصادر أقل لن يمرّوا؛ المتوقع أن تمرّ الأخبار المغطّاة من عدة ناشرين فقط.
- **ما يُراقَب بعد النشر:** سطر `PIPELINE_PROVIDERS` في «الحالة الحية»: `budgetToday` يجب أن لا يقفز للحد بلا مقالات، وظهور `attempted_published` في أحداث الصياغة.
- **عدّاد جديد:** المفتاح صار `news_ai_charged_daily` (كان `news_ai_budget_daily`) لأن عدّاد اليوم القديم كان ملوّثًا بمحاولات فاشلة (40/40) فيحجب الصياغة حتى منتصف الليل؛ العدّاد الجديد يبدأ من صفر فتعود الصياغة فور النشر دون لمس أي بيانات في D1 (القديم يُترك كما هو).

## 37) موقع أخف: 12 قسمًا بدل 15، واستهلاك أقل لحصة D1 (14 نوفمبر، V2_BUILD 2026-11-14.4)
- **حُذفت 3 أقسام غير مهمة:** «رأي» (`arab`: لا كتّاب ولا مصدر محتوى، ويتعارض مع قاعدة عدم اختلاق المحتوى) و«اتجاهات» (`trends`: يكرر الأخبار والأكثر قراءة في الموسوعة) و«سفر» (`travel`: بعيد عن هوية الموقع القائمة على الأدلة). **لم تُحذف أي بيانات:** `LEGACY_SECTIONS` في `v2/src/sections.ts` يحوّل `/arab` و`/travel` إلى `/world` و`/trends` إلى `/news` (301)، والمقالات المخزّنة تحت الأقسام القديمة تظهر الآن تحت القسم الجديد (`sectionSlugsFor`)، وتسميتها تُحلّ إلى القسم الأقرب (`canonicalSlug`)، وخريطة الموقع لا تذكر المحذوفة. الاستعادة: شيل المفتاح من `LEGACY_SECTIONS` وأعد السطر إلى `SECTIONS`.
- **المجموعات صارت 3 × 4:** أخبار وتحليل (الأخبار، سياسة، اقتصاد، العالم)، معرفة وعلوم (علوم، تقنية، صحة، تاريخ)، ناس ومجتمع (شخصيات، فنون، رياضة، مجتمع).
- **الرئيسية أخف:** أقسامها صارت شريحة روابط صغيرة بدل 12 بطاقة كبيرة (كل بطاقة كانت تحمل أيقونتين SVG)؛ البطاقات الكاملة في `/sections` فقط.
- **حصة D1 (أخطر ما وُجد):** استعلام الأرشيف في `v2/src/store.ts` كان `ORDER BY fetched_at DESC LIMIT n` لكن الفهرس الموجود على `(section, language, published_at)`، فكان SQLite يقرأ **كل صفوف الأخبار** (عشرات الآلاف) لكل صفحة باردة ثم يرتبها؛ هذا يستنزف حد القراءات اليومي المجاني (5 ملايين) ويسبب «free tier daily row read limit exceeded». صار `ORDER BY published_at DESC` فيقرأ n صفًا فقط.
- أُزيلت `/trends` و`/arab` و`/travel` من فحص الإنتاج وتشخيص CI.

## 38) السقف الحقيقي للأخبار على الخطة المجانية: 50 طلبًا فرعيًا لكل تشغيل (18 نوفمبر، V2_BUILD 2026-11-18.1)
- **قياس 18 نوفمبر (الإنتاج):** كل الصفحات سليمة (v2، كاش HIT، 25-65ms دافئة)؛ العدّاد الجديد للميزانية يعمل: `budgetToday=…:8` أي 8 توليدات ذكاء اصطناعي ناجحة اليوم (Workers AI). لكن مقالات الأخبار ما زالت لا تُنشر لسببين:
  1. `Workers AI answer: Too many subrequests by single Worker invocation` — حد **50 طلبًا فرعيًا لكل تشغيل** على الخطة المجانية (يشمل fetch واستعلامات D1 ونداءات الذكاء الاصطناعي)؛ تشغيل الصياغة الواحد (بحث أدلة من عدة مصادر + D1 + ذكاء اصطناعي) يتجاوزه. الخطة المدفوعة تعطي 1000.
  2. `no_independent_sources` (شرط 5 ناشرين مستقلين، مقصود)، وقد يكون جزء منه ناتجًا عن نفس الحد (طلبات الأدلة التي تُرفض بعد الخمسين).
- **أُضيف قياس:** `src/subrequests.ts` يعدّ fetch وD1 وAI في كل تشغيل صياغة ويكتب `{"subs":{"fetch":N,"db":M,"ai":K}}` في أول حدث `news_archive_article_generation`، فيظهر في `PIPELINE_EVENTS` بالحالة الحية؛ إن كان المجموع قرب 50 فهذا هو السبب.
- **الحل الدائم (قرار المالك):** Workers Paid (~5$ شهريًا) يرفع الطلبات الفرعية إلى 1000 والمعالج من 10ms إلى 30s وقراءات D1 إلى 25 مليار شهريًا؛ يحل 1102 وحدّ D1 وحدّ الطلبات الفرعية معًا. دون ذلك يمكن تقليل مصادر الأدلة لكل محاولة لكن بخسارة شرط الناشرين الخمسة في أغلب الأخبار.

## 39) الـcron صامت منذ 09:45 UTC؟ (18 نوفمبر، V2_BUILD 2026-11-18.2)
- آخر قراءة للحالة الحية (20:27 UTC) لا تُظهر **أي** حدث صياغة أو قاطع أو إصلاح ذاتي بعد 09:45 رغم أن الخط مفعّل وD1 يقرأ؛ أي أن التشغيل المجدول إما لا يعمل أو لا يستطيع الكتابة.
- أُضيف: (1) نبضة في بداية كل `scheduled` تكتب `scheduled_last_tick` في `admin_settings`، (2) فحص كتابة صغير `health_write_probe` (مخزّن 15 دقيقة) في `/api/health/pipeline`: حقول `lastScheduledTick` و`writeProbe`. إن ظهر `never_recorded` أو `ok:false` فالسبب مكتوب (مثلًا حد الكتابة اليومي المجاني لـD1، وفي الشيفرة كتابة تحليلات لكل زيارة صفحة).

## 40) خطة عدم نفاد الرصيد (رصيد الجلسة ورصيد الموقع) وحل كل المشاكل (19 نوفمبر 2026)

### أ) رصيد الجلسة (Claude): كيف تنتهي المهام دون أن ينفد
1. تبدأ كل جلسة بقراءة «الحالة الحية» في أعلى الملف فقط (لا بالمحادثة)، ثم القسم 40 هذا.
2. **PR واحد لكل موضوع**: تعديلات كثيرة في دفعة واحدة، واختبارات `tsc` و`vitest` و`source-contract` محليًا قبل الدفع، ثم دمج فور اخضرار CI.
3. **لا انتظار بالنوم المتكرر**: التحقق الحي يأتي من تشخيص CI بعد النشر ومن التحديث الآلي للحالة الحية (بعد كل نشر وكل 6 ساعات)، لا من حلقات قراءة.
4. لا قراءة ملفات كبيرة كاملة: `grep` ثم قراءة مقاطع. المخرجات الطويلة تُكتب في ملف وتُقتطع.
5. إن بقي بند يحتاج قرار المالك (تحت) فلا يُستهلك رصيد في التحايل عليه؛ يُسلَّم موثّقًا.
6. نظام الملفات المؤقت يُمسح بين المهام: أول أمر في الجلسة `git clone` ثم `git config user.name/email` ثم `npm ci` عند الحاجة.

### ب) رصيد الموقع: حدود الخطة المجانية وحالة كل حد
| الحد (مجاني) | القياس الحالي | ما فُعل | ما تبقى |
|---|---|---|---|
| معالج 10ms لكل طلب (خطأ 1102) | لا 1102 في أي قياس؛ الصفحات 25-65ms دافئة | كاش صفحات في الـisolate، SWR، لا جلب حي للزائر | Workers Paid يزيله |
| **50 طلبًا فرعيًا لكل تشغيل** | تشغيل الصياغة: `fetch` 20-22 + `db` 21 ≈ **43** قبل أول نداء ذكاء اصطناعي | عدّاد `subs` في حدث الصياغة | **أولوية 1 للجلسة القادمة** (انظر ج) |
| قراءات D1 5 ملايين/يوم | كان استعلام الأرشيف يقرأ كل صفوف الأخبار | `ORDER BY published_at` (فهرس موجود) | مراجعة أي استعلام آخر بلا فهرس |
| كتابات D1 100 ألف/يوم | `writeProbe: ok` حاليًا | — | تحليلات الزيارات تكتب صفًا لكل صفحة؛ إن اقتربنا من الحد: تجميع/عيّنة |
| نيورونز Workers AI 10 آلاف/يوم | الفحص ~10 نيورون كل 15 دقيقة | النموذج 8B (~125 نيورون للمسودة ≈ 80 مسودة/يوم) | — |
| Gemini المجاني 20 طلبًا/يوم لكل نموذج | القاطع مفتوح غالب اليوم | الميزانية تُخصم بعد النجاح فقط | فوترة المشروع (المالك) |
| OpenAI | `credit_balance_exhausted` | — | شحن الرصيد (المالك) |

### ج) المشاكل بالترتيب، من يحلها، ومعيار الإنجاز
1. **الأخبار لا تُنشر (الأهم).** المسبب الحاسم: حد 50 طلبًا فرعيًا لكل تشغيل. **مهمة Claude (الجلسة القادمة، قابلة للإنجاز بلا مال):** خفض تكلفة تشغيل الصياغة الواحدة إلى ≤ 30: (أ) تجميع استعلامات D1 في `DB.batch([...])` (تُحسب طلبًا واحدًا) بدل 21 استعلامًا منفصلًا، (ب) تحديد مزوّدي الأدلة بحيث لا يزيد الجلب عن 10 طلبات لكل محاولة مع بقاء شرط 5 ناشرين مستقلين، (ج) إبقاء 8 طلبات للذكاء الاصطناعي والتحقق والكتابة. **المعيار:** حقل `subs` في الحالة الحية: `fetch+db+ai ≤ 30`، وظهور `attempted_published` في أحداث الصياغة. **المالك:** Workers Paid يحل الجذر نهائيًا.
2. **الـcron صامت؟** إن ظهر `lastScheduledTick` ≠ `never_recorded` فالـcron يعمل (وقد ظهرت أحداث `subs` اليوم فهو يعمل)؛ غير ذلك افحص Triggers في Cloudflare.
3. **شرط 5 ناشرين مستقلين**: يبقى كما هو؛ رفض `no_independent_sources` سلوك صحيح لا عطل.
4. **الفهرسة في جوجل**: تحتاج دومينًا خاصًا (المالك) ثم Search Console (القسم 18).
5. **ترتيب workflows**: 4 يدوية فقط (`deploy-direct` وlighthouse وstrix وacceptance-audit)، تُحذف باستثناء `deploy-direct` المشار إليه في فحوص العقد؛ قرار المالك.
6. **سحب توكن GitHub** الذي لُصق في المحادثات (المالك).

### د) قرارات المالك الثلاثة التي تغيّر النتيجة فعليًا
1. **Workers Paid (~5$ شهريًا)**: يحل الطلبات الفرعية والمعالج وحدود D1 دفعة واحدة.
2. **مزوّد ذكاء اصطناعي بحصة**: شحن OpenAI أو فوترة Gemini (جودة مسودات أعلى من 8B).
3. **دومين خاص** للفهرسة وكاش الحافة.

### هـ) كل جلسة تنتهي بـ: تحديث هذا القسم إن تغيّر شيء، ودمج PR واحد على الأقل أخضر، وعدم ترك فرع مفتوح.

## 41) تنفيذ الأولوية 1: تشغيل الصياغة تحت حد الطلبات الفرعية (19 نوفمبر، V2_BUILD 2026-11-19.1)
- القياس السابق: ≈43 طلبًا فرعيًا قبل أول نداء ذكاء اصطناعي (`fetch` 22 + `db` 21). التخفيض المنفّذ في `src/services/news-article-publisher.ts`: (1) قراءة واحدة لإعدادَي الطابور (اللغة وآخر ناشر) بدل 2-3 قراءات، (2) تدوير اللغة والناشر في عبارة `INSERT` واحدة بدل اثنتين، (3) حدث تشخيص مزوّدين واحد بدل حتى 4 أحداث. و`countSubrequests(env,{fetchCap:24})` يضع سقف 24 طلب جلب لأدلة التشغيل الواحد؛ ما بعده يفشل فورًا كأنه خطأ شبكة فتبقى الطلبات المتبقية للكتابة ونداء الذكاء الاصطناعي.
- **المعيار (يُقرأ من الحالة الحية):** `subs` في أحداث الصياغة: `fetch ≤ 24` و`db` أقل من 17 سابقًا، ثم ظهور `attempted_published`. إن لم يظهر نشر رغم ذلك فالسبب التالي المرجّح `no_independent_sources` (القاعدة) أو حصة المزوّدين، لا حد المنصة.

## 42) أين تقف الأخبار بعد تخفيض الطلبات الفرعية (21 نوفمبر 2026، V2_BUILD 2026-11-21.1)
- **قياس حي (20 نوفمبر 20:07 UTC):** أول تشغيل صياغة وصل إلى مرحلة الذكاء الاصطناعي: `subs {fetch:25, db:27, ai:4}` و`searchStatus: verified` ثم `draft_not_verified`. أي أن **حد الطلبات الفرعية لم يعد العائق الأول**؛ العائق صار أن مسودة Workers AI (نموذج 8B) تسقط في خطوة التحقق (الاستشهادات/الادعاءات غير المدعومة). مجموع الطلبات في هذا التشغيل (≈56 بحسب العدّاد، وهو يعدّ `prepare` أكثر قليلًا مما يُنفَّذ) ما زال على حافة 50، وقد ظهر مرة `Too many subrequests` في 04:06.
- **باقي المحاولات:** `no_independent_sources` (القاعدة، لا عطل) أو القاطع المفتوح لـGemini (`quota_exceeded`)؛ OpenAI رصيده منتهٍ.
- **ما أُضيف:** رسائل أحداث الصياغة في `/api/health/pipeline` صارت 480 حرفًا (كانت 220) لتظهر تفاصيل `draft_not_verified` (لماذا رُفضت المسودة) في «الحالة الحية».
- **الخطوة التالية بحسب المعيار:** اقرأ `publishReasonDetail` لـ`draft_not_verified` في الحالة الحية؛ إن كان سببه نموذج 8B فالحلان: (أ) تقديم `llama-3.3-70b-instruct-fp8-fast` للمسودات (~800 نيورون للمسودة، أي ~12 مسودة يوميًا بالمجان) أو (ب) مزوّد أقوى بحصة. لا تُخفَّف قواعد التحقق.

## 43) سبب سقوط المسودات وإصلاحه (21 نوفمبر 2026، V2_BUILD 2026-11-21.2)
- **قياس حي (21 نوفمبر 04:06-04:36 UTC):** الأدلة سليمة (`independentPublisherCount` 7، `sourceCount` 10، `searchStatus: verified`) والذكاء الاصطناعي يجيب، لكن المسودة تسقط في التحقق لسببين محددين:
  1. **عربية:** `verification_status_mixed; sentences_remaining=6`: شرط الاكتمال في `draftArticle` يطلب `body ≥ 1800` حرف و`≥ 12` جملة و`≥ 4` عناوين؛ نموذج Workers AI الافتراضي 8B يكتب ~6 جمل.
  2. **إنجليزية:** `unsupported_specifics:names=Evidence`: كلمة «Evidence» في أول الجملة (كلمة من قالب الطلب لا اسم علم) كانت تُعدّ «اسمًا غير مدعوم».
- **الإصلاح (لا تخفيف لقواعد التحقق من الوقائع ولا لشرط الناشرين):** (أ) `evidence/source(s)/report(s)/sentence(s)` أُضيفت لقائمة الكلمات العامة في فحص الأسماء؛ الأسماء الحقيقية غير المدعومة (مثل «Governor Smithson») ما زالت تُرفض (اختبار). (ب) `runWorkersAi(env, input, true)` للمسودات يجرّب `llama-3.3-70b-instruct-fp8-fast` أولًا (يلتزم بالطول والعناوين) ثم النموذج المضبوط ثم mistral؛ إن ثبّت المالك `NEWS_AI_MODEL` فهو الأول دائمًا؛ إجابات `ask` العادية تبقى على النموذج المضبوط الرخيص.
- **المراقبة:** في «الحالة الحية» ابحث عن `attempted_published`؛ وإن بقي `draft_not_verified` فاقرأ `publishReasonDetail`. تكلفة المسودة بالنموذج الكبير ~800 نيورون (≈12 مسودة يوميًا في الحصة المجانية)؛ عند نفادها يعود الخط للنموذج الأصغر تلقائيًا.

## 44) حلول بديلة لنفاد حصص الذكاء الاصطناعي (22 نوفمبر 2026، V2_BUILD 2026-11-22.1)
- **المشكلة:** الاعتماد على Gemini (حصة مجانية 20 يوميًا) وOpenAI (رصيد منتهٍ) وWorkers AI (نيورونز محدودة) يوقف الصياغة، ومطلب المالك: ألا يعتمد الموقع على مصدر واحد.
- **نُفّذ (ميزة جديدة):** `src/services/openai-compatible.ts`: مزوّدون متوافقون مع واجهة OpenAI ولهم باقات مجانية: **Groq** (`llama-3.3-70b-versatile`) و**Cerebras** (`llama-3.3-70b`) و**OpenRouter** (`meta-llama/llama-3.3-70b-instruct:free`). يعملون فقط إذا وُجد مفتاحهم كـSecret، وبالترتيب **Gemini ← Groq ← Cerebras ← OpenRouter ← OpenAI ← Workers AI** في الصياغة والإجابات. عند 429/401/5xx/مهلة ينتقل للتالي فورًا ويُوضع المزوّد في «تبريد» داخل الذاكرة (لا استعلامات D1 إضافية)، والمفاتيح لا تُسجَّل. اختبارات: ترتيب، تبديل عند الفشل، تبريد، OpenRouter بلا JSON mode، عدم تسريب المفتاح.
- **المطلوب من المالك (دقائق، بلا بطاقة غالبًا؛ الأسماء والحدود حسب علمي وقد تتغير فتحقق من مواقعهم):** أنشئ مفتاحًا مجانيًا في console.groq.com وcloud.cerebras.ai وopenrouter.ai، وأضفها في Cloudflare → bayan → Settings → Variables and Secrets كـ**Secret** بالأسماء `GROQ_API_KEY` و`CEREBRAS_API_KEY` و`OPENROUTER_API_KEY` (اختياريًا `GROQ_MODEL` وغيرها لتغيير النموذج) ثم Deploy. لا تلصق المفاتيح في المحادثة. **التحقق:** `/api/health/pipeline` (وفي «الحالة الحية») يعرض `providers: {groq:true,…}`، ثم ابحث عن `attempted_published`. لم أستطع تجربة نداء حقيقي لأنه لا يوجد مفتاح عندي، فأول تشغيل هو الاختبار الفعلي.
- **بدائل أخرى مدروسة ولم تُنفَّذ بعد:** (1) تخزين الأدلة في `admin_settings` بين المحاولات لتخطي ~22 طلب جلب عند إعادة المحاولة؛ (2) تشغيل الخط من GitHub Actions خارج حدود الـWorker (يحتاج أسرارًا في GitHub وواجهة الإدارة)؛ (3) تقسيم الخط إلى مراحل (أدلة ثم صياغة) على دورات cron مختلفة؛ (4) Workers Paid. أيها أولًا يحدده المالك بعد رؤية نتيجة المزوّدين المجانيين.

