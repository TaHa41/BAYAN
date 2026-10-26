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
