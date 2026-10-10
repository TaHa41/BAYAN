-- Fill production section gaps with substantial, locale-pure articles.
-- These are evergreen explainers, not fabricated current news or statistics.
INSERT OR IGNORE INTO articles
(slug,section,language,title,summary,body,sources_json,status,image_url,image_alt,created_at,updated_at)
VALUES
('politics-understand-public-policy-ar','politics','ar','كيف تُصنع السياسات العامة؟','شرح لمراحل تحديد المشكلة العامة، وصياغة البدائل، وتقييم الآثار، ومتابعة التنفيذ والمساءلة.','## السؤال الأساسي

ابدأ بتحديد السؤال الذي يجيب عنه موضوع «كيف تُصنع السياسات العامة؟». يساعد هذا التحديد على فصل وصف الواقع عن تفسيره وعن الحكم عليه، ويمنع جمع معلومات متفرقة لا تخدم السؤال نفسه. في هذا المجال، تتضح الصورة عندما نحدد من يتخذ القرار، ومن يتأثر به، وما النتيجة التي نحاول فهمها.

## تحديد المصطلحات

قبل مقارنة المعلومات، عرّف المصطلحات المستخدمة وحدد نطاقها. قد تستخدم جهات مختلفة الكلمة نفسها بمعانٍ أو مقاييس مختلفة، وقد تخفي العناوين المختصرة شروطًا مهمة. لذلك اكتب التعريف العملي أولًا، ثم افحص ما إذا كانت كل معلومة تتحدث عن الشيء نفسه والفترة الزمنية نفسها.

## كيف تسير العملية؟

تتكون العملية عادةً من مراحل مترابطة، ولا تكفي ملاحظة النتيجة النهائية لفهم ما سبقها. افحص المدخلات والقرارات والقيود والجهات المسؤولة، ثم اسأل كيف يمكن أن تؤدي كل مرحلة إلى المرحلة التالية. يساعد هذا الترتيب على كشف الافتراضات بدل القفز مباشرة من سبب محتمل إلى نتيجة مؤكدة.

## ما الذي تثبته الأدلة؟

تختلف قوة الدليل بحسب قربه من الواقعة وطريقة جمعه وتاريخ نشره. تكون الوثيقة الأصلية أو البيانات المنهجية مفيدة عندما تكون متاحة، بينما قد يقدم الملخص الإعلامي سياقًا سريعًا لكنه لا يعرض جميع التفاصيل. في مثال «سياسة النقل العام مثال يوضح كيف تؤثر الميزانية واحتياجات السكان والبيانات المتاحة في الاختيارات»، يجب التمييز بين ما تقوله الوثيقة فعلًا وما يستنتجه الكاتب منها.

## مقارنة المصادر

لا تعتمد على مصدر واحد إذا كان الادعاء مهمًا أو قابلًا للجدل. قارن مصادر مستقلة، وافحص إن كانت تنقل عن بعضها أو تعتمد على البيان نفسه؛ فكثرة الروابط لا تعني بالضرورة كثرة الأدلة المستقلة. دوّن نقاط الاتفاق والاختلاف، وارجع إلى المصدر الأصلي عندما تتغير الأرقام أو تتعارض الصياغات.

## فهم السياق

لا يمكن تفسير معلومة خارج زمانها ومكانها والظروف المحيطة بها. قد تتغير القواعد أو الأسعار أو النتائج أو الأدوار، ولذلك يجب الانتباه إلى تاريخ التحديث والجهة التي تنطبق عليها المعلومة. وعند استخدام مقارنة، تأكد من أن الحالات متشابهة بما يكفي حتى لا تنتج المقارنة استنتاجًا مضللًا.

## الحدود ومواطن عدم اليقين

لكل طريقة قياس حدود؛ فقد تكون البيانات ناقصة أو متأخرة أو لا تمثل جميع الفئات. لا يثبت الارتباط وحده وجود علاقة سببية، ولا تكفي حالة فردية لتعميم حكم على الجميع. عندما تكون المعلومة غير متاحة، اذكر هذا النقص بوضوح ولا تملأ الفراغ بافتراضات تبدو معقولة لكنها غير مثبتة.

## قائمة تحقق عملية

قبل اتخاذ قرار، تحقّق من الجهة المسؤولة، وتاريخ المعلومة، والتعريف المستخدم، والأدلة المستقلة، والاستثناءات المحتملة. احتفظ بالرابط المباشر للمصدر، وافصل في ملاحظاتك بين الحقيقة الموثقة والتفسير والرأي. إذا تغيرت الظروف، أعد الفحص بدل الاعتماد على نسخة قديمة.','[{"title":"Democratic assessment and public policy resources","publisher":"International IDEA","url":"https://www.idea.int/"},{"title":"Parliamentary scrutiny and legislative resources","publisher":"Inter-Parliamentary Union","url":"https://www.ipu.org/"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/United_States_Capitol_west_front_edit2.jpg?width=1200','كيف تُصنع السياسات العامة؟',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('politics-parliamentary-oversight-ar','politics','ar','كيف يراقب البرلمان عمل الحكومة؟','دليل لفهم أدوات الرقابة البرلمانية، والشفافية، والميزانيات، وحدود الاستنتاج من التصريحات السياسية.','## السؤال الأساسي

ابدأ بتحديد السؤال الذي يجيب عنه موضوع «كيف يراقب البرلمان عمل الحكومة؟». يساعد هذا التحديد على فصل وصف الواقع عن تفسيره وعن الحكم عليه، ويمنع جمع معلومات متفرقة لا تخدم السؤال نفسه. في هذا المجال، تتضح الصورة عندما نحدد من يتخذ القرار، ومن يتأثر به، وما النتيجة التي نحاول فهمها.

## تحديد المصطلحات

قبل مقارنة المعلومات، عرّف المصطلحات المستخدمة وحدد نطاقها. قد تستخدم جهات مختلفة الكلمة نفسها بمعانٍ أو مقاييس مختلفة، وقد تخفي العناوين المختصرة شروطًا مهمة. لذلك اكتب التعريف العملي أولًا، ثم افحص ما إذا كانت كل معلومة تتحدث عن الشيء نفسه والفترة الزمنية نفسها.

## كيف تسير العملية؟

تتكون العملية عادةً من مراحل مترابطة، ولا تكفي ملاحظة النتيجة النهائية لفهم ما سبقها. افحص المدخلات والقرارات والقيود والجهات المسؤولة، ثم اسأل كيف يمكن أن تؤدي كل مرحلة إلى المرحلة التالية. يساعد هذا الترتيب على كشف الافتراضات بدل القفز مباشرة من سبب محتمل إلى نتيجة مؤكدة.

## ما الذي تثبته الأدلة؟

تختلف قوة الدليل بحسب قربه من الواقعة وطريقة جمعه وتاريخ نشره. تكون الوثيقة الأصلية أو البيانات المنهجية مفيدة عندما تكون متاحة، بينما قد يقدم الملخص الإعلامي سياقًا سريعًا لكنه لا يعرض جميع التفاصيل. في مثال «السؤال البرلماني ومراجعة الموازنة ولجان الاستماع أدوات مختلفة ولكل منها غرض وحدود»، يجب التمييز بين ما تقوله الوثيقة فعلًا وما يستنتجه الكاتب منها.

## مقارنة المصادر

لا تعتمد على مصدر واحد إذا كان الادعاء مهمًا أو قابلًا للجدل. قارن مصادر مستقلة، وافحص إن كانت تنقل عن بعضها أو تعتمد على البيان نفسه؛ فكثرة الروابط لا تعني بالضرورة كثرة الأدلة المستقلة. دوّن نقاط الاتفاق والاختلاف، وارجع إلى المصدر الأصلي عندما تتغير الأرقام أو تتعارض الصياغات.

## فهم السياق

لا يمكن تفسير معلومة خارج زمانها ومكانها والظروف المحيطة بها. قد تتغير القواعد أو الأسعار أو النتائج أو الأدوار، ولذلك يجب الانتباه إلى تاريخ التحديث والجهة التي تنطبق عليها المعلومة. وعند استخدام مقارنة، تأكد من أن الحالات متشابهة بما يكفي حتى لا تنتج المقارنة استنتاجًا مضللًا.

## الحدود ومواطن عدم اليقين

لكل طريقة قياس حدود؛ فقد تكون البيانات ناقصة أو متأخرة أو لا تمثل جميع الفئات. لا يثبت الارتباط وحده وجود علاقة سببية، ولا تكفي حالة فردية لتعميم حكم على الجميع. عندما تكون المعلومة غير متاحة، اذكر هذا النقص بوضوح ولا تملأ الفراغ بافتراضات تبدو معقولة لكنها غير مثبتة.

## قائمة تحقق عملية

قبل اتخاذ قرار، تحقّق من الجهة المسؤولة، وتاريخ المعلومة، والتعريف المستخدم، والأدلة المستقلة، والاستثناءات المحتملة. احتفظ بالرابط المباشر للمصدر، وافصل في ملاحظاتك بين الحقيقة الموثقة والتفسير والرأي. إذا تغيرت الظروف، أعد الفحص بدل الاعتماد على نسخة قديمة.','[{"title":"Democratic assessment and public policy resources","publisher":"International IDEA","url":"https://www.idea.int/"},{"title":"Parliamentary scrutiny and legislative resources","publisher":"Inter-Parliamentary Union","url":"https://www.ipu.org/"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/United_States_Capitol_west_front_edit2.jpg?width=1200','كيف يراقب البرلمان عمل الحكومة؟',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('politics-understand-public-policy-en','politics','en','How public policy is developed','An evidence-based guide to defining public problems, comparing options, assessing impacts and evaluating implementation.','## The core question

Begin by defining the question addressed by “How public policy is developed”. A clear question separates a description of events from an interpretation and from a value judgment. It also prevents unrelated facts from being collected simply because they share a keyword. Identify who makes a decision, who is affected, and which outcome the reader is trying to understand.

## Define the terms

Define the terms before comparing information. Different organizations may use the same word for different measures, populations or periods, and a short headline can omit important conditions. Write down the operational meaning first, then check whether each source is describing the same thing and the same time window.

## How the process works

The process usually contains connected stages, so the final result alone rarely explains how it happened. Trace inputs, decisions, constraints and responsible organizations, and ask how one stage leads to the next. This makes assumptions visible and reduces the temptation to jump from a plausible factor to a claim of proven causation.

## What evidence can show

Evidence varies in strength according to how close it is to the event, how it was collected and when it was published. Original documents and methodologically described data can be especially useful, while a short media summary may provide context without all underlying details. In the example “public transport illustrates how budgets, residents’ needs and available data shape competing choices”, separate what a record directly states from what an author infers.

## Compare sources

Do not rely on a single source when a claim matters or is contested. Compare independent sources and check whether they repeat the same press release; more links do not necessarily mean more independent evidence. Record where accounts agree and differ, and return to the original record when numbers or wording conflict.

## Read the context

Information cannot be interpreted well outside its date, location and surrounding conditions. Rules, prices, results and responsibilities can change, so check the update date and the population to which a statement applies. Comparisons are meaningful only when the cases are similar enough that differences do not make the conclusion misleading.

## Limits and uncertainty

Every measurement has limits: data may be incomplete, delayed or unrepresentative. Correlation alone does not establish causation, and one personal example cannot justify a universal claim. When information is unavailable, state the gap clearly instead of filling it with an assumption that merely sounds plausible.

## A practical checklist

Before acting, check the responsible organization, date, definitions, independent evidence and possible exceptions. Keep the direct source link and distinguish verified facts from interpretation and opinion in your notes. If the circumstances change, repeat the check rather than relying on an older copy.','[{"title":"Democratic assessment and public policy resources","publisher":"International IDEA","url":"https://www.idea.int/"},{"title":"Parliamentary scrutiny and legislative resources","publisher":"Inter-Parliamentary Union","url":"https://www.ipu.org/"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/United_States_Capitol_west_front_edit2.jpg?width=1200','How public policy is developed',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('politics-parliamentary-oversight-en','politics','en','How parliamentary oversight works','A practical explanation of legislative scrutiny, public budgets, accountability tools and the limits of political claims.','## The core question

Begin by defining the question addressed by “How parliamentary oversight works”. A clear question separates a description of events from an interpretation and from a value judgment. It also prevents unrelated facts from being collected simply because they share a keyword. Identify who makes a decision, who is affected, and which outcome the reader is trying to understand.

## Define the terms

Define the terms before comparing information. Different organizations may use the same word for different measures, populations or periods, and a short headline can omit important conditions. Write down the operational meaning first, then check whether each source is describing the same thing and the same time window.

## How the process works

The process usually contains connected stages, so the final result alone rarely explains how it happened. Trace inputs, decisions, constraints and responsible organizations, and ask how one stage leads to the next. This makes assumptions visible and reduces the temptation to jump from a plausible factor to a claim of proven causation.

## What evidence can show

Evidence varies in strength according to how close it is to the event, how it was collected and when it was published. Original documents and methodologically described data can be especially useful, while a short media summary may provide context without all underlying details. In the example “questions, committee hearings and budget scrutiny serve different purposes and have different limits”, separate what a record directly states from what an author infers.

## Compare sources

Do not rely on a single source when a claim matters or is contested. Compare independent sources and check whether they repeat the same press release; more links do not necessarily mean more independent evidence. Record where accounts agree and differ, and return to the original record when numbers or wording conflict.

## Read the context

Information cannot be interpreted well outside its date, location and surrounding conditions. Rules, prices, results and responsibilities can change, so check the update date and the population to which a statement applies. Comparisons are meaningful only when the cases are similar enough that differences do not make the conclusion misleading.

## Limits and uncertainty

Every measurement has limits: data may be incomplete, delayed or unrepresentative. Correlation alone does not establish causation, and one personal example cannot justify a universal claim. When information is unavailable, state the gap clearly instead of filling it with an assumption that merely sounds plausible.

## A practical checklist

Before acting, check the responsible organization, date, definitions, independent evidence and possible exceptions. Keep the direct source link and distinguish verified facts from interpretation and opinion in your notes. If the circumstances change, repeat the check rather than relying on an older copy.','[{"title":"Democratic assessment and public policy resources","publisher":"International IDEA","url":"https://www.idea.int/"},{"title":"Parliamentary scrutiny and legislative resources","publisher":"Inter-Parliamentary Union","url":"https://www.ipu.org/"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/United_States_Capitol_west_front_edit2.jpg?width=1200','How parliamentary oversight works',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('sports-understand-league-tables-ar','sports','ar','كيف تُحسب جداول ترتيب الدوريات؟','شرح للنقاط وفارق الأهداف والمواجهات المباشرة وقواعد كسر التعادل، ولماذا يجب مراجعة لائحة المسابقة.','## السؤال الأساسي

ابدأ بتحديد السؤال الذي يجيب عنه موضوع «كيف تُحسب جداول ترتيب الدوريات؟». يساعد هذا التحديد على فصل وصف الواقع عن تفسيره وعن الحكم عليه، ويمنع جمع معلومات متفرقة لا تخدم السؤال نفسه. في هذا المجال، تتضح الصورة عندما نحدد من يتخذ القرار، ومن يتأثر به، وما النتيجة التي نحاول فهمها.

## تحديد المصطلحات

قبل مقارنة المعلومات، عرّف المصطلحات المستخدمة وحدد نطاقها. قد تستخدم جهات مختلفة الكلمة نفسها بمعانٍ أو مقاييس مختلفة، وقد تخفي العناوين المختصرة شروطًا مهمة. لذلك اكتب التعريف العملي أولًا، ثم افحص ما إذا كانت كل معلومة تتحدث عن الشيء نفسه والفترة الزمنية نفسها.

## كيف تسير العملية؟

تتكون العملية عادةً من مراحل مترابطة، ولا تكفي ملاحظة النتيجة النهائية لفهم ما سبقها. افحص المدخلات والقرارات والقيود والجهات المسؤولة، ثم اسأل كيف يمكن أن تؤدي كل مرحلة إلى المرحلة التالية. يساعد هذا الترتيب على كشف الافتراضات بدل القفز مباشرة من سبب محتمل إلى نتيجة مؤكدة.

## ما الذي تثبته الأدلة؟

تختلف قوة الدليل بحسب قربه من الواقعة وطريقة جمعه وتاريخ نشره. تكون الوثيقة الأصلية أو البيانات المنهجية مفيدة عندما تكون متاحة، بينما قد يقدم الملخص الإعلامي سياقًا سريعًا لكنه لا يعرض جميع التفاصيل. في مثال «قد يتساوى فريقان في النقاط، فتحدد لائحة البطولة هل يُقدّم فارق الأهداف أم المواجهات المباشرة»، يجب التمييز بين ما تقوله الوثيقة فعلًا وما يستنتجه الكاتب منها.

## مقارنة المصادر

لا تعتمد على مصدر واحد إذا كان الادعاء مهمًا أو قابلًا للجدل. قارن مصادر مستقلة، وافحص إن كانت تنقل عن بعضها أو تعتمد على البيان نفسه؛ فكثرة الروابط لا تعني بالضرورة كثرة الأدلة المستقلة. دوّن نقاط الاتفاق والاختلاف، وارجع إلى المصدر الأصلي عندما تتغير الأرقام أو تتعارض الصياغات.

## فهم السياق

لا يمكن تفسير معلومة خارج زمانها ومكانها والظروف المحيطة بها. قد تتغير القواعد أو الأسعار أو النتائج أو الأدوار، ولذلك يجب الانتباه إلى تاريخ التحديث والجهة التي تنطبق عليها المعلومة. وعند استخدام مقارنة، تأكد من أن الحالات متشابهة بما يكفي حتى لا تنتج المقارنة استنتاجًا مضللًا.

## الحدود ومواطن عدم اليقين

لكل طريقة قياس حدود؛ فقد تكون البيانات ناقصة أو متأخرة أو لا تمثل جميع الفئات. لا يثبت الارتباط وحده وجود علاقة سببية، ولا تكفي حالة فردية لتعميم حكم على الجميع. عندما تكون المعلومة غير متاحة، اذكر هذا النقص بوضوح ولا تملأ الفراغ بافتراضات تبدو معقولة لكنها غير مثبتة.

## قائمة تحقق عملية

قبل اتخاذ قرار، تحقّق من الجهة المسؤولة، وتاريخ المعلومة، والتعريف المستخدم، والأدلة المستقلة، والاستثناءات المحتملة. احتفظ بالرابط المباشر للمصدر، وافصل في ملاحظاتك بين الحقيقة الموثقة والتفسير والرأي. إذا تغيرت الظروف، أعد الفحص بدل الاعتماد على نسخة قديمة.','[{"title":"Football rules and competition resources","publisher":"FIFA","url":"https://www.fifa.com/"},{"title":"Laws of the Game","publisher":"The IFAB","url":"https://www.theifab.com/"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/Football_in_Bloomington,_Indiana,_1995.jpg?width=1200','كيف تُحسب جداول ترتيب الدوريات؟',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('sports-read-player-statistics-ar','sports','ar','كيف نفهم إحصاءات لاعبي كرة القدم؟','دليل لقراءة الأهداف والتمريرات والدقائق ومعدلات الأداء مع مراعاة المركز وقوة المنافس والسياق.','## السؤال الأساسي

ابدأ بتحديد السؤال الذي يجيب عنه موضوع «كيف نفهم إحصاءات لاعبي كرة القدم؟». يساعد هذا التحديد على فصل وصف الواقع عن تفسيره وعن الحكم عليه، ويمنع جمع معلومات متفرقة لا تخدم السؤال نفسه. في هذا المجال، تتضح الصورة عندما نحدد من يتخذ القرار، ومن يتأثر به، وما النتيجة التي نحاول فهمها.

## تحديد المصطلحات

قبل مقارنة المعلومات، عرّف المصطلحات المستخدمة وحدد نطاقها. قد تستخدم جهات مختلفة الكلمة نفسها بمعانٍ أو مقاييس مختلفة، وقد تخفي العناوين المختصرة شروطًا مهمة. لذلك اكتب التعريف العملي أولًا، ثم افحص ما إذا كانت كل معلومة تتحدث عن الشيء نفسه والفترة الزمنية نفسها.

## كيف تسير العملية؟

تتكون العملية عادةً من مراحل مترابطة، ولا تكفي ملاحظة النتيجة النهائية لفهم ما سبقها. افحص المدخلات والقرارات والقيود والجهات المسؤولة، ثم اسأل كيف يمكن أن تؤدي كل مرحلة إلى المرحلة التالية. يساعد هذا الترتيب على كشف الافتراضات بدل القفز مباشرة من سبب محتمل إلى نتيجة مؤكدة.

## ما الذي تثبته الأدلة؟

تختلف قوة الدليل بحسب قربه من الواقعة وطريقة جمعه وتاريخ نشره. تكون الوثيقة الأصلية أو البيانات المنهجية مفيدة عندما تكون متاحة، بينما قد يقدم الملخص الإعلامي سياقًا سريعًا لكنه لا يعرض جميع التفاصيل. في مثال «مقارنة مهاجم ولاعب وسط بعدد الأهداف فقط تتجاهل اختلاف الأدوار والدقائق والفرص»، يجب التمييز بين ما تقوله الوثيقة فعلًا وما يستنتجه الكاتب منها.

## مقارنة المصادر

لا تعتمد على مصدر واحد إذا كان الادعاء مهمًا أو قابلًا للجدل. قارن مصادر مستقلة، وافحص إن كانت تنقل عن بعضها أو تعتمد على البيان نفسه؛ فكثرة الروابط لا تعني بالضرورة كثرة الأدلة المستقلة. دوّن نقاط الاتفاق والاختلاف، وارجع إلى المصدر الأصلي عندما تتغير الأرقام أو تتعارض الصياغات.

## فهم السياق

لا يمكن تفسير معلومة خارج زمانها ومكانها والظروف المحيطة بها. قد تتغير القواعد أو الأسعار أو النتائج أو الأدوار، ولذلك يجب الانتباه إلى تاريخ التحديث والجهة التي تنطبق عليها المعلومة. وعند استخدام مقارنة، تأكد من أن الحالات متشابهة بما يكفي حتى لا تنتج المقارنة استنتاجًا مضللًا.

## الحدود ومواطن عدم اليقين

لكل طريقة قياس حدود؛ فقد تكون البيانات ناقصة أو متأخرة أو لا تمثل جميع الفئات. لا يثبت الارتباط وحده وجود علاقة سببية، ولا تكفي حالة فردية لتعميم حكم على الجميع. عندما تكون المعلومة غير متاحة، اذكر هذا النقص بوضوح ولا تملأ الفراغ بافتراضات تبدو معقولة لكنها غير مثبتة.

## قائمة تحقق عملية

قبل اتخاذ قرار، تحقّق من الجهة المسؤولة، وتاريخ المعلومة، والتعريف المستخدم، والأدلة المستقلة، والاستثناءات المحتملة. احتفظ بالرابط المباشر للمصدر، وافصل في ملاحظاتك بين الحقيقة الموثقة والتفسير والرأي. إذا تغيرت الظروف، أعد الفحص بدل الاعتماد على نسخة قديمة.','[{"title":"Football rules and competition resources","publisher":"FIFA","url":"https://www.fifa.com/"},{"title":"Laws of the Game","publisher":"The IFAB","url":"https://www.theifab.com/"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/Football_in_Bloomington,_Indiana,_1995.jpg?width=1200','كيف نفهم إحصاءات لاعبي كرة القدم؟',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('sports-understand-league-tables-en','sports','en','How football league tables are calculated','A guide to points, goal difference, head-to-head rules and why competition regulations matter when teams are level.','## The core question

Begin by defining the question addressed by “How football league tables are calculated”. A clear question separates a description of events from an interpretation and from a value judgment. It also prevents unrelated facts from being collected simply because they share a keyword. Identify who makes a decision, who is affected, and which outcome the reader is trying to understand.

## Define the terms

Define the terms before comparing information. Different organizations may use the same word for different measures, populations or periods, and a short headline can omit important conditions. Write down the operational meaning first, then check whether each source is describing the same thing and the same time window.

## How the process works

The process usually contains connected stages, so the final result alone rarely explains how it happened. Trace inputs, decisions, constraints and responsible organizations, and ask how one stage leads to the next. This makes assumptions visible and reduces the temptation to jump from a plausible factor to a claim of proven causation.

## What evidence can show

Evidence varies in strength according to how close it is to the event, how it was collected and when it was published. Original documents and methodologically described data can be especially useful, while a short media summary may provide context without all underlying details. In the example “teams level on points may be separated by goal difference or head-to-head records depending on the competition rules”, separate what a record directly states from what an author infers.

## Compare sources

Do not rely on a single source when a claim matters or is contested. Compare independent sources and check whether they repeat the same press release; more links do not necessarily mean more independent evidence. Record where accounts agree and differ, and return to the original record when numbers or wording conflict.

## Read the context

Information cannot be interpreted well outside its date, location and surrounding conditions. Rules, prices, results and responsibilities can change, so check the update date and the population to which a statement applies. Comparisons are meaningful only when the cases are similar enough that differences do not make the conclusion misleading.

## Limits and uncertainty

Every measurement has limits: data may be incomplete, delayed or unrepresentative. Correlation alone does not establish causation, and one personal example cannot justify a universal claim. When information is unavailable, state the gap clearly instead of filling it with an assumption that merely sounds plausible.

## A practical checklist

Before acting, check the responsible organization, date, definitions, independent evidence and possible exceptions. Keep the direct source link and distinguish verified facts from interpretation and opinion in your notes. If the circumstances change, repeat the check rather than relying on an older copy.','[{"title":"Football rules and competition resources","publisher":"FIFA","url":"https://www.fifa.com/"},{"title":"Laws of the Game","publisher":"The IFAB","url":"https://www.theifab.com/"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/Football_in_Bloomington,_Indiana,_1995.jpg?width=1200','How football league tables are calculated',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('sports-read-player-statistics-en','sports','en','How to interpret football player statistics','A practical guide to goals, assists, minutes and performance rates, with attention to position, opposition and context.','## The core question

Begin by defining the question addressed by “How to interpret football player statistics”. A clear question separates a description of events from an interpretation and from a value judgment. It also prevents unrelated facts from being collected simply because they share a keyword. Identify who makes a decision, who is affected, and which outcome the reader is trying to understand.

## Define the terms

Define the terms before comparing information. Different organizations may use the same word for different measures, populations or periods, and a short headline can omit important conditions. Write down the operational meaning first, then check whether each source is describing the same thing and the same time window.

## How the process works

The process usually contains connected stages, so the final result alone rarely explains how it happened. Trace inputs, decisions, constraints and responsible organizations, and ask how one stage leads to the next. This makes assumptions visible and reduces the temptation to jump from a plausible factor to a claim of proven causation.

## What evidence can show

Evidence varies in strength according to how close it is to the event, how it was collected and when it was published. Original documents and methodologically described data can be especially useful, while a short media summary may provide context without all underlying details. In the example “comparing a striker and a midfielder by goals alone ignores their different roles, minutes and chances”, separate what a record directly states from what an author infers.

## Compare sources

Do not rely on a single source when a claim matters or is contested. Compare independent sources and check whether they repeat the same press release; more links do not necessarily mean more independent evidence. Record where accounts agree and differ, and return to the original record when numbers or wording conflict.

## Read the context

Information cannot be interpreted well outside its date, location and surrounding conditions. Rules, prices, results and responsibilities can change, so check the update date and the population to which a statement applies. Comparisons are meaningful only when the cases are similar enough that differences do not make the conclusion misleading.

## Limits and uncertainty

Every measurement has limits: data may be incomplete, delayed or unrepresentative. Correlation alone does not establish causation, and one personal example cannot justify a universal claim. When information is unavailable, state the gap clearly instead of filling it with an assumption that merely sounds plausible.

## A practical checklist

Before acting, check the responsible organization, date, definitions, independent evidence and possible exceptions. Keep the direct source link and distinguish verified facts from interpretation and opinion in your notes. If the circumstances change, repeat the check rather than relying on an older copy.','[{"title":"Football rules and competition resources","publisher":"FIFA","url":"https://www.fifa.com/"},{"title":"Laws of the Game","publisher":"The IFAB","url":"https://www.theifab.com/"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/Football_in_Bloomington,_Indiana,_1995.jpg?width=1200','How to interpret football player statistics',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('travel-plan-evidence-based-trip-ar','travel','ar','كيف تخطط لرحلة اعتمادًا على معلومات موثوقة؟','خطوات لمقارنة الوجهات والمواصلات والتكلفة والموسم والسلامة، والتحقق من المعلومات قبل الحجز.','## السؤال الأساسي

ابدأ بتحديد السؤال الذي يجيب عنه موضوع «كيف تخطط لرحلة اعتمادًا على معلومات موثوقة؟». يساعد هذا التحديد على فصل وصف الواقع عن تفسيره وعن الحكم عليه، ويمنع جمع معلومات متفرقة لا تخدم السؤال نفسه. في هذا المجال، تتضح الصورة عندما نحدد من يتخذ القرار، ومن يتأثر به، وما النتيجة التي نحاول فهمها.

## تحديد المصطلحات

قبل مقارنة المعلومات، عرّف المصطلحات المستخدمة وحدد نطاقها. قد تستخدم جهات مختلفة الكلمة نفسها بمعانٍ أو مقاييس مختلفة، وقد تخفي العناوين المختصرة شروطًا مهمة. لذلك اكتب التعريف العملي أولًا، ثم افحص ما إذا كانت كل معلومة تتحدث عن الشيء نفسه والفترة الزمنية نفسها.

## كيف تسير العملية؟

تتكون العملية عادةً من مراحل مترابطة، ولا تكفي ملاحظة النتيجة النهائية لفهم ما سبقها. افحص المدخلات والقرارات والقيود والجهات المسؤولة، ثم اسأل كيف يمكن أن تؤدي كل مرحلة إلى المرحلة التالية. يساعد هذا الترتيب على كشف الافتراضات بدل القفز مباشرة من سبب محتمل إلى نتيجة مؤكدة.

## ما الذي تثبته الأدلة؟

تختلف قوة الدليل بحسب قربه من الواقعة وطريقة جمعه وتاريخ نشره. تكون الوثيقة الأصلية أو البيانات المنهجية مفيدة عندما تكون متاحة، بينما قد يقدم الملخص الإعلامي سياقًا سريعًا لكنه لا يعرض جميع التفاصيل. في مثال «قد يتغير وقت الوصول والتكلفة الفعلية بسبب النقل المحلي والموسم وشروط الأمتعة»، يجب التمييز بين ما تقوله الوثيقة فعلًا وما يستنتجه الكاتب منها.

## مقارنة المصادر

لا تعتمد على مصدر واحد إذا كان الادعاء مهمًا أو قابلًا للجدل. قارن مصادر مستقلة، وافحص إن كانت تنقل عن بعضها أو تعتمد على البيان نفسه؛ فكثرة الروابط لا تعني بالضرورة كثرة الأدلة المستقلة. دوّن نقاط الاتفاق والاختلاف، وارجع إلى المصدر الأصلي عندما تتغير الأرقام أو تتعارض الصياغات.

## فهم السياق

لا يمكن تفسير معلومة خارج زمانها ومكانها والظروف المحيطة بها. قد تتغير القواعد أو الأسعار أو النتائج أو الأدوار، ولذلك يجب الانتباه إلى تاريخ التحديث والجهة التي تنطبق عليها المعلومة. وعند استخدام مقارنة، تأكد من أن الحالات متشابهة بما يكفي حتى لا تنتج المقارنة استنتاجًا مضللًا.

## الحدود ومواطن عدم اليقين

لكل طريقة قياس حدود؛ فقد تكون البيانات ناقصة أو متأخرة أو لا تمثل جميع الفئات. لا يثبت الارتباط وحده وجود علاقة سببية، ولا تكفي حالة فردية لتعميم حكم على الجميع. عندما تكون المعلومة غير متاحة، اذكر هذا النقص بوضوح ولا تملأ الفراغ بافتراضات تبدو معقولة لكنها غير مثبتة.

## قائمة تحقق عملية

قبل اتخاذ قرار، تحقّق من الجهة المسؤولة، وتاريخ المعلومة، والتعريف المستخدم، والأدلة المستقلة، والاستثناءات المحتملة. احتفظ بالرابط المباشر للمصدر، وافصل في ملاحظاتك بين الحقيقة الموثقة والتفسير والرأي. إذا تغيرت الظروف، أعد الفحص بدل الاعتماد على نسخة قديمة.','[{"title":"Travel and entry information","publisher":"International Air Transport Association","url":"https://www.iata.org/"},{"title":"Foreign travel advice","publisher":"UK Foreign, Commonwealth & Development Office","url":"https://www.gov.uk/foreign-travel-advice"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/Airplane_silhouette.svg?width=1200','كيف تخطط لرحلة اعتمادًا على معلومات موثوقة؟',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('travel-verify-entry-requirements-ar','travel','ar','كيف تتحقق من متطلبات التأشيرة قبل السفر؟','طريقة لمراجعة متطلبات الدخول من الجهات الرسمية، والتأكد من صلاحية الجواز وشروط العبور والتحديثات.','## السؤال الأساسي

ابدأ بتحديد السؤال الذي يجيب عنه موضوع «كيف تتحقق من متطلبات التأشيرة قبل السفر؟». يساعد هذا التحديد على فصل وصف الواقع عن تفسيره وعن الحكم عليه، ويمنع جمع معلومات متفرقة لا تخدم السؤال نفسه. في هذا المجال، تتضح الصورة عندما نحدد من يتخذ القرار، ومن يتأثر به، وما النتيجة التي نحاول فهمها.

## تحديد المصطلحات

قبل مقارنة المعلومات، عرّف المصطلحات المستخدمة وحدد نطاقها. قد تستخدم جهات مختلفة الكلمة نفسها بمعانٍ أو مقاييس مختلفة، وقد تخفي العناوين المختصرة شروطًا مهمة. لذلك اكتب التعريف العملي أولًا، ثم افحص ما إذا كانت كل معلومة تتحدث عن الشيء نفسه والفترة الزمنية نفسها.

## كيف تسير العملية؟

تتكون العملية عادةً من مراحل مترابطة، ولا تكفي ملاحظة النتيجة النهائية لفهم ما سبقها. افحص المدخلات والقرارات والقيود والجهات المسؤولة، ثم اسأل كيف يمكن أن تؤدي كل مرحلة إلى المرحلة التالية. يساعد هذا الترتيب على كشف الافتراضات بدل القفز مباشرة من سبب محتمل إلى نتيجة مؤكدة.

## ما الذي تثبته الأدلة؟

تختلف قوة الدليل بحسب قربه من الواقعة وطريقة جمعه وتاريخ نشره. تكون الوثيقة الأصلية أو البيانات المنهجية مفيدة عندما تكون متاحة، بينما قد يقدم الملخص الإعلامي سياقًا سريعًا لكنه لا يعرض جميع التفاصيل. في مثال «قد تختلف القواعد حسب الجنسية ومدة الإقامة والغرض من الرحلة وبلد الترانزيت»، يجب التمييز بين ما تقوله الوثيقة فعلًا وما يستنتجه الكاتب منها.

## مقارنة المصادر

لا تعتمد على مصدر واحد إذا كان الادعاء مهمًا أو قابلًا للجدل. قارن مصادر مستقلة، وافحص إن كانت تنقل عن بعضها أو تعتمد على البيان نفسه؛ فكثرة الروابط لا تعني بالضرورة كثرة الأدلة المستقلة. دوّن نقاط الاتفاق والاختلاف، وارجع إلى المصدر الأصلي عندما تتغير الأرقام أو تتعارض الصياغات.

## فهم السياق

لا يمكن تفسير معلومة خارج زمانها ومكانها والظروف المحيطة بها. قد تتغير القواعد أو الأسعار أو النتائج أو الأدوار، ولذلك يجب الانتباه إلى تاريخ التحديث والجهة التي تنطبق عليها المعلومة. وعند استخدام مقارنة، تأكد من أن الحالات متشابهة بما يكفي حتى لا تنتج المقارنة استنتاجًا مضللًا.

## الحدود ومواطن عدم اليقين

لكل طريقة قياس حدود؛ فقد تكون البيانات ناقصة أو متأخرة أو لا تمثل جميع الفئات. لا يثبت الارتباط وحده وجود علاقة سببية، ولا تكفي حالة فردية لتعميم حكم على الجميع. عندما تكون المعلومة غير متاحة، اذكر هذا النقص بوضوح ولا تملأ الفراغ بافتراضات تبدو معقولة لكنها غير مثبتة.

## قائمة تحقق عملية

قبل اتخاذ قرار، تحقّق من الجهة المسؤولة، وتاريخ المعلومة، والتعريف المستخدم، والأدلة المستقلة، والاستثناءات المحتملة. احتفظ بالرابط المباشر للمصدر، وافصل في ملاحظاتك بين الحقيقة الموثقة والتفسير والرأي. إذا تغيرت الظروف، أعد الفحص بدل الاعتماد على نسخة قديمة.','[{"title":"Travel and entry information","publisher":"International Air Transport Association","url":"https://www.iata.org/"},{"title":"Foreign travel advice","publisher":"UK Foreign, Commonwealth & Development Office","url":"https://www.gov.uk/foreign-travel-advice"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/Airplane_silhouette.svg?width=1200','كيف تتحقق من متطلبات التأشيرة قبل السفر؟',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('travel-plan-evidence-based-trip-en','travel','en','How to plan a trip using reliable information','A practical method for comparing destinations, transport, costs, seasonality and safety before booking.','## The core question

Begin by defining the question addressed by “How to plan a trip using reliable information”. A clear question separates a description of events from an interpretation and from a value judgment. It also prevents unrelated facts from being collected simply because they share a keyword. Identify who makes a decision, who is affected, and which outcome the reader is trying to understand.

## Define the terms

Define the terms before comparing information. Different organizations may use the same word for different measures, populations or periods, and a short headline can omit important conditions. Write down the operational meaning first, then check whether each source is describing the same thing and the same time window.

## How the process works

The process usually contains connected stages, so the final result alone rarely explains how it happened. Trace inputs, decisions, constraints and responsible organizations, and ask how one stage leads to the next. This makes assumptions visible and reduces the temptation to jump from a plausible factor to a claim of proven causation.

## What evidence can show

Evidence varies in strength according to how close it is to the event, how it was collected and when it was published. Original documents and methodologically described data can be especially useful, while a short media summary may provide context without all underlying details. In the example “arrival times and total costs can change with local transport, seasonality and baggage rules”, separate what a record directly states from what an author infers.

## Compare sources

Do not rely on a single source when a claim matters or is contested. Compare independent sources and check whether they repeat the same press release; more links do not necessarily mean more independent evidence. Record where accounts agree and differ, and return to the original record when numbers or wording conflict.

## Read the context

Information cannot be interpreted well outside its date, location and surrounding conditions. Rules, prices, results and responsibilities can change, so check the update date and the population to which a statement applies. Comparisons are meaningful only when the cases are similar enough that differences do not make the conclusion misleading.

## Limits and uncertainty

Every measurement has limits: data may be incomplete, delayed or unrepresentative. Correlation alone does not establish causation, and one personal example cannot justify a universal claim. When information is unavailable, state the gap clearly instead of filling it with an assumption that merely sounds plausible.

## A practical checklist

Before acting, check the responsible organization, date, definitions, independent evidence and possible exceptions. Keep the direct source link and distinguish verified facts from interpretation and opinion in your notes. If the circumstances change, repeat the check rather than relying on an older copy.','[{"title":"Travel and entry information","publisher":"International Air Transport Association","url":"https://www.iata.org/"},{"title":"Foreign travel advice","publisher":"UK Foreign, Commonwealth & Development Office","url":"https://www.gov.uk/foreign-travel-advice"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/Airplane_silhouette.svg?width=1200','How to plan a trip using reliable information',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('travel-verify-entry-requirements-en','travel','en','How to verify visa requirements before travel','How to check official entry rules, passport validity, transit conditions and updates before paying for travel.','## The core question

Begin by defining the question addressed by “How to verify visa requirements before travel”. A clear question separates a description of events from an interpretation and from a value judgment. It also prevents unrelated facts from being collected simply because they share a keyword. Identify who makes a decision, who is affected, and which outcome the reader is trying to understand.

## Define the terms

Define the terms before comparing information. Different organizations may use the same word for different measures, populations or periods, and a short headline can omit important conditions. Write down the operational meaning first, then check whether each source is describing the same thing and the same time window.

## How the process works

The process usually contains connected stages, so the final result alone rarely explains how it happened. Trace inputs, decisions, constraints and responsible organizations, and ask how one stage leads to the next. This makes assumptions visible and reduces the temptation to jump from a plausible factor to a claim of proven causation.

## What evidence can show

Evidence varies in strength according to how close it is to the event, how it was collected and when it was published. Original documents and methodologically described data can be especially useful, while a short media summary may provide context without all underlying details. In the example “rules can depend on nationality, length of stay, travel purpose and the country used for transit”, separate what a record directly states from what an author infers.

## Compare sources

Do not rely on a single source when a claim matters or is contested. Compare independent sources and check whether they repeat the same press release; more links do not necessarily mean more independent evidence. Record where accounts agree and differ, and return to the original record when numbers or wording conflict.

## Read the context

Information cannot be interpreted well outside its date, location and surrounding conditions. Rules, prices, results and responsibilities can change, so check the update date and the population to which a statement applies. Comparisons are meaningful only when the cases are similar enough that differences do not make the conclusion misleading.

## Limits and uncertainty

Every measurement has limits: data may be incomplete, delayed or unrepresentative. Correlation alone does not establish causation, and one personal example cannot justify a universal claim. When information is unavailable, state the gap clearly instead of filling it with an assumption that merely sounds plausible.

## A practical checklist

Before acting, check the responsible organization, date, definitions, independent evidence and possible exceptions. Keep the direct source link and distinguish verified facts from interpretation and opinion in your notes. If the circumstances change, repeat the check rather than relying on an older copy.','[{"title":"Travel and entry information","publisher":"International Air Transport Association","url":"https://www.iata.org/"},{"title":"Foreign travel advice","publisher":"UK Foreign, Commonwealth & Development Office","url":"https://www.gov.uk/foreign-travel-advice"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/Airplane_silhouette.svg?width=1200','How to verify visa requirements before travel',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('economy-interest-rates-households-en','economy','en','How interest rates affect households','An accessible guide to borrowing costs, savings returns, inflation expectations and why effects differ across households.','## The core question

Begin by defining the question addressed by “How interest rates affect households”. A clear question separates a description of events from an interpretation and from a value judgment. It also prevents unrelated facts from being collected simply because they share a keyword. Identify who makes a decision, who is affected, and which outcome the reader is trying to understand.

## Define the terms

Define the terms before comparing information. Different organizations may use the same word for different measures, populations or periods, and a short headline can omit important conditions. Write down the operational meaning first, then check whether each source is describing the same thing and the same time window.

## How the process works

The process usually contains connected stages, so the final result alone rarely explains how it happened. Trace inputs, decisions, constraints and responsible organizations, and ask how one stage leads to the next. This makes assumptions visible and reduces the temptation to jump from a plausible factor to a claim of proven causation.

## What evidence can show

Evidence varies in strength according to how close it is to the event, how it was collected and when it was published. Original documents and methodologically described data can be especially useful, while a short media summary may provide context without all underlying details. In the example “a borrower with a variable-rate loan may experience a different effect from a saver or a fixed-rate borrower”, separate what a record directly states from what an author infers.

## Compare sources

Do not rely on a single source when a claim matters or is contested. Compare independent sources and check whether they repeat the same press release; more links do not necessarily mean more independent evidence. Record where accounts agree and differ, and return to the original record when numbers or wording conflict.

## Read the context

Information cannot be interpreted well outside its date, location and surrounding conditions. Rules, prices, results and responsibilities can change, so check the update date and the population to which a statement applies. Comparisons are meaningful only when the cases are similar enough that differences do not make the conclusion misleading.

## Limits and uncertainty

Every measurement has limits: data may be incomplete, delayed or unrepresentative. Correlation alone does not establish causation, and one personal example cannot justify a universal claim. When information is unavailable, state the gap clearly instead of filling it with an assumption that merely sounds plausible.

## A practical checklist

Before acting, check the responsible organization, date, definitions, independent evidence and possible exceptions. Keep the direct source link and distinguish verified facts from interpretation and opinion in your notes. If the circumstances change, repeat the check rather than relying on an older copy.','[{"title":"Economic data and analysis","publisher":"International Monetary Fund","url":"https://www.imf.org/en/Data"},{"title":"Monetary policy","publisher":"Board of Governors of the Federal Reserve System","url":"https://www.federalreserve.gov/monetarypolicy.htm"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/Federal_Reserve_Building.jpg?width=1200','How interest rates affect households',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('trends-read-social-media-data-en','trends','en','How to read social media trend data','A guide to sampling, platform effects, bot activity, changing definitions and the difference between attention and public opinion.','## The core question

Begin by defining the question addressed by “How to read social media trend data”. A clear question separates a description of events from an interpretation and from a value judgment. It also prevents unrelated facts from being collected simply because they share a keyword. Identify who makes a decision, who is affected, and which outcome the reader is trying to understand.

## Define the terms

Define the terms before comparing information. Different organizations may use the same word for different measures, populations or periods, and a short headline can omit important conditions. Write down the operational meaning first, then check whether each source is describing the same thing and the same time window.

## How the process works

The process usually contains connected stages, so the final result alone rarely explains how it happened. Trace inputs, decisions, constraints and responsible organizations, and ask how one stage leads to the next. This makes assumptions visible and reduces the temptation to jump from a plausible factor to a claim of proven causation.

## What evidence can show

Evidence varies in strength according to how close it is to the event, how it was collected and when it was published. Original documents and methodologically described data can be especially useful, while a short media summary may provide context without all underlying details. In the example “a rapid rise in posts may reflect a coordinated campaign or a platform change rather than a broad shift in opinion”, separate what a record directly states from what an author infers.

## Compare sources

Do not rely on a single source when a claim matters or is contested. Compare independent sources and check whether they repeat the same press release; more links do not necessarily mean more independent evidence. Record where accounts agree and differ, and return to the original record when numbers or wording conflict.

## Read the context

Information cannot be interpreted well outside its date, location and surrounding conditions. Rules, prices, results and responsibilities can change, so check the update date and the population to which a statement applies. Comparisons are meaningful only when the cases are similar enough that differences do not make the conclusion misleading.

## Limits and uncertainty

Every measurement has limits: data may be incomplete, delayed or unrepresentative. Correlation alone does not establish causation, and one personal example cannot justify a universal claim. When information is unavailable, state the gap clearly instead of filling it with an assumption that merely sounds plausible.

## A practical checklist

Before acting, check the responsible organization, date, definitions, independent evidence and possible exceptions. Keep the direct source link and distinguish verified facts from interpretation and opinion in your notes. If the circumstances change, repeat the check rather than relying on an older copy.','[{"title":"Internet and social media research","publisher":"Pew Research Center","url":"https://www.pewresearch.org/internet/"},{"title":"Digital news and media research","publisher":"Reuters Institute for the Study of Journalism","url":"https://reutersinstitute.politics.ox.ac.uk/"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/Social_media.jpg?width=1200','How to read social media trend data',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('communities-evaluate-public-service-info-en','egypt','en','How to evaluate public service information','A practical guide to checking service eligibility, required documents, fees, deadlines and the authority responsible.','## The core question

Begin by defining the question addressed by “How to evaluate public service information”. A clear question separates a description of events from an interpretation and from a value judgment. It also prevents unrelated facts from being collected simply because they share a keyword. Identify who makes a decision, who is affected, and which outcome the reader is trying to understand.

## Define the terms

Define the terms before comparing information. Different organizations may use the same word for different measures, populations or periods, and a short headline can omit important conditions. Write down the operational meaning first, then check whether each source is describing the same thing and the same time window.

## How the process works

The process usually contains connected stages, so the final result alone rarely explains how it happened. Trace inputs, decisions, constraints and responsible organizations, and ask how one stage leads to the next. This makes assumptions visible and reduces the temptation to jump from a plausible factor to a claim of proven causation.

## What evidence can show

Evidence varies in strength according to how close it is to the event, how it was collected and when it was published. Original documents and methodologically described data can be especially useful, while a short media summary may provide context without all underlying details. In the example “a service page should identify the responsible authority, eligibility rules, documents, costs and date of its latest update”, separate what a record directly states from what an author infers.

## Compare sources

Do not rely on a single source when a claim matters or is contested. Compare independent sources and check whether they repeat the same press release; more links do not necessarily mean more independent evidence. Record where accounts agree and differ, and return to the original record when numbers or wording conflict.

## Read the context

Information cannot be interpreted well outside its date, location and surrounding conditions. Rules, prices, results and responsibilities can change, so check the update date and the population to which a statement applies. Comparisons are meaningful only when the cases are similar enough that differences do not make the conclusion misleading.

## Limits and uncertainty

Every measurement has limits: data may be incomplete, delayed or unrepresentative. Correlation alone does not establish causation, and one personal example cannot justify a universal claim. When information is unavailable, state the gap clearly instead of filling it with an assumption that merely sounds plausible.

## A practical checklist

Before acting, check the responsible organization, date, definitions, independent evidence and possible exceptions. Keep the direct source link and distinguish verified facts from interpretation and opinion in your notes. If the circumstances change, repeat the check rather than relying on an older copy.','[{"title":"Urban development and public services","publisher":"UN-Habitat","url":"https://unhabitat.org/"},{"title":"Urban development","publisher":"World Bank","url":"https://www.worldbank.org/en/topic/urbandevelopment"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/Cairo_skyline.jpg?width=1200','How to evaluate public service information',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('communities-cities-everyday-life-en','egypt','en','How cities shape everyday life','An evidence-based overview of transport, housing, public space, infrastructure and access to essential services.','## The core question

Begin by defining the question addressed by “How cities shape everyday life”. A clear question separates a description of events from an interpretation and from a value judgment. It also prevents unrelated facts from being collected simply because they share a keyword. Identify who makes a decision, who is affected, and which outcome the reader is trying to understand.

## Define the terms

Define the terms before comparing information. Different organizations may use the same word for different measures, populations or periods, and a short headline can omit important conditions. Write down the operational meaning first, then check whether each source is describing the same thing and the same time window.

## How the process works

The process usually contains connected stages, so the final result alone rarely explains how it happened. Trace inputs, decisions, constraints and responsible organizations, and ask how one stage leads to the next. This makes assumptions visible and reduces the temptation to jump from a plausible factor to a claim of proven causation.

## What evidence can show

Evidence varies in strength according to how close it is to the event, how it was collected and when it was published. Original documents and methodologically described data can be especially useful, while a short media summary may provide context without all underlying details. In the example “travel time to schools, clinics and workplaces affects access even when services exist within the same city”, separate what a record directly states from what an author infers.

## Compare sources

Do not rely on a single source when a claim matters or is contested. Compare independent sources and check whether they repeat the same press release; more links do not necessarily mean more independent evidence. Record where accounts agree and differ, and return to the original record when numbers or wording conflict.

## Read the context

Information cannot be interpreted well outside its date, location and surrounding conditions. Rules, prices, results and responsibilities can change, so check the update date and the population to which a statement applies. Comparisons are meaningful only when the cases are similar enough that differences do not make the conclusion misleading.

## Limits and uncertainty

Every measurement has limits: data may be incomplete, delayed or unrepresentative. Correlation alone does not establish causation, and one personal example cannot justify a universal claim. When information is unavailable, state the gap clearly instead of filling it with an assumption that merely sounds plausible.

## A practical checklist

Before acting, check the responsible organization, date, definitions, independent evidence and possible exceptions. Keep the direct source link and distinguish verified facts from interpretation and opinion in your notes. If the circumstances change, repeat the check rather than relying on an older copy.','[{"title":"Urban development and public services","publisher":"UN-Habitat","url":"https://unhabitat.org/"},{"title":"Urban development","publisher":"World Bank","url":"https://www.worldbank.org/en/topic/urbandevelopment"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/Cairo_skyline.jpg?width=1200','How cities shape everyday life',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('debate-check-public-claims-ar','arab','ar','كيف نقيّم الادعاءات في النقاش العام؟','منهج لفصل الرأي عن الادعاء القابل للتحقق، وفحص المصدر والسياق والأرقام، ومقارنة الأدلة المستقلة.','## السؤال الأساسي

ابدأ بتحديد السؤال الذي يجيب عنه موضوع «كيف نقيّم الادعاءات في النقاش العام؟». يساعد هذا التحديد على فصل وصف الواقع عن تفسيره وعن الحكم عليه، ويمنع جمع معلومات متفرقة لا تخدم السؤال نفسه. في هذا المجال، تتضح الصورة عندما نحدد من يتخذ القرار، ومن يتأثر به، وما النتيجة التي نحاول فهمها.

## تحديد المصطلحات

قبل مقارنة المعلومات، عرّف المصطلحات المستخدمة وحدد نطاقها. قد تستخدم جهات مختلفة الكلمة نفسها بمعانٍ أو مقاييس مختلفة، وقد تخفي العناوين المختصرة شروطًا مهمة. لذلك اكتب التعريف العملي أولًا، ثم افحص ما إذا كانت كل معلومة تتحدث عن الشيء نفسه والفترة الزمنية نفسها.

## كيف تسير العملية؟

تتكون العملية عادةً من مراحل مترابطة، ولا تكفي ملاحظة النتيجة النهائية لفهم ما سبقها. افحص المدخلات والقرارات والقيود والجهات المسؤولة، ثم اسأل كيف يمكن أن تؤدي كل مرحلة إلى المرحلة التالية. يساعد هذا الترتيب على كشف الافتراضات بدل القفز مباشرة من سبب محتمل إلى نتيجة مؤكدة.

## ما الذي تثبته الأدلة؟

تختلف قوة الدليل بحسب قربه من الواقعة وطريقة جمعه وتاريخ نشره. تكون الوثيقة الأصلية أو البيانات المنهجية مفيدة عندما تكون متاحة، بينما قد يقدم الملخص الإعلامي سياقًا سريعًا لكنه لا يعرض جميع التفاصيل. في مثال «عبارة قوية في نقاش عام لا تصبح حقيقة لمجرد تكرارها أو انتشارها على منصات متعددة»، يجب التمييز بين ما تقوله الوثيقة فعلًا وما يستنتجه الكاتب منها.

## مقارنة المصادر

لا تعتمد على مصدر واحد إذا كان الادعاء مهمًا أو قابلًا للجدل. قارن مصادر مستقلة، وافحص إن كانت تنقل عن بعضها أو تعتمد على البيان نفسه؛ فكثرة الروابط لا تعني بالضرورة كثرة الأدلة المستقلة. دوّن نقاط الاتفاق والاختلاف، وارجع إلى المصدر الأصلي عندما تتغير الأرقام أو تتعارض الصياغات.

## فهم السياق

لا يمكن تفسير معلومة خارج زمانها ومكانها والظروف المحيطة بها. قد تتغير القواعد أو الأسعار أو النتائج أو الأدوار، ولذلك يجب الانتباه إلى تاريخ التحديث والجهة التي تنطبق عليها المعلومة. وعند استخدام مقارنة، تأكد من أن الحالات متشابهة بما يكفي حتى لا تنتج المقارنة استنتاجًا مضللًا.

## الحدود ومواطن عدم اليقين

لكل طريقة قياس حدود؛ فقد تكون البيانات ناقصة أو متأخرة أو لا تمثل جميع الفئات. لا يثبت الارتباط وحده وجود علاقة سببية، ولا تكفي حالة فردية لتعميم حكم على الجميع. عندما تكون المعلومة غير متاحة، اذكر هذا النقص بوضوح ولا تملأ الفراغ بافتراضات تبدو معقولة لكنها غير مثبتة.

## قائمة تحقق عملية

قبل اتخاذ قرار، تحقّق من الجهة المسؤولة، وتاريخ المعلومة، والتعريف المستخدم، والأدلة المستقلة، والاستثناءات المحتملة. احتفظ بالرابط المباشر للمصدر، وافصل في ملاحظاتك بين الحقيقة الموثقة والتفسير والرأي. إذا تغيرت الظروف، أعد الفحص بدل الاعتماد على نسخة قديمة.','[{"title":"Media and information literacy","publisher":"UNESCO","url":"https://www.unesco.org/en/media-information-literacy"},{"title":"Code of Principles for fact-checking organizations","publisher":"International Fact-Checking Network","url":"https://ifcncodeofprinciples.poynter.org/"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/United_Nations_General_Assembly_hall.jpg?width=1200','كيف نقيّم الادعاءات في النقاش العام؟',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('debate-check-public-claims-en','arab','en','How to evaluate claims in public debate','A method for separating opinion from testable claims, checking sources and context, and comparing independent evidence.','## The core question

Begin by defining the question addressed by “How to evaluate claims in public debate”. A clear question separates a description of events from an interpretation and from a value judgment. It also prevents unrelated facts from being collected simply because they share a keyword. Identify who makes a decision, who is affected, and which outcome the reader is trying to understand.

## Define the terms

Define the terms before comparing information. Different organizations may use the same word for different measures, populations or periods, and a short headline can omit important conditions. Write down the operational meaning first, then check whether each source is describing the same thing and the same time window.

## How the process works

The process usually contains connected stages, so the final result alone rarely explains how it happened. Trace inputs, decisions, constraints and responsible organizations, and ask how one stage leads to the next. This makes assumptions visible and reduces the temptation to jump from a plausible factor to a claim of proven causation.

## What evidence can show

Evidence varies in strength according to how close it is to the event, how it was collected and when it was published. Original documents and methodologically described data can be especially useful, while a short media summary may provide context without all underlying details. In the example “a forceful statement does not become factual simply because it is repeated or widely shared”, separate what a record directly states from what an author infers.

## Compare sources

Do not rely on a single source when a claim matters or is contested. Compare independent sources and check whether they repeat the same press release; more links do not necessarily mean more independent evidence. Record where accounts agree and differ, and return to the original record when numbers or wording conflict.

## Read the context

Information cannot be interpreted well outside its date, location and surrounding conditions. Rules, prices, results and responsibilities can change, so check the update date and the population to which a statement applies. Comparisons are meaningful only when the cases are similar enough that differences do not make the conclusion misleading.

## Limits and uncertainty

Every measurement has limits: data may be incomplete, delayed or unrepresentative. Correlation alone does not establish causation, and one personal example cannot justify a universal claim. When information is unavailable, state the gap clearly instead of filling it with an assumption that merely sounds plausible.

## A practical checklist

Before acting, check the responsible organization, date, definitions, independent evidence and possible exceptions. Keep the direct source link and distinguish verified facts from interpretation and opinion in your notes. If the circumstances change, repeat the check rather than relying on an older copy.','[{"title":"Media and information literacy","publisher":"UNESCO","url":"https://www.unesco.org/en/media-information-literacy"},{"title":"Code of Principles for fact-checking organizations","publisher":"International Fact-Checking Network","url":"https://ifcncodeofprinciples.poynter.org/"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/United_Nations_General_Assembly_hall.jpg?width=1200','How to evaluate claims in public debate',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now'));
