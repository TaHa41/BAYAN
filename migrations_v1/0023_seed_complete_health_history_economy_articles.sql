-- Curated, full-length bilingual health, history and economy articles for sections that had sparse reliable discovery.
-- Every row has structured sections, independent sources and a topic-matched image.
INSERT OR IGNORE INTO articles
(slug,section,language,title,summary,body,sources_json,status,image_url,image_alt,created_at,updated_at)
VALUES
('health-evaluate-health-information-ar','health','ar','كيف نقيّم المعلومات الصحية قبل الاعتماد عليها؟','خطوات عملية لفحص مصدر المعلومة الصحية وجودة الدليل وحدود التوصيات، من دون تحويل المقال العام إلى تشخيص أو علاج شخصي.','## الفكرة الأساسية
تصل المعلومات الصحية عبر مواقع الأخبار والمنصات الاجتماعية ومقاطع الفيديو والإعلانات، لكن سهولة الوصول لا تعني أن المعلومة دقيقة أو مناسبة لكل شخص. وقد تكون المعلومة صحيحة في سياق محدد ثم تُعرض خارج سياقها، أو تستند إلى دراسة أولية لا تكفي وحدها لإثبات النتيجة. لذلك يبدأ التقييم بالسؤال عن المصدر والدليل والسياق، لا بعدد المشاركات أو قوة العنوان.

## من يقف وراء المعلومة؟
ابحث عن اسم المؤسسة أو الكاتب وخبرته وصلته بالموضوع، وتحقق من تاريخ النشر والتحديث. تشرح الجهات الصحية العامة عادةً طريقة الوصول إلى توصياتها، بينما قد تخفي الإعلانات الجهة المستفيدة من بيع منتج. لا يعني الانتماء إلى مؤسسة معروفة أن كل صفحة صحيحة تلقائيًا، لكنه يتيح الرجوع إلى سياسة التحرير والمراجع وتصحيح الأخطاء.

## افحص الدليل الأصلي
ينبغي أن تقود المعلومة المهمة إلى دراسة أو مراجعة علمية أو إرشاد صحي واضح. اقرأ ما الذي قاسه البحث فعلًا، ومن شملهم، وما حجم العينة، وهل كانت النتيجة مرتبطة بمؤشر بديل أم بنتيجة صحية مهمة للناس. لا تثبت دراسة واحدة وحدها أن علاجًا ما يناسب الجميع، ولا يكفي عنوان صحفي لمعرفة حدود البحث أو مقدار عدم اليقين.

## ميّز بين الارتباط والسببية
قد يظهر ارتباط بين عاملين من دون أن يكون أحدهما سببًا للآخر؛ فقد تؤثر عوامل ثالثة في النتيجة أو تكون العينة مختلفة عن المجتمع الذي يراد تعميم النتائج عليه. كما أن النتائج التي تظهر في المختبر لا تتحول تلقائيًا إلى توصية علاجية. ابحث عن تكرار النتائج في دراسات مستقلة وعن مراجعات تجمع الأدلة وتناقش نقاط الضعف.

## انتبه إلى اللغة والمصلحة التجارية
تستحق العبارات المطلقة مثل «علاج مضمون» أو «نتيجة فورية» أو «السر الذي يخفيه الأطباء» حذرًا خاصًا. لا تجعل شهادة شخص واحد بديلًا عن الدليل، ولا تفترض أن المنتج طبيعي يعني أنه آمن للجميع. راجع تضارب المصالح، وميّز بين إعلان مدفوع وإرشاد صحي مستقل، وتأكد من أن الأرقام لا تُعرض من دون مقام أو مقارنة مفهومة.

## متى تحتاج إلى مختص؟
المعلومات العامة تساعد على طرح أسئلة أفضل، لكنها لا تستبدل تقييم الحالة الفردية أو التشخيص أو مراجعة الأدوية. إذا تعارضت المعلومات مع توجيه طبي تلقيته، فناقش الأمر مع مختص مؤهل بدل إيقاف العلاج أو تغييره بناءً على منشور. وفي الحالات العاجلة، لا تؤخر طلب المساعدة بسبب البحث على الإنترنت.

## خلاصة عملية
قبل مشاركة معلومة صحية، تحقق من الناشر والتاريخ والمراجع، ثم قارنها بمصدر صحي مستقل آخر. اقرأ ما تقوله الدراسة وما لا تقوله، ولا تحول احتمالًا إلى حقيقة مؤكدة. إذا تعذر العثور على دليل واضح، فالأدق وصف المعلومة بأنها غير محسومة بدل تقديمها كنصيحة مؤكدة.

## المصادر وحدودها
تقدم منظمة الصحة العالمية معلومات عامة عن موضوعات الصحة، وتوفر ميدلاين بلس مواد تثقيفية للمستهلكين. تساعد هذه المراجع على بدء التحقق، لكنها لا تجعل كل ادعاء متداول صحيحًا تلقائيًا؛ ينبغي الرجوع إلى الدراسة أو الإرشاد المحدد كلما أمكن.','[{"title":"Health topics","publisher":"World Health Organization","url":"https://www.who.int/health-topics"},{"title":"Health Information","publisher":"MedlinePlus","url":"https://medlineplus.gov/"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/Stethoscope%2C%20Laennac%20type.%20Wellcome%20M0003245.jpg?width=1200','سماعة طبية تاريخية',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('health-evidence-based-medicine-ar','health','ar','ما المقصود بالطب المبني على الدليل؟','شرح لكيفية الجمع بين نتائج الأبحاث والخبرة السريرية واحتياجات المريض، مع فهم قوة الأدلة وحدودها.','## تعريف مختصر
الطب المبني على الدليل هو استخدام أفضل الأدلة البحثية المتاحة إلى جانب الخبرة المهنية وظروف المريض وقيمه عند اتخاذ القرار الصحي. لا يعني ذلك أن رقمًا واحدًا أو دراسة منفردة تحسم كل حالة، بل أن القرار يوضح أساسه وما يزال غير مؤكد، ويُراجع عندما تظهر أدلة أفضل.

## ليست كل الدراسات بالقوة نفسها
تختلف الدراسات في تصميمها وقدرتها على الإجابة عن السؤال. قد تساعد التجارب العشوائية على مقارنة تدخلات محددة، بينما تكشف الدراسات الرصدية عن أنماط وارتباطات في الحياة الواقعية. وتجمع المراجعات المنهجية نتائج دراسات متعددة وفق معايير معلنة، لكنها تظل محدودة بجودة الدراسات التي شملتها ومدى تشابهها.

## كيف تُقرأ النتيجة؟
ينبغي النظر إلى حجم الأثر لا إلى وجود فرق إحصائي فقط. اسأل عن عدد المشاركين، والمدة، والنتيجة التي قِيست، والفواصل التي تعبّر عن عدم اليقين، والآثار غير المرغوبة. وقد يبدو انخفاض نسبي كبير لافتًا بينما يكون الفرق المطلق صغيرًا؛ لذلك تحتاج الأرقام إلى سياق مفهوم قبل تحويلها إلى رسالة عامة.

## الإرشادات ليست وصفة موحدة
تراجع الهيئات المهنية الأدلة لتطوير إرشادات تساعد المختصين، لكن التوصية قد تختلف بحسب العمر والأمراض المصاحبة والأدوية والتفضيلات وتوفر الخدمة. لا يجوز نقل توصية مخصصة لفئة بحثية إلى كل الناس من دون فحص شروطها. كما أن الإرشادات قد تتغير حين تتراكم أدلة جديدة أو تتضح مخاطر لم تكن معروفة.

## القرار المشترك
يشرح المختص الخيارات المتاحة والفوائد المتوقعة والمخاطر والبدائل وما لا نعرفه، ويستطيع المريض طرح الأسئلة ومناقشة ما يناسب ظروفه. هذا لا يعني أن كل الخيارات متساوية في الدليل، بل أن المعرفة العلمية تُستخدم بشفافية ضمن قرار مسؤول يراعي الحالة الفردية.

## تضارب المصالح وقابلية التكرار
قد يؤثر التمويل أو انتقاء النتائج أو عدم نشر الدراسات السلبية في صورة الأدلة المتاحة. لذلك تهم مراجعة مصادر التمويل، وتسجيل الدراسات، وتكرار النتائج من فرق مستقلة. ولا ينبغي اعتبار غياب الدليل دليلًا قاطعًا على انعدام الأثر، كما لا يجوز تقديم عدم اليقين على أنه إثبات للفعالية.

## خلاصة عملية
ابحث عن مراجعات منهجية وإرشادات محدثة، واقرأ نوع الدراسة والنتيجة التي قاستها، ثم اسأل كيف تنطبق على الشخص المعني. الطب المبني على الدليل ليس وعدًا باليقين الكامل؛ إنه طريقة منظمة لتقليل التخمين ومراجعة القرارات كلما تحسنت المعرفة.

## المصادر وحدودها
تتيح كوكرين مراجعات للأدلة الصحية، وتنشر هيئة نيس إرشادات وتقييمات للممارسات الصحية. تختلف نطاقات هذه المصادر وموضوعاتها، لذا يجب الرجوع إلى الوثيقة المحددة وتاريخ تحديثها بدل الاكتفاء بعنوان عام.','[{"title":"Cochrane Evidence","publisher":"Cochrane","url":"https://www.cochrane.org/evidence"},{"title":"Guidance","publisher":"National Institute for Health and Care Excellence","url":"https://www.nice.org.uk/guidance"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/Equipment_-_Stethoscope_--_Smart-Servier.png?width=1200','رسم توضيحي لسماعة طبية',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('history-primary-sources-ar','history','ar','كيف يستخدم المؤرخون المصادر الأولية؟','طريقة لفهم الوثائق والشهادات والصور بوصفها أدلة تحتاج إلى فحص المنشأ والسياق والمقارنة، لا حقائق مكتملة بذاتها.','## ما المصدر الأولي؟
المصدر الأولي مادة أُنتجت في زمن الحدث أو على صلة مباشرة به، مثل رسالة أو سجل إداري أو صورة أو خريطة أو شهادة. وتختلف قيمة المصدر باختلاف السؤال التاريخي؛ فالرسالة قد تكشف ما أراد صاحبها قوله، لكنها لا تثبت وحدها أن كل ما ورد فيها حدث كما وصفه. أما الدراسة اللاحقة التي تحلل عدة مصادر فهي مصدر ثانوي بالنسبة إلى الحدث الذي تدرسه.

## افحص المنشأ
ابدأ بمعرفة من أنشأ الوثيقة، ومتى وأين أُنتجت، ولمن وُجهت، ولماذا حُفظت. قد تكون النسخة المتاحة لاحقة للأصل أو مختصرة أو مترجمة، وقد تكون الصورة مقصوصة من إطار أوسع. يساعد فحص الفهرس والجهة الحافظة وسجل النسخ في معرفة ما إذا كان المصدر أصليًا أو نسخة أو وصفًا لاحقًا.

## اقرأ السياق قبل الاقتباس
لا يكفي اقتطاع جملة لشرح موقف تاريخي. ينبغي معرفة ما سبق الوثيقة وما تلاها، والظروف السياسية والاجتماعية والاقتصادية التي أحاطت بها. وقد تستخدم الكلمات نفسها بمعانٍ مختلفة عبر العصور، لذلك يحتاج تفسيرها إلى مقارنة بمصادر من الفترة ذاتها وبالدراسات المتخصصة.

## اسأل عن وجهة النظر والصمت
لكل مصدر زاوية وحدود. قد يعكس السجل الرسمي منظور المؤسسة التي كتبته، وقد لا تظهر فيه تجارب الفئات التي لم يكن لها وصول إلى الكتابة أو الأرشفة. غياب اسم أو صوت من الوثيقة لا يثبت أنه لم يكن موجودًا؛ فقد يكون نتيجة الانتقاء أو فقدان السجلات أو طريقة الحفظ.

## قارن مصادر مستقلة
تزداد الثقة عندما تتفق مواد مستقلة في نقاط أساسية، مع الانتباه إلى احتمال أن يكون مصدران قد نقلا عن أصل واحد. قارن الوثائق بالصور والخرائط والسجلات المادية والدراسات الحديثة، وسجل مواضع الاتفاق والاختلاف بدل إخفائها. إذا تعارضت الأدلة، فاشرح أسباب التعارض وحدود ما يمكن استنتاجه.

## كيف نعرض النتيجة؟
ينبغي التمييز بين ما تقوله الوثيقة حرفيًا وما يستنتجه الباحث منها. انسب الاقتباس إلى مصدره، واذكر التاريخ والجهة الحافظة حيث تتوفر البيانات، ولا تملأ الفجوات بتفاصيل متخيلة. وقد يكون الاستنتاج الأكثر دقة هو أن الأدلة الحالية لا تحسم سؤالًا بعينه.

## المصادر وحدودها
تقدم مكتبة الكونغرس ومصلحة الأرشيف والسجلات الوطنية الأمريكية مواد تعليمية حول تحليل المصادر الأولية. تشرح هذه الموارد منهجًا عامًا، لكنها لا تحل محل فحص الوثيقة الأصلية أو معرفة سياقها المحلي واللغوي.','[{"title":"Primary Source Sets","publisher":"Library of Congress","url":"https://www.loc.gov/classroom-materials/primary-source-sets/"},{"title":"Education","publisher":"National Archives","url":"https://www.archives.gov/education"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/Thucydides_Manuscript.jpg?width=1200','مخطوطة تاريخية قديمة',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('history-context-and-causation-ar','history','ar','لماذا يغيّر السياق فهم الأحداث التاريخية؟','شرح لدور التسلسل الزمني والظروف المحيطة وتعدد الأسباب في تفسير الأحداث من دون اختزالها في سبب واحد.','## الحدث لا يفسر نفسه
قد يصف التاريخ حدثًا في تاريخ محدد، لكن فهمه يتطلب معرفة الظروف التي سبقته والقرارات التي تلتْه. فالتاريخ ليس قائمة تواريخ منفصلة؛ إنه محاولة لفهم التغير والاستمرار والعلاقات بين المؤسسات والأفراد والاقتصاد والأفكار. ولا يعني وضع الحدث في سياقه تبريره، بل يساعد على تفسير ما جعل بعض الخيارات ممكنة أو مرجحة في زمن معين.

## ابنِ تسلسلًا زمنيًا
يساعد ترتيب الأحداث على تمييز ما وقع قبل السبب المفترض وما جاء بعده. لكن التتابع وحده لا يثبت السببية؛ فقد يتزامن حدثان من دون علاقة مباشرة. ينبغي مقارنة أكثر من تسلسل زمني، والانتباه إلى الفترات التي لا تتوفر عنها سجلات كافية، وإلى اختلاف التقويمات أو طرق تأريخ الوثائق.

## ابحث عن أسباب متعددة
غالبًا ما تنتج التحولات الكبيرة عن تفاعل عوامل طويلة الأمد مع أحداث قريبة وقرارات بشرية. قد تؤثر الظروف الاقتصادية أو البيئة أو المؤسسات أو الصراعات أو الأفكار، لكن وزن كل عامل يختلف من حالة إلى أخرى. تفسير الحدث بسبب واحد قد يكون جذابًا وسهل التذكر، لكنه يخفي التعقيد ويجعل الاستنتاج أقل دقة.

## قارن وجهات النظر
تختلف الروايات بحسب موقع الكاتب والجهة التي حفظت المصدر والجمهور المقصود. لذلك ينبغي مقارنة روايات المشاركين والجهات الرسمية والمراقبين والباحثين اللاحقين، مع عدم افتراض أن كثرة الروايات تعني استقلالها. إذا تكررت عبارة واحدة في عدة كتب فقد يكون مصدرها رواية واحدة انتقلت بينها.

## تجنب إسقاط الحاضر على الماضي
تتغير معاني المفاهيم والقوانين والأدوار الاجتماعية عبر الزمن. لا يصح افتراض أن الناس في الماضي امتلكوا المعلومات أو الخيارات نفسها المتاحة اليوم، كما لا ينبغي استخدام اختلاف السياق لإعفاء الأفعال من الفحص الأخلاقي. الأفضل توضيح المعايير والقيود التي كانت قائمة آنذاك ثم فصل الوصف التاريخي عن الحكم المعاصر.

## ما الذي يجعل التفسير قويًا؟
التفسير الجيد يوضح الأدلة التي يستند إليها، ويذكر الأدلة المخالفة، ويفصل بين الحقيقة والاستنتاج. كما يشرح ما الذي يمكن أن يغير الرأي، مثل العثور على وثيقة جديدة أو إعادة تقييم مصدر معروف. اليقين المطلق نادر في كثير من الأسئلة التاريخية، لكن المقارنة المنهجية تجعل بعض التفسيرات أقوى من غيرها.

## المصادر وحدودها
تشرح الموسوعة البريطانية مناهج البحث التاريخي، وتتيح مكتبة الكونغرس مجموعات من الوثائق الأصلية. تساعد هذه المراجع على فهم المنهج والسياق، لكن تطبيقه يتطلب الرجوع إلى المصادر المتعلقة بالحدث المحدد لا تعميم مثال واحد على كل التاريخ.','[{"title":"Historical Method","publisher":"Encyclopaedia Britannica","url":"https://www.britannica.com/topic/historical-method"},{"title":"Primary Source Sets","publisher":"Library of Congress","url":"https://www.loc.gov/classroom-materials/primary-source-sets/"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/Polybius_Histories_Papyrus.jpg?width=1200','بردية تاريخية قديمة',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('economy-inflation-purchasing-power-ar','economy','ar','كيف يؤثر التضخم في القوة الشرائية؟','شرح للعلاقة بين ارتفاع المستوى العام للأسعار والدخل والإنفاق، وكيف تُقرأ مؤشرات التضخم وحدود المقارنات بين الأسر.','## ما التضخم؟
التضخم هو ارتفاع مستمر في المستوى العام لأسعار السلع والخدمات خلال فترة، وليس مجرد ارتفاع سعر سلعة واحدة. قد ترتفع أسعار منتج بسبب نقص مؤقت أو تغير موسمي من دون أن يعني ذلك وحده أن الاقتصاد كله يمر بالمعدل نفسه من التضخم. لذلك تعتمد المقارنة على سلة من الأسعار ومؤشر محدد وفترة زمنية معلومة.

## القوة الشرائية والدخل
إذا ارتفعت الأسعار أسرع من دخل الأسرة، فإن المبلغ نفسه يشتري كمية أقل من السلع والخدمات. لكن أثر التضخم يختلف باختلاف نمط الإنفاق؛ فالأسر التي تنفق نسبة كبيرة على الغذاء أو النقل قد تشعر بارتفاع مختلف عن أسرة تنفق أكثر على خدمات أخرى. ولهذا لا تعكس نسبة عامة كل تجربة فردية بالتساوي.

## كيف يُحسب المؤشر؟
تجمع الجهات الإحصائية أسعار سلة محددة وتتابع تغيرها وفق منهج معلن. وتؤثر أوزان المكونات في النتيجة، لأن السلع والخدمات لا تحتل الحصة نفسها من إنفاق كل أسرة. ينبغي عند قراءة الرقم معرفة تاريخ المقارنة وما إذا كان التغير سنويًا أو شهريًا، وما إذا كان المؤشر عامًا أو يستثني مكونات معينة.

## الأسباب ليست واحدة
قد يرتبط التضخم بارتفاع الطلب، أو زيادة تكاليف الإنتاج والطاقة والنقل، أو تغير سعر الصرف، أو اضطراب سلاسل الإمداد، أو مزيج من هذه العوامل. ويختلف وزن كل عامل بحسب البلد والفترة. لذلك لا يكفي مؤشر واحد لإثبات السبب، وتحتاج التفسيرات إلى مقارنة بيانات الأسعار والإنتاج والأجور والسياسة النقدية والتجارة.

## كيف تقارن الأسعار والأجور؟
ينبغي مقارنة نمو الأجور بنمو الأسعار خلال الفترة نفسها، مع التمييز بين الأجر الاسمي وما يمكن شراؤه به. كما أن المتوسط قد يخفي اختلافات كبيرة بين القطاعات والمناطق والأسر. وعند مقارنة بلدين، يجب الانتباه إلى اختلاف السلال الإحصائية والعملات والضرائب وأنماط الإنفاق.

## ما الذي لا يخبرنا به الرقم وحده؟
لا يحدد التضخم وحده ما إذا كانت أسرة بعينها أصبحت أفقر، ولا يشرح كل تغير في الأسعار، ولا يضمن اتجاه الأسعار في المستقبل. تساعد البيانات في وصف الاتجاه، لكن تفسير الأسباب والتنبؤ يتطلب أدلة إضافية وافتراضات واضحة. من الأفضل ذكر المؤشر والفترة والمصدر بدل استخدام الرقم خارج سياقه.

## خلاصة عملية
عند قراءة خبر اقتصادي، تحقق من تعريف المؤشر والفترة والسلة، وقارن الأسعار بالدخل وبمصادر مستقلة. افصل بين الملاحظة والتفسير والتوقع، ولا تعمم تجربة سلعة أو أسرة على الاقتصاد كله.

## المصادر وحدودها
ينشر صندوق النقد الدولي مواد عن التضخم والسياسات الاقتصادية، ويوفر البنك الدولي قواعد بيانات وتحليلات للمؤشرات الاقتصادية. ينبغي الرجوع إلى بيانات البلد والفترة المحددين، لأن المتوسطات العالمية لا تصف بالضرورة ظروف كل سوق.','[{"title":"Inflation","publisher":"International Monetary Fund","url":"https://www.imf.org/en/Topics/inflation"},{"title":"Inflation Database","publisher":"World Bank","url":"https://www.worldbank.org/en/research/brief/inflation-database"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/US_Consumer_Price_Index_Graph.svg?width=1200','رسم بياني لمؤشر أسعار المستهلك',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('health-evaluate-health-information-en','health','en','How to evaluate health information','A practical method for checking the publisher, evidence quality and limits of health claims without turning general information into personal diagnosis or treatment.','## The core idea
Health information reaches people through news sites, social platforms, videos and advertising, but easy access does not guarantee accuracy or suitability for every person. A claim may be true in a narrow context and misleading when removed from that context, or it may rely on an early study that cannot establish the conclusion on its own. Evaluation starts with the source, evidence and scope, not with a headline or number of shares.

## Who produced the information?
Look for the organization or author, relevant expertise, publication date and update history. Public health organizations often explain how recommendations are developed, while commercial advertising may hide the financial interest behind a product. A recognizable institution is not an automatic guarantee that every page is correct, but it gives readers a way to check editorial standards, references and corrections.

## Inspect the underlying evidence
Important claims should point to a study, systematic review or clear health guideline. Ask what the research actually measured, who participated, how large the sample was, and whether the outcome was a meaningful health result or only a proxy measure. One study rarely proves that a treatment works for everyone, and a news headline cannot substitute for the study limitations or uncertainty.

## Separate association from causation
Two factors may occur together without one causing the other. A third factor may affect the result, or the sample may differ from the population to which the claim is applied. Laboratory findings also do not automatically become treatment recommendations. Look for results repeated in independent studies and for reviews that compare evidence and discuss weaknesses.

## Notice language and commercial interests
Absolute phrases such as “guaranteed cure,” “instant result” or “the secret doctors hide” deserve special caution. One person’s story is not a substitute for evidence, and a natural product is not automatically safe for everyone. Check conflicts of interest, distinguish advertising from independent guidance, and make sure statistics are not presented without a denominator or understandable comparison.

## When to consult a professional
General information can help people ask better questions, but it cannot replace an individual assessment, diagnosis or medication review. If online information conflicts with advice you received, discuss it with a qualified professional instead of stopping or changing treatment based on a post. In an urgent situation, do not delay seeking help while browsing the internet.

## A practical checklist
Before sharing a health claim, verify the publisher, date and references, then compare it with another independent health source. Read what the study says and what it does not say, and do not turn a possibility into a confirmed fact. If clear evidence is unavailable, describing the claim as uncertain is more accurate than presenting it as established advice.

## Sources and limitations
The World Health Organization provides general information on health topics, and MedlinePlus offers consumer health information. These references are useful starting points, but they do not automatically validate every circulating claim; consult the specific study or guideline whenever possible.','[{"title":"Health topics","publisher":"World Health Organization","url":"https://www.who.int/health-topics"},{"title":"Health Information","publisher":"MedlinePlus","url":"https://medlineplus.gov/"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/Stethoscope%2C%20Laennac%20type.%20Wellcome%20M0003245.jpg?width=1200','A historical medical stethoscope',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('health-evidence-based-medicine-en','health','en','What evidence-based medicine means','How research findings, clinical expertise and patient circumstances are combined, with attention to evidence strength and uncertainty.','## A concise definition
Evidence-based medicine uses the best available research together with professional expertise and a patient’s circumstances and values when making health decisions. It does not mean that one number or a single study settles every case. Instead, it makes the basis of a decision and its uncertainties explicit, and revises the decision when better evidence appears.

## Studies have different strengths
Research designs answer different questions and have different limitations. Randomized trials can compare defined interventions, while observational studies reveal patterns and associations in real-world settings. Systematic reviews combine studies using stated methods, but their conclusions remain limited by the quality and comparability of the research they include.

## Read the result, not only the headline
Consider the size of an effect, not merely whether a statistical difference was detected. Ask about the number of participants, follow-up period, outcome measured, uncertainty intervals and unwanted effects. A large relative reduction can sound impressive while the absolute difference is small, so figures need context before they are turned into general messages.

## Guidelines are not one-size-fits-all prescriptions
Professional bodies review evidence to produce guidance, but recommendations can depend on age, other conditions, medications, preferences and access to care. A recommendation for a research population should not automatically be applied to everyone. Guidance may also change as evidence accumulates or risks become clearer.

## Shared decisions
A qualified professional can explain options, expected benefits, risks, alternatives and remaining uncertainty. The patient can ask questions and discuss what fits their circumstances. This does not mean all options have equal evidence; it means scientific knowledge is used transparently within a responsible decision that considers the individual case.

## Conflicts of interest and replication
Funding, selective reporting and missing negative studies can distort the available evidence. Researchers therefore examine funding, study registration and whether independent teams reproduce findings. A lack of evidence is not conclusive proof that an effect does not exist, but uncertainty should never be presented as proof of effectiveness.

## A practical approach
Look for systematic reviews and current guidelines, read the study design and outcome, then ask how it applies to the person concerned. Evidence-based medicine is not a promise of complete certainty; it is a structured way to reduce guesswork and revisit decisions as knowledge improves.

## Sources and limitations
Cochrane provides reviews of health evidence, while NICE publishes guidance and assessments for health practice. Their scopes differ, so consult the specific document and its update date rather than relying on a general heading.','[{"title":"Cochrane Evidence","publisher":"Cochrane","url":"https://www.cochrane.org/evidence"},{"title":"Guidance","publisher":"National Institute for Health and Care Excellence","url":"https://www.nice.org.uk/guidance"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/Equipment_-_Stethoscope_--_Smart-Servier.png?width=1200','A medical stethoscope illustration',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('history-primary-sources-en','history','en','How historians use primary sources','How to assess documents, testimony and images as evidence by checking provenance, context and corroboration rather than treating them as complete facts.','## What is a primary source?
A primary source was created during a period or has a direct connection to the event being studied, such as a letter, administrative record, photograph, map or testimony. Its value depends on the historical question. A letter can show what its author wanted to say, but it cannot by itself prove that every statement describes events exactly as they happened. Later research that analyzes many sources is secondary for the event it studies.

## Check provenance
Start by asking who created the item, when and where it was produced, for whom it was intended and why it was preserved. The available version may be a later copy, an edited extract or a translation; a photograph may have been cropped from a wider scene. Catalog records, archive descriptions and version histories help distinguish an original from a copy or later description.

## Read the context before quoting
A sentence taken out of context rarely explains a historical position. Learn what happened before and after the document and the political, social and economic conditions around it. Words can carry different meanings across periods, so interpretation benefits from comparison with contemporary sources and specialist scholarship.

## Ask about perspective and silence
Every source has a point of view and limits. An official record may reflect the institution that produced it, and archives may underrepresent people who had less access to writing or formal record keeping. The absence of a name or voice from a document does not prove that the person or group did not exist; it may reflect selection, loss or preservation practices.

## Corroborate independent sources
Confidence grows when independent materials agree on key points, while researchers must check whether apparently separate accounts copied the same original. Compare documents with photographs, maps, material evidence and later studies. Record both agreement and disagreement instead of hiding conflict. When evidence differs, explain the possible reasons and the limits of the conclusion.

## Present findings responsibly
Separate what a document says directly from what a researcher infers. Attribute quotations, record dates and archival references when available, and do not fill gaps with imagined details. Sometimes the most accurate conclusion is that the available evidence cannot settle a particular question.

## Sources and limitations
The Library of Congress and the US National Archives provide educational materials on analyzing primary sources. These resources explain a general method, but they do not replace examination of the original item or knowledge of its local and linguistic context.','[{"title":"Primary Source Sets","publisher":"Library of Congress","url":"https://www.loc.gov/classroom-materials/primary-source-sets/"},{"title":"Education","publisher":"National Archives","url":"https://www.archives.gov/education"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/Thucydides_Manuscript.jpg?width=1200','An ancient historical manuscript',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('history-context-and-causation-en','history','en','Why context matters in historical interpretation','How chronology, surrounding conditions and multiple causes help explain events without reducing them to a single explanation.','## Events do not explain themselves
History can name an event and its date, but understanding it requires attention to the conditions that came before and decisions that followed. History is not simply a list of dates; it studies change, continuity and relationships among institutions, individuals, economies and ideas. Context does not excuse an action. It helps explain which choices were possible or likely in a particular time.

## Build a chronology
Ordering events helps distinguish what happened before a proposed cause from what followed it. Sequence alone, however, does not prove causation; two events may coincide without a direct relationship. Compare timelines, note periods with few surviving records, and account for differences in calendars or dating practices.

## Look for multiple causes
Major changes often result from the interaction of long-term conditions with immediate events and human decisions. Economic circumstances, environment, institutions, conflict and ideas may all matter, but their relative importance varies by case. A single-cause explanation may be easy to remember, yet it can hide complexity and weaken the conclusion.

## Compare perspectives
Accounts differ according to the author’s position, the institution that preserved the source and the intended audience. Compare participants, official bodies, observers and later researchers without assuming that multiple accounts are independent. If several books repeat the same phrase, they may all derive from one original account.

## Avoid projecting the present onto the past
Concepts, laws and social roles change over time. People in the past did not necessarily have the information or choices available today. At the same time, historical context should not prevent careful ethical examination. Explain the standards and constraints of the period, then distinguish historical description from present-day judgment.

## What makes an interpretation strong?
A strong interpretation identifies its evidence, acknowledges contrary material and separates fact from inference. It also explains what could change the conclusion, such as a newly discovered document or a reassessment of a known source. Absolute certainty is rare in many historical questions, but methodical comparison can make some explanations stronger than others.

## Sources and limitations
Encyclopaedia Britannica explains historical method, while the Library of Congress provides collections of primary documents. These resources help readers understand context and method, but a specific historical claim still requires sources relevant to that event rather than generalizing from one example.','[{"title":"Historical Method","publisher":"Encyclopaedia Britannica","url":"https://www.britannica.com/topic/historical-method"},{"title":"Primary Source Sets","publisher":"Library of Congress","url":"https://www.loc.gov/classroom-materials/primary-source-sets/"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/Polybius_Histories_Papyrus.jpg?width=1200','An ancient papyrus manuscript',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('economy-inflation-purchasing-power-en','economy','en','How inflation affects purchasing power','How rising overall prices interact with income and household spending, and how to interpret inflation measures and their limits.','## What is inflation?
Inflation is a sustained increase in the general price level of goods and services over time, not merely a rise in the price of one item. A product may become more expensive because of a temporary shortage or seasonal change without that alone proving that the entire economy has the same inflation rate. Comparisons therefore rely on a defined basket of prices, a particular index and a stated period.

## Purchasing power and income
If prices rise faster than a household’s income, the same amount of money buys fewer goods and services. The effect differs with spending patterns: households that devote a large share of their budget to food or transport may experience a different change from households that spend more on other services. A national average does not describe every household equally.

## How is an index measured?
Statistical agencies track the prices of a defined basket and calculate changes using a published method. The weights matter because goods and services do not take the same share of every household budget. When reading a figure, check the comparison period and whether the rate is monthly or annual, headline or a narrower measure.

## Causes vary by period
Inflation can be associated with strong demand, higher production and energy costs, exchange-rate changes, supply-chain disruption or a combination of factors. Their relative importance differs by country and period. One index alone cannot prove the cause; interpretation requires comparison with data on prices, output, wages, monetary policy and trade.

## Compare prices and wages carefully
Compare wage growth with price growth over the same period, distinguishing nominal pay from what it can buy. An average may conceal substantial differences across sectors, regions and households. Comparing countries also requires attention to basket definitions, currencies, taxes and spending patterns.

## What the number cannot tell us
Inflation alone does not determine whether a particular household became poorer, explain every price change or guarantee the future direction of prices. Data can describe a trend, while explanations and forecasts require additional evidence and explicit assumptions. State the index, period and source rather than using a figure without context.

## A practical checklist
When reading an economic claim, check the index definition, period and basket, and compare prices with income and independent sources. Separate observations from explanations and forecasts; do not generalize from one product or household to the whole economy.

## Sources and limitations
The International Monetary Fund publishes material on inflation and economic policy, while the World Bank provides economic data and analysis. Consult the data for the specific country and period because global averages do not necessarily describe local conditions.','[{"title":"Inflation","publisher":"International Monetary Fund","url":"https://www.imf.org/en/Topics/inflation"},{"title":"Inflation Database","publisher":"World Bank","url":"https://www.worldbank.org/en/research/brief/inflation-database"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/US_Consumer_Price_Index_Graph.svg?width=1200','A consumer price index graph',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now'));
