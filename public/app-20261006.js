(() => {
  const sections = [
    ["egypt","مصر","Egypt","المحتوى الموثق عن مصر والأحداث والشخصيات والبيانات.","Verified knowledge about Egypt, events, people and data.","⌂"],
    ["arab","العالم العربي","Arab World","أخبار وملفات العالم العربي مع السياق والمصادر.","Arab-world news and knowledge with context and sources.","◇"],
    ["world","العالم","World","دول وأحداث وموضوعات عالمية قابلة للتحقق.","Countries, global events and verifiable topics.","⌖"],
    ["science","العلوم","Science","شرح علمي واضح للأفكار والاكتشافات والظواهر.","Clear, evidence-based explanations of science and discoveries.","◌"],
    ["economy","الاقتصاد","Economy","اقتصاد وأسواق وأسعار وبيانات مالية.","Economy, markets, prices and financial data.","₿"],
    ["politics","السياسة","Politics","سياسة وشؤون عامة مع فصل الخبر عن التحليل.","Politics and public affairs with news separated from analysis.","◎"],
    ["technology","التقنية والذكاء الاصطناعي","Technology & AI","تقنية وذكاء اصطناعي وبرمجة وحلول عملية.","Technology, AI, coding and practical solutions.","⌘"],
    ["health","الصحة","Health","معلومات صحية موثوقة مع حدود الدليل.","Reliable health information with evidence limits made clear.","＋"],
    ["history","التاريخ والثقافة","History & Culture","تاريخ وثقافة وفنون وتراث في صفحات مترابطة.","History, culture, arts and heritage in connected pages.","▱"],
    ["people","الأشخاص","People","صفحات شخصيات تجمع السيرة والإنجازات والمصادر.","People pages combining biography, work, events and sources.","◎"],
    ["sports","الرياضة والبيانات","Sports & Data","رياضة ونتائج وإحصاءات وسجلات قابلة للتحقق.","Sports, results, statistics and records with evidence.","△"],
    ["travel","السفر","Travel","وجهات وأماكن ونصائح سفر مبنية على مصادر.","Destinations, places and travel guidance based on sources.","✈"],
    ["news","الأخبار","News","أخبار حديثة من مزودات متعددة مع المصدر والوقت والصورة.","Current news from multiple providers with source, time and imagery.","◈"],
    ["trends","الاهتمام والاتجاهات","Interest & Trends","ما يهتم به الناس، منفصل عن الأخبار الموثقة.","What people are interested in, separated from verified news.","↗"],
    ["prices","الأسعار والبيانات الحية","Prices & Live Data","طقس وعملات وذهب وبيانات حية.","Weather, currencies, gold and live data.","₿"]
  ];

  const params = new URLSearchParams(location.search);
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
      link("/prices?lang=" + lang, t("الأسعار والبيانات الحية","Prices & Live Data")) +
      link("/contribute?lang=" + lang, t("ساهم بمعلومة","Contribute")) +
      link("/saved?lang=" + lang, t("المحفوظات","Saved")) +
      link("/tools?lang=" + lang, t("الأدوات","Tools")) +
      link("/admin?lang=" + lang, "Admin") +
      "</div>";

    document.querySelector("#menu").onclick = () => drawer.classList.toggle("open");
    document.querySelector("#closeDrawer").onclick = () => drawer.classList.remove("open");
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
          <span class="eyebrow">${t("BAYAN | بيان — مركز معرفة حي","BAYAN | A living knowledge platform")}</span>
          <h1>${t("أي شيء تريد معرفته.<br><em>ابحث عنه هنا.</em>","Anything you want to know.<br><em>Find it here.</em>")}</h1>
          <p>${t("شخصية، خبر، موضوع، سؤال، طريقة، مشكلة تقنية أو سعر لحظي — نبحث، نتحقق، ونرتب لك الصورة كاملة قبل أن ندّعي اليقين.","A person, news story, topic, question, how-to, technical problem or live price — we retrieve, verify and organize the full picture before claiming certainty.")}</p>
          ${searchBox()}<div class="home-actions"><a class="primary" href="/ask?lang=${lang}">${t("اسأل بيان","Ask BAYAN")}</a></div>
          <div class="trust-row"><span>✓ ${t("أدلة ومصادر","Evidence & sources")}</span><span>◉ ${t("تحديث مستمر","Continuously updated")}</span><span>⌁ ${t("ذكاء يساعدك","AI assistance")}</span></div>
          <div class="wisdom-card" aria-label="${t("الحكمة اليومية","Daily wisdom")}"><span class="eyebrow">${t("الحكمة اليومية","Daily wisdom")}</span><blockquote>“${t("فَإِنَّ مَعَ الْعُسْرِ يُسْرًا","Indeed, with hardship comes ease.")}”</blockquote><p class="wisdom-source">${t("القرآن الكريم — سورة الشرح، الآية 5","The Qur’an — Ash-Sharh 94:5")}</p></div>
        </div>
        <div class="section-intro"><span class="eyebrow">${t("استكشف المعرفة","Explore knowledge")}</span><div class="section-grid">${sections.map((s) => '<a class="section-card" href="/' + s[0] + '?lang=' + lang + '"><span class="section-icon">' + s[5] + '</span><div><h2>' + escapeHtml(ar ? s[1] : s[2]) + '</h2><p>' + escapeHtml(ar ? s[3] : s[4]) + '</p></div><b>↗</b></a>').join("")}</div></div>
        <div class="home-content">
          <div class="page-head home-feed-head"><span class="eyebrow">${t("آخر ما نُشر","Latest published")}</span><h2>${t("المعرفة والأخبار في الصفحة الرئيسية","Knowledge and news on the homepage")}</h2></div>
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
        : '<div class="notice"><h2>' + t("لم أجد نتيجة موثقة كافية بعد","No sufficiently verified result yet") +
          '</h2><p>' + escapeHtml(data.message || "") + "</p></div>";
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
    app.innerHTML =
      '<section class="page admin-page"><div class="page-head"><span class="eyebrow">BAYAN CONTROL CENTER</span><h1>' +
      t("مركز تحكم بيان","BAYAN Control Center") + '</h1><p>' +
      t("تحكم في البحث والمصادر والصور والإصلاحات والمراقبة من مكان واحد.",
        "Control retrieval, sources, images, repairs and monitoring from one place.") +
      '</p></div><div class="admin-login"><input id="adminToken" class="field" type="password" placeholder="' +
      t("رمز مدير بيان","BAYAN manager token") + '"><button id="adminSave" class="primary">' +
      t("دخول","Enter") + '</button><button id="adminRepair" class="navbtn">' + t("تشخيص وإصلاح آمن بالذكاء الاصطناعي","AI diagnose & safe repair") + '</button></div><div id="adminOut"></div></section>';

    const token = () => sessionStorage.getItem("bayan-admin-token") || "";
    document.querySelector("#adminSave").onclick = () => {
      const value = document.querySelector("#adminToken").value.trim();
      if (value) sessionStorage.setItem("bayan-admin-token", value);
      load();
    };

    async function adminApi(url, options = {}) {
      const headers = new Headers(options.headers || {});
      headers.set("x-bayan-manager-token", token());
      const response = await fetch(url, {...options, headers});
      if (response.status === 401) throw new Error("unauthorized");
      return response.json();
    }

    async function load() {
      const output = document.querySelector("#adminOut");
      if (!token()) {
        output.innerHTML = '<div class="notice">' +
          t("أدخل رمز المدير لعرض لوحة التحكم.","Enter the manager token to open the control center.") + "</div>";
        return;
      }
      output.innerHTML = '<div class="notice loading">' +
        t("جاري تحميل حالة النظام…","Loading system status…") + "</div>";
      try {
        const [health, settings, repairs, runtime, analytics, contributions, articles] = await Promise.all([
          api("/api/health"), adminApi("/api/admin/settings"), adminApi("/api/admin/repairs"),
          adminApi("/api/admin/runtime"), adminApi("/api/admin/analytics"), adminApi("/api/admin/contributions"), adminApi("/api/admin/articles")
        ]);
        const setting = Object.fromEntries((settings.items || []).map((item) => [item.key, item.value]));
        output.innerHTML =
          '<div class="admin-grid"><div class="admin-card"><span class="kicker">' + t("الحالة","Status") +
          '</span><h2>🟢 ' + t("النظام يعمل","System online") + '</h2><p>BAYAN v' +
          escapeHtml(health.version || "1.0.0") + '</p></div><div class="admin-card"><span class="kicker">' +
          t("المصادر","Sources") + '</span><h2>' + escapeHtml(setting.min_sources || "3") +
          '+</h2><p>' + t("الحد الأدنى للأدلة","Minimum evidence sources") +
          '</p></div><div class="admin-card"><span class="kicker">' + t("الإصلاح الذاتي","Self-healing") +
          '</span><h2>' + (setting.auto_repair === "1" ? "🟢" : "⏸️") +
          '</h2><p>' + t("مسموح للإصلاحات الآمنة","Safe repairs enabled") + '</p></div></div>' +
          '<div class="admin-card"><h2>' + t("سياسة البحث والصور","Search & image policy") +
          '</h2><div class="admin-controls">' +
          [["min_sources",t("الحد الأدنى للمصادر","Minimum sources")],["max_sources",t("أقصى عدد مصادر","Maximum sources")],
           ["news_items",t("عدد الأخبار","News items")],["search_timeout_ms",t("مهلة البحث بالمللي ثانية","Search timeout ms")],
           ["source_wikipedia","Wikipedia"],["source_wikidata","Wikidata"],["source_gdelt","GDELT News"],
           ["source_openalex","OpenAlex Research"],["source_ai_search","Cloudflare AI Search"]]
          .map(([key,label]) => '<label>' + label + '<input class="field setting" data-key="' + key +
            '" value="' + escapeHtml(setting[key] || "") + '"></label>').join("") +
          '<label><input type="checkbox" class="setting-check" data-key="image_required" ' +
          (setting.image_required === "1" ? "checked" : "") + '>' +
          t("الصورة مطلوبة عند النشر","Require an image when publishing") + '</label><label><input type="checkbox" class="setting-check" data-key="image_fallback" ' +
          (setting.image_fallback === "1" ? "checked" : "") + '>' +
          t("استخدم مسارات صور احتياطية","Use image fallback paths") + '</label><label><input type="checkbox" class="setting-check" data-key="auto_repair" ' +
          (setting.auto_repair === "1" ? "checked" : "") + '>' +
          t("الإصلاح الآمن التلقائي","Enable safe automatic repair") +
          '</label><button id="saveSettings" class="primary">' + t("حفظ الإعدادات","Save settings") +
          '</button></div></div>' +
          '<div class="admin-card"><h2>' + t("الإصلاحات","Repairs") + '</h2><div class="admin-list">' +
          (repairs.items || []).slice(0,10).map((item) => '<div><b>' + escapeHtml(item.status) +
          '</b> · ' + escapeHtml(item.signature || "") + "<small>" + escapeHtml(item.updated_at || "") +
          "</small></div>").join("") + '</div></div>' +
          '<div class="admin-card"><h2>' + t("آخر المشاكل","Recent runtime events") + '</h2><div class="admin-list">' +
          (runtime.items || []).slice(0,10).map((item) => '<div><b>' + escapeHtml(item.level) +
          '</b> · ' + escapeHtml(item.kind) + " — " + escapeHtml(item.message) + "</div>").join("") +
          '</div></div><div class="admin-card"><h2>' + t("أكثر الاستخدامات","Usage") +
          '</h2><div class="admin-list">' + (analytics.items || []).slice(0,10).map((item) =>
          '<div><b>' + escapeHtml(item.count) + '</b> · ' + escapeHtml(item.event) + " · " +
          escapeHtml(item.path) + "</div>").join("") + '</div></div>' +
          '<div class="admin-card"><h2>' + t("المساهمات","Contributions") +
          '</h2><div class="admin-list">' + (contributions.items || []).filter((item) => item.status === "PENDING").slice(0,10).map((item) =>
          '<div><b>' + escapeHtml(item.title) +
          '</b><button class="reviewBtn" data-id="' + escapeHtml(item.id) + '" data-action="APPROVE">' +
          t("نشر","Approve") + '</button><button class="reviewBtn" data-id="' + escapeHtml(item.id) +
          '" data-action="REJECT">' + t("رفض","Reject") + "</button></div>").join("") + "</div></div>";

        output.insertAdjacentHTML("beforeend", '<div class="admin-card"><h2>' + t("إدارة صور المقالات","Article image management") + '</h2><p>' + t("يمكنك تغيير صورة أي مقال منشور دون تعديل الكود.","Change the image of any published article without editing code.") + '</p><div class="admin-list">' + (articles.items || []).slice(0,20).map((item) => '<div class="image-admin-row"><b>' + escapeHtml(item.title) + '</b><input class="field article-image-url" data-slug="' + escapeHtml(item.slug) + '" data-language="' + escapeHtml(item.language) + '" value="' + escapeHtml(item.image_url || "") + '" placeholder="https://..."><button class="reviewBtn imageSave" data-slug="' + escapeHtml(item.slug) + '" data-language="' + escapeHtml(item.language) + '">' + t("حفظ الصورة","Save image") + '</button></div>').join("") + '</div></div>');
        document.querySelectorAll(".imageSave").forEach((button) => {
          button.onclick = async () => {
            const input = document.querySelector('.article-image-url[data-slug="' + CSS.escape(button.dataset.slug) + '"][data-language="' + CSS.escape(button.dataset.language) + '"]');
            if (!input?.value.trim()) return;
            await adminApi("/api/admin/article-image", {method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({slug:button.dataset.slug,language:button.dataset.language,imageUrl:input.value.trim(),imageAlt:button.dataset.slug})});
            load();
          };
        });
        document.querySelector("#saveSettings").onclick = async () => {
          for (const element of document.querySelectorAll(".setting")) {
            await adminApi("/api/admin/settings", {
              method:"POST", headers:{"content-type":"application/json"},
              body:JSON.stringify({key:element.dataset.key,value:element.value})
            });
          }
          for (const element of document.querySelectorAll(".setting-check")) {
            await adminApi("/api/admin/settings", {
              method:"POST", headers:{"content-type":"application/json"},
              body:JSON.stringify({key:element.dataset.key,value:element.checked ? "1" : "0"})
            });
          }
          load();
        };
        document.querySelectorAll(".reviewBtn").forEach((button) => {
          button.onclick = async () => {
            await adminApi("/api/admin/contributions/review", {
              method:"POST", headers:{"content-type":"application/json"},
              body:JSON.stringify({id:Number(button.dataset.id),action:button.dataset.action})
            });
            load();
          };
        });
      } catch (error) {
        output.innerHTML = '<div class="notice">' +
          (String(error).includes("unauthorized")
            ? t("رمز المدير غير صحيح.","Invalid manager token.")
            : t("تعذر تحميل لوحة الإدارة.","Admin panel could not be loaded.")) + "</div>";
      }
    }
    document.querySelector("#adminRepair").onclick = async () => {
      const output = document.querySelector("#adminOut");
      output.innerHTML = '<div class="notice loading">' + t("بيان يفحص الحالة ويحاول مسار الإصلاح الآمن…","BAYAN is checking the system and attempting the safe repair path…") + "</div>";
      try {
        const data = await adminApi("/api/admin/repair");
        output.innerHTML = '<div class="notice"><h2>' + (data.ok ? t("لا توجد مشكلة حتمية مكتشفة.","No deterministic failure was detected.") : t("تم تسجيل المشكلة للتشخيص وإعادة المحاولة.","The failure was recorded for diagnosis and retry.")) + "</h2><p>" + escapeHtml((data.failures || []).join(" · ")) + "</p></div>";
      } catch {
        output.innerHTML = '<div class="notice">' + t("تعذر تشغيل مسار الإصلاح الآمن.","The safe repair path could not be started.") + "</div>";
      }
    };
    load();
  }

  async function renderSection(slug) {
    const section = sections.find((item) => item[0] === slug);
    if (!section || slug === "news" || slug === "prices") return;
    app.innerHTML =
      '<section class="page"><div class="page-head"><span class="eyebrow">' + escapeHtml(section[5]) +
      " " + t("قسم معرفي","Knowledge section") + '</span><h1>' +
      escapeHtml(ar ? section[1] : section[2]) + '</h1><p>' +
      escapeHtml(ar ? section[3] : section[4]) + '</p></div><div id="section-content" class="article-grid">' +
      '<div class="notice">' + t("جاري تحميل المواد…","Loading content…") + "</div></div></section>";
    try {
      const data = await api("/api/section?section=" + encodeURIComponent(slug) + "&lang=" + lang);
      const output = document.querySelector("#section-content");
      output.innerHTML = data.items?.length
        ? data.items.map(articleCard).join("")
        : '<div class="notice"><h2>' + t("لا توجد مواد منشورة في هذا القسم بعد.","No published material in this section yet.") +
          '</h2><p>' + t("سيظهر هنا المحتوى بعد مروره بمسار الاسترجاع والتحقق والمراجعة.",
          "Content appears here after retrieval, verification and review.") + "</p></div>";
      if (data.items?.length) hydrateSectionImages(data.items);
    } catch {
      document.querySelector("#section-content").innerHTML =
        '<div class="notice">' + t("تعذر تحميل القسم الآن.","This section could not be loaded right now.") + "</div>";
    }
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
    if (path === "admin") return renderAdmin();
    const section = sections.find((item) => item[0] === path);
    if (section) return renderSection(path);
    app.innerHTML = '<section class="page"><div class="notice"><h1>404</h1><p>' +
      t("الصفحة غير موجودة.","Page not found.") + "</p></div></section>";
  }

  render();
})();