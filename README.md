# BAYAN | بيان v1

**المعلومة أولًا. الدليل قبل الادعاء.**

BAYAN v1 is a clean rebuild: Arabic/English knowledge, evidence-first search, verified news, live data, Ask BAYAN, contributions, saved content and a private manager center.

## مرجع المشروع وسجله التاريخي

- [المرجع الرئيسي الشامل بالعربية](docs/MASTER_PROJECT_REFERENCE_AR.md): الرؤية، المتطلبات، الحالة المعروفة، المشكلات والحلول، الأدوات المطلوبة، الضوابط، وخطة إغلاق البنود.
- [الخط الزمني وسجل التحقق التاريخي](docs/MASTER_PROJECT_TIMELINE_AR.md): تسلسل العمل منذ التأسيس، commits حديثة ذات صلة، الحوادث، متطلبات المستخدم التي يجب حفظها، وفجوات التحقق المفتوحة.

> وجود مطلب أو commit في الوثائق لا يعني أن الميزة تعمل في الإنتاج. يجب توثيق الاختبارات ونتائج CI وSHA المنشور والتحقق المباشر قبل إعلان الإنجاز.

## Principles
- Retrieval and verification precede generation.
- Multiple independent sources are preferred.
- Evidence status is explicit; insufficient evidence is not hidden.
- English is first-class and never silently falls back to Arabic.
- Public submissions are moderated before publication.
- Manager actions require BAYAN_AI_MANAGER_TOKEN.
- Telegram is the operational notification channel; Resend is not required.
- Production claims require test and deployed-SHA evidence; historical notes are not proof of current behavior.

## Checks
npm install → npm run check
