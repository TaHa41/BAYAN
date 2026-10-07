(() => {
  const sections = [
    ["egypt","مصر","Egypt","أخبار ومعرفة ووقائع موثقة عن مصر.","Verified news, knowledge and facts about Egypt.","🇪🇬"],
    ["arab","العالم العربي","Arab World","المعرفة والأحداث والسياق في العالم العربي.","Knowledge, events and context across the Arab world.","◇"],
    ["world","العالم","World","أهم الأحداث والمعرفة والسياق من حول العالم.","Major events, knowledge and context from around the world.","◆"],
    ["science","العلوم","Science","اكتشافات ونظريات وحقائق علمية موثقة.","Documented discoveries, theories and scientific facts.","⚗"],
    ["economy","الاقتصاد","Economy","الاقتصاد والأسواق والأسعار والقرارات المؤثرة.","Economics, markets, prices and influential decisions.","◈"],
    ["politics","السياسة","Politics","القرارات والسياسات والقوى التي تصنع المشهد العام.","Decisions, policies and forces shaping public affairs.","▣"],
    ["technology","التقنية والذكاء الاصطناعي","Technology & AI","التقنية والذكاء الاصطناعي والابتكار.","Technology, AI and innovation.","⌘"],
    ["health","الصحة","Health","معلومات صحية موثقة وشرح واضح بعيدًا عن الادعاءات.","Verified health information explained clearly.","+"],
    ["history","التاريخ والثقافة","History & Culture","التاريخ والثقافة والفنون والتراث.","History, culture, arts and heritage.","▱"],
    ["people","الأشخاص","People","شخصيات وسير وأعمال صنعت أثرًا موثقًا.","People, biographies and documented impact.","●"],
    ["sports","الرياضة والبيانات","Sports & Data","الرياضة والنتائج والإحصاءات والسجلات.","Sports, results, statistics and records.","△"],
    ["travel","السفر","Travel","الوجهات والأماكن والمعلومات العملية للسفر.","Destinations, places and practical travel knowledge.","✈"]
  ];  const params = new URLSearchParams(location.search);
  const lang = params.get("lang") === "en" ? "en" : "ar";
  const ar = lang === "ar";
  const t = (a, e) => ar ? a : e;
  const app = document.querySelector("#app");
  const nav = document.querySelector("#nav");
  const drawer = document.querySelector("#drawer");
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"]/g, (m) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"
  }[m]));

  const api = async (url, options) => {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error("http_" + response.status);
    return response.json();
  };

  const link = (url, label, cls = "") =>
    '<a class="' + cls + '" href="' + url + '">' + label + "</a>";

  const imageHtml = (item, className = "article-card-image") =>
    item.imageUrl
      ? '<img loading="lazy" class="' + className + '" src="' + escapeHtml(item.imageUrl) + '" alt="' + escapeHtml(item.imageAlt || item.title || "") + '">'
      : '<div class="image-placeholder">BAYAN</div>';

  const articleCard = (item) =>
    '<a class="article-card" href="/article/' + encodeURIComponent(item.slug || "") + '?lang=' + lang + '">' +
      imageHtml(item) +
      '<div class="article-card-body"><span class="kicker">' + escapeHtml(item.section || t("مادة","Content")) + "</span>" +
      "<h3>" + escapeHtml(item.title) + "</h3><p>" + escapeHtml(item.summary) + '</p><span class="read">' +
      t("اقرأ الملف","Read the file") + " →</span></div></a>";

  function searchBox(value = "") {
    return '<form class="search" id="search"><input name="q" value="' + escapeHtml(value) +
      '" placeholder="' + t("ابحث عن شخص، خبر، سؤال، سعر أو أي موضوع…","Search for a person, news story, question, price or any topic…") +
      '" required><button class="primary">' + t("ابحث في بيان","Search BAYAN") + "</button></form>";
  }

  function bindSearch() {
    document.querySelector("#search")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const query = new FormData(event.target).get("q");
      if (query) location.href = "/search?q=" + encodeURIComponent(query) + "&lang=" + lang;
    });
  }

  function renderShell() {
    document.documentElement.lang = lang;
    const footerLabels = ar ? ["عن بيان","المنهجية","الخصوصية","الشروط"] : ["About BAYAN","Methodology","Privacy","Terms"];
    ["f-about","f-method","f-privacy","f-terms"].forEach((id,i)=>{ const el=document.getElementById(id); if(el){ el.textContent=footerLabels[i]; const u=new URL(el.href,location.origin); u.searchParams.set("lang",lang); el.href=u.pathname+"?lang="+lang; }});
    document.documentElement.dir = ar ? "rtl" : "ltr";
    const brand = document.querySelector(".brand span");
    if (brand) brand.textContent = ar ? "بيان" : "BAYAN";
    nav.innerHTML =
      link("/search?lang=" + lang, t("بحث","Search")) +
      link("/news?lang=" + lang, t("الأخبار","News")) +
      '<button id="lang" class="navbtn">' + (ar ? "EN" : "AR") + "</button>" +
      '<button id="theme" class="navbtn">◐</button>';

    drawer.innerHTML =
      '<div class="drawer-head"><div><b>BAYAN</b><span>' + t("مركز المعرفة","Knowledge") +
      '</span></div><button id="closeDrawer" class="navbtn">×</button></div>' +
      '<div class="drawer-main">' +
      sections.map((s) => link("/" + s[0] + "?lang=" + lang,
        '<span class="drawer-icon">' + s[5] + "</span><span>" + (ar ? s[1] : s[2]) + "</span>",
        "drawer-link")).join("") +
      '</div><div class="drawer-tools">' +
      link("/ask?lang=" + lang, t("اسأل بيان","Ask BAYAN")) +
      link("/prices?lang=" + lang, t("مباشر الآن","Live Data & Prices")) +
      link("/contribute?lang=" + lang, t("ساهم بمعلومة","Contribute")) +
      link("/saved?lang=" + lang, t("المحفوظات","Saved")) +
      link("/tools?lang=" + lang, t("الأدوات","Tools")) +
      link("/admin?lang=" + lang, t("الإدارة","Admin")) +
      "</div>";

    document.querySelector("#menu").onclick = () => drawer.classList.toggle("open");
    document.querySelector("#closeDrawer").onclick = () => drawer.classList.remove("open");
    drawer.querySelectorAll("a").forEach((item) => {
      item.addEventListener("click", () => drawer.classList.remove("open"));
    });
    drawer.addEventListener("click", (event) => {
      if (event.target === drawer) drawer.classList.remove("open");
    });
    document.querySelector("#lang").onclick = () => {
      const url = new URL(location.href);
      url.searchParams.set("lang", ar ? "en" : "ar");
      location.href = url;
    };
    const applyTheme = () => {
      const mode = localStorage.getItem("bayan-theme") || "auto";
      const dark = mode === "dark" || (mode === "auto" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.body.classList.toggle("dark", dark);
      const themeButton = document.querySelector("#theme");
      if (themeButton) themeButton.title = t("المظهر: " + (mode === "dark" ? "داكن" : mode === "light" ? "فاتح" : "تلقائي"), "Theme: " + (mode === "dark" ? "Dark" : mode === "light" ? "Light" : "Auto"));
    };
    applyTheme();
    document.querySelector("#theme").onclick = () => {
      const mode = localStorage.getItem("bayan-theme") || "auto";
      const next = mode === "auto" ? "light" : mode === "light" ? "dark" : "auto";
      localStorage.setItem("bayan-theme", next);
      applyTheme();
    };
    window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener?.("change", applyTheme);
  }

  async function hydrateSectionImages(items) {
    await Promise.all((items || []).map(async (item, index) => {
      if (item.imageUrl) return;
      try {
        const data = await api("/api/image?q=" + encodeURIComponent(item.title + " " + (item.summary || "")));
        const placeholders = document.querySelectorAll(".image-placeholder");
        if (data.imageUrl && placeholders[index]) {
          placeholders[index].outerHTML = '<img loading="lazy" class="article-card-image" src="' +
            escapeHtml(data.imageUrl) + '" alt="' + escapeHtml(item.title) + '">';
        }
      } catch {}
    }));
  }

  async function renderHome() {
    app.innerHTML = `
      <section class="home">
        <div class="home-copy">
          <span class="eyebrow">${t("بيان — مركز معرفة موثوق","BAYAN — a trusted knowledge center")}</span>
          <h1>${t("أي شيء تريد معرفته.<br><em>ابحث عنه هنا.</em>","Anything you want to know.<br><em>Find it here.</em>")}</h1>
          <p>${t("شخصية، خبر، موضوع، سؤال، طريقة، مشكلة تقنية أو سعر لحظي — نبحث، نتحقق، ونرتب لك الصورة كاملة قبل أن ندّعي اليقين.","A person, news story, topic, question, how-to, technical problem or live price — we retrieve, verify and organize the full picture before claiming certainty.")}</p>
          ${searchBox()}<div class="home-actions"><a class="primary" href="/ask?lang=${lang}">${t("اسأل بيان","Ask BAYAN")}</a></div>
          <div class="trust-row"><span>✓ ${t("أدلة ومصادر","Evidence & sources")}</span><span>◉ ${t("تحديث مستمر","Continuously updated")}</span><span>⌁ ${t("ذكاء يساعدك","AI assistance")}</span></div>
        </div>
        <div class="section-intro"><span class="eyebrow">${t("استكشف الأقسام","Explore sections")}</span><div class="section-grid">${sections.map((s) => '<a class="section-card" href="/' + s[0] + '?lang=' + lang + '"><span class="section-icon">' + s[5] + '</span><div><h2>' + escapeHtml(ar ? s[1] : s[2]) + '</h2><p>' + escapeHtml(ar ? s[3] : s[4]) + '</p></div><b>↗</b></a>').join("")}</div></div>
        <div class="home-content">
          <div class="page-head home-feed-head"><span class="eyebrow">${t("آخر ما نُشر","Latest published")}</span><h2>${t("أحدث المعرفة والأخبار","Latest knowledge and news")}</h2></div>
          <div id="home-news" class="article-grid"><div class="notice loading">${t("جاري تحديث الأخبار…","Refreshing news…")}</div></div>
          <div id="home-featured" class="article-grid"></div>
        </div>
      </section>`;
    bindSearch();
    try {
      const [newsData, ...sectionData] = await Promise.all([
        api("/api/news?lang=" + lang),
        ...sections.filter((s) => !["news","prices","trends"].includes(s[0])).map((s) =>
          api("/api/section?section=" + encodeURIComponent(s[0]) + "&lang=" + lang).catch(() => ({items: []}))
        )
      ]);
      const newsOut = document.querySelector("#home-news");
      const newsItems = (newsData.items || []).slice(0, 6);
      newsOut.innerHTML = newsItems.length
        ? newsItems.map((item) => '<a class="article-card" href="/news?story=' + encodeURIComponent(item.title) + '&lang=' + lang + '">' + imageHtml(item) + '<div class="article-card-body"><span class="kicker">' + escapeHtml(item.publisher || t("الأخبار","News")) + '</span><h3>' + escapeHtml(item.title) + '</h3><p>' + escapeHtml(item.summary || "") + '</p><div class="source-line">' + escapeHtml(item.publishedAt || "") + '</div><span class="read">' + t("اقرأ داخل بيان","Read inside BAYAN") + " →</span></div></a>").join("")
        : '<div class="notice">' + t("لا توجد أخبار حديثة متاحة الآن؛ لن نعرض خبرًا مختلقًا.","No current news is available right now; BAYAN will not invent a story.") + "</div>";
      const featured = sectionData.flatMap((x) => x.items || []).slice(0, 9);
      const featuredOut = document.querySelector("#home-featured");
      featuredOut.innerHTML = featured.length ? featured.map(articleCard).join("") : '<div class="notice">' + t("لا توجد مواد منشورة إضافية الآن.","No additional published material is available right now.") + "</div>";
      hydrateSectionImages(featured);
    } catch {
      const out=document.querySelector("#home-news");
      if(out) out.innerHTML='<div class="notice">' + t("تعذر تحديث محتوى الصفحة الرئيسية الآن. الأقسام ما زالت متاحة من القائمة.","Homepage content could not be refreshed. Sections remain available from the menu.") + "</div>";
    }
  }

  async function renderSearch() {
    const query = params.get("q") || "";
    app.innerHTML =
      '<section class="page"><div class="page-head"><span class="eyebrow">' + t("محرك بيان","BAYAN Search") +
      '</span><h1>' + t("ابحث عن أي شيء","Search for anything") + '</h1><p>' +
      t("الشخصيات والموضوعات والأخبار والقصص والأسئلة والحلول والبيانات الحية في مسار واحد.",
        "People, topics, news, stories, questions, solutions and live data in one search.") +
      '</p></div>' + searchBox(query) + '<div id="out" class="results"></div></section>';
    bindSearch();
    if (!query) return;
    try {
      const data = await api("/api/search?q=" + encodeURIComponent(query) + "&lang=" + lang);
      const output = document.querySelector("#out");
      output.innerHTML = data.results?.length
        ? '<div class="result-meta">' + escapeHtml((data.providers || []).join(" · ") || "BAYAN") + "</div>" +
          data.results.map((item) =>
            '<article class="search-result"><span class="kicker">' + escapeHtml(item.section) + " · " +
            escapeHtml(item.evidence) + "</span><h2>" +
            (item.slug ? '<a href="/article/' + encodeURIComponent(item.slug) + '?lang=' + lang + '">' +
              escapeHtml(item.title) + "</a>" : escapeHtml(item.title)) +
            "</h2><p>" + escapeHtml(item.summary) + '</p><div class="source-line">' +
            (item.sources || []).slice(0, 3).map((source) => escapeHtml(source.publisher)).join(" · ") +
            "</div></article>").join("")
        : '<div class="notice"><h2>' + t("لم تُرجع محركات البحث نتيجة الآن","Search providers returned no result right now") +
          '</h2><p>' + t("سيحاول بيان توسيع مسارات البحث بدل اختلاق معلومة.","BAYAN will expand its search paths rather than invent information.") + "</p></div>";
    } catch {
      document.querySelector("#out").innerHTML =
        '<div class="notice">' + t("حدث خطأ مؤقت في البحث. حاول مرة أخرى.","Search is temporarily unavailable. Please try again.") + "</div>";
    }
  }

  async function renderArticle() {
    const slug = decodeURIComponent(location.pathname.slice(9));
    app.innerHTML = '<section class="page narrow"><div id="article"><div class="notice loading">' +
      t("جاري تجهيز الملف…","Preparing the knowledge file…") + "</div></div></section>";
    try {
      const data = await api("/api/article?slug=" + encodeURIComponent(slug) + "&lang=" + lang);
      const output = document.querySelector("#article");
      output.innerHTML =
        '<article class="article-full">' + (data.imageUrl ?
        '<img class="article-hero-image" src="' + escapeHtml(data.imageUrl) + '" alt="' + escapeHtml(data.imageAlt || data.title) + '">' : "") +
        '<span class="eyebrow">' + escapeHtml(data.section || "BAYAN") + "</span><h1>" +
        escapeHtml(data.title) + '</h1><p class="lead">' + escapeHtml(data.summary || "") +
        '</p><div class="article-body">' + String(data.body || "").split(/\n+/).map((line) =>
        "<p>" + escapeHtml(line) + "</p>").join("") +
        '</div><div class="sources-box"><h2>' + t("الأدلة والمصادر","Evidence & sources") + "</h2>" +
        (data.sources || []).map((source) =>
          '<div class="source-line">' + escapeHtml(source.publisher || "") + " · " + escapeHtml(source.title || "") +
          "</div>").join("") + "</div></article>";
      if (!data.imageUrl) {
        try {
          const image = await api("/api/image?q=" + encodeURIComponent(data.title + " " + (data.summary || "")));
          if (image.imageUrl) document.querySelector(".article-full")?.insertAdjacentHTML(
            "afterbegin", '<img class="article-hero-image" src="' + escapeHtml(image.imageUrl) + '" alt="' +
            escapeHtml(data.title) + '">');
        } catch {}
      }
    } catch {
      document.querySelector("#article").innerHTML =
        '<div class="notice">' + t("تعذر فتح الملف.","The knowledge file could not be opened.") + "</div>";
    }
  }

  async function renderNews() {
    const storyTitle = params.get("story") || "";
    app.innerHTML =
      '<section class="page"><div class="page-head"><span class="eyebrow">' + t("محدث الآن","Updated now") +
      '</span><h1>' + t("الأخبار","News") + '</h1><p>' +
      t("أخبار حديثة من أكثر من مزود، مع الصورة والوقت والمصدر، وتُفتح داخل بيان كصفحات خبر منظمة.",
        "Current stories from multiple providers, with imagery, time and source metadata, opened inside BAYAN.") +
      '</p></div><div id="news" class="article-grid"><div class="notice">…</div></div></section>';

    try {
      const data = await api("/api/news?lang=" + lang);
      const items = data.items || [];
      const output = document.querySelector("#news");
      const story = storyTitle ? items.find((item) => item.title === storyTitle) : null;
      if (story) {
        output.className = "results";
        try {
          const articleData = await api("/api/news/article?title=" + encodeURIComponent(story.title) +
            "&image=" + encodeURIComponent(story.imageUrl || "") + "&lang=" + lang);
          const article = articleData.article;
          output.innerHTML =
            '<article class="article-full">' + (article.image ?
            '<img class="article-hero-image" src="' + escapeHtml(article.image) + '" alt="' + escapeHtml(article.title) + '">' : "") +
            '<span class="eyebrow">' + escapeHtml(story.publisher || "News") + "</span><h1>" +
            escapeHtml(article.title) + '</h1><p class="lead">' + escapeHtml(article.summary || story.summary || "") +
            '</p><div class="article-body">' + String(article.body || "").split(/\n+/).map((line) =>
            "<p>" + escapeHtml(line) + "</p>").join("") +
            '</div><div class="sources-box"><h2>' + t("الأدلة والمصادر","Evidence & sources") + "</h2>" +
            (article.sources || []).map((source) =>
              '<div class="source-line">' + escapeHtml(source.publisher || "") + " · " + escapeHtml(source.title || "") +
              "</div>").join("") + "</div></article>";
        } catch {
          output.innerHTML = '<div class="notice">' +
            t("تعذر تجهيز المقال الكامل من الأدلة الآن.","The full evidence-based article could not be prepared right now.") + "</div>";
        }
        return;
      }
      output.innerHTML = items.length
        ? items.map((item) =>
          '<a class="article-card" href="/news?story=' + encodeURIComponent(item.title) + '&lang=' + lang + '">' +
          imageHtml(item) + '<div class="article-card-body"><span class="kicker">' +
          escapeHtml(item.publisher || "News") + "</span><h2>" + escapeHtml(item.title) +
          "</h2><p>" + escapeHtml(item.summary) + '</p><div class="source-line">' +
          escapeHtml(item.publishedAt || "") + '</div><span class="read">' +
          t("اقرأ داخل بيان","Read inside BAYAN") + " →</span></div></a>").join("")
        : '<div class="notice">' + t("لم يرجع أي مزود أخبار مادة الآن. لن نعرض أخبارًا مختلقة.",
          "No news provider returned a story right now. BAYAN will not invent news.") + "</div>";
    } catch {
      document.querySelector("#news").innerHTML =
        '<div class="notice">' + t("تعذر تحديث الأخبار الآن.","News could not be refreshed right now.") + "</div>";
    }
  }

  async function renderAsk() {
    app.innerHTML =
      '<section class="page narrow"><div class="page-head"><span class="eyebrow">BAYAN AI</span><h1>' +
      t("اسأل بيان","Ask BAYAN") + '</h1><p>' +
      t("مساعد بحثي معك أثناء البحث والفهم والتحقق. إذا تعارضت الأدلة سيقول ذلك بوضوح.",
        "A research assistant for searching, understanding and verifying. If evidence conflicts, it says so clearly.") +
      '</p></div>' + searchBox() + '<div id="answer"></div></section>';
    document.querySelector("#search").onsubmit = async (event) => {
      event.preventDefault();
      const question = new FormData(event.target).get("q");
      const output = document.querySelector("#answer");
      output.innerHTML = '<div class="notice loading">' +
        t("أجمع الأدلة وأتحقق منها…","Gathering and checking evidence…") + "</div>";
      try {
        const data = await api("/api/ask?lang=" + lang, {
          method: "POST",
          headers: {"content-type":"application/json"},
          body: JSON.stringify({question})
        });
        output.innerHTML =
          '<article class="answer"><span class="eyebrow">' + t("إجابة بيان","BAYAN answer") +
          '</span><h2>' + escapeHtml(data.answer || data.message || "") +
          '</h2><p class="evidence-label">' + t("الأدلة المستخدمة","Evidence used") + "</p>" +
          (data.evidence || []).map((item) =>
            '<div class="evidence-item"><b>' + escapeHtml(item.title) +
            "</b><p>" + escapeHtml(item.summary) + "</p></div>").join("") + "</article>";
      } catch {
        output.innerHTML = '<div class="notice">' +
          t("تعذر إكمال الإجابة الآن.","The answer could not be completed right now.") + "</div>";
      }
    };
  }

  async function renderContribute() {
    app.innerHTML =
      '<section class="page narrow"><div class="page-head"><span class="eyebrow">' +
      t("شارك المعرفة","Share knowledge") + '</span><h1>' + t("ساهم بمعلومة","Contribute") +
      '</h1><p>' + t("المعلومة لا تُنشر تلقائيًا؛ تمر بالمراجعة والتحقق أولًا.",
        "A submission is reviewed and verified before publication.") +
      '</p></div><form id="contrib" class="form"><input class="field" name="title" placeholder="' +
      t("عنوان واضح","Clear title") + '" required><textarea class="field" name="body" placeholder="' +
      t("اكتب المعلومة بالتفصيل…","Write the information in detail…") +
      '" required></textarea><input class="field" name="source" placeholder="' +
      t("مصدر اختياري","Optional source") + '"><select class="field" name="section">' +
      sections.filter((s) => s[0] !== "news" && s[0] !== "prices").map((s) =>
        '<option value="' + s[0] + '">' + (ar ? s[1] : s[2]) + "</option>").join("") +
      '</select><button class="primary">' + t("إرسال للمراجعة","Submit for review") +
      '</button></form><div id="msg"></div></section>';

    document.querySelector("#contrib").onsubmit = async (event) => {
      event.preventDefault();
      try {
        const body = Object.fromEntries(new FormData(event.target));
        const data = await api("/api/contribute", {
          method: "POST",
          headers: {"content-type":"application/json"},
          body: JSON.stringify(body)
        });
        document.querySelector("#msg").innerHTML =
          '<div class="notice">' + (data.ok
            ? t("وصلت مساهمتك إلى المراجعة.","Your contribution is now in review.")
            : t("تعذر إرسال المساهمة.","Submission failed.")) + "</div>";
      } catch {
        document.querySelector("#msg").innerHTML =
          '<div class="notice">' + t("تعذر إرسال المساهمة.","Submission failed.") + "</div>";
      }
    };
  }

  async function renderPrices() {
    app.innerHTML =
      '<section class="page"><div class="page-head"><span class="eyebrow">' +
      t("بيانات حية","Live data") + '</span><h1>' + t("الأسعار والبيانات الحية","Prices & Live Data") +
      '</h1></div><div class="live-grid"><div class="live" id="weather">…</div><div class="live" id="fx">…</div><div class="live" id="gold">…</div></div></section>';
    try {
      const [weather, fx, gold] = await Promise.all([
        api("/api/live/weather"), api("/api/live/fx"), api("/api/live/gold")
      ]);
      document.querySelector("#weather").innerHTML =
        '<span class="kicker">' + t("الطقس","Weather") + "</span><h2>" +
        escapeHtml(weather.current?.temperature_2m ?? "—") + ' °C</h2><p>' +
        escapeHtml(weather.provider || "") + "</p>";
      document.querySelector("#fx").innerHTML =
        '<span class="kicker">' + t("العملات","Currencies") + '</span><h2>USD / EGP</h2><p>' +
        escapeHtml(fx.rates?.EGP ?? "—") + '</p><span class="source-line">' +
        escapeHtml(fx.provider || "") + "</span>";
      document.querySelector("#gold").innerHTML =
        '<span class="kicker">' + t("الذهب","Gold") + "</span><h2>" +
        escapeHtml(gold.price ?? gold.gold?.["24K"] ?? "—") + '</h2><p>' +
        escapeHtml(gold.provider || "") + "</p>";
    } catch {
      document.querySelector(".live-grid").innerHTML =
        '<div class="notice">' + t("تعذر تحديث البيانات الحية.","Live data could not be refreshed.") + "</div>";
    }
  }

  async function renderAdmin() {
    app.innerHTML='<section class="page admin-page"><div class="page-head"><span class="eyebrow">BAYAN CONTROL CENTER</span><h1>'+t("مركز تحكم بيان","BAYAN Control Center")+'</h1><p>'+t("تحكم كامل في المحتوى والنشر والأقسام والإعدادات والمراقبة.","Full control over content, publishing, sections, settings and monitoring.")+'</p></div><div class="admin-login"><input id="adminToken" class="field" type="password" placeholder="'+t("رمز مدير بيان","BAYAN manager token")+'"><button id="adminSave" class="primary">'+t("دخول","Enter")+'</button><button id="adminRepair" class="navbtn">'+t("تشخيص وإصلاح","Diagnose & Repair")+'</button></div><div id="adminOut"></div></section>';
    const token=()=>sessionStorage.getItem("bayan-admin-token")||"";
    document.querySelector("#adminSave").onclick=()=>{const v=document.querySelector("#adminToken").value.trim();if(v)sessionStorage.setItem("bayan-admin-token",v);load();};
    async function adminApi(url,options={}){const h=new Headers(options.headers||{});h.set("x-bayan-manager-token",token());const r=await fetch(url,{...options,headers:h});if(r.status===401)throw new Error("unauthorized");if(!r.ok)throw new Error("http_"+r.status);return r.json();}
    const opts=()=>sections.filter(x=>x[0]!=="prices").map(x=>'<option value="'+x[0]+'">'+escapeHtml(ar?x[1]:x[2])+'</option>').join("");
    async function load(){const o=document.querySelector("#adminOut");if(!token()){o.innerHTML='<div class="notice">'+t("أدخل رمز المدير لفتح الإدارة.","Enter the manager token to open admin.")+"</div>";return;}o.innerHTML='<div class="notice loading">'+t("جاري تحميل الإدارة…","Loading admin…")+"</div>";
      try{const [health,settings,repairs,runtime,analytics,contributions,articles]=await Promise.all([api("/api/health"),adminApi("/api/admin/settings"),adminApi("/api/admin/repairs"),adminApi("/api/admin/runtime"),adminApi("/api/admin/analytics"),adminApi("/api/admin/contributions"),adminApi("/api/admin/articles")]);const st=Object.fromEntries((settings.items||[]).map(x=>[x.key,x.value])),list=articles.items||[];
      o.innerHTML='<div class="admin-grid"><div class="admin-card"><span class="kicker">'+t("الحالة","Status")+'</span><h2>🟢 '+t("يعمل","Online")+'</h2><p>BAYAN v'+escapeHtml(health.version||"1.0.0")+'</p></div><div class="admin-card"><span class="kicker">'+t("المقالات","Articles")+'</span><h2>'+list.length+'</h2><p>'+t("كل الحالات","All statuses")+'</p></div><div class="admin-card"><span class="kicker">'+t("الإصلاح الذاتي","Self-healing")+'</span><h2>'+(st.auto_repair==="1"?"🟢":"⏸️")+'</h2></div></div>';
      o.innerHTML+='<div class="admin-card"><h2>'+t("إعدادات التحكم","Control settings")+'</h2><div class="admin-controls">'+[["min_sources",t("الحد الأدنى للمصادر","Minimum sources")],["max_sources",t("أقصى المصادر","Maximum sources")],["news_items",t("عدد الأخبار","News items")],["search_timeout_ms",t("مهلة البحث","Search timeout")]].map(x=>'<label>'+x[1]+'<input class="field setting" data-key="'+x[0]+'" value="'+escapeHtml(st[x[0]]||"")+'"></label>').join("")+'<label><input type="checkbox" class="setting-check" data-key="image_required" '+(st.image_required==="1"?"checked":"")+'> '+t("إلزام الصورة","Require image")+'</label><label><input type="checkbox" class="setting-check" data-key="auto_repair" '+(st.auto_repair==="1"?"checked":"")+'> '+t("الإصلاح التلقائي الآمن","Safe auto repair")+'</label><button id="saveSettings" class="primary">'+t("حفظ","Save")+'</button></div></div>';
      o.innerHTML+='<div class="admin-card"><h2>'+t("إدارة المحتوى","Content management")+'</h2><div class="admin-list">'+list.slice(0,100).map((x,i)=>'<div class="admin-article-row"><b>'+escapeHtml(x.title)+'</b><small>'+escapeHtml(x.language==="en"?"English":"العربية")+' · '+escapeHtml(x.section)+' · '+escapeHtml(x.status)+'</small><button class="editArticle navbtn" data-i="'+i+'">'+t("تحرير","Edit")+'</button><button class="statusArticle navbtn" data-slug="'+escapeHtml(x.slug)+'" data-lang="'+x.language+'" data-status="'+(x.status==="PUBLISHED"?"DRAFT":"PUBLISHED")+'">'+(x.status==="PUBLISHED"?t("إخفاء","Unpublish"):t("نشر","Publish"))+'</button><button class="deleteArticle navbtn" data-slug="'+escapeHtml(x.slug)+'" data-lang="'+x.language+'">'+t("حذف","Delete")+'</button></div>').join("")+'</div><div id="articleEditor"></div></div>';
      o.innerHTML+='<div class="admin-card"><h2>'+t("إحصائيات الموقع","Site statistics")+'</h2><div class="admin-grid"><div><span class="kicker">'+t("إجمالي الزيارات","Total views")+'</span><h2>'+Number(analytics.totalViews||0)+'</h2></div><div><span class="kicker">'+t("الزوار الفريدون","Unique visitors")+'</span><h2>'+Number(analytics.uniqueVisitors||0)+'</h2></div><div><span class="kicker">'+t("اليوم","Today")+'</span><h2>'+Number(analytics.periods?.day?.views||0)+'</h2></div><div><span class="kicker">'+t("7 أيام","7 days")+'</span><h2>'+Number(analytics.periods?.week?.views||0)+'</h2></div><div><span class="kicker">'+t("30 يومًا","30 days")+'</span><h2>'+Number(analytics.periods?.month?.views||0)+'</h2></div></div><h3>'+t("أكثر الصفحات","Top pages")+'</h3><div class="admin-list">'+(analytics.topPages||[]).slice(0,10).map(x=>'<div><b>'+escapeHtml(x.path)+'</b><small>'+Number(x.visits||0)+'</small></div>').join("")+'</div><h3>'+t("أكثر عمليات البحث","Top searches")+'</h3><div class="admin-list">'+(analytics.topSearches||[]).slice(0,10).map(x=>'<div><b>'+escapeHtml(x.query)+'</b><small>'+Number(x.count||0)+'</small></div>').join("")+'</div></div>';o.innerHTML+='<div class="admin-card"><h2>'+t("المساهمات","Contributions")+'</h2><div class="admin-list">'+(contributions.items||[]).filter(x=>x.status==="PENDING").slice(0,30).map(x=>'<div><b>'+escapeHtml(x.title)+'</b> <button class="reviewBtn navbtn" data-id="'+x.id+'" data-action="APPROVE">'+t("نشر","Approve")+'</button><button class="reviewBtn navbtn" data-id="'+x.id+'" data-action="REJECT">'+t("رفض","Reject")+'</button></div>').join("")+'</div></div>';
      o.innerHTML+='<div class="admin-card"><h2>'+t("المراقبة والإصلاحات","Monitoring & repairs")+'</h2><div class="admin-list">'+(runtime.items||[]).slice(0,8).map(x=>'<div><b>'+escapeHtml(x.level)+'</b> · '+escapeHtml(x.kind)+' — '+escapeHtml(x.message)+'</div>').join("")+(repairs.items||[]).slice(0,8).map(x=>'<div><b>'+escapeHtml(x.status)+'</b> · '+escapeHtml(x.signature)+'</div>').join("")+'</div></div>';
      document.querySelector("#saveSettings").onclick=async()=>{for(const e of document.querySelectorAll(".setting,.setting-check"))await adminApi("/api/admin/settings",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({key:e.dataset.key,value:e.type==="checkbox"?(e.checked?"1":"0"):e.value})});load();};
      document.querySelectorAll(".statusArticle").forEach(b=>b.onclick=async()=>{await adminApi("/api/admin/article/status",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({slug:b.dataset.slug,language:b.dataset.lang,status:b.dataset.status})});load();});
      document.querySelectorAll(".deleteArticle").forEach(b=>b.onclick=async()=>{if(confirm(t("حذف المقال نهائيًا؟","Delete permanently?")))await adminApi("/api/admin/article/delete",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({slug:b.dataset.slug,language:b.dataset.lang})});load();});
      document.querySelectorAll(".editArticle").forEach(b=>b.onclick=()=>{const x=list[Number(b.dataset.i)],e=document.querySelector("#articleEditor");e.innerHTML='<div class="admin-card"><h3>'+t("تحرير المقال","Edit article")+'</h3><input id="edTitle" class="field" value="'+escapeHtml(x.title)+'"><textarea id="edSummary" class="field" rows="3">'+escapeHtml(x.summary||"")+'</textarea><textarea id="edBody" class="field" rows="10">'+escapeHtml(x.body||"")+'</textarea><select id="edSection" class="field">'+opts()+'</select><select id="edStatus" class="field"><option>PUBLISHED</option><option>DRAFT</option><option>ARCHIVED</option></select><input id="edImage" class="field" value="'+escapeHtml(x.image_url||"")+'" placeholder="https://..."><button id="edSave" class="primary">'+t("حفظ التعديلات","Save changes")+'</button></div>';document.querySelector("#edSection").value=x.section;document.querySelector("#edStatus").value=x.status;document.querySelector("#edSave").onclick=async()=>{await adminApi("/api/admin/article",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({slug:x.slug,language:x.language,title:document.querySelector("#edTitle").value,summary:document.querySelector("#edSummary").value,articleBody:document.querySelector("#edBody").value,section:document.querySelector("#edSection").value,status:document.querySelector("#edStatus").value,imageUrl:document.querySelector("#edImage").value,imageAlt:document.querySelector("#edTitle").value})});load();};});
      document.querySelectorAll(".reviewBtn").forEach(b=>b.onclick=async()=>{await adminApi("/api/admin/contributions/review",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({id:Number(b.dataset.id),action:b.dataset.action})});load();});
      }catch(e){o.innerHTML='<div class="notice">'+(String(e).includes("unauthorized")?t("رمز المدير غير صحيح.","Invalid manager token."):t("تعذر تحميل لوحة الإدارة.","Admin panel failed to load."))+"</div>";}}
    document.querySelector("#adminRepair").onclick=async()=>{const o=document.querySelector("#adminOut");o.innerHTML='<div class="notice loading">'+t("جاري التشخيص…","Diagnosing…")+"</div>";try{const d=await adminApi("/api/admin/repair");o.innerHTML='<div class="notice"><h2>'+escapeHtml(d.ok?t("لا توجد مشكلة حتمية.","No deterministic failure."):t("تم تسجيل المشكلة.","Failure recorded."))+'</h2></div>';}catch{o.innerHTML='<div class="notice">'+t("تعذر الإصلاح.","Repair failed.")+"</div>";}};load();
  }

  async function renderSaved() {
    app.innerHTML='<section class="page"><div class="page-head"><span class="eyebrow">'+t("مكتبتك","Your library")+'</span><h1>'+t("المحفوظات","Saved")+'</h1><p>'+t("المقالات التي حفظتها على هذا الجهاز.","Articles saved on this device.")+'</p></div><div id="saved-content" class="article-grid"><div class="notice loading">'+t("جاري التحميل…","Loading…")+'</div></div></section>';
    try{const data=await api("/api/saved"),items=[];for(const row of data.items||[]){try{const a=await api("/api/article?slug="+encodeURIComponent(row.slug)+"&lang="+lang);if(a)items.push(a)}catch{}}const out=document.querySelector("#saved-content");out.innerHTML=items.length?items.map(articleCard).join(""):'<div class="notice">'+t("لا توجد مقالات محفوظة بعد.","No saved articles yet.")+"</div>";hydrateSectionImages(items);}catch{document.querySelector("#saved-content").innerHTML='<div class="notice">'+t("تعذر تحميل المحفوظات الآن.","Saved items could not be loaded right now.")+"</div>"}
  }

  async function renderTools() {
    app.innerHTML='<section class="page"><div class="page-head"><span class="eyebrow">'+t("أدوات بيان","BAYAN tools")+'</span><h1>'+t("الأدوات","Tools")+'</h1><p>'+t("أدوات مباشرة للبحث والبيانات والتحقق.","Direct tools for search, live data and verification.")+'</p></div><div class="section-grid">'+[
      ["/search?lang="+lang,t("البحث","Search"),t("ابحث في المعرفة والمصادر.","Search knowledge and sources.")],
      ["/ask?lang="+lang,t("اسأل بيان","Ask BAYAN"),t("اسأل سؤالًا واجمع الأدلة.","Ask a question and gather evidence.")],
      ["/prices?lang="+lang,t("البيانات الحية","Live Data"),t("الطقس والعملات والذهب.","Weather, FX and gold.")],
      ["/contribute?lang="+lang,t("المساهمة","Contribute"),t("أرسل معلومة للمراجعة.","Submit information for review.")]
    ].map(x=>'<a class="section-card" href="'+x[0]+'"><div><h2>'+x[1]+'</h2><p>'+x[2]+'</p></div><b>↗</b></a>').join("")+'</div></section>';
  }

  async function renderStatic(kind) {
    const data={
      about:[t("عن بيان","About BAYAN"),t("بيان مركز معرفة وأخبار وبيانات مبني على الأدلة والتحقق قبل الادعاء.","BAYAN is a knowledge, news and live-data service built around evidence and verification.")],
      methodology:[t("المنهجية","Methodology"),t("نسترجع الأدلة أولًا، نقارن المصادر، ثم نعرض ما يمكن دعمه بوضوح ونذكر نقص الأدلة عند الحاجة.","We retrieve evidence first, compare sources, then present what can be supported and clearly state when evidence is insufficient.")],
      privacy:[t("الخصوصية","Privacy"),t("نستخدم الحد الأدنى اللازم لتشغيل الخدمة وقياس الاستخدام التقني، وتظل إحصاءات الزيارات الإدارية خاصة.","We use only the information needed to operate the service and measure technical usage; visit analytics remain private to the administrator.")],
      terms:[t("الشروط","Terms"),t("المحتوى المعروض للمعلومات العامة ولا يغني عن التحقق المستقل أو المشورة المتخصصة عند الحاجة.","Content is provided for general information and does not replace independent verification or professional advice when needed.")]
    }[kind];
    app.innerHTML='<section class="page narrow"><div class="page-head"><span class="eyebrow">BAYAN</span><h1>'+data[0]+'</h1></div><article class="answer"><p>'+data[1]+'</p></article></section>';
  }

  async function renderSection(slug) {
    const section=sections.find((item)=>item[0]===slug); if(!section)return;
    app.innerHTML='<section class="page"><div class="page-head"><span class="eyebrow">'+escapeHtml(section[5])+" "+t("قسم معرفي","Knowledge section")+'</span><h1>'+escapeHtml(ar?section[1]:section[2])+'</h1><p>'+escapeHtml(ar?section[3]:section[4])+'</p></div><div id="wisdom" class="wisdom-card"><span class="kicker">'+t("حكمة بيان","BAYAN Insight")+'</span><p>'+t("جاري اختيار عبارة…","Selecting an insight…")+'</p></div><div id="section-content" class="article-grid"><div class="notice">'+t("جاري تحميل المواد…","Loading content…")+"</div></div></section>";
    try{const wd=await api("/api/wisdom?section="+encodeURIComponent(slug)+"&lang="+lang);const w=document.querySelector("#wisdom p");if(w)w.textContent=wd.wisdom||"";}catch{}
    try{const data=await api("/api/section?section="+encodeURIComponent(slug)+"&lang="+lang),out=document.querySelector("#section-content");out.innerHTML=data.items?.length?data.items.map(articleCard).join(""):'<div class="notice"><h2>'+t("لا توجد مواد منشورة في هذا القسم بعد.","No published material in this section yet.")+'</h2><p>'+t("سيظهر هنا المحتوى بعد مروره بمسار الاسترجاع والتحقق والمراجعة.","Content appears here after retrieval, verification and review.")+"</p></div>";if(data.items?.length)hydrateSectionImages(data.items);}catch{document.querySelector("#section-content").innerHTML='<div class="notice">'+t("تعذر تحميل القسم الآن.","This section could not be loaded right now.")+"</div>"}
  }

  async function render() {
    renderShell();
    const path = location.pathname.replace(/^\//, "").replace(/\/$/, "");
    if (!path) return renderHome();
    if (path === "search") return renderSearch();
    if (path.startsWith("article/")) return renderArticle();
    if (path === "news") return renderNews();
    if (path === "ask") return renderAsk();
    if (path === "contribute") return renderContribute();
    if (path === "prices") return renderPrices();
    if (path === "saved") return renderSaved();
    if (path === "tools") return renderTools();
    if (["about","methodology","privacy","terms"].includes(path)) return renderStatic(path);
    if (path === "admin") return renderAdmin();
    const section = sections.find((item) => item[0] === path);
    if (section) return renderSection(path);
    app.innerHTML = '<section class="page"><div class="notice"><h1>404</h1><p>' +
      t("الصفحة غير موجودة.","Page not found.") + "</p></div></section>";
  }

  render();
})();