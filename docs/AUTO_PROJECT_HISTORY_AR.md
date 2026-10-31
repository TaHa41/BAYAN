# سجل التغييرات التلقائي — BAYAN

هذا السجل يُحدَّث آليًا عند وصول تغييرات إلى الفرع `main` عبر `.github/workflows/auto-project-history.yml`.

- يسجل التاريخ، SHA، رسالة commit، والملفات المتغيرة.
- لا يسجل الأسرار أو قيم المتغيرات الحساسة.
- السجل التقني لا يثبت وحده صحة الميزة أو نجاح الإنتاج.
- شرح السبب، الاختبارات، المخاطر، والتراجع مطلوب في كل Pull Request عبر القالب الإلزامي.
- يجب تحديث المرجع الرئيسي يدويًا عند تغير حالة مطلب أو قرار؛ لا يمكن استنتاج ذلك بأمان من commit فقط.

## سجل التغييرات

### 2026-10-26 — تأسيس منظومة التوثيق المستمر
- التغيير: إضافة سير عمل لتسجيل commits على `main` تلقائيًا، ودليل onboarding وتشغيل، وقالب Pull Request يطلب الأدلة والاختبارات وخطة التراجع.
- الحالة: أُضيفت التغييرات إلى فرع توثيق وطلب دمج؛ لم يُثبت دمجها في `main` بعد.
- ملاحظة: يبدأ التسجيل التلقائي بعد دمج workflow في الفرع `main` وتفعيله.

### 2026-10-26T09:47:28+03:00 — docs: add comprehensive BAYAN project reference in Arabic 
- Commit: `aecd484b515cf104d6dde8de7a3ae710dfb4ce27`
- الملفات: A	docs/MASTER_PROJECT_REFERENCE_AR.md 
- المراجعة: راجع طلب الدمج/رسالة commit والاختبارات المرتبطة قبل اعتبار العمل مكتملًا.

### 2026-10-26T09:47:34+03:00 — docs: link master project reference from README 
- Commit: `e67cb866677d0550358a6a216d80e0524b9ac07c`
- الملفات: M	README.md 
- المراجعة: راجع طلب الدمج/رسالة commit والاختبارات المرتبطة قبل اعتبار العمل مكتملًا.

### 2026-10-26T09:49:46+03:00 — docs: add detailed BAYAN project timeline and verification gaps 
- Commit: `ebade30433a88d8dc2694c594b9acbbc611c0af8`
- الملفات: A	docs/MASTER_PROJECT_TIMELINE_AR.md 
- المراجعة: راجع طلب الدمج/رسالة commit والاختبارات المرتبطة قبل اعتبار العمل مكتملًا.

### 2026-10-26T09:49:51+03:00 — docs: link master reference and project timeline from README 
- Commit: `f226189aacbeb4ca4d2fa6d237f614d13880b8dc`
- الملفات: M	README.md 
- المراجعة: راجع طلب الدمج/رسالة commit والاختبارات المرتبطة قبل اعتبار العمل مكتملًا.

### 2026-10-26T09:52:46+03:00 — Add automatic project history logging on main 
- Commit: `6daee209b5df0e34bd81865e3728c5834cf9c0dc`
- الملفات: A	.github/workflows/auto-project-history.yml 
- المراجعة: راجع طلب الدمج/رسالة commit والاختبارات المرتبطة قبل اعتبار العمل مكتملًا.

### 2026-10-26T09:52:49+03:00 — Add Arabic onboarding and safe operations guide 
- Commit: `813b27d1d2f5596fd341506a76d7822f575653ad`
- الملفات: A	docs/CONTRIBUTING_AND_OPERATIONS_AR.md 
- المراجعة: راجع طلب الدمج/رسالة commit والاختبارات المرتبطة قبل اعتبار العمل مكتملًا.

### 2026-10-26T09:52:51+03:00 — Require evidence and documentation in every pull request 
- Commit: `581594400f733c29ae114705a14ede3566362b01`
- الملفات: A	.github/PULL_REQUEST_TEMPLATE.md 
- المراجعة: راجع طلب الدمج/رسالة commit والاختبارات المرتبطة قبل اعتبار العمل مكتملًا.

### 2026-10-26T09:53:04+03:00 — Add automatic project history ledger 
- Commit: `85e1362cc885e46ff70c75d14fcdff0d589aa0da`
- الملفات: A	docs/AUTO_PROJECT_HISTORY_AR.md 
- المراجعة: راجع طلب الدمج/رسالة commit والاختبارات المرتبطة قبل اعتبار العمل مكتملًا.

### 2026-10-26T09:53:06+03:00 — Link automatic history and contributor guide 
- Commit: `1fec12b0284c87d8045b1cf0f760ea0209a2b7b9`
- الملفات: M	README.md 
- المراجعة: راجع طلب الدمج/رسالة commit والاختبارات المرتبطة قبل اعتبار العمل مكتملًا.

### 2026-10-26T10:05:31+03:00 — Person pages, guarded AI repair retries, and ads.txt readiness 
- Commit: `2768ce4bc8141d3a79542bf93a05c915f3e49fef`
- الملفات: M	scripts/source-contract-smoke.mjs;M	src/index.ts;M	src/seo.ts;M	src/services/repair.ts;M	src/services/search.ts;M	src/types.ts;A	tests/ads-txt.test.ts;M	tests/repair-ai-readonly.test.ts 
- المراجعة: راجع طلب الدمج/رسالة commit والاختبارات المرتبطة قبل اعتبار العمل مكتملًا.

### 2026-10-26T10:06:31+03:00 — Improve Arabic weather geocoding 
- Commit: `43a41e528c5674ed1ff13a591249dadac9ee4343`
- الملفات: M	src/services/live.ts;M	tests/live-providers.test.ts 
- المراجعة: راجع طلب الدمج/رسالة commit والاختبارات المرتبطة قبل اعتبار العمل مكتملًا.

### 2026-10-26T10:06:47+03:00 — Integrate responsive BAYAN homepage hero 
- Commit: `3ebb0f38397599bec5e7a71450632c73687a6581`
- الملفات: M	package.json;A	public/app-20261026-01.js;M	public/index.html;M	public/styles.css 
- المراجعة: راجع طلب الدمج/رسالة commit والاختبارات المرتبطة قبل اعتبار العمل مكتملًا.

### 2026-10-26T10:10:05+03:00 — Keep admin dashboard usable with partial endpoint failures 
- Commit: `004bbeb0d2339b05b33d0da52920bab688bd6bf6`
- الملفات: M	package.json;A	public/app-20261026-admin-03.js;M	public/index.html;M	scripts/source-contract-smoke.mjs 
- المراجعة: راجع طلب الدمج/رسالة commit والاختبارات المرتبطة قبل اعتبار العمل مكتملًا.

### 2026-10-26T10:10:39+03:00 — Resolve prayer times by exact city and governorate 
- Commit: `589992adc756cde49646f86db99b0f5208cd158c`
- الملفات: M	src/services/live.ts;M	tests/live-providers.test.ts 
- المراجعة: راجع طلب الدمج/رسالة commit والاختبارات المرتبطة قبل اعتبار العمل مكتملًا.

### 2026-10-26T22:04:31Z — Research article page: automatic 3-attempt retry before the failure notice (bundle app-20261027-01.js) 
- Commit: `5bd2a142ba4fff1049a4d9d0de7c7cea11546c44`
- الملفات: M	package.json;A	public/app-20261027-01.js;M	scripts/source-contract-smoke.mjs;M	src/index.ts 
- المراجعة: راجع طلب الدمج/رسالة commit والاختبارات المرتبطة قبل اعتبار العمل مكتملًا.

### 2026-10-26T22:09:57Z — Health check: emit the failure reason as a GitHub annotation 
- Commit: `cfbeaeaa77ddee7273abfa6c0b12bb215125cf7b`
- الملفات: M	scripts/production-health.mjs 
- المراجعة: راجع طلب الدمج/رسالة commit والاختبارات المرتبطة قبل اعتبار العمل مكتملًا.

### 2026-10-26T22:13:38Z — Health check: annotation handler also covers uncaught top-level-await errors 
- Commit: `dfe3c4f3aedf3fe812c82809ba363e7b4f2e42dc`
- الملفات: M	scripts/production-health.mjs 
- المراجعة: راجع طلب الدمج/رسالة commit والاختبارات المرتبطة قبل اعتبار العمل مكتملًا.

### 2026-10-26T22:16:53Z — News sitemap diagnostics: also emit counts as a run annotation (non-blocking) 
- Commit: `bd52114fac41098fd6dfff9b711a716f8b2d5eb8`
- الملفات: M	scripts/news-sitemap-diagnostics.mjs 
- المراجعة: راجع طلب الدمج/رسالة commit والاختبارات المرتبطة قبل اعتبار العمل مكتملًا.

### 2026-10-26T22:31:39Z — Serve the hero bundle: app-20261027-02.js = hero bundle (20261026-01) + article retry; fixes the shell pointing at a bundle without the hero 
- Commit: `45bc05785d9ca4f502ca852b96c84e74b6843f0c`
- الملفات: M	package.json;A	public/app-20261027-02.js;M	scripts/source-contract-smoke.mjs;M	src/index.ts 
- المراجعة: راجع طلب الدمج/رسالة commit والاختبارات المرتبطة قبل اعتبار العمل مكتملًا.

### 2026-10-26T22:35:18Z — News sitemap: expose aggregated archive drafting reasons in a header and in the diagnostics annotation (no extra D1 reads) 
- Commit: `1d742fc2bcaf10cfe0729d1d008d0fc5593d1e15`
- الملفات: M	scripts/news-sitemap-diagnostics.mjs;M	src/seo.ts 
- المراجعة: راجع طلب الدمج/رسالة commit والاختبارات المرتبطة قبل اعتبار العمل مكتملًا.

### 2026-10-27T03:07:24Z — Redesign v3: unified section names and copy, new section artwork, motion/card/article CSS layer (bundle app-20261027-03.js) 
- Commit: `886a529b9327a4d034acde84a42818c7a1aa3c8d`
- الملفات: M	package.json;A	public/app-20261027-03.js;M	public/sections/arab.svg;M	public/sections/art.svg;M	public/sections/economy.svg;M	public/sections/egypt.svg;M	public/sections/health.svg;M	public/sections/history.svg;M	public/sections/news.svg;M	public/sections/people.svg;M	public/sections/politics.svg;M	public/sections/prices.svg;M	public/sections/science.svg;M	public/sections/sports.svg;M	public/sections/technology.svg;M	public/sections/travel.svg;M	public/sections/trends.svg;M	public/sections/world.svg;M	public/styles.css;M	scripts/source-contract-smoke.mjs;M	src/index.ts;M	src/sections.ts 
- المراجعة: راجع طلب الدمج/رسالة commit والاختبارات المرتبطة قبل اعتبار العمل مكتملًا.

### 2026-10-27T06:28:13+03:00 — feat: integrate globe visual into BAYAN homepage hero 
- Commit: `eb0dab0b2edc108c93e1d05efca91bcd6710061b`
- الملفات: M	public/app-20261027-03.js;M	public/styles.css 
- المراجعة: راجع طلب الدمج/رسالة commit والاختبارات المرتبطة قبل اعتبار العمل مكتملًا.

### 2026-10-27T08:11:19Z — Section archive: file every sourced search result / opened topic under its own section (ARCHIVE status, never PUBLISHED) 
- Commit: `9273c386a0d3dcb362d93d394436d329dab1dba8`
- الملفات: M	src/routes/api.ts;A	src/services/section-archive.ts;A	tests/section-archive.test.ts 
- المراجعة: راجع طلب الدمج/رسالة commit والاختبارات المرتبطة قبل اعتبار العمل مكتملًا.

### 2026-10-26T06:44:01Z — v2: clean foundation (evidence rules, resilient search core, testable worker routes) in v2/, old code untouched 
- Commit: `a00e12bcf9f70426f2b86a653548975edf2e9d83`
- الملفات: M	tsconfig.json;A	v2/README.md;A	v2/src/evidence.ts;A	v2/src/index.ts;A	v2/src/search.ts;A	v2/src/worker.ts;A	v2/tests/evidence.test.ts;A	v2/tests/search.test.ts;A	v2/tests/worker.test.ts 
- المراجعة: راجع طلب الدمج/رسالة commit والاختبارات المرتبطة قبل اعتبار العمل مكتملًا.

### 2026-10-27T08:30:08Z — v2: server-rendered site (home, 15 sections, article, search), D1 read store, Wikipedia provider, new design and copy, bayan-v2 preview config 
- Commit: `8e54cb799e64d43148e75a8d9d7c1d3323930baa`
- الملفات: M	v2/README.md;M	v2/src/index.ts;A	v2/src/providers/wikipedia.ts;A	v2/src/sections.ts;A	v2/src/store.ts;A	v2/src/ui.ts;M	v2/src/worker.ts;A	v2/tests/store.test.ts;M	v2/tests/worker.test.ts;A	v2/wrangler.jsonc 
- المراجعة: راجع طلب الدمج/رسالة commit والاختبارات المرتبطة قبل اعتبار العمل مكتملًا.

### 2026-10-28T00:16:05Z — v2: AI engineer (Gemini + Workers AI behind typed results, fail-closed admin diagnose/ai-test, deterministic findings) 
- Commit: `60ce0d8464d54adec21944bd27d8b82fb7d79e6f`
- الملفات: M	v2/README.md;A	v2/src/ai.ts;A	v2/src/engineer.ts;M	v2/src/worker.ts;A	v2/tests/admin.test.ts 
- المراجعة: راجع طلب الدمج/رسالة commit والاختبارات المرتبطة قبل اعتبار العمل مكتملًا.

### 2026-10-28T00:25:25Z — Go-live bridge: serve home, content sections and article pages from the new server-rendered v2 inside the production Worker; news-site design, SVG icons, front page; v1 routes unchanged 
- Commit: `cab45bfe4969aae47a672eba8ce89268e686abe8`
- الملفات: M	src/index.ts;A	src/v2-bridge.ts;M	tests/api.test.ts;A	tests/v2-bridge.test.ts;A	v2/src/icons.ts;M	v2/src/ui.ts;M	v2/src/worker.ts;M	v2/tests/worker.test.ts 
- المراجعة: راجع طلب الدمج/رسالة commit والاختبارات المرتبطة قبل اعتبار العمل مكتملًا.

### 2026-10-28T00:26:03Z — e2e: replace the obsolete drawer test with checks for the new home (ribbon, search, credit, section page) 
- Commit: `cd315ef832e3736247ef926cff7c2d6d347e9baa`
- الملفات: M	tests/e2e/public-routes.spec.ts 
- المراجعة: راجع طلب الدمج/رسالة commit والاختبارات المرتبطة قبل اعتبار العمل مكتملًا.

### 2026-10-28T08:35:56Z — News page in the new design: live headlines + archive merged and de-duplicated, honest placeholders and empty state; bridge serves /news (archive deep links stay on v1) 
- Commit: `6ea356f959114c671eb3da8b74257b1a84e1aef7`
- الملفات: M	src/v2-bridge.ts;M	tests/v2-bridge.test.ts;M	v2/src/store.ts;M	v2/src/ui.ts;M	v2/src/worker.ts;M	v2/tests/store.test.ts;M	v2/tests/worker.test.ts 
- المراجعة: راجع طلب الدمج/رسالة commit والاختبارات المرتبطة قبل اعتبار العمل مكتملًا.

### 2026-10-28T08:36:25Z — Bridge: 6s cap on the live news refresh so the page falls back to the archive 
- Commit: `b145303ac71592fabf2d8cff2e586ae2d54786c0`
- الملفات: M	src/v2-bridge.ts 
- المراجعة: راجع طلب الدمج/رسالة commit والاختبارات المرتبطة قبل اعتبار العمل مكتملًا.

### 2026-10-28T08:40:08Z — New pages: render feed summaries as clean text (strip raw HTML/entities from RSS) so tags never show to readers 
- Commit: `16e564737f73d976a4b91c46b14be04c2063f0f3`
- الملفات: M	v2/src/ui.ts;M	v2/tests/worker.test.ts 
- المراجعة: راجع طلب الدمج/رسالة commit والاختبارات المرتبطة قبل اعتبار العمل مكتملًا.

### 2026-10-28T19:47:11Z — Deploy marker: V2_BUILD constant in src/ (deploy workflow only watches src/**) + x-bayan-v2-build header 
- Commit: `9a3ba46bcdde08122d322d43abfa4fa231668ebd`
- الملفات: M	src/v2-bridge.ts;M	tests/v2-bridge.test.ts 
- المراجعة: راجع طلب الدمج/رسالة commit والاختبارات المرتبطة قبل اعتبار العمل مكتملًا.

### 2026-10-30T04:51:00Z — Quality + structure: stub articles no longer shown as articles (quality gate), news-first front page, news filed into sections by transparent rules, grouped section pages, honest stub pages (noindex) 
- Commit: `2b1a012b1cac2d9a7d2bd7b1768c323a6d6f96fb`
- الملفات: M	src/v2-bridge.ts;A	v2/src/classify.ts;A	v2/src/quality.ts;M	v2/src/store.ts;M	v2/src/ui.ts;M	v2/src/worker.ts;A	v2/tests/classify-quality.test.ts;M	v2/tests/store.test.ts;M	v2/tests/worker.test.ts 
- المراجعة: راجع طلب الدمج/رسالة commit والاختبارات المرتبطة قبل اعتبار العمل مكتملًا.

### 2026-10-30T10:18:36Z — BAYAN encyclopedia: live Wikipedia/Commons entries (sourced, licensed, auto-renewing) in every section, daily most-read block on the home page, full entry pages with sections, image credit and CC BY-SA attribution 
- Commit: `9c466d380d5ce58f349fbd76e322478fc31330dd`
- الملفات: M	src/v2-bridge.ts;M	tests/v2-bridge.test.ts;A	v2/src/topics.ts;M	v2/src/ui.ts;A	v2/src/wiki.ts;M	v2/src/worker.ts;A	v2/tests/wiki.test.ts;M	v2/tests/worker.test.ts 
- المراجعة: راجع طلب الدمج/رسالة commit والاختبارات المرتبطة قبل اعتبار العمل مكتملًا.

### 2026-10-30T10:24:00Z — Isolate tests from the network (stub fetch), lazy global fetch in wikiApi, 3s soft limits for optional encyclopedia blocks so pages never wait on Wikipedia 
- Commit: `7b92c5ffe57ff8d2867d36270b005758382c1075`
- الملفات: M	tests/api.test.ts;M	tests/v2-bridge.test.ts;M	v2/src/wiki.ts;M	v2/src/worker.ts 
- المراجعة: راجع طلب الدمج/رسالة commit والاختبارات المرتبطة قبل اعتبار العمل مكتملًا.

### 2026-10-30T21:39:39Z — Encyclopedia entries: keep lead paragraphs, heading levels (h2/h3) with main-sections-only contents, strip formula remnants 
- Commit: `5e3684a37262fe94e770f07c6df10b25edb86a31`
- الملفات: M	src/v2-bridge.ts;M	v2/src/ui.ts;M	v2/src/wiki.ts;M	v2/tests/wiki.test.ts;M	v2/tests/worker.test.ts 
- المراجعة: راجع طلب الدمج/رسالة commit والاختبارات المرتبطة قبل اعتبار العمل مكتملًا.

### 2026-10-31T16:59:05Z — Live tools in the new design (prices, weather any city, prayer times any city/country), news ticker, scroll-driven animations, reading progress bar 
- Commit: `b5d06cffa162d34d83e9fb5b1dd19305918fca15`
- الملفات: M	src/v2-bridge.ts;M	tests/v2-bridge.test.ts;M	v2/src/icons.ts;M	v2/src/sections.ts;M	v2/src/ui.ts;M	v2/src/worker.ts;M	v2/tests/worker.test.ts 
- المراجعة: راجع طلب الدمج/رسالة commit والاختبارات المرتبطة قبل اعتبار العمل مكتملًا.
