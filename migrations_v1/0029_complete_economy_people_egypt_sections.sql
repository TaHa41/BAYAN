-- Fill the remaining complete-article coverage gaps with distinct, source-backed evergreen articles.
INSERT OR IGNORE INTO articles
(slug,section,language,title,summary,body,sources_json,status,image_url,image_alt,created_at,updated_at)
VALUES
('economy-trade-balance-current-account-en','economy','en','How to read a trade balance and current account','A source-based guide to exports, imports, income flows and the limits of using one external-balance number to judge an economy.','## What the trade balance measures

A trade balance compares the value of goods and services sold to the rest of the world with the value bought from it over a defined period. Exports minus imports gives the balance: a positive result is a surplus and a negative result is a deficit. The number describes a particular set of transactions; by itself it does not tell whether households are better off, whether firms are productive or whether public finances are sustainable.

## How the current account differs

The current account is broader than the trade balance. It also includes net income from cross-border investments and compensation, as well as transfers such as remittances and some forms of assistance. The International Monetary Fund explains that these components help show how goods, services and income move between a country and the rest of the world. Readers should check which measure a chart reports before comparing it with another chart.

## Why a deficit is not a verdict

A deficit is not automatically proof of economic failure, just as a surplus is not automatically proof of success. Imports may include machinery, medicine or equipment that supports future production, while a surplus may reflect weak domestic demand as well as strong exports. The meaning depends on why the balance exists, how it is financed, whether the pattern persists and how it relates to saving, investment and the wider economy.

## Prices, exchange rates and volume

Values measured in current money can change because prices or exchange rates change, even when the physical amount of goods is similar. A rise in the value of exports may therefore reflect higher prices rather than more units sold. When possible, compare both nominal values and volume measures, note the currency used, and check whether the series is adjusted for inflation. These details prevent a simple chart from being mistaken for a complete account of real activity.

## Compare data carefully

A meaningful comparison keeps the time period, coverage and units consistent. Goods-only trade is not identical to trade in goods and services, and annual figures should not be compared directly with one month without adjusting the interpretation. World Bank metadata describes the scope and units of individual indicators; that metadata matters because two series with similar names can measure different things. Revisions and differences in national reporting can also affect comparisons.

## Questions to ask before drawing a conclusion

Before interpreting a headline, ask what is included, which period is covered, whether values are current or inflation-adjusted, and whether income and transfers are part of the measure. Then compare the balance with production, employment, investment and household conditions. The IMF cautions against treating the current account as a simple scorecard: it is an outcome shaped by saving, investment and cross-border flows. A careful explanation states what the figures show and what they cannot establish on their own.','[{"title":"Current Account Deficits: Back to Basics","url":"https://www.imf.org/en/publications/fandd/issues/series/back-to-basics/current-account-deficits","publisher":"International Monetary Fund"},{"title":"Trade in Goods and Services: Metadata Glossary","url":"https://databank.worldbank.org/metadataglossary/all/series?search=Trade+in+goods+and+services","publisher":"World Bank"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/Container_ship_MSC_Clorinda_in_the_port_of_Hamburg_in_Januar_2016_%28cropped%29.jpg','Container ship in a commercial port',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('economy-trade-balance-current-account-ar','economy','ar','كيف نقرأ الميزان التجاري والحساب الجاري؟','دليل يشرح الصادرات والواردات وتدفقات الدخل وحدود استخدام رقم واحد للحكم على أداء الاقتصاد.','## ماذا يقيس الميزان التجاري؟

يقارن الميزان التجاري قيمة السلع والخدمات التي يبيعها بلد إلى الخارج بقيمة ما يشتريه من الخارج خلال فترة محددة. ويُحسب الفرق بطرح الواردات من الصادرات؛ فالنتيجة الموجبة تعني فائضًا والسالبة تعني عجزًا. يصف هذا الرقم نوعًا محددًا من المعاملات، لكنه لا يوضح وحده مستوى معيشة الأسر أو إنتاجية الشركات أو استدامة المالية العامة.

## كيف يختلف الحساب الجاري؟

الحساب الجاري أوسع من الميزان التجاري؛ فهو يضم أيضًا صافي الدخل الناتج عن الاستثمارات والتعويضات عبر الحدود، إلى جانب التحويلات مثل تحويلات العاملين وبعض أشكال المساعدة. يوضح صندوق النقد الدولي أن هذه المكونات تساعد على فهم حركة السلع والخدمات والدخل بين البلد وبقية العالم. لذلك يجب التأكد من المقياس الذي يعرضه الرسم قبل مقارنته برسم آخر يحمل عنوانًا مشابهًا.

## لماذا لا يكفي العجز للحكم على الاقتصاد؟

لا يعني العجز تلقائيًا فشل الاقتصاد، كما أن الفائض لا يعني تلقائيًا نجاحه. فقد تشمل الواردات آلات أو أدوية أو معدات تساعد على زيادة الإنتاج مستقبلًا، بينما قد يعكس الفائض ضعف الطلب المحلي إلى جانب قوة الصادرات. ويتوقف التفسير على أسباب النتيجة وطريقة تمويلها ومدى استمرارها وعلاقتها بالادخار والاستثمار وبقية مؤشرات النشاط الاقتصادي.

## الأسعار وسعر الصرف وحجم التجارة

قد تتغير القيم المحسوبة بالنقود الجارية بسبب تغير الأسعار أو سعر الصرف حتى إذا لم تتغير الكميات الفعلية كثيرًا. لذلك قد تعكس زيادة قيمة الصادرات ارتفاع الأسعار لا زيادة عدد الوحدات المباعة. وعند توفر البيانات، قارن القيم الاسمية بمقاييس الحجم، وانتبه إلى العملة المستخدمة وإلى ما إذا كانت السلسلة قد عُدلت وفق التضخم. تساعد هذه التفاصيل على تجنب اعتبار رسم بسيط وصفًا كاملًا للنشاط الحقيقي.

## كيف نقارن البيانات بطريقة سليمة؟

تحتاج المقارنة المفيدة إلى فترة زمنية وتغطية ووحدات متسقة. فالتجارة في السلع وحدها ليست مطابقة للتجارة في السلع والخدمات، ولا يصح تفسير رقم سنوي كما لو كان رقم شهر واحد من دون مراعاة اختلاف الفترة. وتشرح بيانات البنك الدولي الوصفية نطاق كل مؤشر ووحداته؛ وهي مهمة لأن سلسلتين تحملان اسمين متشابهين قد تقيسان أمرين مختلفين. كما يمكن أن تؤثر المراجعات واختلافات الإبلاغ الوطني في المقارنة.

## أسئلة ينبغي طرحها قبل الاستنتاج

قبل تفسير عنوان خبري، اسأل عما يتضمنه المؤشر والفترة التي يغطيها وما إذا كانت القيم جارية أم معدلة وفق التضخم، وهل يدخل الدخل والتحويلات في الحساب. ثم قارن النتيجة بالإنتاج والتوظيف والاستثمار وأوضاع الأسر. ويحذر صندوق النقد من التعامل مع الحساب الجاري كأنه درجة بسيطة للاقتصاد؛ فهو نتيجة تتأثر بالادخار والاستثمار والتدفقات العابرة للحدود. والتفسير الدقيق يوضح ما تكشفه الأرقام وما لا يمكنها إثباته وحدها.','[{"title":"عجز الحساب الجاري: شرح مبسط","url":"https://www.imf.org/en/publications/fandd/issues/series/back-to-basics/current-account-deficits","publisher":"صندوق النقد الدولي"},{"title":"بيانات التجارة في السلع والخدمات","url":"https://databank.worldbank.org/metadataglossary/all/series?search=Trade+in+goods+and+services","publisher":"البنك الدولي"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/Container_ship_MSC_Clorinda_in_the_port_of_Hamburg_in_Januar_2016_%28cropped%29.jpg','سفينة حاويات في ميناء تجاري',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('people-marie-curie-biography-en','people','en','Marie Curie: life, research and scientific legacy','A documented biography of Marie Curie, from her studies in Paris to two Nobel Prizes and her work advancing research on radioactivity.','## Early life and education

Marie Skłodowska Curie was born in Warsaw in 1867 in a family of teachers. She pursued further study in Paris after leaving Poland, enrolling at the Sorbonne in 1891 and concentrating on physics and mathematics. Her education unfolded in a period when women faced substantial barriers in higher education and scientific employment. The details of her early life help explain both the effort required to enter research and the international path of her career.

## A research partnership

Curie met physicist Pierre Curie in 1894, and they married the following year. Their work built on Henri Becquerel’s discovery of spontaneous radioactivity. Through careful experiments and chemical separation, Marie and Pierre identified the elements polonium and radium in 1898. Their results depended on patient measurement and analysis of radioactive materials, rather than on a single observation. The work helped establish radioactivity as a subject of sustained physical and chemical investigation.

## The Nobel Prize in Physics

In 1903, Marie Curie shared the Nobel Prize in Physics with Pierre Curie and Henri Becquerel for research into radiation phenomena. The award recognized a body of work rather than a popular claim or an isolated demonstration. Curie became the first woman to receive a Nobel Prize. The official Nobel biography records the joint award and places it within the scientific work that followed Becquerel’s discovery.

## A second Nobel Prize and scientific leadership

In 1911, Curie received the Nobel Prize in Chemistry for her work on radioactivity, including the discovery of polonium and radium and the isolation and study of radium. She remains notable for receiving Nobel Prizes in two different scientific fields. After Pierre died in 1906, she continued her research and took over his teaching position at the Sorbonne, becoming the first woman to hold that professorship. Her career combined laboratory work, teaching and institution building.

## Research in wartime

During the First World War, Curie helped organize mobile radiology services so physicians could use X-ray examinations to assess wounded soldiers. This work applied scientific knowledge to a practical medical need and required equipment, training and coordination. Her wartime contribution is part of the historical record of radiology, but it should not be confused with the separate question of how the long-term risks of radiation were understood during her lifetime.

## Legacy and historical context

Curie died in France in 1934 after an illness. The hazards of prolonged radiation exposure were not fully understood during much of her working life, and her career is now discussed both for its scientific achievements and for the history of laboratory safety. Reliable biographies distinguish documented milestones from later interpretation. Her legacy includes discoveries, scientific institutions, a model of careful experimental work and a reminder that research practices evolve as evidence about risk improves.','[{"title":"Marie Curie — Biographical","url":"https://www.nobelprize.org/prizes/chemistry/1911/marie-curie/biographical/","publisher":"Nobel Prize Outreach"},{"title":"Biography of Marie Sklodowska Curie","url":"https://www.nist.gov/pml/marie-curie-and-nbs-radium-standards/marie-curie-and-nbs-radium-standards-biographies/biography","publisher":"National Institute of Standards and Technology"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/Marie_Curie_c1920.jpg','Portrait of Marie Curie around 1920',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('people-marie-curie-biography-ar','people','ar','ماري كوري: حياتها وأبحاثها وإرثها العلمي','سيرة موثقة لماري كوري، من دراستها في باريس إلى جائزتي نوبل وإسهامها في تطوير البحث في النشاط الإشعاعي.','## النشأة والتعليم

وُلدت ماري سكوودوفسكا كوري في وارسو عام 1867 في أسرة من المعلمين. وانتقلت إلى باريس لمتابعة الدراسة، والتحقت بالسوربون عام 1891 وركزت على الفيزياء والرياضيات. جاءت دراستها في زمن واجهت فيه النساء عوائق كبيرة في التعليم الجامعي والعمل العلمي. ويساعد فهم ظروف نشأتها على إدراك الجهد الذي احتاجته لدخول مجال البحث، كما يوضح المسار الدولي الذي اتخذته حياتها المهنية.

## شراكة بحثية

التقت ماري بالفيزيائي بيير كوري عام 1894، وتزوجا في العام التالي. واستند عملهما إلى اكتشاف هنري بيكريل للنشاط الإشعاعي التلقائي. ومن خلال التجارب الدقيقة والفصل الكيميائي، حددا عنصري البولونيوم والراديوم عام 1898. واعتمدت النتائج على القياس والتحليل المتأنيين للمواد المشعة، لا على ملاحظة واحدة عابرة. وأسهم العمل في جعل النشاط الإشعاعي مجالًا للبحث الفيزيائي والكيميائي المنهجي.

## جائزة نوبل في الفيزياء

في عام 1903، تقاسمت ماري كوري جائزة نوبل في الفيزياء مع بيير كوري وهنري بيكريل عن أبحاث ظواهر الإشعاع. وقد كرمت الجائزة مجموعة من الأعمال العلمية، لا ادعاءً شائعًا أو تجربة منفردة. وأصبحت ماري أول امرأة تحصل على جائزة نوبل. وتوثق السيرة الرسمية للجائزة هذا التكريم المشترك وتضعه في سياق الأبحاث التي أعقبت اكتشاف بيكريل.

## جائزة ثانية والقيادة العلمية

حصلت ماري كوري عام 1911 على جائزة نوبل في الكيمياء تقديرًا لأعمالها في النشاط الإشعاعي، بما في ذلك اكتشاف البولونيوم والراديوم وعزل الراديوم ودراسة خصائصه. وتتميز سيرتها بحصولها على جائزتي نوبل في مجالين علميين مختلفين. وبعد وفاة بيير عام 1906، واصلت أبحاثها وتولت منصبه التدريسي في السوربون، لتصبح أول امرأة تشغل ذلك المنصب. وجمعت مسيرتها بين العمل المخبري والتعليم وبناء المؤسسات العلمية.

## البحث أثناء الحرب

خلال الحرب العالمية الأولى، ساعدت كوري في تنظيم خدمات التصوير بالأشعة المتنقلة كي يتمكن الأطباء من فحص الجنود المصابين. وقد طبقت هذه الجهود المعرفة العلمية على حاجة طبية عملية، واحتاجت إلى معدات وتدريب وتنسيق. ويُعد إسهامها خلال الحرب جزءًا من تاريخ التصوير الطبي، لكنه يختلف عن السؤال المتعلق بمدى فهم مخاطر الإشعاع طويلة الأمد في زمنها.

## الإرث والسياق التاريخي

توفيت كوري في فرنسا عام 1934 بعد مرض. ولم تكن مخاطر التعرض الطويل للإشعاع مفهومة بالكامل خلال جزء كبير من حياتها العملية، ولذلك تُدرس سيرتها اليوم من زاوية إنجازاتها العلمية وتاريخ السلامة في المختبرات معًا. وتفصل السير الموثوقة بين المحطات الموثقة والتفسيرات اللاحقة. ويشمل إرثها اكتشافات ومؤسسات علمية ونموذجًا للعمل التجريبي الدقيق، إلى جانب تذكير بأن ممارسات البحث تتطور عندما تتراكم الأدلة حول المخاطر.','[{"title":"السيرة العلمية لماري كوري","url":"https://www.nobelprize.org/prizes/chemistry/1911/marie-curie/biographical/","publisher":"مؤسسة جائزة نوبل"},{"title":"سيرة ماري سكوودوفسكا كوري","url":"https://www.nist.gov/pml/marie-curie-and-nbs-radium-standards/marie-curie-and-nbs-radium-standards-biographies/biography","publisher":"المعهد الوطني الأمريكي للمعايير والتقنية"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/Marie_Curie_c1920.jpg','صورة لماري كوري نحو عام 1920',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('egypt-nile-valley-delta-en','egypt','en','How the Nile Valley and Delta shape settlement in Egypt','A source-based overview of Egypt''s Nile Valley, Delta and desert regions, and why geography matters for water, farming and settlement.','## A river through an arid landscape

Egypt spans the northeastern corner of Africa and the Sinai Peninsula in southwest Asia. Much of the country is arid desert, while the Nile creates a narrow corridor of water, cultivated land and settlement. The Food and Agriculture Organization describes how people, farming and services are concentrated around the valley and delta. This pattern is a geographical feature, not a claim that every community or economic activity is located beside the river.

## The Nile Valley

South of Cairo, the Nile runs through a comparatively narrow valley bordered by desert plateaus. The cultivated strip can vary in width, and towns and agricultural land are connected by the river and canals. The river provides a central route through the country, but access to water, land quality and local infrastructure differ from place to place. These differences matter when describing regional development, transport and public-service needs.

## The Delta and Lower Egypt

North of Cairo, the river spreads into the Nile Delta before reaching the Mediterranean Sea. The delta includes farmland, canals, drainage channels and coastal lakes. Its landscape is not uniform: water management, soil, settlement patterns and exposure to coastal hazards vary across the region. A satellite image can show the broad shape of the delta, but understanding local conditions also requires maps, field data and information from responsible agencies.

## Deserts, coasts and Sinai

The Nile Valley and Delta are only part of Egypt''s geography. The Western Desert, Eastern Desert and Sinai have distinct landscapes, routes and settlement patterns, while the Mediterranean and Red Sea coasts create different environmental and economic settings. A national overview should not treat the country as a single flat landscape. Geographic regions influence transport distances, access to services, agriculture and the way communities connect to cities.

## Water and agriculture

Because rainfall is limited across much of Egypt, irrigation and water management are important to farming. The FAO''s country material describes the relationship between agriculture, water resources and the concentration of cultivated land near the Nile system. These relationships also create planning questions: how to use water efficiently, maintain canals, protect farmland and balance urban growth with other land uses. Specific claims about current water availability should be checked against dated technical data.

## How to use geographic evidence

When reading a report about Egypt, identify the region, the date of the data and the institution responsible for it. Distinguish a satellite image from a population estimate or an agricultural statistic; each answers a different question. Compare maps with official country profiles and explain uncertainty where sources use different definitions. Geography provides context for understanding communities and services, but it does not by itself explain every social or economic outcome.','[{"title":"Egypt at a glance","url":"https://www.fao.org/egypt/our-office/egypt-at-a-glance/en/","publisher":"Food and Agriculture Organization of the United Nations"},{"title":"Egypt: Geography and Regions","url":"https://www.britannica.com/place/Egypt","publisher":"Encyclopaedia Britannica"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/Satellite_picture_of_the_Nile_Delta%2C_Egypt.jpg','Satellite image of the Nile Delta in Egypt',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('egypt-nile-valley-delta-ar','egypt','ar','كيف يشكل وادي النيل والدلتا الاستقرار في مصر؟','عرض موثق لوادي النيل والدلتا والصحارى المصرية، وأهمية الجغرافيا للمياه والزراعة وتوزيع التجمعات السكانية.','## نهر يمر عبر بيئة جافة

تقع مصر في الركن الشمالي الشرقي من أفريقيا، وتمتد عبر شبه جزيرة سيناء إلى جنوب غرب آسيا. وتغلب البيئة الصحراوية الجافة على مساحات واسعة من البلاد، بينما يشكل النيل ممرًا ضيقًا للمياه والأراضي المزروعة والتجمعات السكانية. وتوضح منظمة الأغذية والزراعة كيف يرتبط توزيع السكان والزراعة والخدمات بالوادي والدلتا. وهذه سمة جغرافية عامة، وليست ادعاءً بأن كل نشاط أو مجتمع يوجد بجوار النهر.

## وادي النيل

يمر النيل جنوب القاهرة داخل وادٍ ضيق نسبيًا تحيط به الهضاب الصحراوية. ويتغير عرض الشريط المزروع من مكان إلى آخر، وترتبط البلدات والأراضي الزراعية بالنهر والقنوات. ويوفر النهر مسارًا رئيسيًا عبر البلاد، لكن الوصول إلى المياه وجودة الأرض والبنية الأساسية المحلية يختلف بين المناطق. وتؤثر هذه الفروق في فهم التنمية الإقليمية والنقل واحتياجات الخدمات العامة.

## الدلتا ومصر السفلى

يتفرع النهر شمال القاهرة إلى دلتا النيل قبل أن يصل إلى البحر المتوسط. وتضم الدلتا أراضي زراعية وقنوات وشبكات صرف وبحيرات ساحلية. وليست طبيعتها واحدة في جميع المواضع؛ إذ تختلف إدارة المياه وأنواع التربة وأنماط الاستقرار والتعرض للمخاطر الساحلية بين منطقة وأخرى. ويمكن لصورة الأقمار الصناعية أن توضح الشكل العام للدلتا، لكن فهم الظروف المحلية يحتاج أيضًا إلى خرائط وبيانات ميدانية ومعلومات من الجهات المختصة.

## الصحارى والسواحل وسيناء

لا يقتصر جغرافيا مصر على وادي النيل والدلتا. فللصحراء الغربية والصحراء الشرقية وسيناء تضاريس ومسارات وأنماط استقرار مختلفة، كما تخلق سواحل البحر المتوسط والبحر الأحمر ظروفًا بيئية واقتصادية متميزة. لذلك لا ينبغي أن يعامل الوصف الوطني البلاد كأنها أرض مستوية واحدة. وتؤثر الأقاليم الجغرافية في مسافات النقل والوصول إلى الخدمات والزراعة والروابط بين المجتمعات والمدن.

## المياه والزراعة

بسبب محدودية الأمطار في معظم مصر، تكتسب إدارة المياه والري أهمية كبيرة للزراعة. وتوضح مواد منظمة الأغذية والزراعة الصلة بين الزراعة والموارد المائية وتركيز الأراضي المزروعة قرب نظام النيل. وتطرح هذه العلاقة أسئلة تخطيطية حول كفاءة استخدام المياه وصيانة القنوات وحماية الأراضي الزراعية والتوازن بين التوسع العمراني والاستخدامات الأخرى. أما الادعاءات المحددة عن توافر المياه حاليًا، فينبغي مراجعتها بالرجوع إلى بيانات فنية مؤرخة.

## كيف نستخدم الأدلة الجغرافية؟

عند قراءة تقرير عن مصر، حدد الإقليم وتاريخ البيانات والجهة المسؤولة عنها. وميّز بين صورة أقمار صناعية وتقدير سكاني وإحصاء زراعي، لأن كل نوع يجيب عن سؤال مختلف. وقارن الخرائط بملفات البلد الرسمية، واشرح مواضع عدم اليقين إذا اختلفت تعريفات المصادر. توفر الجغرافيا سياقًا لفهم المجتمعات والخدمات، لكنها لا تفسر وحدها كل نتيجة اجتماعية أو اقتصادية.','[{"title":"مصر في لمحة","url":"https://www.fao.org/egypt/our-office/egypt-at-a-glance/en/","publisher":"منظمة الأغذية والزراعة للأمم المتحدة"},{"title":"مصر: الجغرافيا والأقاليم","url":"https://www.britannica.com/place/Egypt","publisher":"موسوعة بريتانيكا"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/Satellite_picture_of_the_Nile_Delta%2C_Egypt.jpg','صورة أقمار صناعية لدلتا النيل في مصر',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

-- Enforce the reviewed article version if a prior seed used one of these slugs.
UPDATE articles SET title='How to read a trade balance and current account',summary='A source-based guide to exports, imports, income flows and the limits of using one external-balance number to judge an economy.',body='## What the trade balance measures

A trade balance compares the value of goods and services sold to the rest of the world with the value bought from it over a defined period. Exports minus imports gives the balance: a positive result is a surplus and a negative result is a deficit. The number describes a particular set of transactions; by itself it does not tell whether households are better off, whether firms are productive or whether public finances are sustainable.

## How the current account differs

The current account is broader than the trade balance. It also includes net income from cross-border investments and compensation, as well as transfers such as remittances and some forms of assistance. The International Monetary Fund explains that these components help show how goods, services and income move between a country and the rest of the world. Readers should check which measure a chart reports before comparing it with another chart.

## Why a deficit is not a verdict

A deficit is not automatically proof of economic failure, just as a surplus is not automatically proof of success. Imports may include machinery, medicine or equipment that supports future production, while a surplus may reflect weak domestic demand as well as strong exports. The meaning depends on why the balance exists, how it is financed, whether the pattern persists and how it relates to saving, investment and the wider economy.

## Prices, exchange rates and volume

Values measured in current money can change because prices or exchange rates change, even when the physical amount of goods is similar. A rise in the value of exports may therefore reflect higher prices rather than more units sold. When possible, compare both nominal values and volume measures, note the currency used, and check whether the series is adjusted for inflation. These details prevent a simple chart from being mistaken for a complete account of real activity.

## Compare data carefully

A meaningful comparison keeps the time period, coverage and units consistent. Goods-only trade is not identical to trade in goods and services, and annual figures should not be compared directly with one month without adjusting the interpretation. World Bank metadata describes the scope and units of individual indicators; that metadata matters because two series with similar names can measure different things. Revisions and differences in national reporting can also affect comparisons.

## Questions to ask before drawing a conclusion

Before interpreting a headline, ask what is included, which period is covered, whether values are current or inflation-adjusted, and whether income and transfers are part of the measure. Then compare the balance with production, employment, investment and household conditions. The IMF cautions against treating the current account as a simple scorecard: it is an outcome shaped by saving, investment and cross-border flows. A careful explanation states what the figures show and what they cannot establish on their own.',sources_json='[{"title":"Current Account Deficits: Back to Basics","url":"https://www.imf.org/en/publications/fandd/issues/series/back-to-basics/current-account-deficits","publisher":"International Monetary Fund"},{"title":"Trade in Goods and Services: Metadata Glossary","url":"https://databank.worldbank.org/metadataglossary/all/series?search=Trade+in+goods+and+services","publisher":"World Bank"}]',status='PUBLISHED',image_url='https://commons.wikimedia.org/wiki/Special:FilePath/Container_ship_MSC_Clorinda_in_the_port_of_Hamburg_in_Januar_2016_%28cropped%29.jpg',image_alt='Container ship in a commercial port',updated_at=CURRENT_TIMESTAMP WHERE slug='economy-trade-balance-current-account-en' AND language='en';
UPDATE articles SET title='كيف نقرأ الميزان التجاري والحساب الجاري؟',summary='دليل يشرح الصادرات والواردات وتدفقات الدخل وحدود استخدام رقم واحد للحكم على أداء الاقتصاد.',body='## ماذا يقيس الميزان التجاري؟

يقارن الميزان التجاري قيمة السلع والخدمات التي يبيعها بلد إلى الخارج بقيمة ما يشتريه من الخارج خلال فترة محددة. ويُحسب الفرق بطرح الواردات من الصادرات؛ فالنتيجة الموجبة تعني فائضًا والسالبة تعني عجزًا. يصف هذا الرقم نوعًا محددًا من المعاملات، لكنه لا يوضح وحده مستوى معيشة الأسر أو إنتاجية الشركات أو استدامة المالية العامة.

## كيف يختلف الحساب الجاري؟

الحساب الجاري أوسع من الميزان التجاري؛ فهو يضم أيضًا صافي الدخل الناتج عن الاستثمارات والتعويضات عبر الحدود، إلى جانب التحويلات مثل تحويلات العاملين وبعض أشكال المساعدة. يوضح صندوق النقد الدولي أن هذه المكونات تساعد على فهم حركة السلع والخدمات والدخل بين البلد وبقية العالم. لذلك يجب التأكد من المقياس الذي يعرضه الرسم قبل مقارنته برسم آخر يحمل عنوانًا مشابهًا.

## لماذا لا يكفي العجز للحكم على الاقتصاد؟

لا يعني العجز تلقائيًا فشل الاقتصاد، كما أن الفائض لا يعني تلقائيًا نجاحه. فقد تشمل الواردات آلات أو أدوية أو معدات تساعد على زيادة الإنتاج مستقبلًا، بينما قد يعكس الفائض ضعف الطلب المحلي إلى جانب قوة الصادرات. ويتوقف التفسير على أسباب النتيجة وطريقة تمويلها ومدى استمرارها وعلاقتها بالادخار والاستثمار وبقية مؤشرات النشاط الاقتصادي.

## الأسعار وسعر الصرف وحجم التجارة

قد تتغير القيم المحسوبة بالنقود الجارية بسبب تغير الأسعار أو سعر الصرف حتى إذا لم تتغير الكميات الفعلية كثيرًا. لذلك قد تعكس زيادة قيمة الصادرات ارتفاع الأسعار لا زيادة عدد الوحدات المباعة. وعند توفر البيانات، قارن القيم الاسمية بمقاييس الحجم، وانتبه إلى العملة المستخدمة وإلى ما إذا كانت السلسلة قد عُدلت وفق التضخم. تساعد هذه التفاصيل على تجنب اعتبار رسم بسيط وصفًا كاملًا للنشاط الحقيقي.

## كيف نقارن البيانات بطريقة سليمة؟

تحتاج المقارنة المفيدة إلى فترة زمنية وتغطية ووحدات متسقة. فالتجارة في السلع وحدها ليست مطابقة للتجارة في السلع والخدمات، ولا يصح تفسير رقم سنوي كما لو كان رقم شهر واحد من دون مراعاة اختلاف الفترة. وتشرح بيانات البنك الدولي الوصفية نطاق كل مؤشر ووحداته؛ وهي مهمة لأن سلسلتين تحملان اسمين متشابهين قد تقيسان أمرين مختلفين. كما يمكن أن تؤثر المراجعات واختلافات الإبلاغ الوطني في المقارنة.

## أسئلة ينبغي طرحها قبل الاستنتاج

قبل تفسير عنوان خبري، اسأل عما يتضمنه المؤشر والفترة التي يغطيها وما إذا كانت القيم جارية أم معدلة وفق التضخم، وهل يدخل الدخل والتحويلات في الحساب. ثم قارن النتيجة بالإنتاج والتوظيف والاستثمار وأوضاع الأسر. ويحذر صندوق النقد من التعامل مع الحساب الجاري كأنه درجة بسيطة للاقتصاد؛ فهو نتيجة تتأثر بالادخار والاستثمار والتدفقات العابرة للحدود. والتفسير الدقيق يوضح ما تكشفه الأرقام وما لا يمكنها إثباته وحدها.',sources_json='[{"title":"عجز الحساب الجاري: شرح مبسط","url":"https://www.imf.org/en/publications/fandd/issues/series/back-to-basics/current-account-deficits","publisher":"صندوق النقد الدولي"},{"title":"بيانات التجارة في السلع والخدمات","url":"https://databank.worldbank.org/metadataglossary/all/series?search=Trade+in+goods+and+services","publisher":"البنك الدولي"}]',status='PUBLISHED',image_url='https://commons.wikimedia.org/wiki/Special:FilePath/Container_ship_MSC_Clorinda_in_the_port_of_Hamburg_in_Januar_2016_%28cropped%29.jpg',image_alt='سفينة حاويات في ميناء تجاري',updated_at=CURRENT_TIMESTAMP WHERE slug='economy-trade-balance-current-account-ar' AND language='ar';
UPDATE articles SET title='Marie Curie: life, research and scientific legacy',summary='A documented biography of Marie Curie, from her studies in Paris to two Nobel Prizes and her work advancing research on radioactivity.',body='## Early life and education

Marie Skłodowska Curie was born in Warsaw in 1867 in a family of teachers. She pursued further study in Paris after leaving Poland, enrolling at the Sorbonne in 1891 and concentrating on physics and mathematics. Her education unfolded in a period when women faced substantial barriers in higher education and scientific employment. The details of her early life help explain both the effort required to enter research and the international path of her career.

## A research partnership

Curie met physicist Pierre Curie in 1894, and they married the following year. Their work built on Henri Becquerel’s discovery of spontaneous radioactivity. Through careful experiments and chemical separation, Marie and Pierre identified the elements polonium and radium in 1898. Their results depended on patient measurement and analysis of radioactive materials, rather than on a single observation. The work helped establish radioactivity as a subject of sustained physical and chemical investigation.

## The Nobel Prize in Physics

In 1903, Marie Curie shared the Nobel Prize in Physics with Pierre Curie and Henri Becquerel for research into radiation phenomena. The award recognized a body of work rather than a popular claim or an isolated demonstration. Curie became the first woman to receive a Nobel Prize. The official Nobel biography records the joint award and places it within the scientific work that followed Becquerel’s discovery.

## A second Nobel Prize and scientific leadership

In 1911, Curie received the Nobel Prize in Chemistry for her work on radioactivity, including the discovery of polonium and radium and the isolation and study of radium. She remains notable for receiving Nobel Prizes in two different scientific fields. After Pierre died in 1906, she continued her research and took over his teaching position at the Sorbonne, becoming the first woman to hold that professorship. Her career combined laboratory work, teaching and institution building.

## Research in wartime

During the First World War, Curie helped organize mobile radiology services so physicians could use X-ray examinations to assess wounded soldiers. This work applied scientific knowledge to a practical medical need and required equipment, training and coordination. Her wartime contribution is part of the historical record of radiology, but it should not be confused with the separate question of how the long-term risks of radiation were understood during her lifetime.

## Legacy and historical context

Curie died in France in 1934 after an illness. The hazards of prolonged radiation exposure were not fully understood during much of her working life, and her career is now discussed both for its scientific achievements and for the history of laboratory safety. Reliable biographies distinguish documented milestones from later interpretation. Her legacy includes discoveries, scientific institutions, a model of careful experimental work and a reminder that research practices evolve as evidence about risk improves.',sources_json='[{"title":"Marie Curie — Biographical","url":"https://www.nobelprize.org/prizes/chemistry/1911/marie-curie/biographical/","publisher":"Nobel Prize Outreach"},{"title":"Biography of Marie Sklodowska Curie","url":"https://www.nist.gov/pml/marie-curie-and-nbs-radium-standards/marie-curie-and-nbs-radium-standards-biographies/biography","publisher":"National Institute of Standards and Technology"}]',status='PUBLISHED',image_url='https://commons.wikimedia.org/wiki/Special:FilePath/Marie_Curie_c1920.jpg',image_alt='Portrait of Marie Curie around 1920',updated_at=CURRENT_TIMESTAMP WHERE slug='people-marie-curie-biography-en' AND language='en';
UPDATE articles SET title='ماري كوري: حياتها وأبحاثها وإرثها العلمي',summary='سيرة موثقة لماري كوري، من دراستها في باريس إلى جائزتي نوبل وإسهامها في تطوير البحث في النشاط الإشعاعي.',body='## النشأة والتعليم

وُلدت ماري سكوودوفسكا كوري في وارسو عام 1867 في أسرة من المعلمين. وانتقلت إلى باريس لمتابعة الدراسة، والتحقت بالسوربون عام 1891 وركزت على الفيزياء والرياضيات. جاءت دراستها في زمن واجهت فيه النساء عوائق كبيرة في التعليم الجامعي والعمل العلمي. ويساعد فهم ظروف نشأتها على إدراك الجهد الذي احتاجته لدخول مجال البحث، كما يوضح المسار الدولي الذي اتخذته حياتها المهنية.

## شراكة بحثية

التقت ماري بالفيزيائي بيير كوري عام 1894، وتزوجا في العام التالي. واستند عملهما إلى اكتشاف هنري بيكريل للنشاط الإشعاعي التلقائي. ومن خلال التجارب الدقيقة والفصل الكيميائي، حددا عنصري البولونيوم والراديوم عام 1898. واعتمدت النتائج على القياس والتحليل المتأنيين للمواد المشعة، لا على ملاحظة واحدة عابرة. وأسهم العمل في جعل النشاط الإشعاعي مجالًا للبحث الفيزيائي والكيميائي المنهجي.

## جائزة نوبل في الفيزياء

في عام 1903، تقاسمت ماري كوري جائزة نوبل في الفيزياء مع بيير كوري وهنري بيكريل عن أبحاث ظواهر الإشعاع. وقد كرمت الجائزة مجموعة من الأعمال العلمية، لا ادعاءً شائعًا أو تجربة منفردة. وأصبحت ماري أول امرأة تحصل على جائزة نوبل. وتوثق السيرة الرسمية للجائزة هذا التكريم المشترك وتضعه في سياق الأبحاث التي أعقبت اكتشاف بيكريل.

## جائزة ثانية والقيادة العلمية

حصلت ماري كوري عام 1911 على جائزة نوبل في الكيمياء تقديرًا لأعمالها في النشاط الإشعاعي، بما في ذلك اكتشاف البولونيوم والراديوم وعزل الراديوم ودراسة خصائصه. وتتميز سيرتها بحصولها على جائزتي نوبل في مجالين علميين مختلفين. وبعد وفاة بيير عام 1906، واصلت أبحاثها وتولت منصبه التدريسي في السوربون، لتصبح أول امرأة تشغل ذلك المنصب. وجمعت مسيرتها بين العمل المخبري والتعليم وبناء المؤسسات العلمية.

## البحث أثناء الحرب

خلال الحرب العالمية الأولى، ساعدت كوري في تنظيم خدمات التصوير بالأشعة المتنقلة كي يتمكن الأطباء من فحص الجنود المصابين. وقد طبقت هذه الجهود المعرفة العلمية على حاجة طبية عملية، واحتاجت إلى معدات وتدريب وتنسيق. ويُعد إسهامها خلال الحرب جزءًا من تاريخ التصوير الطبي، لكنه يختلف عن السؤال المتعلق بمدى فهم مخاطر الإشعاع طويلة الأمد في زمنها.

## الإرث والسياق التاريخي

توفيت كوري في فرنسا عام 1934 بعد مرض. ولم تكن مخاطر التعرض الطويل للإشعاع مفهومة بالكامل خلال جزء كبير من حياتها العملية، ولذلك تُدرس سيرتها اليوم من زاوية إنجازاتها العلمية وتاريخ السلامة في المختبرات معًا. وتفصل السير الموثوقة بين المحطات الموثقة والتفسيرات اللاحقة. ويشمل إرثها اكتشافات ومؤسسات علمية ونموذجًا للعمل التجريبي الدقيق، إلى جانب تذكير بأن ممارسات البحث تتطور عندما تتراكم الأدلة حول المخاطر.',sources_json='[{"title":"السيرة العلمية لماري كوري","url":"https://www.nobelprize.org/prizes/chemistry/1911/marie-curie/biographical/","publisher":"مؤسسة جائزة نوبل"},{"title":"سيرة ماري سكوودوفسكا كوري","url":"https://www.nist.gov/pml/marie-curie-and-nbs-radium-standards/marie-curie-and-nbs-radium-standards-biographies/biography","publisher":"المعهد الوطني الأمريكي للمعايير والتقنية"}]',status='PUBLISHED',image_url='https://commons.wikimedia.org/wiki/Special:FilePath/Marie_Curie_c1920.jpg',image_alt='صورة لماري كوري نحو عام 1920',updated_at=CURRENT_TIMESTAMP WHERE slug='people-marie-curie-biography-ar' AND language='ar';
UPDATE articles SET title='How the Nile Valley and Delta shape settlement in Egypt',summary='A source-based overview of Egypt''s Nile Valley, Delta and desert regions, and why geography matters for water, farming and settlement.',body='## A river through an arid landscape

Egypt spans the northeastern corner of Africa and the Sinai Peninsula in southwest Asia. Much of the country is arid desert, while the Nile creates a narrow corridor of water, cultivated land and settlement. The Food and Agriculture Organization describes how people, farming and services are concentrated around the valley and delta. This pattern is a geographical feature, not a claim that every community or economic activity is located beside the river.

## The Nile Valley

South of Cairo, the Nile runs through a comparatively narrow valley bordered by desert plateaus. The cultivated strip can vary in width, and towns and agricultural land are connected by the river and canals. The river provides a central route through the country, but access to water, land quality and local infrastructure differ from place to place. These differences matter when describing regional development, transport and public-service needs.

## The Delta and Lower Egypt

North of Cairo, the river spreads into the Nile Delta before reaching the Mediterranean Sea. The delta includes farmland, canals, drainage channels and coastal lakes. Its landscape is not uniform: water management, soil, settlement patterns and exposure to coastal hazards vary across the region. A satellite image can show the broad shape of the delta, but understanding local conditions also requires maps, field data and information from responsible agencies.

## Deserts, coasts and Sinai

The Nile Valley and Delta are only part of Egypt''s geography. The Western Desert, Eastern Desert and Sinai have distinct landscapes, routes and settlement patterns, while the Mediterranean and Red Sea coasts create different environmental and economic settings. A national overview should not treat the country as a single flat landscape. Geographic regions influence transport distances, access to services, agriculture and the way communities connect to cities.

## Water and agriculture

Because rainfall is limited across much of Egypt, irrigation and water management are important to farming. The FAO''s country material describes the relationship between agriculture, water resources and the concentration of cultivated land near the Nile system. These relationships also create planning questions: how to use water efficiently, maintain canals, protect farmland and balance urban growth with other land uses. Specific claims about current water availability should be checked against dated technical data.

## How to use geographic evidence

When reading a report about Egypt, identify the region, the date of the data and the institution responsible for it. Distinguish a satellite image from a population estimate or an agricultural statistic; each answers a different question. Compare maps with official country profiles and explain uncertainty where sources use different definitions. Geography provides context for understanding communities and services, but it does not by itself explain every social or economic outcome.',sources_json='[{"title":"Egypt at a glance","url":"https://www.fao.org/egypt/our-office/egypt-at-a-glance/en/","publisher":"Food and Agriculture Organization of the United Nations"},{"title":"Egypt: Geography and Regions","url":"https://www.britannica.com/place/Egypt","publisher":"Encyclopaedia Britannica"}]',status='PUBLISHED',image_url='https://commons.wikimedia.org/wiki/Special:FilePath/Satellite_picture_of_the_Nile_Delta%2C_Egypt.jpg',image_alt='Satellite image of the Nile Delta in Egypt',updated_at=CURRENT_TIMESTAMP WHERE slug='egypt-nile-valley-delta-en' AND language='en';
UPDATE articles SET title='كيف يشكل وادي النيل والدلتا الاستقرار في مصر؟',summary='عرض موثق لوادي النيل والدلتا والصحارى المصرية، وأهمية الجغرافيا للمياه والزراعة وتوزيع التجمعات السكانية.',body='## نهر يمر عبر بيئة جافة

تقع مصر في الركن الشمالي الشرقي من أفريقيا، وتمتد عبر شبه جزيرة سيناء إلى جنوب غرب آسيا. وتغلب البيئة الصحراوية الجافة على مساحات واسعة من البلاد، بينما يشكل النيل ممرًا ضيقًا للمياه والأراضي المزروعة والتجمعات السكانية. وتوضح منظمة الأغذية والزراعة كيف يرتبط توزيع السكان والزراعة والخدمات بالوادي والدلتا. وهذه سمة جغرافية عامة، وليست ادعاءً بأن كل نشاط أو مجتمع يوجد بجوار النهر.

## وادي النيل

يمر النيل جنوب القاهرة داخل وادٍ ضيق نسبيًا تحيط به الهضاب الصحراوية. ويتغير عرض الشريط المزروع من مكان إلى آخر، وترتبط البلدات والأراضي الزراعية بالنهر والقنوات. ويوفر النهر مسارًا رئيسيًا عبر البلاد، لكن الوصول إلى المياه وجودة الأرض والبنية الأساسية المحلية يختلف بين المناطق. وتؤثر هذه الفروق في فهم التنمية الإقليمية والنقل واحتياجات الخدمات العامة.

## الدلتا ومصر السفلى

يتفرع النهر شمال القاهرة إلى دلتا النيل قبل أن يصل إلى البحر المتوسط. وتضم الدلتا أراضي زراعية وقنوات وشبكات صرف وبحيرات ساحلية. وليست طبيعتها واحدة في جميع المواضع؛ إذ تختلف إدارة المياه وأنواع التربة وأنماط الاستقرار والتعرض للمخاطر الساحلية بين منطقة وأخرى. ويمكن لصورة الأقمار الصناعية أن توضح الشكل العام للدلتا، لكن فهم الظروف المحلية يحتاج أيضًا إلى خرائط وبيانات ميدانية ومعلومات من الجهات المختصة.

## الصحارى والسواحل وسيناء

لا يقتصر جغرافيا مصر على وادي النيل والدلتا. فللصحراء الغربية والصحراء الشرقية وسيناء تضاريس ومسارات وأنماط استقرار مختلفة، كما تخلق سواحل البحر المتوسط والبحر الأحمر ظروفًا بيئية واقتصادية متميزة. لذلك لا ينبغي أن يعامل الوصف الوطني البلاد كأنها أرض مستوية واحدة. وتؤثر الأقاليم الجغرافية في مسافات النقل والوصول إلى الخدمات والزراعة والروابط بين المجتمعات والمدن.

## المياه والزراعة

بسبب محدودية الأمطار في معظم مصر، تكتسب إدارة المياه والري أهمية كبيرة للزراعة. وتوضح مواد منظمة الأغذية والزراعة الصلة بين الزراعة والموارد المائية وتركيز الأراضي المزروعة قرب نظام النيل. وتطرح هذه العلاقة أسئلة تخطيطية حول كفاءة استخدام المياه وصيانة القنوات وحماية الأراضي الزراعية والتوازن بين التوسع العمراني والاستخدامات الأخرى. أما الادعاءات المحددة عن توافر المياه حاليًا، فينبغي مراجعتها بالرجوع إلى بيانات فنية مؤرخة.

## كيف نستخدم الأدلة الجغرافية؟

عند قراءة تقرير عن مصر، حدد الإقليم وتاريخ البيانات والجهة المسؤولة عنها. وميّز بين صورة أقمار صناعية وتقدير سكاني وإحصاء زراعي، لأن كل نوع يجيب عن سؤال مختلف. وقارن الخرائط بملفات البلد الرسمية، واشرح مواضع عدم اليقين إذا اختلفت تعريفات المصادر. توفر الجغرافيا سياقًا لفهم المجتمعات والخدمات، لكنها لا تفسر وحدها كل نتيجة اجتماعية أو اقتصادية.',sources_json='[{"title":"مصر في لمحة","url":"https://www.fao.org/egypt/our-office/egypt-at-a-glance/en/","publisher":"منظمة الأغذية والزراعة للأمم المتحدة"},{"title":"مصر: الجغرافيا والأقاليم","url":"https://www.britannica.com/place/Egypt","publisher":"موسوعة بريتانيكا"}]',status='PUBLISHED',image_url='https://commons.wikimedia.org/wiki/Special:FilePath/Satellite_picture_of_the_Nile_Delta%2C_Egypt.jpg',image_alt='صورة أقمار صناعية لدلتا النيل في مصر',updated_at=CURRENT_TIMESTAMP WHERE slug='egypt-nile-valley-delta-ar' AND language='ar';
