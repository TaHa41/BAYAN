-- Complete, source-backed science and technology articles for both locales.
INSERT OR IGNORE INTO articles
(slug,section,language,title,summary,body,sources_json,status,image_url,image_alt,created_at,updated_at)
VALUES
('science-read-space-observations-en','science','en','How to read evidence from space discoveries','A guide to telescope images, astronomical data, uncertainty and independent confirmation.','## Observation and interpretation

Astronomy begins with measurements of light, radiation or motion, which are then transformed into images, tables and models. A published telescope image may be processed to reveal features that human eyes cannot see directly, so readers should check the mission notes and learn which wavelengths and display colors were used. Processing does not automatically make an image misleading; it explains how researchers moved from recorded signals to a visual representation and which conclusions the representation can support.

## What a telescope can tell us

Different telescopes observe different kinds of light and cover different regions of the sky at different levels of detail. The James Webb Space Telescope observes infrared light, helping researchers investigate distant or cool objects and regions partly obscured by dust. Every instrument still has limits related to sensitivity, exposure time, noise and calibration. A striking image does not mean that every property or the full history of an object is now known.

## From measurements to a claim

Researchers compare observations with models and alternative explanations, then test whether the data support one interpretation or several. Conclusions can change when additional observations become available or when a better analysis method is developed. Readers should separate what was measured directly, what the research team inferred and what remains a hypothesis requiring further tests. This distinction matters when headlines describe every new result as a final discovery.

## Why independent confirmation matters

Confidence grows when independent measurements or different instruments support a similar interpretation, or when another team can analyze the data and reach a comparable result. Independence does not require every team to use the same instrument; observations from other observatories can provide an additional check. Many websites may repeat a single press release, so a large number of headlines does not necessarily mean many independent confirmations.

## How to read a space-science story

Look for the mission or instrument name, the observation date and the scientific organization responsible for the data. Read the original study or mission explanation when available, and distinguish measurements from interpretation. Check what the researchers say they still do not know. If a story relies only on a conference announcement, treat it as an early description until the underlying details can be reviewed.

## What remains uncertain

Measurements may be real while their interpretation remains unsettled. Estimates of distance, mass or age can change as instruments improve and additional observations arrive. That does not undermine science; it illustrates how knowledge is revised. A careful account explains why a finding matters without turning a possibility into certainty or hiding the questions that remain open.','[{"title":"Webb Space Telescope","publisher":"NASA","url":"https://science.nasa.gov/mission/webb/"},{"title":"Webb Space Science","publisher":"European Space Agency","url":"https://www.esa.int/Science_Exploration/Space_Science/Webb"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/James_Webb_Space_Telescope_Mirror.jpg?width=1200','James Webb Space Telescope mirror',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('science-test-scientific-claims-en','science','en','How to test scientific claims','A method for checking research questions, study design, uncertainty and independent replication.','## Start with a precise question

A useful scientific claim can be stated clearly enough to be examined, such as a question about the relationship between two variables or the effect of a defined intervention. Broad statements that a substance cures every disease or that a technology changes everything do not specify a measurable outcome. A precise question helps researchers choose suitable evidence instead of collecting information that merely supports an initial impression.

## Check how data were collected

Evidence strength depends on study design, sample size, participant selection and measurement methods. An observational study can reveal an association, but it cannot by itself prove that one factor caused another. Controlled experiments can help test causation when they are suitable and ethical, yet results remain tied to the conditions of the experiment and to how well the sample represents a wider population.

## Association is not causation

When two events occur together, they may share a common cause or depend on a factor that was not measured. For example, people who use a health service may have better outcomes partly because they differ in age, income or the severity of their condition. Researchers therefore consider confounding factors, use appropriate statistical methods and compare findings with other evidence before making a causal claim.

## What peer review can do

Review by specialists allows methods, analysis and clarity to be examined before publication in many journals. It is not an absolute guarantee of correctness: errors can remain, knowledge can change, and papers can later be corrected or withdrawn. Peer review is one layer of scrutiny alongside transparent data, reproducible analysis, repeated findings and evaluation of the full body of evidence.

## Read the results and limitations

Look beyond a single statistical value. Check the number of participants, time period, outcome measure and size of the observed effect. Read the limitations section to understand what the study cannot establish. If a result is preliminary or appears in a non-peer-reviewed preprint, say so when sharing it rather than presenting it as settled scientific consensus.

## Compare independent sources

Systematic reviews and reports from independent scientific organizations can help establish whether a result fits the wider evidence. Confirm that sources address the same question and do not simply repeat one press release. When findings conflict, examine differences in methods, populations and variable definitions instead of automatically choosing the most dramatic conclusion.

## A practical checklist

Ask what was actually measured, how it was measured, what alternative explanations remain and whether the result has been replicated. Separate the study data from the authors interpretation and from media headlines. You do not need to become an expert in every field to recognize overstatement; these questions help you assess confidence fairly and acknowledge what the evidence has not yet settled.','[{"title":"Understanding Science","publisher":"University of California Museum of Paleontology","url":"https://undsci.berkeley.edu/"},{"title":"Science and Engineering Indicators","publisher":"National Science Foundation","url":"https://ncses.nsf.gov/indicators"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/Microscope.jpg?width=1200','Microscope used in scientific research',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('technology-understand-generative-ai-ar','technology','ar','الذكاء الاصطناعي التوليدي: كيف يعمل وما حدوده؟','شرح للنماذج التوليدية وأخطائها المحتملة والتحيز والخصوصية وطرق التحقق من المخرجات.','## ما الذي يولده النموذج؟

يتعلم الذكاء الاصطناعي التوليدي أنماطًا من بيانات التدريب ثم يستخدمها لإنتاج نص أو صورة أو صوت أو شيفرة استجابةً لطلب المستخدم. لا يعني ذلك أنه يملك قاعدة حقائق كاملة أو أنه يفهم كل عبارة بالطريقة البشرية. تعتمد النتيجة على البيانات والتصميم والسياق والتعليمات، وقد تبدو الإجابة واثقة ومنظمة حتى عندما تكون بعض تفاصيلها غير صحيحة.

## لماذا تظهر أخطاء مقنعة؟

قد يكمل النموذج نمطًا لغويًا مألوفًا بدل أن يتحقق من حقيقة خارجية، وقد يخلط بين أسماء متشابهة أو يركب تفاصيل من مصادر مختلفة. لذلك لا يكفي الأسلوب الجيد أو طول الإجابة لإثبات الدقة. عندما تتعلق الإجابة بشخص أو رقم أو تاريخ أو قرار حالي، يجب الرجوع إلى مصدر مباشر مناسب وفحص ما إذا كان المصدر يدعم الادعاء المحدد لا الموضوع العام فقط.

## البيانات والتحيز

تعكس مخرجات الأنظمة بعض خصائص البيانات التي تعلمت منها، بما فيها النقص والتحيزات التاريخية واختلاف تمثيل اللغات والفئات. قد تكون النتائج أقل دقة في سياقات أو لهجات لا تظهر بما يكفي في بيانات التدريب. ينبغي تقييم النظام على أمثلة متنوعة، وتوثيق الحالات التي يفشل فيها، وإتاحة مراجعة بشرية في القرارات التي قد تؤثر في الحقوق أو فرص العمل أو الخدمات.

## الخصوصية والاستخدام المسؤول

لا تضع كلمات المرور أو بيانات الهوية أو الملفات السرية في أداة لا تعرف طريقة معالجتها للمعلومات. اقرأ سياسة الخدمة، وافهم خيارات الاحتفاظ بالبيانات واستخدامها، وقلل المعلومات التي تشاركها إلى الحد الضروري. وفي المؤسسات، ينبغي تحديد من يستطيع الوصول إلى المخرجات وكيفية مراجعتها قبل نقلها إلى سجلات أو أنظمة تشغيلية.

## كيف تتحقق من الإجابة؟

اطلب من النظام فصل الحقائق عن الاستنتاجات والافتراضات، ثم تحقق من أهم الادعاءات في مصادر أولية أو مستقلة. افتح الرابط نفسه بدل الاكتفاء بعنوان المصدر، وتأكد من أن النص يدعم العبارة. إذا تعارض مصدران، فلا تختَر الأكثر ثقة في الصياغة؛ افحص التاريخ والسياق والجهة التي أصدرت المعلومة. واطلب تصحيحًا محددًا عند اكتشاف خطأ بدل إعادة استخدام الإجابة كما هي.

## أين يفيد الإنسان؟

يمكن للنظام أن يساعد في تلخيص نص طويل أو اقتراح أفكار أو شرح مفهوم أو إعداد مسودة أولية. لكنه لا يعفي المستخدم من مراجعة المعلومات، ولا ينبغي أن ينفذ وحده قرارًا عالي المخاطر. أفضل استخدام يجمع سرعة التوليد مع أدلة قابلة للفحص ومراجعة مناسبة وتوثيق للحدود.

## خلاصة

تعامل مع المخرجات بوصفها اقتراحًا يحتاج إلى تقييم، لا شهادة صحة تلقائية. حدد ما تريد معرفته، وافحص المصادر، واحمِ البيانات الخاصة، وراقب التحيز والأخطاء المتكررة. عندما لا تتوفر أدلة كافية، يجب أن يصرح النظام بذلك بدل اختراع تفاصيل لإكمال الإجابة.','[{"title":"AI Risk Management Framework","publisher":"National Institute of Standards and Technology","url":"https://www.nist.gov/itl/ai-risk-management-framework"},{"title":"Recommendation on the Ethics of Artificial Intelligence","publisher":"UNESCO","url":"https://www.unesco.org/en/artificial-intelligence/recommendation-ethics"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/Computer_keyboard.jpg?width=1200','لوحة مفاتيح حاسوب',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('technology-protect-online-accounts-ar','technology','ar','تقنية الأمن السيبراني: حماية الحسابات من الاختراق','خطوات لحماية الحسابات وكشف التصيد وتحديث الأجهزة واستعادة الوصول بأمان.','## ابدأ بكلمة مرور فريدة

استخدام كلمة المرور نفسها في خدمات متعددة يجعل اختراق حساب واحد خطرًا على بقية الحسابات. استخدم كلمة مرور طويلة وفريدة لكل خدمة، ويمكن لمدير كلمات المرور الموثوق أن يساعدك في إنشائها وحفظها. لا ترسل كلمات المرور عبر الرسائل ولا تكتبها في ملفات مشتركة. وإذا أبلغت الخدمة عن تسريب، غيّر كلمة المرور من الموقع أو التطبيق الرسمي لا من رابط وصل برسالة مفاجئة.

## فعّل المصادقة متعددة العوامل

تضيف المصادقة متعددة العوامل خطوة أخرى بعد كلمة المرور، مثل تطبيق مصادقة أو مفتاح أمان أو وسيلة تحقق أخرى. هذا لا يجعل الحساب محصنًا تمامًا، لكنه يقلل خطر الدخول بكلمة مرور مسروقة وحدها. احفظ رموز الاسترداد في مكان آمن، وحدد طريقة لاستعادة الحساب إذا فقدت الهاتف، ولا توافق على طلب تسجيل دخول لم تبدأه بنفسك.

## تعرّف على رسائل التصيد

قد تنتحل الرسالة صفة بنك أو شركة شحن أو جهة حكومية وتضغط عليك لاتخاذ إجراء عاجل. افحص عنوان المرسل والرابط ووجود أخطاء أو طلبات غير معتادة، ولا تعتمد على الشعار أو اسم العرض فقط. إذا طلبت الرسالة كلمة المرور أو رمز التحقق أو الدفع عبر طريقة غريبة، افتح التطبيق الرسمي يدويًا أو اتصل بالجهة عبر وسيلة تعرفها مسبقًا.

## حدّث الأجهزة والتطبيقات

تصلح التحديثات الأمنية ثغرات يمكن أن يستغلها المهاجمون. فعّل التحديث التلقائي عندما يكون مناسبًا، وأزل التطبيقات التي لم تعد تستخدمها، واقفل الهاتف والحاسوب برمز قوي. استخدم نسخًا احتياطية منتظمة للملفات المهمة، واختبر إمكانية استعادتها؛ فوجود نسخة لم تختبرها لا يضمن أنك ستستطيع استرجاع بياناتك وقت الحاجة.

## ماذا تفعل عند الاشتباه بالاختراق؟

استخدم جهازًا موثوقًا لتغيير كلمة المرور، وأنهِ الجلسات غير المعروفة، وراجع وسائل الاسترداد وقواعد إعادة توجيه البريد. اتصل بمزود الخدمة أو البنك من قناة رسمية إذا كانت معلومات مالية معرضة للخطر. احتفظ بالرسائل والسجلات المهمة، ولا تدفع لشخص مجهول يعدك باستعادة الحساب قبل التحقق من هويته وخبرته.

## لا تشارك رموز التحقق

رمز التحقق المؤقت يعادل مفتاحًا قصير العمر للحساب، وقد يطلبه المحتال بحجة أنه موظف دعم أو شخص يساعدك. لا تشاركه مع أي شخص، حتى لو كان يعرف اسمك أو بعض تفاصيلك. الموظف الشرعي لا يحتاج عادةً إلى أن تملي عليه رمز تسجيل الدخول الكامل كي يحمي الحساب.

## خطة حماية بسيطة

ابدأ بالبريد الإلكتروني لأنه غالبًا وسيلة استعادة حسابات أخرى، ثم أمّن الحسابات المالية والاجتماعية. استخدم كلمات مرور فريدة ومصادقة متعددة العوامل وتحديثات منتظمة، وراجع التنبيهات والجلسات. هذه الخطوات لا تلغي كل المخاطر، لكنها تقلل فرص الاختراق وتساعدك على اكتشاف المشكلة مبكرًا.','[{"title":"Secure Our World","publisher":"Cybersecurity and Infrastructure Security Agency","url":"https://www.cisa.gov/secure-our-world"},{"title":"Recognizing and Avoiding Phishing Scams","publisher":"Federal Trade Commission","url":"https://consumer.ftc.gov/articles/how-recognize-and-avoid-phishing-scams"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/Computer_keyboard.jpg?width=1200','لوحة مفاتيح حاسوب',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('technology-understand-generative-ai-en','technology','en','Generative AI: how it works and where it fails','An accessible guide to generative models, convincing errors, bias, privacy and evidence-based verification.','## What a model generates

Generative artificial intelligence learns patterns from training data and uses them to produce text, images, audio or code in response to a prompt. This does not mean that it contains a complete database of facts or understands every statement in the human sense. Output depends on data, design, context and instructions. A response can sound confident and well organized even when some details are wrong.

## Why convincing errors happen

A model may continue a familiar language pattern instead of checking an external fact. It can confuse people with similar names or combine details from different sources. Good writing and a long answer do not prove accuracy. For claims about a person, number, date or current decision, consult a suitable direct source and check whether it supports the specific claim rather than the general topic.

## Data and bias

System outputs can reflect gaps and historical biases in the data used to build them, including uneven representation of languages, dialects and communities. Performance may be weaker in contexts that appear rarely in training or evaluation. Responsible deployment requires testing diverse examples, documenting failures and keeping human review for decisions that may affect rights, employment, access to services or other important interests.

## Privacy and responsible use

Do not submit passwords, identity documents or confidential files to a service unless you understand how the information is handled. Read the service policy, understand retention and data-use options, and share only what is necessary. Organizations should define who can access outputs and how they are reviewed before the information is copied into records or operational systems.

## How to verify an answer

Ask the system to separate facts from inferences and assumptions, then check important claims against primary or independent sources. Open the source itself rather than relying on its title, and confirm that the page supports the statement. If sources disagree, do not choose the one that sounds most certain; compare dates, context and the organizations responsible. When an error appears, request a specific correction instead of reusing the answer unchanged.

## Where human judgment matters

A model can help summarize a long text, brainstorm ideas, explain a concept or prepare a first draft. It does not remove the need to review information and should not independently make high-impact decisions. Strong use combines fast generation with inspectable evidence, suitable human review and clear documentation of limitations.

## Practical takeaway

Treat generated output as a proposal to evaluate, not an automatic certificate of truth. Define the question, inspect sources, protect private data and watch for recurring errors or bias. When evidence is missing, a responsible system should say so instead of inventing details to complete a polished response.','[{"title":"AI Risk Management Framework","publisher":"National Institute of Standards and Technology","url":"https://www.nist.gov/itl/ai-risk-management-framework"},{"title":"Recommendation on the Ethics of Artificial Intelligence","publisher":"UNESCO","url":"https://www.unesco.org/en/artificial-intelligence/recommendation-ethics"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/Computer_keyboard.jpg?width=1200','Computer keyboard',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('technology-protect-online-accounts-en','technology','en','Cybersecurity: how to protect online accounts','Practical steps for unique passwords, multi-factor authentication, phishing detection, software updates and recovery.','## Start with unique passwords

Reusing one password across services turns a breach at one site into a risk for other accounts. Use a long, unique password for each service; a reputable password manager can help create and store them. Never send passwords through messages or leave them in shared files. If a service reports a breach, change the password from its official site or app rather than following a surprise link in a message.

## Turn on multi-factor authentication

Multi-factor authentication adds a step after the password, such as an authenticator app, security key or another verification method. It does not make an account invulnerable, but it reduces the risk of access with a stolen password alone. Store recovery codes securely, plan how to regain access if your phone is lost, and never approve a sign-in request you did not initiate.

## Recognize phishing attempts

A message may impersonate a bank, delivery company or government office and pressure you to act urgently. Check the sender address, link destination, unusual wording and unexpected requests. Do not rely on a logo or display name. If a message asks for a password, verification code or payment through an unusual method, open the official app manually or contact the organization through a channel you already trust.

## Update devices and applications

Security updates repair weaknesses that attackers may exploit. Enable automatic updates when appropriate, remove apps you no longer use and lock your devices with a strong passcode. Keep regular backups of important files and test that you can restore them. A backup that has never been tested does not guarantee that your information will be recoverable when you need it.

## Responding to a suspected compromise

Use a trusted device to change the password, end unfamiliar sessions and review recovery methods and email forwarding rules. Contact the service provider or bank through an official channel if financial information may be at risk. Preserve relevant messages and logs. Be cautious of strangers who promise to recover an account for a fee before you can verify their identity and expertise.

## Never share verification codes

A temporary verification code is a short-lived key to an account. A scammer may ask for it while pretending to be support staff or someone helping you. Do not share it with anyone, even if the person knows your name or some personal details. Legitimate staff generally do not need you to read out a full sign-in code to protect an account.

## A simple protection plan

Secure your email account first because it often helps recover other accounts, then protect financial and social accounts. Use unique passwords, multi-factor authentication and regular updates, and review alerts and active sessions. These steps do not eliminate every risk, but they lower the chance of compromise and help you detect problems earlier.','[{"title":"Secure Our World","publisher":"Cybersecurity and Infrastructure Security Agency","url":"https://www.cisa.gov/secure-our-world"},{"title":"Recognizing and Avoiding Phishing Scams","publisher":"Federal Trade Commission","url":"https://consumer.ftc.gov/articles/how-recognize-and-avoid-phishing-scams"}]','PUBLISHED','https://commons.wikimedia.org/wiki/Special:FilePath/Computer_keyboard.jpg?width=1200','Computer keyboard',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now'));
