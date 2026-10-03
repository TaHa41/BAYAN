(()=>{window.addEventListener("error",()=>{const app=document.querySelector("#app");if(app&&!app.innerHTML.trim()){app.innerHTML='<section class="page"><h1 class="page-title">بيان يعمل على وضع الاسترداد</h1><p class="page-lead">حدث خطأ مؤقت في الواجهة. أعد تحميل الصفحة، وإذا استمرت المشكلة سيتم تسجيلها للتشخيص.</p><button class="primary" type="button" onclick="location.reload()">إعادة المحاولة</button></section>';}});window.addEventListener("unhandledrejection",()=>{const app=document.querySelector("#app");if(app&&!app.innerHTML.trim()){app.innerHTML='<section class="page"><h1 class="page-title">تعذر تحميل الصفحة</h1><p class="page-lead">تم إيقاف الجزء المتعطل بدل ترك الصفحة فارغة.</p><button class="primary" type="button" onclick="location.reload()">إعادة المحاولة</button></section>';}});const sections=[["egypt","مصر: معرفة وأحداث","Egypt"],["arab","العالم العربي: سياق وأحداث","Arab World"],["world","العالم: ما يستحق المعرفة","World"],["science","علوم وفهم","Science & Understanding"],["economy","اقتصاد ومال","Economy & Money"],["politics","سياسة وشأن عام","Politics & Public Affairs"],["technology","تقنية وذكاء اصطناعي","Technology & AI"],["health","صحة وطب","Health & Medicine"],["history-culture","تاريخ وثقافة","History & Culture"],["people","أشخاص وسير","People & Profiles"],["sports","رياضة وبيانات","Sports & Data"],["travel","سفر وأماكن","Travel & Places"],["arts","فن وترفيه","Arts & Entertainment"],["news","أخبار موثقة","Verified News"],["trending","اهتمام واتجاهات","Trends & Interest"],["prices","أسعار وبيانات مباشرة","Live Prices & Data"],["search","بحث ومعرفة","Search & Knowledge"]];const descriptions={egypt:"معرفة عن مصر وشرح للسياق وراء الأحداث والموضوعات التي تهم القارئ، مع مصادر واضحة.",arab:"موضوعات وأحداث من العالم العربي، مع خلفية تساعد على فهم الخبر بدل الاكتفاء بالعنوان.",world:"معرفة وأحداث من العالم، منتقاة للوضوح والفائدة، مع فصل الخبر عن التفسير والادعاء.",science:"شرح علمي واضح يبدأ من السؤال وينتهي بالدليل.",economy:"مفاهيم وبيانات اقتصادية تساعدك على فهم ما يحدث.",politics:"معلومات سياسية موثقة ومحايدة مع تمييز الخبر عن الادعاء والرأي.",technology:"تقنيات ومنتجات ومفاهيم رقمية بشرح عملي.",health:"معلومات صحية موثوقة مع عناية أعلى بالمصادر وحدود المعلومة.","history-culture":"تاريخ وثقافة وسياق يساعدك على فهم الأحداث والأفكار.",people:"صفحات الأشخاص تجمع السيرة والأحداث والمصادر في مكان واحد.",sports:"رياضة وبيانات وأحداث مع تحديثات عندما تتوفر مصادر مباشرة.",travel:"معلومات الأماكن والسفر والطقس وما يحتاجه المسافر.",arts:"فنون وترفيه وثقافة مع سياق ومصادر.",news:"الأخبار المهمة بعد التحقق، لا مجرد تجميع عناوين.",trending:"الموضوعات التي يرتفع عليها اهتمام الزوار، بعد اجتياز التحقق.",prices:"بيانات الأسعار والأسواق من مصادر مباشرة عندما تكون متاحة.",search:"ابحث في المعرفة والأخبار والأشخاص والموضوعات والأسئلة من مكان واحد."};const info={about:["عن بيان","About BAYAN","منصة معرفة وبحث عربية وإنجليزية تُبنى حول الأدلة والمصادر والوضوح."],methodology:["المنهجية","Methodology","نكتشف المحتوى من مصادر متعددة، نسترجع الأدلة، نتحقق، ثم نقرر ما يصلح للنشر."],privacy:["الخصوصية","Privacy","نستخدم أقل قدر ممكن من البيانات اللازمة لتشغيل المنصة. عند تفعيل الإعلانات، قد تستخدم شبكات الإعلانات تقنيات قياس وعرض خاصة بها وفق إعدادات الحساب والسياسات المعمول بها."],terms:["الشروط","Terms","قواعد استخدام المنصة والمحتوى والأدوات الذكية."],contact:["تواصل","Contact","للملاحظات وتصحيح المعلومات والإبلاغ عن المشكلات."]};const content={science:["لماذا السماء زرقاء؟","الضوء يتفاعل مع الغلاف الجوي، وتبعثر الأطوال الموجية الأقصر يجعل السماء تبدو زرقاء في ظروف النهار المعتادة."],technology:["كيف تحمي حساباتك؟","استخدم كلمة مرور فريدة ومدير كلمات مرور، فعّل المصادقة متعددة العوامل، ولا تدخل بياناتك في روابط غير موثوقة."],economy:["كيف نفهم تغيّر الأسعار؟","السعر يتأثر بالعرض والطلب والتكاليف والسيولة والسياسات والظروف المحلية والعالمية؛ لذلك يجب ربط الرقم بوقته ومصدره."],health:["كيف أقيّم معلومة صحية؟","ابدأ بالمصدر، تاريخ المعلومة، قوة الدليل، وما إذا كانت تنطبق على حالتك. لا تستبدل المعلومات العامة بتقييم طبي متخصص."],sports:["كيف نفهم إحصائية رياضية؟","أي رقم رياضي يحتاج إلى تعريف واضح للفترة والمسابقة ومصدر البيانات قبل مقارنته بأرقام أخرى."],travel:["ماذا أحتاج قبل السفر؟","تحقق من الطقس، متطلبات الدخول، وسائل النقل، ساعات العمل، والتنبيهات الرسمية قبل اتخاذ القرار."],prices:["كيف أقرأ السعر؟","تحقق من الوحدة والعملة ووقت التحديث ومصدر السعر؛ السعر الحالي لا ينبغي أن يُستنتج من معلومة قديمة." ]};const sectionGuides={
egypt:["مصر — جغرافيا وتاريخ ومجتمع","محتوى تمهيدي خاص بمصر يجمع الجغرافيا والتاريخ والمجتمع والاقتصاد والثقافة مع فصل الحقائق الثابتة عن الأخبار المتغيرة."],
arab:["العالم العربي — دول ومجتمعات وسياق","محتوى تمهيدي خاص بالعالم العربي يوضح التنوع بين الدول والمجتمعات والاقتصادات، دون اختزال المنطقة في قصة واحدة."],
world:["العالم — أحداث ومعرفة وسياق","محتوى تمهيدي خاص بالعالم يساعد على فهم الأحداث الدولية من خلال المكان والزمن والأطراف والسياق والمصادر."],
science:["علوم وفهم — المنهج العلمي وموضوعات علمية","مقدمة للمنهج العلمي ثم موضوعات علمية قابلة للشرح والتحقق، من السؤال والفرضية إلى الاختبار وتحليل النتائج."],
economy:["اقتصاد ومال — التضخم وقراءة الأسعار","محتوى يشرح التضخم والأسعار والمؤشرات المالية، مع ربط كل رقم بالفترة والوحدة والمصدر."],
politics:["سياسة وشأن عام — الأخبار والسياسات","محتوى يشرح كيفية قراءة الأخبار السياسية والسياسات العامة، مع الفصل بين الوقائع والتصريحات والتحليل."],
technology:["تقنية وذكاء اصطناعي — AI والأمان الرقمي","محتوى عن الذكاء الاصطناعي والتقنيات الرقمية والأمان الرقمي، من المفاهيم الأساسية إلى الاستخدامات العملية."],
health:["صحة وطب — المعلومات والأدلة الطبية","محتوى يساعد على تقييم المعلومات الصحية وفهم الأدلة الطبية، مع التمييز بين التوعية العامة والنصيحة الطبية الشخصية."],
"history-culture":["تاريخ وثقافة — السياق والتراث","محتوى عن التاريخ والثقافة والتراث يضع الأحداث والأعمال في سياقها الزمني والاجتماعي."],
people:["أشخاص وسير — بناء والتحقق من الملفات","محتوى يشرح كيفية بناء سيرة موثقة لشخص ومقارنة الأسماء والتواريخ والأحداث والمصادر."],
sports:["رياضة وبيانات — قراءة الإحصائيات","محتوى رياضي يشرح الأرقام والإحصائيات مع تحديد الموسم والمسابقة وحجم العينة ومصدر البيانات."],
travel:["سفر وأماكن — التخطيط والتحقق","محتوى عن الأماكن والسفر والتخطيط للرحلات، مع التحقق من الدخول والطقس والتنقل والتنبيهات الرسمية."],
arts:["فن وترفيه — قراءة الأعمال والسياق","محتوى عن الفنون والترفيه يشرح الأعمال من خلال الفنان والفترة والأسلوب والوسيط والسياق الثقافي."],
news:["أخبار موثقة — الخبر والتحليل","محتوى يشرح التحقق من الخبر والفرق بين الوقائع والتصريحات والتحليل قبل عرض المادة للقارئ."],
trending:["اهتمام واتجاهات — فهم الترند والإشارات","محتوى يشرح إشارات الاهتمام والترند وكيفية قراءة بيانات البحث والتفاعل دون الخلط بينها وبين صحة المعلومة."],
prices:["أسعار وبيانات مباشرة — قراءة الأسعار وتغيراتها","محتوى يشرح الأسعار والبيانات المباشرة مع الوحدة والعملة ووقت التحديث والمصدر."]
};const iconPaths={egypt:"M4 18h16M6 18V9l6-5 6 5v9M9 18v-5h6v5",arab:"M12 3a9 9 0 1 0 0 18 9 9 0 0 0-0-18ZM3 12h18M12 3c3 3 3 15 0 18",world:"M12 3a9 9 0 1 0 0 18 9 9 0 0 0-0-18ZM3 12h18M12 3c2.5 2.5 2.5 15 0 18",science:"M9 3v5l-5 8a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-5-8V3M8 3h8M7 15h10",economy:"M4 19V9M10 19V5M16 19v-8M22 19H2",politics:"M6 21V5M6 5h11l-3 4 3 4H6M3 21h6",technology:"M8 8h8v8H8zM4 10v4M20 10v4M10 4v4M14 4v4M10 16v4M14 16v4",health:"M12 20s-7-4.4-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.6-7 10-7 10ZM9 11h6M12 8v6","history-culture":"M4 20h16M6 17h12M8 14h8M10 11h4M12 4v7",people:"M8 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4M16 11a3 3 0 1 0 0-6M15 17h2a4 4 0 0 1 4 4",sports:"M12 3v18M3 12h18M5 5l14 14M19 5 5 19",travel:"M3 18l18-6M5 13l-2-5 2-1 5 4M14 8l2-4 2 1-1 5M9 15l2 4",arts:"M12 3a9 9 0 1 0 0 18 9 9 0 0 0-0-18ZM7 14c2-1 4-1 5 1M8 8h.01M16 8h.01M10 11h4",news:"M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1ZM8 8h8M8 12h8M8 16h5",trending:"M4 18l6-6 4 4 6-8M16 8h4v4",prices:"M12 3v18M17 7c0-2-2-3-5-3s-5 1-5 3 2 3 5 3 5 1 5 3-2 3-5 3-5-1-5-3"};const sectionIcon=key=>{const d=iconPaths[key]||"M5 12h14M12 5v14";return `<svg class="section-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"></path></svg>`};const path=location.pathname.replace(/^\//,"").replace(/\/$/,""),params=new URLSearchParams(location.search),isEn=params.get("lang")==="en";
const visitorId=(()=>{try{let id=localStorage.getItem("bayan:visitor-id");if(!id){id=(crypto.randomUUID?crypto.randomUUID():"v-"+Date.now()+"-"+Math.random().toString(36).slice(2));localStorage.setItem("bayan:visitor-id",id);}return id;}catch{return "anonymous-"+Math.random().toString(36).slice(2);}})();
const recordInterest=(section,eventType="view")=>{if(!section)return;try{const key="bayan:interests";const data=JSON.parse(localStorage.getItem(key)||"{}");data[section]=(Number(data[section])||0)+(eventType==="save"?3:eventType==="search"?2:1);localStorage.setItem(key,JSON.stringify(data));}catch{}fetch("/api/interest",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({visitorId,section,eventType,language:isEn?"en":"ar"})}).catch(()=>{});};const recordAnalytics=(eventType,pathName,query="")=>{try{fetch("/api/analytics/event",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({visitorId,eventType,path:pathName||"/",query,language:isEn?"en":"ar"}),keepalive:true}).catch(()=>{});}catch{}};const escapeHtml=(v)=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/\'/g,"&#39;");const withLang=href=>{if(!isEn)return href;const u=new URL(href,location.origin);u.searchParams.set("lang","en");return u.pathname+u.search};document.documentElement.lang=isEn?"en":"ar";document.documentElement.dir=isEn?"ltr":"rtl";document.body.dataset.section=path||"home";const nav=document.querySelector("#nav");nav.innerHTML=sections.map(x=>'<a class="'+(path===x[0]?"active":"")+'" href="'+withLang("/"+x[0])+'">'+sectionIcon(x[0])+(isEn?x[2]:x[1])+"</a>").join("");document.querySelector("#menu")?.addEventListener("click",()=>{const open=nav.classList.toggle("open");document.querySelector("#menu").setAttribute("aria-expanded",String(open))});const headerSearch=document.querySelector(".site-header .searchbar");headerSearch?.addEventListener("submit",(event)=>{event.preventDefault();const input=headerSearch.querySelector('input[name="q"]');const query=input?.value.trim()||"";if(!query){safeRenderRoute("search");history.pushState({},"","/search");return;}const u=new URL("/search",location.origin);u.searchParams.set("q",query);history.pushState({q:query},"",u.pathname+u.search);safeRenderRoute("search");window.scrollTo({top:0,behavior:"smooth"});});const app=document.querySelector("#app");const title=x=>isEn?x[2]:x[1];function summaryBlock(items){return '<section class="summary"><h2>'+(isEn?"Quick Summary":"الخلاصة")+'</h2><ul>'+items.map(x=>"<li>"+x+"</li>").join("")+"</ul></section>"}function adSlot(slot){return '<div class="ad-slot" data-ad-slot="'+slot+'" hidden><span>إعلان</span></div>'}function evidence(){return '<div class="evidence-strip"><span class="badge">'+(isEn?"Sources required":"المصادر مطلوبة")+'</span><span class="badge">'+(isEn?"Verification":"حالة التحقق")+'</span><span class="badge">'+(isEn?"Updated with evidence":"التحديث مرتبط بالدليل")+'</span></div>'}function editorialArticles(){const list=window.BAYAN_CONTENT?.articles||[];const meta=window.BAYAN_CONTENT?.sectionMeta||{};return '<section><div class="section-head"><div><h2>مقالات بيان</h2><p>محتوى أصلي يشرح ويجيب، وليس مجرد نتائج بحث.</p></div></div><div class="grid article-grid">'+list.slice(0,6).map(a=>'<a class="card article-card" href="'+withLang("/article/"+a.id)+'"><span class="article-section">'+sectionIcon(a.section)+(meta[a.section]||a.section)+'</span><h3>'+a.title+'</h3><p>'+a.summary+'</p><small>'+a.readTime+'</small></a>').join("")+'</div></section>'}async function loadHomeNewsAndDiscovery(){
  const trendBox=document.querySelector("#homeTrendingPreview");
  const newsBox=document.querySelector("#homeNewsPreview");
  if(!trendBox&&!newsBox)return;
  const lang=isEn?"en":"ar";
  const esc=(v)=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  try{
    const [trendRes,newsRes]=await Promise.all([
      fetch("/api/trending?lang="+lang),
      fetch("/api/news?lang="+lang)
    ]);
    const [trend,news]=await Promise.all([trendRes.json(),newsRes.json()]);
    if(trendBox){
      const signals=Array.isArray(trend.signals)?trend.signals.slice(0,3):[];
      trendBox.innerHTML=signals.length?signals.map(x=>'<a class="signal-item" href="'+esc(x.url||("/search?q="+encodeURIComponent(x.title||"")))+'" target="'+(x.url?"_blank":"_self")+'" rel="'+(x.url?"noopener noreferrer":"")+'"><strong>'+esc(x.title)+'</strong><small>'+esc(x.source||"مصدر مباشر")+(x.date?" · "+esc(x.date):"")+'</small></a>').join(""):'<p class="muted">لم تصل إشارات حديثة قابلة للعرض الآن.</p>';
    }
    if(newsBox){
      const articles=Array.isArray(news.articles)?news.articles.slice(0,3):[];
      newsBox.innerHTML=articles.length?articles.map(x=>'<a class="signal-item" href="'+esc(x.url||("/search?q="+encodeURIComponent(x.title||"")))+'" target="'+(x.url?"_blank":"_self")+'" rel="'+(x.url?"noopener noreferrer":"")+'"><strong>'+esc(x.title)+'</strong><small>'+esc(x.source?.name||"مصدر مباشر")+(x.publishedAt?" · "+esc(x.publishedAt):"")+'</small></a>').join(""):'<p class="muted">لم تصل أخبار حديثة قابلة للعرض الآن.</p>';
    }
  }catch{
    if(trendBox)trendBox.innerHTML='<p class="muted">تعذر تحديث الإشارات مؤقتًا.</p>';
    if(newsBox)newsBox.innerHTML='<p class="muted">تعذر تحديث الأخبار مؤقتًا.</p>';
  }
}
async function liveDataHome(){
const box=document.querySelector("#liveDataGrid"); if(!box)return;
const city=document.querySelector("#weatherCity")?.value.trim()||"Cairo";
box.innerHTML='<div class="live-loading">جارٍ تحديث البيانات من المصادر المباشرة…</div>';
try{
const [weatherRes,usdRes,eurRes,gbpRes,sarRes,aedRes,goldRes]=await Promise.all([
fetch("/api/weather?city="+encodeURIComponent(city)),fetch("/api/markets?base=USD&quote=EGP"),fetch("/api/markets?base=EUR&quote=EGP"),fetch("/api/markets?base=GBP&quote=EGP"),fetch("/api/markets?base=SAR&quote=EGP"),fetch("/api/markets?base=AED&quote=EGP"),fetch("/api/gold")
]);
const [weather,usd,eur,gbp,sar,aed,gold]=await Promise.all([weatherRes.json(),usdRes.json(),eurRes.json(),gbpRes.json(),sarRes.json(),aedRes.json(),goldRes.json()]);
const esc=(v)=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const money=(x)=>typeof x==="number"?x.toLocaleString("en-EG",{maximumFractionDigits:2}):"—";
const rateCard=(name,d)=>d?.status==="ok"?'<article class="card live-card"><span class="number">FX</span><h3>'+name+' / EGP</h3><strong>'+money(d.rate)+'</strong><small>لكل 1 '+name+' · المصدر: '+esc(d.source||"Frankfurter")+' · '+esc(d.updatedAt||"—")+'</small></article>':'<article class="card live-card"><span class="number">FX</span><h3>'+name+' / EGP</h3><strong>غير متاح</strong><small>لم يتم عرض رقم غير متحقق منه.</small></article>';
const weatherLabels={0:"صحو",1:"غائم جزئيًا",2:"غائم جزئيًا",3:"غائم",45:"ضباب",48:"ضباب",51:"رذاذ",53:"رذاذ",55:"رذاذ كثيف",61:"مطر خفيف",63:"مطر",65:"مطر غزير",71:"ثلوج خفيفة",73:"ثلوج",75:"ثلوج غزيرة",80:"زخات مطر",81:"زخات مطر",82:"زخات مطر غزيرة",95:"عواصف رعدية",96:"عواصف رعدية مع برد",99:"عواصف رعدية مع برد"};const weatherLabel=isEn?(weather.weatherCode!=null?"Weather code "+weather.weatherCode:"Weather unavailable"):(weatherLabels[weather.weatherCode]||"حالة جوية غير محددة");const weatherCard=weather.status==="ok"?'<article class="card live-card weather-card"><span class="number">WEATHER · '+esc(weather.city)+'</span><h3>'+esc(weather.country||"")+'</h3><strong>'+money(weather.temperature)+'°C</strong><p>'+esc(weatherLabel)+' · '+(isEn?"Humidity ":"رطوبة ")+money(weather.humidity)+'%</p><small>'+(isEn?"Source: ":"المصدر: ")+esc(weather.source||"Open-Meteo")+' · '+esc(weather.updatedAt||"—")+'</small></article>':'<article class="card live-card"><span class="number">WEATHER</span><h3>تعذر تحديث الطقس</h3><p>جرّب مدينة أخرى.</p></article>';
const goldCard=gold.status==="ok"?'<article class="card live-card gold-card"><span class="number">GOLD</span><h3>الذهب بالجنيه المصري</h3><div class="mini-values"><span>24K <b>'+money(gold.karat24Egp)+'</b></span><span>21K <b>'+money(gold.karat21Egp)+'</b></span><span>18K <b>'+money(gold.karat18Egp)+'</b></span></div><small>جرام · تحديث المصدر: '+esc(gold.updatedAt||"—")+'</small></article>':'<article class="card live-card"><span class="number">GOLD</span><h3>الذهب غير متاح الآن</h3><p>لا نعرض رقمًا غير موثوق.</p></article>';
box.innerHTML=weatherCard+rateCard("USD",usd)+rateCard("EUR",eur)+rateCard("GBP",gbp)+rateCard("SAR",sar)+rateCard("AED",aed)+goldCard;
}catch{box.innerHTML='<div class="card"><h3>تعذر تحديث البيانات</h3><p class="muted">لم يتم عرض أرقام غير متحقق منها.</p></div>';}
}
function pricesPage(){
app.innerHTML='<section class="page"><div class="eyebrow">LIVE MARKETS</div><h1 class="page-title">الأسعار والأسواق</h1><p class="page-lead">أسعار العملات والذهب تُعرض من مصادر مباشرة مع وقت التحديث. لا نستخدم أرقامًا ثابتة أو تخمينات.</p><div class="card weather-picker"><label for="weatherCity">طقس مدينة</label><div class="actions"><input id="weatherCity" class="select" value="Cairo" placeholder="مثال: Hurghada"><button id="refreshLive" class="primary" type="button">تحديث البيانات</button></div></div><div id="liveDataGrid" class="live-grid"><div class="live-loading">جارٍ تحميل البيانات…</div></div></section>';
document.querySelector("#refreshLive").onclick=liveDataHome; liveDataHome();
}
async function recommendations(){const box=document.querySelector("#personalizedGrid");if(!box)return;try{const local=JSON.parse(localStorage.getItem("bayan:interests")||"{}");const localSections=Object.entries(local).sort((a,b)=>Number(b[1])-Number(a[1])).map(x=>x[0]);const rr=await fetch("/api/recommendations?visitorId="+encodeURIComponent(visitorId));const dd=await rr.json();const serverItems=Array.isArray(dd.articles)?dd.articles:[];const staticItems=Array.isArray(window.BAYAN_CONTENT?.articles)?window.BAYAN_CONTENT.articles.filter(a=>localSections.includes(a.section)).sort((a,b)=>localSections.indexOf(a.section)-localSections.indexOf(b.section)):[];const seen=new Set(),items=[...serverItems,...staticItems].filter(a=>{const id=a.id||a.slug;if(!id||seen.has(id))return false;seen.add(id);return true;});if(!items.length){box.innerHTML='<article class="card"><h3>لم نعرف اهتماماتك بعد</h3><p class="muted">تصفح الأقسام التي تهمك، وسيبني بيان اقتراحاتك تدريجيًا.</p></article>';return;}box.innerHTML=items.slice(0,6).map(a=>'<a class="card article-card" href="'+withLang("/article/"+(a.id||a.slug))+'"><h3>'+escapeHtml(a.title)+'</h3><p>'+escapeHtml(a.summary)+'</p></a>').join("");}catch{box.innerHTML='<article class="card"><p class="muted">ستظهر اقتراحاتك بعد تفاعل إضافي مع الموقع.</p></article>';}}
function reviewPage(){
app.innerHTML='<section class="page"><div class="eyebrow">BAYAN REVIEW</div><h1 class="page-title">مراجعة مساهمات الزوار</h1><p class="page-lead">هذه الصفحة خاصة بإدارة بيان. أدخل مفتاح المراجعة لمشاهدة المساهمات التي أرسلها الزوار ولم تُنشر تلقائيًا.</p><div class="card"><label>مفتاح المراجعة<input id="reviewToken" class="select" type="password" placeholder="BAYAN manager token"></label><div class="actions"><button id="reviewLoad" class="primary" type="button">عرض المساهمات</button><button id="analyticsLoad" class="secondary" type="button">تحديث إحصاءات الزيارات</button><button id="reviewTest" class="secondary" type="button">اختبار النظام وإرسال تقرير Telegram</button><button id="reviewStatus" class="secondary" type="button">فحص إعدادات النظام</button><button id="telegramSetup" class="secondary" type="button">ربط Telegram واستخراج CHAT_ID</button><button id="telegramTest" class="secondary" type="button">اختبار Telegram</button></div><p id="reviewState" class="muted"></p></div><div id="bayanAnalytics" class="page-section"><div class="card"><h3>إحصاءات الزيارات</h3><p class="muted">اضغط تحديث بعد إدخال مفتاح الإدارة.</p></div></div><div id="bayanRepairs" class="page-section"><div class="card"><h3>المراقبة والإصلاح الذاتي</h3><p class="muted">ستظهر هنا الأخطاء التي اكتشفها بيان، التشخيص، المحاولات، وحالة التحقق.</p></div></div><div id="reviewList" class="grid"></div></section>';
const token=document.querySelector("#reviewToken"),state=document.querySelector("#reviewState"),list=document.querySelector("#reviewList");
try{const saved=sessionStorage.getItem("bayan:review-token");if(saved)token.value=saved;}catch{}
async function load(){const t=token.value.trim();if(!t){state.textContent="أدخل مفتاح المراجعة.";return;}try{sessionStorage.setItem("bayan:review-token",t);}catch{}state.textContent="جارٍ تحميل المساهمات…";try{const r=await fetch("/api/contributions/review",{headers:{authorization:"Bearer "+t}}),d=await r.json();if(!r.ok){state.textContent="مفتاح المراجعة غير صحيح أو خدمة الإدارة غير متاحة. استخدم BAYAN_AI_MANAGER_TOKEN.";list.innerHTML="";return;}state.textContent="عدد المساهمات قيد المراجعة: "+(d.count||0);list.innerHTML=(d.items||[]).map(x=>'<article class="card"><span class="number">#'+escapeHtml(x.id)+' · '+escapeHtml(x.status)+'</span><h3>'+escapeHtml(x.title)+'</h3><p>'+escapeHtml(x.body)+'</p>'+(x.source?'<p class="muted">المصدر: '+escapeHtml(x.source)+'</p>':"")+'<small>'+escapeHtml(x.created_at||"")+'</small><div class="actions"><button class="secondary review-action" data-id="'+escapeHtml(x.id)+'" data-status="VERIFIED">تم التحقق</button><button class="secondary review-action" data-id="'+escapeHtml(x.id)+'" data-status="NEEDS_MORE_INFO">تحتاج معلومات</button><button class="secondary review-action" data-id="'+escapeHtml(x.id)+'" data-status="REJECTED">رفض</button></div></article>').join("")||'<article class="card"><h3>لا توجد مساهمات جديدة</h3><p class="muted">عندما يرسل شخص معلومة ستظهر هنا بحالة PENDING_REVIEW.</p></article>';}catch{state.textContent="تعذر الاتصال بخدمة المراجعة."}}
async function loadRepairs(){
  const t=token.value.trim();
  if(!t)return;
  const box=document.querySelector("#bayanRepairs");
  if(!box)return;
  try{
    const r=await fetch("/api/ai/manager/repairs",{headers:{authorization:"Bearer "+t}});
    const d=await r.json();
    if(!r.ok){box.innerHTML='<div class="card"><h3>تعذر تحميل سجل الإصلاح</h3><p class="muted">تحقق من مفتاح الإدارة.</p></div>';return;}
    const jobs=Array.isArray(d.jobs)?d.jobs:[];
    box.innerHTML='<div class="section-head"><div><h3>المراقبة والإصلاح الذاتي</h3><p class="muted">'+jobs.length+' سجل إصلاح حديث</p></div></div><div class="grid">'+(jobs.length?jobs.map(x=>'<article class="card"><span class="number">#'+escapeHtml(x.id)+' · '+escapeHtml(x.status)+'</span><h3>'+escapeHtml(x.context)+'</h3><p>'+escapeHtml(x.error_text)+'</p><p class="muted">المحاولات: '+escapeHtml(x.attempts)+' · الإجراء: '+escapeHtml(x.last_action||"—")+'</p><p>'+escapeHtml(x.diagnosis||"بانتظار التشخيص")+'</p><small>التالي: '+escapeHtml(x.next_attempt_at||"—")+'</small>'+(x.status!=="RESOLVED"?'<div class="actions"><button class="secondary repair-retry" data-id="'+escapeHtml(x.id)+'" type="button">إعادة الإصلاح الآن</button></div>':"")+'</article>').join(""):'<article class="card"><p class="muted">لا توجد أعطال مسجلة.</p></article>')+'</div>';
  }catch{box.innerHTML='<div class="card"><h3>تعذر الاتصال بسجل الإصلاح</h3></div>';}
}
document.querySelector("#bayanRepairs")?.addEventListener("click",async(e)=>{
  const b=e.target.closest(".repair-retry"); if(!b)return;
  const t=token.value.trim(); if(!t){state.textContent="أدخل BAYAN_AI_MANAGER_TOKEN أولًا.";return;}
  b.disabled=true; b.textContent="جارٍ إعادة المحاولة…";
  try{
    const r=await fetch("/api/ai/manager/repairs/retry",{method:"POST",headers:{"content-type":"application/json",authorization:"Bearer "+t},body:JSON.stringify({id:Number(b.dataset.id)})});
    const d=await r.json(); state.textContent=r.ok?"تم وضع الإصلاح في قائمة التنفيذ وسيُعاد التحقق منه تلقائيًا.":"تعذر إعادة الإصلاح: "+(d.error||d.status||"خطأ");
    if(r.ok) setTimeout(()=>loadRepairs().catch(()=>{}),800);
  }catch{state.textContent="تعذر الاتصال بخدمة الإصلاح."}finally{b.disabled=false;b.textContent="إعادة الإصلاح الآن";}
});
document.querySelector("#reviewLoad").onclick=load;
document.querySelector("#reviewStatus").onclick=async()=>{
  const t=token.value.trim();
  if(!t){state.textContent="أدخل BAYAN_AI_MANAGER_TOKEN أولًا.";return;}
  state.textContent="جارٍ فحص إعدادات النظام…";
  const button=document.querySelector("#reviewStatus");
  if(button) button.disabled=true;
  try{
    const r=await fetch("/api/ai/manager/status",{headers:{authorization:"Bearer "+t}});
    const d=await r.json().catch(()=>({}));
    if(!r.ok){
      state.textContent=r.status===403?"مفتاح الإدارة غير صحيح.":"تعذر فحص إعدادات النظام.";
      return;
    }
    const labels={
      database:"قاعدة البيانات D1",
      cloudflareAI:"Cloudflare Workers AI",
      cloudflareAISearch:"Cloudflare AI Search",
      browser:"Browser Rendering",
      openAI:"OpenAI",
      searchApi:"مزود البحث",
      gnews:"GNews",
      goldApi:"Gold API",
      managerToken:"مفتاح إدارة بيان"
    };
    const config=d.configuration||{};
    const entries=Object.entries(labels).map(([key,label])=>{
      const ok=!!config[key];
      return '<div class="card"><strong>'+escapeHtml(label)+'</strong><p class="muted">'+(ok?"متاح":"غير مضبوط")+'</p></div>';
    }).join("");
    const missing=Object.keys(labels).filter(key=>!config[key]).map(key=>labels[key]);
    const statusText=missing.length
      ?"الفحص اكتمل، لكن توجد إعدادات غير مضبوطة: "+missing.join("، ")
      :"الفحص اكتمل: الإعدادات الأساسية الظاهرة في النظام مضبوطة.";
    state.innerHTML='<strong>'+escapeHtml(statusText)+'</strong><div class="grid" style="margin-top:1rem">'+entries+'</div>';
  }catch{
    state.textContent="تعذر الاتصال بخدمة فحص الإعدادات.";
  }finally{
    if(button) button.disabled=false;
  }
};
document.querySelector("#telegramSetup").onclick=async()=>{
  const t=token.value.trim();
  if(!t){state.textContent="أدخل BAYAN_AI_MANAGER_TOKEN أولًا.";return;}
  state.textContent="جارٍ البحث عن محادثة Telegram…";
  try{
    const r=await fetch("/api/ai/manager/telegram/setup",{headers:{authorization:"Bearer "+t}});
    const d=await r.json();
    if(!r.ok){state.textContent="تعذر الوصول لإعداد Telegram.";return;}
    if(d.chatId) state.textContent="تم العثور على CHAT_ID: "+d.chatId+" — احفظه الآن في Cloudflare Secret باسم TELEGRAM_CHAT_ID.";
    else state.textContent="لم أجد رسالة Telegram بعد. افتح البوت واضغط Start وأرسل /start ثم جرّب الزر مرة أخرى.";
  }catch{state.textContent="تعذر الاتصال بإعداد Telegram."}
};
document.querySelector("#telegramTest").onclick=async()=>{
  const t=token.value.trim();
  if(!t){state.textContent="أدخل BAYAN_AI_MANAGER_TOKEN أولًا.";return;}
  state.textContent="جارٍ إرسال اختبار Telegram…";
  try{
    const r=await fetch("/api/ai/manager/telegram/test",{method:"POST",headers:{authorization:"Bearer "+t}});
    const d=await r.json();
    state.textContent=d.delivered?"تم إرسال رسالة اختبار Telegram بنجاح.":"فشل إرسال Telegram: "+(d.error||"تأكد من TELEGRAM_CHAT_ID.");
  }catch{state.textContent="تعذر الاتصال باختبار Telegram."}
};
document.querySelector("#reviewTest").onclick=async()=>{
  const t=token.value.trim();
  if(!t){state.textContent="أدخل BAYAN_AI_MANAGER_TOKEN أولًا. استخدم مفتاح إدارة بيان فقط.";return;}
  state.textContent="جارٍ اختبار الموقع وتجهيز التقرير…";
  try{
    const r=await fetch("/api/ai/manager/test-telegram",{method:"POST",headers:{authorization:"Bearer "+t}});
    const d=await r.json();
    if(r.ok) state.textContent=d.delivered?"تم إرسال رسالة الاختبار والتشخيص إلى حساب الإشعارات.":"اكتمل الاختبار؛ راجع Telegram إذا لم تصل الرسالة.";
    else state.textContent=d.status==="forbidden"?"المفتاح غير صحيح.":"تعذر تشغيل الاختبار.";
  }catch{state.textContent="تعذر الاتصال بخدمة الاختبار."}
};
list.addEventListener("click",async e=>{const b=e.target.closest(".review-action");if(!b)return;const id=Number(b.dataset.id),status=b.dataset.status;const note=status==="NEEDS_MORE_INFO"?"يرجى إضافة مصدر أو تفاصيل يمكن التحقق منها.":"";try{const r=await fetch("/api/contributions/review",{method:"POST",headers:{"content-type":"application/json",authorization:"Bearer "+token.value.trim()},body:JSON.stringify({id,status,note})});if(r.ok)load();else state.textContent="تعذر تحديث حالة المساهمة.";}catch{state.textContent="تعذر الاتصال بخدمة المراجعة."}});
async function loadAnalytics(){
  const t=token.value.trim();
  if(!t){state.textContent="أدخل مفتاح المراجعة أولًا.";return;}
  state.textContent="جارٍ تحميل إحصاءات الزيارات…";
  try{
    const periods=[["24 ساعة",24],["7 أيام",168],["30 يومًا",720]];
    const data=await Promise.all(periods.map(async([label,hours])=>{
      const r=await fetch("/api/analytics?hours="+hours,{headers:{authorization:"Bearer "+t}});
      const d=await r.json();
      return {label,d};
    }));
    const first=data.find(x=>x.d?.status==="ok")?.d;
    if(!first){state.textContent="تعذر تحميل الإحصاءات.";return;}
    const cards=data.map(x=>x.d?.status==="ok"?'<article class="card"><span class="number">'+escapeHtml(x.label)+'</span><h3>'+escapeHtml(x.d.views)+' مشاهدة</h3><p class="muted">'+escapeHtml(x.d.uniqueVisitors)+' زائر فريد · '+escapeHtml(x.d.searches)+' عملية بحث</p></article>':'<article class="card"><h3>'+escapeHtml(x.label)+'</h3><p class="muted">غير متاح</p></article>').join("");
    const maxPage=Math.max(1,...(first.topPages||[]).map(x=>Number(x.count)||0));
    const pages=(first.topPages||[]).map(x=>'<div class="card"><strong>'+escapeHtml(x.path)+'</strong><p class="muted">'+escapeHtml(x.count)+' مشاهدة</p><div style="height:6px;background:rgba(127,127,127,.2);border-radius:99px;overflow:hidden"><span style="display:block;height:100%;width:'+Math.max(3,Math.round(Number(x.count)/maxPage*100))+'%"></span></div></div>').join("");
    const queries=(first.topSearches||[]).map(x=>'<article class="card"><strong>'+escapeHtml(x.query)+'</strong><p class="muted">'+escapeHtml(x.count)+' مرة</p></article>').join("");
    const analytics=document.querySelector("#bayanAnalytics");
    if(analytics)analytics.innerHTML='<div class="section-head"><div><h2>إحصاءات بيان الخاصة</h2><p>لا تظهر للزوار؛ الوصول إليها محمي بمفتاح إدارة بيان.</p></div></div><div class="grid">'+cards+'</div><div class="section-head"><div><h2>أكثر الصفحات زيارة — آخر 24 ساعة</h2></div></div><div class="grid">'+(pages||'<article class="card"><p class="muted">لا توجد زيارات مسجلة بعد.</p></article>')+'</div><div class="section-head"><div><h2>أكثر عمليات البحث — آخر 24 ساعة</h2></div></div><div class="grid">'+(queries||'<article class="card"><p class="muted">لا توجد عمليات بحث مسجلة بعد.</p></article>')+'</div>';
    state.textContent="تم تحديث إحصاءات الزيارات.";
  }catch{state.textContent="تعذر الاتصال بإحصاءات الزيارات."}
}
loadRepairs().catch(()=>{});document.querySelector("#analyticsLoad").onclick=loadAnalytics;
}
function contributionPage(){app.innerHTML='<section class="page"><div class="eyebrow">COMMUNITY KNOWLEDGE</div><h1 class="page-title">ساهم بمعلومة</h1><p class="page-lead">يمكنك إرسال معلومة أو تصحيح أو مصدر. لا تُنشر مساهمتك تلقائيًا؛ تمر أولًا بالمراجعة والتحقق.</p><div class="card"><label>العنوان<input id="contribTitle" class="select" maxlength="240" placeholder="ما المعلومة؟"></label><label>المحتوى<textarea id="contribBody" class="prompt" maxlength="6000" placeholder="اكتب المعلومة بالتفصيل..."></textarea></label><label>المصدر (اختياري)<input id="contribSource" class="select" maxlength="500" placeholder="اسم المصدر أو المرجع"></label><button id="contribSend" class="primary" type="button">إرسال للمراجعة</button><p id="contribState" class="muted"></p></div></section>';document.querySelector("#contribSend").onclick=async()=>{const state=document.querySelector("#contribState"),title=document.querySelector("#contribTitle").value.trim(),body=document.querySelector("#contribBody").value.trim(),source=document.querySelector("#contribSource").value.trim();if(!title||body.length<20){state.textContent="اكتب عنوانًا ومعلومة لا تقل عن 20 حرفًا.";return;}state.textContent="جارٍ إرسال المساهمة للمراجعة…";try{const rr=await fetch("/api/contributions",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({visitorId,title,body,source})});const dd=await rr.json();if(rr.ok){state.textContent="تم استلام المساهمة وستدخل دورة المراجعة.";document.querySelector("#contribTitle").value="";document.querySelector("#contribBody").value="";document.querySelector("#contribSource").value="";}else{state.textContent=dd.status||"تعذر إرسال المساهمة.";}}catch{state.textContent="تعذر الاتصال بالخدمة."};}};
function home(){app.innerHTML='<section class="hero"><div><div class="eyebrow">BAYAN | بيان</div><h1>ماذا تريد أن <span>تعرف؟</span></h1><p>اسأل، ابحث، افهم، أو حل مشكلة. يجمع بيان المعرفة والأخبار والبيانات والمصادر في تجربة واحدة، ويصرّح عندما لا تكفي الأدلة.</p><div class="actions"><a class="primary" href="'+withLang("/search")+'">ابدأ البحث</a><a class="secondary" href="'+withLang("/ai")+'">اسأل بيان</a></div></div><div class="hero-visual"><div class="hero-visual-label">معلومة · دليل · سياق · تحقق</div></div></section>'+adSlot("home-top")+'<section><div class="section-head"><div><h2>مهم الآن</h2><p>بيانات مباشرة تتحدث عندما تصل من مصادرها.</p></div><a class="secondary" href="'+withLang("/prices")+'">كل الأسعار والطقس</a></div><div class="card live-home"><div class="live-home-head"><div><span class="number">LIVE DATA</span><h3>الطقس والعملات والذهب</h3></div><div class="weather-city-inline"><input id="weatherCity" class="select" value="Cairo" aria-label="مدينة الطقس"><button id="refreshLiveHome" class="secondary" type="button">تحديث</button></div></div><div id="liveDataGrid" class="live-grid"><div class="live-loading">جارٍ تحميل البيانات…</div></div></div></section><section><div class="section-head"><div><h2>ما الذي يتابعه الناس الآن؟</h2><p>إشارات حديثة نراجعها قبل أن نعرضها لك، مع فصل الاهتمام عن الخبر المؤكد.</p></div></div><div class="signal-grid"><article class="card signal"><span class="number">DISCOVERY</span><h3>موضوعات يزداد حولها الاهتمام</h3><p class="muted">إشارات من المصادر الحديثة؛ ظهور الموضوع هنا لا يعني أن كل ما يقال عنه صحيح.</p><div id="homeTrendingPreview" class="signal-preview"><p class="muted">جارٍ جمع الإشارات…</p></div><a class="secondary" href="'+withLang("/trending")+'">عرض الموضوعات</a></article><article class="card signal"><span class="number">NEWS</span><h3>الأخبار</h3><p class="muted">عناوين حديثة من مصادر إخبارية، مع إبقاء الخبر منفصلًا عن التفسير والتكهن.</p><div id="homeNewsPreview" class="signal-preview"><p class="muted">جارٍ تحديث الأخبار…</p></div><a class="secondary" href="'+withLang("/news")+'">عرض الأخبار</a></article></div></section><section><div class="section-head"><div><h2>استكشف المعرفة</h2><p>موضوعات مرتبطة بالمحتوى الفعلي داخل بيان، وكل قسم له وظيفة مختلفة.</p></div></div><div class="grid">'+sections.slice(0,12).map((x,i)=>'<a class="card topic-card" href="'+withLang("/"+x[0])+'"><span class="number">'+String(i+1).padStart(2,"0")+"</span><h3>"+title(x)+"</h3><p>"+(descriptions[x[0]]||"محتوى منظم مع مصادر وسياق.")+"</p></a>").join("")+'</div></section>'+editorialArticles()+'<section class="feature card"><div><div class="eyebrow">BAYAN INTELLIGENCE</div><h2>ثلاث طرق لاستخدام بيان</h2><p class="muted">ابحث عن معلومة، اسأل الذكاء الاصطناعي، أو اقرأ شرحًا جاهزًا من قاعدة المعرفة.</p><div class="actions"><a class="primary" href="'+withLang("/search")+'">ابحث في المعرفة</a><a class="secondary" href="'+withLang("/ai")+'">اسأل بيان</a><a class="secondary" href="'+withLang("/article/ai-evidence")+'">كيف نتحقق؟</a></div></div></section><section><div class="section-head"><div><h2>محتوى مخصص لك</h2><p>اقتراحات مبنية على الأقسام التي تتفاعل معها، دون جمع اسمك أو بريدك.</p></div></div><div id="personalizedGrid" class="grid"></div></section>'+adSlot("home-bottom")+'<section class="wisdom"><b>WISDOM · حكمة</b><p id="wisdom"></p></section>'}function sectionPage(key){const sec=sections.find(x=>x[0]===key),lead=descriptions[key]||"قسم معرفي مستقل.";const pair=content[key]||sectionGuides[key];const list=(window.BAYAN_CONTENT?.articles||[]).filter(a=>a.section===key);const featured=pair?'<article class="card topic-card"><span class="number">FEATURED</span><h3>'+pair[0]+'</h3><p>'+pair[1]+'</p><a class="secondary" href="'+withLang("/article/"+(list[0]?.id||key))+'">افهم الموضوع</a></article>':'';const articles=list.map(a=>'<a class="card article-card" href="'+withLang("/article/"+a.id)+'"><span class="article-section">'+sectionIcon(a.section)+(window.BAYAN_CONTENT?.sectionMeta?.[a.section]||a.section)+'</span><h3>'+a.title+'</h3><p>'+a.summary+'</p><small>'+a.readTime+'</small></a>').join("");const fallback='<a class="card topic-card" href="'+withLang("/search?q="+encodeURIComponent(title(sec)))+'"><span class="number">DISCOVERY</span><h3>اكتشف المزيد</h3><p>ابحث داخل بيان عن أسئلة وموضوعات مرتبطة بهذا القسم.</p></a>';app.innerHTML='<section class="page"><div class="breadcrumb">BAYAN / '+title(sec)+'</div><h1 class="page-title">'+title(sec)+'</h1><p class="page-lead">'+lead+'</p>'+summaryBlock(["المحتوى في هذا القسم مرتبط بالسياق وليس مجرد عنوان.","كل معلومة قابلة للتحقق ترتبط بمصادر وأوقات تحديث واضحة.","عند نقص الأدلة، يعرض بيان ذلك بدل ملء الفراغ بتخمين."])+evidence()+adSlot("section-top")+(featured?'<div class="grid">'+featured+fallback+'</div>':'')+(articles?'<div class="section-head"><div><h2>محتوى القسم</h2><p>افتح أي مادة لقراءة التفاصيل داخل بيان.</p></div></div><div class="grid article-grid dynamic-knowledge-grid">'+articles+'</div>':'<div class="grid">'+fallback+'</div>')+'</section>';loadPersistedSection(key)}async function loadPersistedSection(key){
  try{
    const rr=await fetch("/api/knowledge?section="+encodeURIComponent(key)+"&limit=30");
    const dd=await rr.json();
    const items=Array.isArray(dd.articles)?dd.articles:[];
    const grid=document.querySelector(".dynamic-knowledge-grid");
    if(!items.length||!grid)return;
    grid.innerHTML=items.map(a=>'<a class="card article-card" href="'+withLang("/article/"+a.id)+'"><span class="article-section">'+sectionIcon(a.section)+(window.BAYAN_CONTENT?.sectionMeta?.[a.section]||a.section)+'</span><h3>'+escapeHtml(a.title)+'</h3><p>'+escapeHtml(a.summary)+'</p><small>مقال معرفة محفوظ في بيان</small></a>').join("")+grid.innerHTML;
  }catch{}
}
async function articlePage(slug){
const a=(window.BAYAN_CONTENT?.articles||[]).find(x=>x.id===slug);
const renderArticle=(k,isPersisted)=>{
  const section=k.section||"news";
  const body=(Array.isArray(k.body)?k.body:(String(k.body||"").split(/\n+/).filter(Boolean))).map(x=>String(x||"").replace(/�+/g,"").replace(/[\u0000-\u001F\u007F]/g," ").replace(/\\u([0-9a-fA-F]{4})/g,(_,h)=>String.fromCharCode(parseInt(h,16))).trim()).filter(Boolean);
  const saved=(()=>{try{return JSON.parse(localStorage.getItem("bayan:saved-articles")||"[]").includes(k.id||slug)}catch{return false}})();
  const related=(window.BAYAN_CONTENT?.articles||[]).filter(x=>x.section===section&&x.id!==(k.id||slug)).slice(0,3);
  const sources=Array.isArray(k.sources)?k.sources:[];
  const sourceHtml=sources.length?"<section class=\"card article-sources\"><h2>المصادر المستخدمة</h2><p class=\"muted\">المصادر التالية استُخدمت للتحقق وبناء المقال، وليست بديلًا عن متن المقال.</p><ol>"+sources.slice(0,8).map(s=>"<li>"+escHtml(s.source||s.title||"مصدر")+(s.date?" · "+escHtml(s.date):"")+"</li>").join("")+"</ol></section>":"";
  const sourceLabel=isPersisted?"مقال معرفة محفوظ داخل بيان":"مقال معرفي في بيان";
  const actions='<div class="actions article-actions"><button class="secondary" type="button" data-bayan-save="'+escHtml(k.id||slug)+'">'+(saved?"محفوظ":"حفظ المقال")+'</button><button class="secondary" type="button" data-bayan-share="'+escHtml(k.title||"مقال بيان")+'">مشاركة</button></div>';
  const relatedHtml=related.length?'<div class="section-head"><div><h2>اقرأ أيضًا</h2><p>مواد مرتبطة من نفس المجال.</p></div></div><div class="grid">'+related.map(x=>'<a class="card article-card" href="'+withLang("/article/"+x.id)+'"><span class="article-section">'+sectionIcon(x.section)+(window.BAYAN_CONTENT?.sectionMeta?.[x.section]||x.section)+'</span><h3>'+escHtml(x.title)+'</h3><p>'+escHtml(x.summary)+'</p></a>').join("")+'</div>':"";
  const heroImage=k.image?'<img loading="eager" class="news-image article-hero-image" src="'+escHtml(k.image)+'" alt="" referrerpolicy="no-referrer">':"";
  let articleHtml="";
  let listItems=[];
  const flushList=()=>{if(listItems.length){articleHtml+="<ul>"+listItems.join("")+"</ul>";listItems=[];}};
  for(const line of body){
    const value=String(line||"").trim();
    if(!value)continue;
    if(/^[-*]\s+/.test(value)){listItems.push("<li>"+escHtml(value.replace(/^[-*]\s+/,""))+"</li>");continue;}
    flushList();
    if(/^###\s+/.test(value)){articleHtml+="<h3>"+escHtml(value.replace(/^###\s+/,""))+"</h3>";continue;}
    if(/^##\s+/.test(value)){articleHtml+="<h2>"+escHtml(value.replace(/^##\s+/,""))+"</h2>";continue;}
    if(/^#\s+/.test(value)){articleHtml+="<h2>"+escHtml(value.replace(/^#\s+/,""))+"</h2>";continue;}
    articleHtml+="<p>"+escHtml(value)+"</p>";
  }
  flushList();
  app.innerHTML='<section class="page"><div class="breadcrumb">BAYAN / '+(isPersisted?"مقال معرفة":(isEn?"Article":"مقال"))+'</div><div class="article-kicker">'+sectionIcon(section)+(window.BAYAN_CONTENT?.sectionMeta?.[section]||section)+'</div><h1 class="page-title">'+escHtml(k.title||"مقال بيان")+'</h1>'+heroImage+'<p class="page-lead article-intro">'+escHtml(k.summary||"")+'</p>'+summaryBlock([sourceLabel,"المقال يشرح الموضوع في سياق مترابط، ثم يفصل الأدلة والمصادر في نهاية الصفحة."])+actions+adSlot("article")+'<article class="article-body card">'+articleHtml+'</article>'+sourceHtml+relatedHtml+'</section>';
};
const trendParams=new URLSearchParams(location.search);
if(trendParams.get("trend")==="1"){
  try{
    const title=trendParams.get("title")||"";
    const image=trendParams.get("image")||"";
    const rr=await fetch("/api/trending/article?title="+encodeURIComponent(title)+"&image="+encodeURIComponent(image)+"&lang="+(isEn?"en":"ar"));
    const dd=await rr.json();
    if(rr.ok&&dd.article){renderArticle({...dd.article,id:dd.article.id||slug,image:dd.article.image||image},true);return;}
  }catch{}
}
if(a){renderArticle(a,false);return;}
try{
  const rr=await fetch("/api/knowledge?id="+encodeURIComponent(slug));
  const dd=await rr.json();
  if(dd.article){renderArticle(dd.article,true);return;}
}catch{}
const sectionArticle=(window.BAYAN_CONTENT?.articles||[]).find(x=>x.section===slug);
if(sectionArticle){renderArticle(sectionArticle,false);return;}
try{
  const query=decodeURIComponent(slug).replace(/[-_]+/g," ").trim();
  if(query){
    const generated=await fetch("/api/search/article?q="+encodeURIComponent(query)+"&lang="+(isEn?"en":"ar"));
    const gd=await generated.json();
    if(generated.ok&&gd.article&&gd.article.body){renderArticle({...gd.article,id:gd.article.id||slug},true);return;}
  }
}catch{}
const pair=content[slug]||[decodeURIComponent(slug).replace(/[-_]+/g," ")||"مقال بيان","لم يتم العثور على مادة منشورة لهذا المسار بعد."];
app.innerHTML='<section class="page"><div class="breadcrumb">BAYAN / '+(isEn?"Article":"مقال")+'</div><h1 class="page-title">'+escHtml(pair[0])+'</h1><p class="page-lead">'+escHtml(pair[1])+'</p>'+summaryBlock(["سيُعرض المحتوى الكامل بعد اجتياز دورة الاسترجاع والتحليل والكتابة والتحقق."])+'</section>';
}
async function dynamicKnowledgePage(kind,slug){
const labels={person:isEn?"Person":"شخص",event:isEn?"Event":"حدث",topic:isEn?"Topic":"موضوع"};
const label=labels[kind]||labels.topic;
app.innerHTML='<section class="page"><div class="breadcrumb">BAYAN / '+label+'</div><div class="eyebrow">'+kind.toUpperCase()+'</div><h1 class="page-title">'+escHtml(slug.replace(/[-_]+/g," "))+'</h1><div id="dynamicState" class="card"><h3>'+ (isEn?"Researching and verifying…":"جارٍ البحث والتحقق…") +'</h3><p class="muted">'+(isEn?"BAYAN is retrieving evidence before writing the page.":"يجمع بيان الأدلة قبل كتابة الصفحة.")+'</p></div><div id="dynamicAnswer" class="card answer" style="display:none"></div>'+evidence()+'</section>';
const state=document.querySelector("#dynamicState"),out=document.querySelector("#dynamicAnswer");
const request=(kind==="person"?(isEn?"Build a verified factual profile for the person named "+slug:"أنشئ ملفًا معرفيًا موثقًا ومحايدًا للشخص المذكور: "+slug):(kind==="event"?(isEn?"Explain the event named "+slug+" with confirmed facts, when, where, who, context and updates.":"اشرح الحدث المذكور: "+slug+" مع الحقائق المؤكدة، متى وأين ومن والسياق والتحديثات."):(isEn?"Explain the topic "+slug+" with definition, history, how it works, examples and related concepts.":"اشرح الموضوع "+slug+" مع التعريف والتاريخ وكيف يعمل والأمثلة والمفاهيم المرتبطة.")));
try{
const r=await fetch("/api/ai",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({input:request,mode:kind})});
const d=await r.json();
if(!r.ok){state.innerHTML='<h3>'+ (isEn?"Verification unavailable":"تعذر التحقق الآن")+'</h3><p class="muted">'+escHtml(d.warnings?.join(" · ")||"Insufficient Evidence")+'</p>';return;}
state.innerHTML='<h3>'+ (isEn?"Verified evidence retrieved":"تم استرجاع الأدلة")+'</h3><p class="muted">'+(isEn?"The answer below is evidence-first.":"الإجابة التالية مبنية على الأدلة أولًا.")+'</p>';
out.style.display="block";out.innerHTML='<h2>'+label+'</h2><div class="answer-copy">'+escHtml(d.answer||"Insufficient Evidence").replace(/\n/g,"<br>")+'</div>';
}catch{state.innerHTML='<h3>'+ (isEn?"Could not complete verification":"تعذر إكمال التحقق")+'</h3><p class="muted">Insufficient Evidence</p>';}
}
function escHtml(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}

function topicPage(slug){const sec=sections.find(x=>x[0]===slug);app.innerHTML='<section class="page"><div class="breadcrumb">BAYAN / '+(isEn?"Topic":"موضوع")+'</div><h1 class="page-title">'+(sec?title(sec):slug)+'</h1>'+summaryBlock(["تعريف الموضوع وسياقه أولًا.","شرح ما نعرفه وما يحتاج إلى دليل إضافي.","مصادر وموضوعات مرتبطة لتوسيع الفهم."])+evidence()+'<div class="grid"><article class="card topic-card"><span class="number">EXPLAIN</span><h3>ما هو الموضوع؟</h3><p>سيُبنى التعريف من مصادر موثوقة ويُراجع قبل النشر.</p></article><article class="card topic-card"><span class="number">RELATED</span><h3>موضوعات مرتبطة</h3><p>روابط داخلية مفيدة بدون تكرار أو حشو SEO.</p></article></div></section>'}function searchPage(routeParams){
const q=(routeParams instanceof URLSearchParams?routeParams:new URLSearchParams(location.search)).get("q")||"";
app.innerHTML='<section class="page search-page"><div class="search-hero"><div><div class="eyebrow">SEARCH / KNOWLEDGE</div><h1 class="page-title">البحث</h1><p class="page-lead">ابحث عن سؤال أو شخص أو موضوع أو خبر. يجمع بيان الأدلة أولًا ثم يرتبها في إجابة واضحة، مع فصل المصادر عن الخلاصة.</p></div></div><form id="siteSearch" class="searchbar search-page-form"><input id="searchInput" name="q" value="'+q.replace(/"/g,"&quot;")+'" placeholder="مثال: من هو محمد صلاح؟" autocomplete="off"><button type="submit">بحث</button></form><div id="searchState" class="search-status"><span class="status-dot"></span><div><strong>'+ (q?"جارٍ البحث والتحقق…":"ابدأ البحث") +'</strong><p>'+(q?"يجمع بيان الأدلة قبل كتابة الإجابة.":"اكتب سؤالك لتحصل على نتيجة منظمة داخل بيان.")+'</p></div></div><div id="searchAnswer" class="search-answer" style="display:none"></div><section id="searchSources" class="search-sources" style="display:none"><div class="section-head"><div><h2>الأدلة والمصادر</h2><p>المصادر التي استُخدمت في بناء الإجابة.</p></div><span id="sourceCount" class="source-count"></span></div><div id="searchEvidence" class="search-results-grid"></div></section></section>';
const form=document.querySelector("#siteSearch"),state=document.querySelector("#searchState"),answer=document.querySelector("#searchAnswer"),sources=document.querySelector("#searchSources"),evidence=document.querySelector("#searchEvidence"),sourceCount=document.querySelector("#sourceCount");
const esc=(v)=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const run=async(query)=>{
if(!query)return;
recordAnalytics("search","/search",query);
state.innerHTML='<span class="status-dot loading"></span><div><strong>جارٍ البحث والتحقق…</strong><p>يتم جمع الأدلة ومقارنتها قبل عرض النتيجة.</p></div>';
try{
const r=await fetch("/api/search?q="+encodeURIComponent(query)+"&lang="+(isEn?"en":"ar"));
const d=await r.json();
if(!r.ok||d.status==="search_provider_not_configured"){state.innerHTML='<span class="status-dot error"></span><div><strong>البحث غير متاح مؤقتًا</strong><p>لم تتوفر مصادر قابلة للتحقق الآن.</p></div>';return;}
if(d.answer){
answer.style.display="block";
answer.innerHTML='<div class="answer-header"><div><span class="eyebrow">BAYAN ANSWER</span><h2>الخلاصة</h2></div><span class="verified-pill">مبنية على الأدلة</span></div><div class="answer-copy">'+esc(d.answer).replace(/\n/g,"<br>")+'</div>'+(d.article&&d.article.id?'<div class="actions"><a class="primary" href="'+withLang("/article/"+encodeURIComponent(d.article.id))+'">قراءة المقال الكامل</a></div>':"")+'<p class="answer-note">تمت الصياغة من الأدلة المتاحة. التفاصيل الزمنية أو الإحصائية تُراجع بحسب تاريخ المصدر.</p>';
}
const items=d.items||[];
if(items.length){
sources.style.display="block";
sourceCount.textContent=items.length+" مصادر";
evidence.innerHTML=items.map((x,index)=>{
const title=escapeHtml(x.title||"نتيجة بدون عنوان");
const source=escapeHtml(x.source||"مصدر غير محدد");
const date=x.date?escapeHtml(x.date):"";
const snippet=escapeHtml(x.snippet||"لم يتوفر ملخص كافٍ.");
return '<article class="search-result-card"><div class="result-number">'+String(index+1).padStart(2,"0")+'</div><div class="result-main"><div class="result-meta"><span class="source-name">'+source+'</span>'+(date?'<span>·</span><span>'+date+'</span>':"")+'</div><h3>'+title+'</h3><p>'+snippet+'</p><button class="secondary read-search-article" data-rank="'+esc(x.rank)+'" type="button">قراءة داخل بيان <span>←</span></button><div class="search-article-body" hidden></div></div></article>';
}).join("");
evidence.querySelectorAll(".read-search-article").forEach(button=>{
button.addEventListener("click",async()=>{
const card=button.closest(".search-result-card"),body=card?.querySelector(".search-article-body"),rank=button.dataset.rank;
if(!card||!body||!rank)return;
button.disabled=true;button.textContent="جارٍ إعداد المقال…";body.hidden=false;body.innerHTML='<p class="muted">بيان يتحقق من المادة ويجهز المقال…</p>';
try{
const rr=await fetch("/api/search/article?q="+encodeURIComponent(query)+"&rank="+encodeURIComponent(rank)+"&lang="+(isEn?"en":"ar"));
const dd=await rr.json();
if(!rr.ok||!dd.article)throw new Error("article_unavailable");
location.href=withLang("/article/"+encodeURIComponent(dd.article.id));
}catch{body.innerHTML='<p class="search-error">تعذر تجهيز المقال الآن؛ لم يتم عرض محتوى غير متحقق منه.</p>';button.disabled=false;button.textContent="حاول مرة أخرى";}
});
});
}
state.innerHTML='<span class="status-dot success"></span><div><strong>اكتمل البحث</strong><p>تم جمع '+items.length+' مصادر/نتائج وعرضها في أقسام منفصلة.</p></div>';
}catch{state.innerHTML='<span class="status-dot error"></span><div><strong>تعذر إكمال البحث</strong><p>لم يتم عرض معلومة غير متحقق منها.</p></div>';}}
form.onsubmit=(e)=>{e.preventDefault();const query=document.querySelector("#searchInput").value.trim();if(query){const u=new URL(location.href);u.searchParams.set("q",query);history.pushState({q:query},"",u.pathname+u.search);run(query);}};
if(q)run(q);
}function newsPage(){app.innerHTML='<section class="page"><div class="eyebrow">LIVE NEWS</div><h1 class="page-title">الأخبار</h1><p class="page-lead">أخبار حديثة من مزود مباشر، تُعرض داخل بيان مع المصدر ووقت النشر، دون روابط خارجية للزائر.</p><div class="card" id="newsState"><h3>جارٍ تحديث الأخبار…</h3></div><div id="newsGrid" class="grid article-grid"></div></section>';const state=document.querySelector("#newsState"),grid=document.querySelector("#newsGrid");fetch("/api/news?lang="+(isEn?"en":"ar")).then(r=>r.json()).then(d=>{if(!d.articles?.length){state.innerHTML='<h3>الأخبار غير متاحة الآن</h3><p class="muted">لم يتم عرض أخبار غير متحققة أو قديمة.</p>';return;}state.innerHTML='<h3>تم التحديث</h3><p class="muted">'+esc(d.totalArticles||d.articles.length)+' مادة من '+esc(d.provider||"المصدر المباشر")+'.</p>';grid.innerHTML=d.articles.slice(0,10).map(x=>'<article class="card article-card">'+(x.image?"<img loading=\"lazy\" src=\""+escapeHtml(x.image)+"\" alt=\"\" class=\"news-image\">":"")+'<span class="article-section">'+escapeHtml(x.source?.name||"News")+'</span><h3>'+escapeHtml(x.title||"")+'</h3><p>'+escapeHtml(x.description||x.content||"")+'</p><small>'+escapeHtml(x.publishedAt||"—")+'</small></article>').join("");}).catch(()=>{state.innerHTML='<h3>تعذر تحديث الأخبار</h3><p class="muted">لم يتم عرض معلومات غير متحققة.</p>';});}
function trendingPage(){app.innerHTML='<section class="page"><div class="eyebrow">DISCOVERY</div><h1 class="page-title">إشارات الاهتمام</h1><p class="page-lead">موضوعات تظهر في الأخبار الحالية داخل بيان. اضغط على أي إشارة لفتح مقال موثق داخل بيان مع الصورة المرتبطة بالمادة الأصلية.</p><div class="card" id="trendingState"><h3>جارٍ جمع الإشارات…</h3><p class="muted">يتم جلب أحدث العناوين من مصدر أخبار مباشر.</p></div><div id="trendingGrid" class="grid article-grid"></div></section>';const state=document.querySelector("#trendingState"),grid=document.querySelector("#trendingGrid");fetch("/api/trending?lang="+(isEn?"en":"ar")).then(r=>r.json()).then(d=>{if(!d.signals?.length){state.innerHTML='<h3>الإشارات غير متاحة الآن</h3><p class="muted">لم تتوفر بيانات حديثة قابلة للعرض.</p>';return;}state.innerHTML='<h3>تم التحديث</h3><p class="muted">هذه إشارات من الأخبار الحالية وليست مقياسًا لعدد المتابعين أو عمليات البحث.</p>';grid.innerHTML=d.signals.map(x=>'<a class="card article-card trending-card" href="'+withLang("/article/trending?trend=1&title="+encodeURIComponent(x.title||"")+"&image="+encodeURIComponent(x.image||""))+'">'+(x.image?'<img loading="lazy" class="news-image" src="'+escapeHtml(x.image)+'" alt="" referrerpolicy="no-referrer">':"")+'<span class="article-section">#'+escapeHtml(x.rank)+' · '+escapeHtml(x.source||"News")+'</span><h3>'+escapeHtml(x.title||"")+'</h3><p>'+escapeHtml(x.snippet||"اضغط لقراءة المقال والتحقق من الأدلة.")+'</p><small>'+escapeHtml(x.date||"وقت النشر غير متاح")+'</small><div class="actions"><span class="primary">قراءة المقال ←</span></div></a>').join("");}).catch(()=>{state.innerHTML='<h3>تعذر تحديث الإشارات</h3><p class="muted">لم يتم عرض ترتيب غير متحقق منه.</p>';});}
function ai(){
app.innerHTML='<section class="page"><div class="eyebrow">BAYAN AI</div><h1 class="page-title">اسأل بيان</h1><p class="page-lead">اسأل عن أي شيء. يختار بيان بين المعرفة الداخلية والاسترجاع المباشر بحسب طبيعة السؤال.</p><div class="card ai-box"><div><textarea id="prompt" class="prompt" placeholder="مثال: اشرح لي الموضوع ببساطة…"></textarea><div class="actions"><select id="mode" class="select"><option value="knowledge">معرفة</option><option value="research">بحث موثق</option><option value="summary">تلخيص</option><option value="analyze">تحليل</option><option value="write">كتابة</option><option value="code">برمجة</option></select><button id="ask" class="primary" type="button">إرسال</button></div></div><div class="card"><b>كيف يجيب بيان؟</b><p class="muted">الأسئلة العامة يمكن الإجابة عنها من المعرفة المتاحة، بينما الأسئلة الحالية أو التي تحتاج مصدرًا تمر بمسار الاسترجاع والتحقق.</p></div></div><div id="answer" class="card answer" aria-live="polite" style="display:none"></div></section>';
const ask=async()=>{
 const input=document.querySelector("#prompt").value.trim(),out=document.querySelector("#answer"),button=document.querySelector("#ask");
 if(!input)return;
 out.style.display="block";out.innerHTML='<p class="muted">جارٍ الاسترجاع والتحليل…</p>';button.disabled=true;
 try{
  const r=await fetch("/api/ai",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({input,mode:document.querySelector("#mode").value})});
  const d=await r.json();
  if(!r.ok&&d.answer){out.innerHTML='<div class="warning"><strong>حالة التحقق</strong><p>'+escapeHtml(d.answer)+'</p></div>';return;}
  const answer=String(d.answer||d.error||"تعذر تجهيز الإجابة.");
  const evidence=Array.isArray(d.evidence)?d.evidence:[];
  const sources=evidence.length?'<div class="ai-sources"><h3>الأدلة المستخدمة</h3><ul>'+evidence.slice(0,8).map(x=>'<li><strong>'+escapeHtml(x.source||x.title||"مصدر")+'</strong>'+(x.date?" · "+escapeHtml(x.date):"")+(x.snippet?"<p>"+escapeHtml(x.snippet).slice(0,500)+"</p>":"")+'</li>').join("")+'</ul></div>':"";
  const confidence=typeof d.confidence==="number"?Math.round(d.confidence*100)+"%":"—";
  const warnings=Array.isArray(d.warnings)&&d.warnings.length?'<p class="muted">'+d.warnings.map(escapeHtml).join(" · ")+'</p>':"";
  out.innerHTML='<div class="answer-main"><h3>إجابة بيان</h3><p>'+escapeHtml(answer).replace(/\n/g,"<br>")+'</p></div><div class="evidence-strip"><span class="badge">الثقة التقديرية: '+confidence+'</span><span class="badge">'+(evidence.length?"تم الاسترجاع":"معرفة عامة/تحليل")+'</span></div>'+warnings+sources+(d.article?.id?'<p><a class="primary" href="/article/'+encodeURIComponent(d.article.id)+'">فتح المقال المحفوظ</a></p>':"");
 }catch{out.innerHTML='<div class="warning"><strong>تعذر الاتصال بالخدمة</strong><p>حاول مرة أخرى بعد قليل.</p></div>'}
 finally{button.disabled=false}
};
document.querySelector("#ask").onclick=ask;
document.querySelector("#prompt").addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key==="Enter")ask()});
}
function savedPage(){
 let ids=[];try{ids=JSON.parse(localStorage.getItem("bayan:saved-articles")||"[]")}catch{}
 const articles=(window.BAYAN_CONTENT?.articles||[]).filter(a=>ids.includes(a.id));
 app.innerHTML='<section class="page"><div class="eyebrow">BAYAN</div><h1 class="page-title">المحفوظات</h1><p class="page-lead">مقالاتك المحفوظة على هذا الجهاز.</p>'+(articles.length?'<div class="grid article-grid">'+articles.map(a=>'<a class="card article-card" href="'+withLang("/article/"+a.id)+'"><span class="article-section">'+sectionIcon(a.section)+(window.BAYAN_CONTENT?.sectionMeta?.[a.section]||a.section)+'</span><h3>'+escapeHtml(a.title)+'</h3><p>'+escapeHtml(a.summary)+'</p></a>').join("")+'</div>':'<div class="card"><h3>لا توجد مقالات محفوظة</h3><p class="muted">استخدم زر «حفظ المقال» داخل أي مقال لإضافته هنا.</p></div>')+'</section>';
}
const validInterestSectionForClient=(key)=>["egypt","arab","world","science","economy","politics","technology","health","history-culture","people","sports","travel","arts","news","trending","prices"].includes(key);
function renderRoute(routePath, routeParams){
document.body.dataset.section=routePath||"home";
if(validInterestSectionForClient(routePath)) recordInterest(routePath,"view");recordAnalytics("page_view",routePath?"/"+routePath:"/");
nav.querySelectorAll("a").forEach(a=>a.classList.toggle("active",a.getAttribute("href")?.split("?")[0]==="/"+routePath));
if(!routePath)home();else if(routePath==="ai")ai();else if(routePath==="search")searchPage(routeParams);else if(routePath==="saved")savedPage();else if(routePath==="prices")pricesPage();else if(routePath.startsWith("article/"))articlePage(routePath.split("/")[1]);else if(routePath.startsWith("person/"))dynamicKnowledgePage("person",routePath.split("/")[1]);else if(routePath.startsWith("event/"))dynamicKnowledgePage("event",routePath.split("/")[1]);else if(routePath.startsWith("topic/"))dynamicKnowledgePage("topic",routePath.split("/")[1]);else if(routePath==="contribute"){contributionPage();}else if((routePath==="review"||routePath==="admin")){reviewPage();}else if(info[routePath]){const x=info[routePath];app.innerHTML='<section class="page"><div class="breadcrumb">BAYAN / '+(isEn?x[1]:x[0])+'</div><h1 class="page-title">'+(isEn?x[1]:x[0])+'</h1><p class="page-lead">'+x[2]+'</p>'+summaryBlock(["الوضوح قبل السرعة.","المصادر والتحقق جزء من طريقة عمل المنصة.","أي معلومة غير مؤكدة تُعامل على أنها غير مؤكدة."])+'</section>'}else if(routePath==="news")newsPage();else if(routePath==="trending")trendingPage();else if(sections.some(x=>x[0]===routePath))sectionPage(routePath);else app.innerHTML='<section class="page"><h1 class="page-title">404</h1><p class="page-lead">هذه الصفحة غير متاحة.</p></section>';if(!routePath){liveDataHome();loadHomeNewsAndDiscovery();recommendations();}const wisdom=window.BAYAN_CONTENT?.wisdom||[];const wisdomAt=Math.floor(Date.now()/30000);const wisdomIndex=wisdom.length?wisdomAt%wisdom.length:0;const w=document.querySelector("#wisdom");if(w){w.textContent=wisdom.length?(isEn?(wisdom[wisdomIndex].en||wisdom[wisdomIndex].ar):wisdom[wisdomIndex].ar):"السؤال الجيد بداية معرفة أفضل.";}
}
const safeRenderRoute=(routePath, routeParams)=>{try{renderRoute(routePath, routeParams);}catch(error){const app=document.querySelector("#app");if(app)app.innerHTML='<section class="page"><h1 class="page-title">تعذر عرض هذه الصفحة</h1><p class="page-lead">تم احتواء الخطأ حتى لا تظهر الصفحة فارغة.</p><button class="primary" type="button" onclick="location.reload()">إعادة المحاولة</button>';console.error("BAYAN route error",error);}};
const updateWisdom=()=>{const wisdom=window.BAYAN_CONTENT?.wisdom||[];const w=document.querySelector("#wisdom");if(!w)return;const i=wisdom.length?Math.floor(Date.now()/30000)%wisdom.length:0;w.textContent=wisdom.length?(isEn?(wisdom[i].en||wisdom[i].ar):wisdom[i].ar):"السؤال الجيد بداية معرفة أفضل.";};
safeRenderRoute(path,new URLSearchParams(location.search));
if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(()=>{}));}
window.setInterval(updateWisdom,30000);
document.addEventListener("click",(event)=>{
  const save=event.target.closest("[data-bayan-save]");
  if(save){
    event.preventDefault();
    event.stopPropagation();
    const id=save.getAttribute("data-bayan-save");
    let list=[];try{list=JSON.parse(localStorage.getItem("bayan:saved-articles")||"[]")}catch{}
    if(list.includes(id)){list=list.filter(x=>x!==id);save.textContent="☆ حفظ المقال";}else{list.unshift(id);save.textContent="★ محفوظ";}
    localStorage.setItem("bayan:saved-articles",JSON.stringify(list.slice(0,100)));const article=(window.BAYAN_CONTENT?.articles||[]).find(x=>x.id===id);if(article)recordInterest(article.section,"save");
    return;
  }
  const share=event.target.closest("[data-bayan-share]");
  if(share){
    event.preventDefault();
    event.stopPropagation();
    const title=share.getAttribute("data-bayan-share")||"مقال بيان";
    const data={title,text:title+" — BAYAN | بيان",url:location.href};
    if(navigator.share)navigator.share(data).catch(()=>{});
    else if(navigator.clipboard)navigator.clipboard.writeText(location.href).then(()=>{share.textContent="✓ تم نسخ الرابط";setTimeout(()=>share.textContent="↗ مشاركة",1800)}).catch(()=>{});
    return;
  }
  const link=event.target.closest("a");
  if(!link)return;
  const href=link.getAttribute("href");
  if(!href||!href.startsWith("/")||href.startsWith("//")||link.hasAttribute("download")||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  event.preventDefault();
  const u=new URL(href,location.origin);
  history.pushState({}, "", u.pathname+u.search);
  safeRenderRoute(u.pathname.replace(/^\//,"").replace(/\/$/,""), u.searchParams);
  window.scrollTo({top:0,behavior:"smooth"});
});
window.addEventListener("popstate",()=>safeRenderRoute(location.pathname.replace(/^\//,"").replace(/\/$/,""),new URLSearchParams(location.search)));
if(localStorage.getItem("bayan-theme")==="light")document.body.classList.add("light");document.querySelector("#theme")?.addEventListener("click",()=>{document.body.classList.toggle("light");localStorage.setItem("bayan-theme",document.body.classList.contains("light")?"light":"dark")});document.querySelector("#language")?.addEventListener("click",()=>{const u=new URL(location.href);u.searchParams.set("lang",isEn?"ar":"en");location.href=u});document.querySelector("#year").textContent=new Date().getFullYear()})();