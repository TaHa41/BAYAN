-- Restore the two seeded Naguib Mahfouz profiles with complete, source-backed bilingual articles.
-- The previous seed rows contained only short introductory blurbs and one source, so they must not
-- be served as complete articles. The image is intentionally cleared so the runtime resolves a
-- subject-specific image before exposing the article.
UPDATE articles
SET summary='سيرة موثقة لنجيب محفوظ تشمل النشأة والتعليم وتطور تجربته الروائية وأبرز أعماله وجائزة نوبل، مع التمييز بين الوقائع والسياق النقدي.',
    body='## خلاصة

نجيب محفوظ (11 ديسمبر 1911 – 30 أغسطس 2006) روائي مصري كتب بالعربية، ونال جائزة نوبل في الأدب عام 1988. وتوضح سيرته الرسمية أنه عاش معظم حياته في القاهرة، المدينة التي أصبحت مكانًا أساسيًا في كثير من أعماله. لا تقتصر أهمية محفوظ على الجائزة؛ بل ترتبط أيضًا بتوسيع حضور الرواية العربية عالميًا وبقدرته على تصوير الحياة اليومية والتحولات الاجتماعية من خلال شخصيات وأحياء وعائلات متباينة.

## النشأة والتعليم

ولد محفوظ في القاهرة، والتحق بجامعة القاهرة حيث درس الفلسفة وتخرج عام 1934. وبعد الجامعة اختار أن يجعل الكتابة محورًا رئيسيًا لحياته المهنية. عمل في وظائف حكومية وثقافية لسنوات طويلة بالتوازي مع التأليف، وهو سياق يساعد على فهم قربه من المؤسسات والحياة العامة، لكنه لا يفسر أعماله وحده ولا يغني عن قراءة النصوص نفسها.

## تطور تجربته الروائية

بدأ محفوظ بعض أعماله المبكرة بالعودة إلى التاريخ المصري القديم، ثم اتجه بصورة أوضح إلى تصوير القاهرة الحديثة والعلاقات الاجتماعية داخلها. وفي رواياته تظهر آثار تغير المدينة وتبدل الأجيال والاختلاف بين التقاليد والطموحات الفردية. لم يكن هذا التحول انتقالًا بسيطًا من نوع أدبي إلى آخر؛ فقد استمر اهتمامه بالتاريخ والذاكرة والهوية حتى في الأعمال التي تتناول الحياة المعاصرة.

## أعمال بارزة

تعد ثلاثية القاهرة من أشهر مشروعاته الروائية، وتتكون من بين القصرين وقصر الشوق والسكرية. وتتابع الروايات حياة أسرة عبر أجيال وتربط التغيرات داخل البيت بالظروف الاجتماعية والسياسية في مصر خلال النصف الأول من القرن العشرين. ومن الأعمال المعروفة أيضًا زقاق المدق وأولاد حارتنا، ولكل عمل بناء سردي وأسئلة مختلفة؛ لذلك لا ينبغي اختزال تجربة الكاتب في رواية واحدة أو افتراض أن جميع كتبه تقدم الرؤية نفسها.

## الموضوعات والأسلوب

تتناول أعمال محفوظ الزمن والسلطة والعائلة والإيمان والمعرفة والحب والعدالة، وتجمع بين ملاحظة تفاصيل الحياة اليومية وبناء شخصيات تحمل دوافع متعارضة. وتختلف طريقة السرد من مرحلة إلى أخرى؛ فبعض الروايات أقرب إلى الواقعية الاجتماعية، بينما تستخدم أعمال أخرى الرمز أو الحكاية ذات الأبعاد الفلسفية. هذه أوصاف نقدية تساعد على القراءة، وليست تصنيفات جامدة تمنع وجود أكثر من معنى في العمل الواحد.

## جائزة نوبل والأثر الأدبي

منحت الأكاديمية السويدية محفوظ جائزة نوبل في الأدب عام 1988، وكان أول كاتب يكتب بالعربية يحصل على الجائزة. وأكدت لجنة الجائزة قيمة إسهامه في تطوير فن سرد عربي قادر على مخاطبة قراء من ثقافات مختلفة. كما وصلت أعمال عديدة إلى السينما، فصار تأثيره حاضرًا في الأدب وفي الثقافة الشعبية. ومع ذلك، فإن الجائزة لا تغني عن الرجوع إلى الروايات ولا تجعل كل تفسير نقدي لها حقيقة نهائية.

## كيف نقرأ سيرته بدقة؟

ينبغي الفصل بين الوقائع القابلة للتحقق، مثل تواريخ الميلاد والوفاة والجائزة، وبين الأحكام الأدبية التي تختلف باختلاف القراء والباحثين. وتساعد مقارنة السيرة الرسمية مع مصادر أدبية مستقلة على ضبط المعلومات الأساسية، بينما تحتاج المقارنة بين الروايات إلى قراءة النصوص وسياقات نشرها وترجماتها. وقد تختلف كتابة أسماء الأعمال المترجمة من لغة إلى أخرى، لذلك من المفيد الاحتفاظ بالعنوان العربي عند تحديد العمل المقصود.',
    sources_json='[{"title":"Naguib Mahfouz – Biographical","publisher":"Nobel Prize","url":"https://www.nobelprize.org/prizes/literature/1988/mahfouz/biographical/"},{"title":"Naguib Mahfouz","publisher":"The Booker Prizes","url":"https://thebookerprizes.com/the-booker-library/authors/naguib-mahfouz"}]',
    image_url=NULL,image_alt='نجيب محفوظ',status='PUBLISHED',updated_at='2026-10-10T04:00:00Z'
WHERE slug='who-is-naguib-mahfouz-ar' AND language='ar';

UPDATE articles
SET summary='A sourced profile of Naguib Mahfouz covering his early life, education, literary development, major works and Nobel Prize, while separating facts from critical interpretation.',
    body='## Overview

Naguib Mahfouz (11 December 1911 – 30 August 2006) was an Egyptian novelist who wrote in Arabic and received the Nobel Prize in Literature in 1988. His official Nobel biography records his lifelong connection with Cairo, a city that became a central setting in many of his stories. His significance is not limited to the award: his novels helped bring modern Arabic fiction to a wider international readership and explored everyday life, family relationships and social change through carefully observed characters and places.

## Early life and education

Mahfouz was born in Cairo and studied philosophy at Cairo University, graduating in 1934. After university he chose writing as his central vocation. He also held government and cultural posts for many years while continuing to write. That professional background placed him close to public institutions and cultural life, but it should be treated as context rather than as a complete explanation of the themes and choices in his fiction.

## The development of his fiction

Some of Mahfouz’s early novels draw on ancient Egyptian history. He later became widely known for fiction set in modern Cairo and focused on social relationships, urban neighborhoods and the lives of families. His writing follows changing generations and tensions between inherited customs and individual ambitions. This was not a simple shift from one genre to another: history, memory and identity continued to matter even when the immediate setting was contemporary life.

## Major works

The Cairo Trilogy is among his best-known achievements. It consists of Palace Walk, Palace of Desire and Sugar Street, and follows a family across generations while connecting household life to Egypt’s social and political changes in the first half of the twentieth century. Other widely discussed works include Midaq Alley and Children of Gebelawi. Each has a different narrative design and set of questions, so the author’s career should not be reduced to one novel or treated as if every book expressed the same position.

## Themes and style

Mahfouz’s fiction explores time, authority, family, faith, knowledge, love and justice. His stories combine detailed observation of daily life with characters whose motives often conflict. The narrative approach varies across his career: some novels are associated with social realism, while other works use allegory, symbolism or philosophical storytelling. These descriptions can help readers orient themselves, but they are critical frameworks rather than fixed labels that settle every possible interpretation.

## Nobel Prize and literary influence

The Swedish Academy awarded Mahfouz the 1988 Nobel Prize in Literature. He was the first Arabic-language writer to receive the prize. The Nobel citation emphasized his contribution to a form of Arabic narrative art that could speak to readers across cultures. Many of his works were also adapted for cinema, extending his influence into popular culture. The award is an important historical fact, but it does not replace reading the novels or make any single critical judgment definitive.

## How to read the biography carefully

Reliable biographical facts, such as dates and the Nobel award, should be distinguished from literary evaluations that vary among readers and scholars. Comparing the Nobel biography with independent literary references helps establish the basic record, while comparing novels requires attention to the texts, their publication contexts and their translations. English titles may vary between editions, so retaining the Arabic title can help identify a specific work accurately.',
    sources_json='[{"title":"Naguib Mahfouz – Biographical","publisher":"Nobel Prize","url":"https://www.nobelprize.org/prizes/literature/1988/mahfouz/biographical/"},{"title":"Naguib Mahfouz","publisher":"The Booker Prizes","url":"https://thebookerprizes.com/the-booker-library/authors/naguib-mahfouz"}]',
    image_url=NULL,image_alt='Naguib Mahfouz',status='PUBLISHED',updated_at='2026-10-10T04:00:00Z'
WHERE slug='who-is-naguib-mahfouz-en' AND language='en';
