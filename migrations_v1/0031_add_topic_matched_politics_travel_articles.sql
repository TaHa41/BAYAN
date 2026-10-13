-- Add two complete bilingual evergreen guides with subject-specific Wikimedia Commons images.
-- INSERT OR IGNORE keeps deployment idempotent and avoids duplicate article slugs.
INSERT OR IGNORE INTO articles
(slug,section,language,title,summary,body,sources_json,status,image_url,image_alt,created_at,updated_at)
VALUES
('politics-public-consultation-en','politics','en','How public consultation can improve decisions','A practical guide to consultation, public evidence, representation and checking whether participation changed a policy outcome.','## Consultation is a process, not a checkbox

Public consultation gives people who may be affected by a decision a chance to explain needs, identify overlooked impacts and compare possible solutions. A meeting or online form alone does not prove that participation was meaningful. The process should state what decision is open, who has authority to make it, which options remain possible and when contributions will be considered. If the decision has already been made, the institution should explain what feedback can still change and what is no longer negotiable.

## Define the question before collecting views

A clear question helps participants respond to the real problem instead of guessing what officials want to hear. For example, a transport consultation might ask how a route affects travel time, access for disabled passengers, safety, cost and connections with other services. Different groups can experience the same proposal differently, so organisers should publish the scope, the evidence already available and the criteria that will be used to compare options. This makes the process easier to understand and reduces the risk that loud or well-resourced voices dominate by default.

## Make participation accessible

People cannot contribute if the process is available only at a time, location or format that excludes them. Accessible consultation can combine written submissions, public meetings, translated material, clear summaries and formats suitable for people with disabilities. Organisers should explain how personal information will be handled and avoid collecting unnecessary sensitive details. Outreach should aim to hear from affected communities, not only from people who routinely attend public meetings or already know how government procedures work.

## Separate evidence from preference

Submissions may contain personal experiences, predictions, values and factual claims. Each can be useful, but they answer different questions. A personal account may reveal a barrier that aggregate data misses; a statistical claim may need a source and a defined time period; a preference explains which trade-off a participant considers acceptable. Decision makers should record these differences rather than count every statement as if it were the same kind of evidence. Independent data and transparent methods can help test claims without dismissing lived experience.

## Show what happened after consultation

A credible process closes the loop. The responsible institution should publish a summary of themes, identify which proposals were adopted or rejected and give reasons for important choices. Where feasible, it should show how the final decision differs from the initial proposal. A response that merely thanks participants without explaining the outcome makes accountability difficult. A public record also allows later reviewers to compare promises with implementation and identify whether the consultation affected the decision in practice.

## How readers can assess quality

Look for the original consultation notice, the rules for submitting views, the evidence supplied to participants and the published response. Check dates and jurisdiction because similar policies can follow different legal processes in different places. Compare the final decision with the options that were originally open, and distinguish an official explanation from an independent evaluation. International guidance can help frame questions, but local law determines the institution’s formal duties. Consultation is strongest when the scope is honest, access is broad, evidence is considered fairly and the final reasoning is visible.','[{"publisher":"OECD","title":"Open government and public participation","url":"https://www.oecd.org/en/topics/open-government.html"},{"publisher":"United Nations","title":"Democracy and participation","url":"https://www.un.org/en/global-issues/democracy"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/UN_General_Assembly_hall.jpg','The United Nations General Assembly hall',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('politics-public-consultation-ar','politics','ar','كيف تحسّن المشاورات العامة القرارات','دليل عملي لفهم المشاورات العامة، والأدلة التي يقدمها الناس، وتمثيل الفئات المتأثرة، وقياس أثر المشاركة في القرار النهائي.','## المشاورة عملية وليست إجراءً شكليًا

تمنح المشاورات العامة الأشخاص المتأثرين بقرار ما فرصة لشرح احتياجاتهم، والتنبيه إلى آثار لم تُدرس، ومقارنة الحلول الممكنة. لكن عقد اجتماع أو نشر نموذج إلكتروني لا يثبت وحده أن المشاركة كانت مؤثرة. ينبغي توضيح القرار المطروح، والجهة التي تملك صلاحية اتخاذه، والخيارات التي ما زالت مفتوحة، والموعد الذي ستُدرس فيه المشاركات. وإذا كان القرار قد حُسم بالفعل، فعلى الجهة المسؤولة أن تشرح ما الذي يمكن أن يتغير وما الذي لم يعد قابلًا للتعديل.

## حدّد السؤال قبل جمع الآراء

يساعد السؤال الواضح المشاركين على مناقشة المشكلة الفعلية بدلًا من محاولة تخمين ما تريد الجهة سماعه. فقد تتناول مشاورة عن مسار نقل عام زمن الرحلة، وإتاحة الخدمة لذوي الإعاقة، والسلامة، والتكلفة، والربط بوسائل النقل الأخرى. وقد تتأثر الفئات المختلفة بالمقترح نفسه بطرق متباينة؛ لذلك ينبغي نشر نطاق المشاورة والبيانات المتاحة والمعايير التي ستُستخدم للمقارنة. يوضح ذلك طريقة اتخاذ القرار ويحد من هيمنة الأصوات الأعلى أو الأكثر قدرة على الوصول.

## اجعل المشاركة متاحة للجميع

قد يُستبعد بعض الناس إذا كانت المشاركة متاحة في وقت أو مكان أو صيغة لا تناسب ظروفهم. ويمكن الجمع بين المذكرات المكتوبة والاجتماعات العامة والملخصات الواضحة والترجمة والصيغ المناسبة للأشخاص ذوي الإعاقة. كما ينبغي شرح كيفية التعامل مع البيانات الشخصية وتجنب جمع معلومات حساسة لا حاجة إليها. ويجب أن تستهدف الدعوة المجتمعات المتأثرة فعلًا، لا الأشخاص الذين اعتادوا حضور الاجتماعات أو يعرفون مسبقًا إجراءات المؤسسات العامة.

## فرّق بين الدليل والتفضيل

قد تتضمن المشاركات تجارب شخصية أو توقعات أو قيمًا أو ادعاءات واقعية. لكل نوع منها فائدة، لكنه لا يجيب عن السؤال نفسه. فقد تكشف تجربة فردية عائقًا لا يظهر في المتوسطات الإحصائية، بينما يحتاج الادعاء الرقمي إلى مصدر وفترة زمنية محددة، ويشرح التفضيل نوع المفاضلة التي يقبلها صاحبه. من الأفضل تسجيل هذه الفروق بدل التعامل مع كل عبارة كأنها دليل من النوع ذاته. ويمكن للبيانات المستقلة والمنهجيات المعلنة اختبار الادعاءات من دون التقليل من قيمة الخبرة المعيشة.

## انشر ما حدث بعد المشاورة

تكتمل العملية الموثوقة عندما تنشر الجهة المسؤولة خلاصة الموضوعات التي تكررت، وتوضح المقترحات التي قبلتها أو رفضتها وأسباب القرارات المهمة. وحيثما أمكن، ينبغي بيان الاختلاف بين المقترح الأولي والقرار النهائي. أما شكر المشاركين من دون شرح النتيجة فيجعل المساءلة صعبة. كما يسمح السجل العام بمقارنة الوعود بالتنفيذ لاحقًا، ومعرفة ما إذا كانت المشاورات قد أثرت فعلًا في القرار أو بقيت خطوة شكلية.

## كيف تقيّم جودة المشاركة؟

ابحث عن إعلان المشاورة الأصلي، وقواعد إرسال الآراء، والأدلة التي أتيحت للمشاركين، ورد الجهة النهائي. تحقّق من التواريخ والنطاق القانوني، لأن الإجراءات قد تختلف من دولة إلى أخرى حتى عندما تتشابه السياسات. قارن القرار النهائي بالخيارات التي كانت متاحة في البداية، وميّز بين تفسير المؤسسة والتقييم المستقل. تساعد الإرشادات الدولية على صياغة أسئلة جيدة، لكن القانون المحلي هو الذي يحدد الواجبات الرسمية. وتكون المشاورة أقوى عندما يكون نطاقها صريحًا، والوصول إليها واسعًا، وفحص الأدلة عادلًا، وأسباب القرار معلنة.','[{"publisher":"منظمة التعاون الاقتصادي والتنمية","title":"الحكومة المنفتحة والمشاركة العامة","url":"https://www.oecd.org/en/topics/open-government.html"},{"publisher":"الأمم المتحدة","title":"الديمقراطية والمشاركة","url":"https://www.un.org/en/global-issues/democracy"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/UN_General_Assembly_hall.jpg','قاعة الجمعية العامة للأمم المتحدة',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('travel-responsible-heritage-en','travel','en','How to visit heritage places responsibly','How to plan visits to historic places while protecting fragile sites, respecting local communities and separating evidence from tourist myths.','## Heritage is more than a photograph

Historic places hold physical evidence of how people lived, traded, built, worshipped and adapted to changing environments. Their value may include architecture, archaeological layers, living traditions and meanings that remain important to local communities. A responsible visit begins by learning what a place represents and why some areas may be closed or access may be limited. A site is not simply a backdrop for photographs: it is a finite resource that can be damaged by touching surfaces, leaving waste, climbing on structures or ignoring barriers put in place for protection.

## Check the rules before arriving

Entry conditions can change with conservation work, weather, religious events, crowd management or security requirements. Consult the official site authority or heritage organisation before travel, and confirm opening hours, ticket rules, accessibility, photography restrictions and permitted routes. A booking page or social post may not reflect a later closure, so check the latest notice when the visit matters. Keep a flexible plan and follow instructions from authorised staff rather than relying on unverified advice from strangers or old travel blogs.

## Respect people who live and work there

Many heritage places are also neighbourhoods, places of worship, working landscapes or sources of income for local residents. Ask before photographing people, dress appropriately for the setting, keep noise low and avoid blocking doorways or everyday routes. Buy goods and services transparently, agree prices before a service begins and prefer local businesses that explain what they provide. Responsible travel is not about treating every local interaction as a performance for visitors; it means recognising that the site remains part of someone else’s daily life after a tourist leaves.

## Reduce pressure on fragile places

Stay on marked paths, do not remove stones or artefacts, and never write on walls or monuments. Follow rules about drones, flash photography and food, and carry rubbish out when bins are unavailable. Large crowds can wear down surfaces, disturb wildlife and strain water or sanitation systems. When possible, visit at less crowded times, use authorised guides and choose transport options that reduce unnecessary congestion. These small choices cannot solve every conservation challenge, but they lower avoidable damage and help staff protect the site for future visitors.

## Separate established history from attractive stories

Popular destinations often attract dramatic legends, simplified timelines and claims that spread faster than the evidence. Read the interpretation provided by recognised heritage bodies and compare it with museum, archaeological or academic material when a claim seems extraordinary. Ask whether a date is supported by excavation, inscriptions, documents or later tradition, and whether experts disagree. Uncertainty is normal in historical research. A careful guide should explain what is known, what is inferred and what remains debated instead of presenting every story as settled fact.

## Make the trip useful and fair

Before booking, consider whether the operator follows site rules, explains cancellation terms and provides accurate information about access and safety. Carry water where permitted, plan for heat and long walks, and keep emergency contacts available. If an area is restricted, treat the restriction as part of conservation rather than an invitation to find another entrance. After the visit, share practical information responsibly and avoid posting directions to sensitive locations that are vulnerable to damage. UNESCO’s heritage framework and responsible tourism guidance offer useful starting points, while local authorities set the rules that visitors must follow at each place.','[{"publisher":"UNESCO World Heritage Centre","title":"World Heritage and its protection","url":"https://whc.unesco.org/en/about/"},{"publisher":"UN Tourism","title":"Sustainable tourism","url":"https://www.unwto.org/sustainable-development"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/Great_Pyramid_of_Giza.jpg','The Great Pyramid of Giza',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('travel-responsible-heritage-ar','travel','ar','كيف تزور المواقع التراثية بمسؤولية','إرشادات للتخطيط لزيارة المواقع التاريخية مع حماية الأماكن الهشة واحترام السكان المحليين والتمييز بين الحقائق والحكايات السياحية.','## التراث أكبر من صورة تذكارية

تحفظ المواقع التاريخية أدلة مادية على كيفية عيش الناس وتبادلهم وبنائهم وعبادتهم وتكيفهم مع تغير البيئة. وقد تشمل قيمتها العمارة والطبقات الأثرية والتقاليد الحية والمعاني التي ما زالت مهمة للمجتمعات المحلية. تبدأ الزيارة المسؤولة بفهم ما يمثله المكان وسبب إغلاق بعض المناطق أو تقييد الوصول إليها. فالموقع ليس خلفية للتصوير فقط؛ بل مورد محدود يمكن أن يتضرر بلمس الأسطح أو ترك المخلفات أو تسلق المنشآت أو تجاهل الحواجز الموضوعة لحمايته.

## تحقّق من القواعد قبل الوصول

قد تتغير شروط الدخول بسبب أعمال الترميم أو الطقس أو المناسبات الدينية أو تنظيم الحشود أو المتطلبات الأمنية. راجع الجهة الرسمية المسؤولة عن الموقع قبل السفر، وتأكد من مواعيد الزيارة والتذاكر وإتاحة الوصول وقيود التصوير والمسارات المسموح بها. قد لا تعكس صفحة حجز أو منشور قديم إغلاقًا أُعلن لاحقًا، لذلك افحص أحدث التنبيهات عندما تكون الزيارة مهمة. ضع خطة مرنة واتبع تعليمات الموظفين المخولين بدل الاعتماد على نصائح مجهولة أو مدونات سفر قديمة.

## احترم السكان والعاملين في المكان

تكون مواقع التراث في أحيان كثيرة أحياء سكنية أو أماكن عبادة أو أراضي عمل ومصادر دخل للسكان. استأذن قبل تصوير الأشخاص، وراعِ طبيعة المكان في الملابس، وخفّض الضوضاء، ولا تسد المداخل أو المسارات اليومية. تعامل بوضوح عند شراء الخدمات والمنتجات، واتفق على السعر قبل بدء الخدمة، وفضّل الأنشطة المحلية التي تشرح ما تقدمه. لا تعني السياحة المسؤولة تحويل كل تفاعل محلي إلى مشهد للزائر؛ بل تعني إدراك أن المكان جزء من حياة الآخرين اليومية بعد مغادرة السائح.

## خفّف الضغط على المواقع الهشة

التزم بالمسارات المحددة، ولا تجمع الحجارة أو القطع الأثرية، ولا تكتب على الجدران أو الآثار. اتبع قواعد الطائرات المسيّرة والتصوير بالفلاش والطعام، وخذ مخلفاتك معك عندما لا تتوفر حاويات. قد تؤدي الحشود الكبيرة إلى تآكل الأسطح وإزعاج الحياة البرية وزيادة الضغط على المياه والصرف الصحي. إذا أمكن، اختر أوقاتًا أقل ازدحامًا، واستعن بمرشدين مرخصين، واستخدم وسائل نقل تقلل الازدحام غير الضروري. لا تحل هذه الخطوات كل تحديات الحماية، لكنها تقلل الأضرار الممكن تجنبها.

## ميّز التاريخ الموثق عن القصص الجذابة

تجذب الوجهات الشهيرة الأساطير الدرامية والخطوط الزمنية المبسطة والادعاءات التي تنتشر أسرع من الأدلة. اقرأ المعلومات التي تقدمها الجهات التراثية المعروفة، وقارنها بمواد المتاحف أو الدراسات الأثرية والأكاديمية عندما يبدو الادعاء استثنائيًا. اسأل هل يستند التاريخ إلى حفريات أو نقوش أو وثائق أم إلى رواية متأخرة، وهل يوجد خلاف بين المختصين. عدم اليقين أمر طبيعي في البحث التاريخي؛ وعلى الدليل الجيد أن يوضح المعروف والمستنتج وما لا يزال محل نقاش بدل تقديم كل حكاية كحقيقة نهائية.

## اجعل الرحلة نافعة وعادلة

قبل الحجز، تحقّق من التزام مقدم الخدمة بقواعد الموقع، ووضوح شروط الإلغاء، ودقة المعلومات عن الوصول والسلامة. خطط للماء والحرارة والمشي الطويل، واحتفظ بوسائل الاتصال للطوارئ. إذا كانت منطقة مغلقة، فاعتبر ذلك جزءًا من الحماية لا دعوة للبحث عن مدخل بديل. وبعد الزيارة، شارك المعلومات العملية بمسؤولية ولا تنشر إرشادات لمواقع حساسة قد تتعرض للتلف. يوفر إطار التراث العالمي وإرشادات السياحة المسؤولة نقطة بداية مفيدة، بينما تحدد الجهات المحلية القواعد التي يجب اتباعها في كل موقع.','[{"publisher":"مركز التراث العالمي باليونسكو","title":"التراث العالمي وحمايته","url":"https://whc.unesco.org/en/about/"},{"publisher":"الأمم المتحدة للسياحة","title":"السياحة المستدامة","url":"https://www.unwto.org/sustainable-development"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/Great_Pyramid_of_Giza.jpg','الهرم الأكبر في الجيزة',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
