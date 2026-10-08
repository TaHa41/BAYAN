(() => {
  const sections = [
    ["science","علوم وفهم","Science & Understanding","علوم واكتشافات وشرح مبني على الأدلة.","Science, discoveries and evidence-based explanations.","⚗"],
    ["technology","تقنية وذكاء اصطناعي","Technology & AI","التقنية والذكاء الاصطناعي والابتكار.","Technology, artificial intelligence and innovation.","⌘"],
    ["economy","اقتصاد ومال","Economy & Money","الاقتصاد والأسواق والمال والقرارات المالية.","Economics, markets, money and financial decisions.","◈"],
    ["politics","سياسة وشأن عام","Politics & Public Affairs","السياسات والقرارات والشأن العام.","Politics, public policy and public affairs.","▣"],
    ["health","صحة وطب","Health & Medicine","الصحة والطب والمعلومات الصحية الموثقة.","Health, medicine and evidence-based health information.","+"],
    ["history","تاريخ وثقافة","History & Culture","التاريخ والثقافة والتراث.","History, culture and heritage.","▱"],
    ["people","أشخاص وسير","People & Biographies","الأشخاص والسير والقصص الموثقة.","People, biographies and sourced stories.","●"],
    ["sports","رياضة وبيانات","Sports & Data","الرياضة والنتائج والإحصاءات والبيانات.","Sports, results, statistics and data.","△"],
    ["travel","سفر وأماكن","Travel & Places","السفر والوجهات والأماكن والمعلومات العملية.","Travel, destinations, places and practical information.","✈"],
    ["art","فن وترفيه","Arts & Entertainment","الفن والترفيه والثقافة الشعبية.","Arts, entertainment and popular culture.","✦"],
    ["news","أخبار موثقة","Verified News","أخبار حديثة تُعرض بعد التحقق من مصادرها.","Current news presented after source verification.","◉"],
    ["trends","اهتمام واتجاهات","Interest & Trends","ما يلفت اهتمام الناس واتجاهات النقاش، مع فصلها عن الأخبار الموثقة.","What captures attention and discussion trends, kept separate from verified news.","↗"],
    ["prices","أسعار وبيانات مباشرة","Prices & Live Data","الأسعار والطقس والعملات والبيانات الحية.","Prices, weather, currencies and live data.","◌"],
    ["egypt","مصر","Egypt","المعرفة والأخبار والبيانات المتعلقة بمصر.","Knowledge, news and data about Egypt.","🇪🇬"],
    ["arab","العالم العربي","Arab World","المعرفة والأخبار والسياق في العالم العربي.","Knowledge, news and context across the Arab world.","◇"],
    ["world","العالم","World","المعرفة والأخبار والسياق من أنحاء العالم.","Knowledge, news and context from around the world.","◆"]
  ];
  const primarySections = sections.filter((section) => !["egypt","arab","world"].includes(section[0]));
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

  const api = async (url, options = {}) => {
    const separator = url.includes("?") ? "&" : "?";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Number(options.timeoutMs || 9000));
    try {
      const response = await fetch(url + separator + "_b=20261008.07", {
        ...options,
        cache: "no-store",
        signal: controller.signal
      });
      if (!response.ok) throw new Error("http_" + response.status);
      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  };

  const link = (url, label, cls = "") =>
    '<a class="' + cls + '" href="' + url + '">' + label + "</a>";

  const imageHtml = (item, className = "article-card-image") =>
    item.imageUrl
      ? '<img loading="lazy" class="' + className + '" src="' + escapeHtml(item.imageUrl) + '" alt="' + escapeHtml(item.imageAlt || item.title || "") + '" onerror="this.onerror=null;this.style.display=\'none\';this.insertAdjacentHTML(\'afterend\',\'<div class=&quot;image-placeholder&quot;>BAYAN</div>\')">'
      : '<div class="image-placeholder">BAYAN</div>';

  const articleCard = (item) => {
    const body = imageHtml(item) +
      '<div class="article-card-body"><span class="kicker">' + escapeHtml(item.section || t("مادة","Content")) + "</span>" +
      "<h3>" + escapeHtml(item.title) + "</h3><p>" + escapeHtml(item.summary || "") + '</p><span class="read">' +
      t(item.slug ? "اقرأ الملف" : "مصدر موثق", item.slug ? "Read the file" : "Verified source") + " →</span></div>";
    return item.slug ? '<a class="article-card" href="/article/' + encodeURIComponent(item.slug) + '?lang=' + lang + '">' + body + "</a>" : '<article class="article-card evidence-card">' + body + "</article>";
  };

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

  const safeStorage = {
    get(key, fallback = null) {
      try { return window.localStorage.getItem(key) ?? fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { window.localStorage.setItem(key, value); } catch {}
    }
  };

  function renderShell() {
    document.documentElement.lang = lang;
    const footerLabels = ar ? ["عن بيان","المنهجية","الخصوصية","الشروط"] : ["About BAYAN","Methodology","Privacy","Terms"];
    ["f-about","f-method","f-privacy","f-terms"].forEach((id,i)=>{ const el=document.getElementById(id); if(el){ el.textContent=footerLabels[i]; const u=new URL(el.href,location.origin); u.searchParams.set("lang",lang); el.href=u.pathname+"?lang="+lang; }});
    document.documentElement.dir = ar ? "rtl" : "ltr";
    const brand = document.querySelector(".brand span");
    if (brand) brand.textContent = ar ? "بيان" : "BAYAN";
    if (!nav || !drawer || !app) return;
    nav.innerHTML =
      link("/search?lang=" + lang, t("بحث","Search")) +
      link("/news?lang=" + lang, t("الأخبار","News")) +
      '<button id="lang" class="navbtn">' + (ar ? "EN" : "AR") + "</button>" +
      '<button id="theme" class="navbtn">◐</button>';

    drawer.innerHTML =
      '<div class="drawer-head"><div><b>BAYAN</b><span>' + t("مركز المعرفة","Knowledge") +
      '</span></div><button id="closeDrawer" class="navbtn">×</button></div>' +
      '<div class="drawer-main">' +
      primarySections.map((s) => link("/" + s[0] + "?lang=" + lang,
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

    const closeDrawer = () => {
      drawer.classList.remove("open");
      document.body.classList.remove("drawer-open");
    };
    const openDrawer = () => {
      drawer.classList.add("open");
      document.body.classList.add("drawer-open");
    };
    document.querySelector("#menu")?.addEventListener("click", () => {
      drawer.classList.contains("open") ? closeDrawer() : openDrawer();
    });
    drawer.querySelector("#closeDrawer")?.addEventListener("click", (event) => { event.preventDefault(); event.stopPropagation(); closeDrawer(); });
    document.addEventListener("click", (event) => { const target = event.target instanceof Element ? event.target : null; if (drawer.classList.contains("open") && target && !drawer.contains(target) && !target.closest("#menu")) closeDrawer(); });
    drawer.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("#closeDrawer")) { event.preventDefault(); closeDrawer(); return; }
      if (target?.closest("a")) closeDrawer();
      if (target === drawer) closeDrawer();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeDrawer();
    });
    document.querySelector("#lang")?.addEventListener("click", () => {
      const url = new URL(location.href);
      url.searchParams.set("lang", ar ? "en" : "ar");
      location.href = url;
    });
    const applyTheme = () => {
      const mode = safeStorage.get("bayan-theme","auto");
      const dark = mode === "dark" || (mode === "auto" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.body.classList.toggle("dark", dark);
      const themeButton = document.querySelector("#theme");
      if (themeButton) themeButton.title = t("المظهر: " + (mode === "dark" ? "داكن" : mode === "light" ? "فاتح" : "تلقائي"), "Theme: " + (mode === "dark" ? "Dark" : mode === "light" ? "Light" : "Auto"));
    };
    applyTheme();
    document.querySelector("#theme")?.addEventListener("click", () => {
      const mode = safeStorage.get("bayan-theme","auto");
      const next = mode === "auto" ? "light" : mode === "light" ? "dark" : "auto";
      safeStorage.set("bayan-theme", next);
      applyTheme();
    });
    window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener?.("change", applyTheme);
  }

  async function hydrateSectionImages(items) {
    // Match each image placeholder to its own card by title. Indexing into a global
    // placeholder list was incorrect whenever some cards already had images.
    const pending = (items || []).filter((item) => !item.imageUrl).slice(0, 4);
    await Promise.all(pending.map(async (item) => {
      try {
        const data = await api("/api/image?q=" + encodeURIComponent(item.title + " " + (item.summary || "")), {timeoutMs: 6000});
        const cards = Array.from(document.querySelectorAll(".article-card, .evidence-card"));
        const card = cards.find((candidate) => {
          const heading = candidate.querySelector("h2,h3");
          return heading && heading.textContent.trim() === String(item.title || "").trim();
        });
        const placeholder = card?.querySelector(".image-placeholder");
        if (data.imageUrl && placeholder) {
          const img = document.createElement("img");
          img.loading = "lazy";
          img.className = "article-card-image";
          img.alt = String(item.imageAlt || item.title || "");
          img.onerror = () => {
            img.remove();
            const fallback = document.createElement("div");
            fallback.className = "image-placeholder";
            fallback.textContent = "BAYAN";
            img.replaceWith(fallback);
          };
          img.src = data.imageUrl;
          placeholder.replaceWith(img);
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
        <div class="section-intro"><span class="eyebrow">${t("استكشف الأقسام","Explore sections")}</span><div class="section-grid">${primarySections.map((s) => '<a class="section-card" href="/' + s[0] + '?lang=' + lang + '"><span class="section-icon">' + s[5] + '</span><div><h2>' + escapeHtml(ar ? s[1] : s[2]) + '</h2><p>' + escapeHtml(ar ? s[3] : s[4]) + '</p></div><b>↗</b></a>').join("")}</div></div>
        <div class="home-content">
          <div class="page-head home-feed-head"><span class="eyebrow">${t("آخر ما نُشر","Latest published")}</span><h2>${t("أحدث المعرفة والأخبار","Latest knowledge and news")}</h2></div>
          <div id="home-news" class="article-grid"><div class="notice loading">${t("جاري تحديث الأخبار…","Refreshing news…")}</div></div>
          <div id="home-featured" class="article-grid"></div>
        </div>
      </section>`;
    bindSearch();
    const newsTask = api("/api/news?lang=" + lang).catch(() => ({items: []}));
    const sectionTasks = sections
      .filter((s) => !["news","prices","trends"].includes(s[0]))
      .map((s) => api("/api/section?section=" + encodeURIComponent(s[0]) + "&lang=" + lang).catch(() => ({items: []})));
    const [newsData, sectionData] = await Promise.all([
      newsTask,
      Promise.all(sectionTasks)
    ]);

    const newsOut = document.querySelector("#home-news");
    if (newsData.stale && newsOut) {
      newsOut.insertAdjacentHTML("beforebegin", '<div class="notice">' +
        t("الأخبار المباشرة متوقفة مؤقتًا؛ نعرض آخر نسخة متحققة محفوظة.",
          "Live news is temporarily unavailable; showing the latest verified cached stories.") +
        "</div>");
    }
    const newsItems = (newsData.items || [])
      .filter((item) => ar ? /[\u0600-\u06ff]/.test(String(item.title || "")) : !/[\u0600-\u06ff]/.test(String(item.title || "")))
      .slice(0, 6);
    newsOut.innerHTML = newsItems.length
      ? newsItems.map((item) => '<a class="article-card" href="/news?story=' + encodeURIComponent(item.title) + '&lang=' + lang + '">' + imageHtml(item) + '<div class="article-card-body"><span class="kicker">' + escapeHtml(item.publisher || t("الأخبار","News")) + '</span><h3>' + escapeHtml(item.title) + '</h3><p>' + escapeHtml(item.summary || "") + '</p><div class="source-line">' + escapeHtml(item.publishedAt || "") + '</div><span class="read">' + t("اقرأ داخل بيان","Read inside BAYAN") + " →</span></div></a>").join("")
      : '<div class="notice">' + t("لا توجد أخبار حديثة متاحة الآن؛ لن نعرض خبرًا مختلقًا.","No current news is available right now; BAYAN will not invent a story.") + "</div>";
    if (newsItems.length) hydrateSectionImages(newsItems);

    const featured = sectionData
      .flatMap((x) => x.items || [])
      .filter((item) => ar ? /[\u0600-\u06ff]/.test(String(item.title || "")) : !/[\u0600-\u06ff]/.test(String(item.title || "")))
      .slice(0, 9);
    const featuredOut = document.querySelector("#home-featured");
    featuredOut.innerHTML = featured.length
      ? featured.map(articleCard).join("")
      : '<div class="notice">' + t("لا توجد مواد منشورة إضافية الآن.","No additional published material is available right now.") + "</div>";
    hydrateSectionImages(featured);
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
        ? ((data.answer ? '<article class="answer search-answer"><span class="eyebrow">' + t("إجابة بيان","BAYAN answer") + '</span><div class="article-body">' + String(data.answer).split(String.fromCharCode(10)).map((line) => "<p>" + escapeHtml(line) + "</p>").join("") + '</div>' + (data.articleSlug ? '<a class="read" href="/article/' + encodeURIComponent(data.articleSlug) + "?lang=" + lang + '">' + t("فتح الملف الكامل داخل بيان","Open the full BAYAN file") + " →</a>" : "") + "</article>" : "") + '<div class="result-meta">' + escapeHtml((data.providers || []).join(" · ") || "BAYAN") + "</div>" +
          data.results.map((item) =>
            '<article class="search-result"><span class="kicker">' + escapeHtml(item.section) + " · " +
            escapeHtml(item.evidence) + "</span><h2>" +
            (item.slug ? '<a href="/article/' + encodeURIComponent(item.slug) + '?lang=' + lang + '">' +
              escapeHtml(item.title) + "</a>" : escapeHtml(item.title)) +
            "</h2><p>" + escapeHtml(item.summary) + '</p><div class="source-line">' +
            (item.sources || []).slice(0, 3).map((source) => escapeHtml(source.publisher)).join(" · ") +
            "</div></article>").join(""))
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
        '</p><div class="article-body">' + String(data.body || "").split(String.fromCharCode(10)).map((line) =>
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
      if (data.stale && output) {
        output.insertAdjacentHTML("beforebegin", '<div class="notice">' +
          t("المعروض هنا آخر أخبار متحققة محفوظة مؤقتًا؛ تعذر الوصول إلى مزودات الأخبار المباشرة الآن.",
            "These are the latest verified stories temporarily cached because live news providers are unavailable right now.") +
          "</div>");
      }
      const story = storyTitle ? items.find((item) => item.title === storyTitle) : null;
      if (story) {
        output.className = "results";
        try {
          const articleData = await api("/api/news/article?title=" + encodeURIComponent(story.title) +
            "&image=" + encodeURIComponent(story.imageUrl || "") +
            "&summary=" + encodeURIComponent(story.summary || "") +
            "&url=" + encodeURIComponent(story.url || "") +
            "&publisher=" + encodeURIComponent(story.publisher || "") +
            "&publishedAt=" + encodeURIComponent(story.publishedAt || "") + "&lang=" + lang);
          const article = articleData.article;
          output.innerHTML =
            '<article class="article-full">' + (article.image ?
            '<img class="article-hero-image" src="' + escapeHtml(article.image) + '" alt="' + escapeHtml(article.title) + '">' : "") +
            '<span class="eyebrow">' + escapeHtml(story.publisher || "News") + "</span><h1>" +
            escapeHtml(article.title) + '</h1><p class="lead">' + escapeHtml(article.summary || story.summary || "") +
            '</p><div class="article-body">' + String(article.body || "").split(String.fromCharCode(10)).map((line) =>
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
      if (items.length) hydrateSectionImages(items);
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
            ? (data.notification === "sent"
              ? t("وصلت مساهمتك إلى المراجعة وتم إرسال إشعار تيليجرام.","Your contribution is in review and a Telegram notification was sent.")
              : t("وصلت مساهمتك إلى المراجعة، لكن تعذر إرسال إشعار تيليجرام. تحقق من إعدادات البوت.","Your contribution is in review, but Telegram notification delivery failed. Check the bot configuration."))
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
      t("بيانات مباشرة","Live data") + '</span><h1>' + t("الأسعار والبيانات الحية","Prices & Live Data") +
      '</h1><p>' + t("بيانات محدثة من مزوداتها، مع توضيح المصدر والزمن بدل عرض الرقم منفصلًا.","Updated data from its providers, with source and timing shown alongside every value.") +
      '</p></div><div class="live-grid"><article class="live live-card" id="weather">…</article><article class="live live-card" id="fx">…</article><article class="live live-card" id="gold">…</article></div></section>';
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
    app.innerHTML='<section class="page admin-page"><div class="page-head"><span class="eyebrow">'+t("مركز تحكم بيان","BAYAN Control Center")+'</span><h1>'+t("مركز تحكم بيان","BAYAN Control Center")+'</h1><p>'+t("تحكم كامل في المحتوى والنشر والأقسام والإعدادات والمراقبة.","Full control over content, publishing, sections, settings and monitoring.")+'</p></div><div class="admin-login"><input id="adminToken" class="field" type="password" placeholder="'+t("رمز مدير بيان","BAYAN manager token")+'"><button id="adminSave" class="primary">'+t("دخول","Enter")+'</button><button id="adminRepair" class="navbtn">'+t("تشخيص وإصلاح","Diagnose & Repair")+'</button><button id="telegramTest" class="navbtn">'+t("اختبار تيليجرام","Test Telegram")+'</button><textarea id="aiRepairProblem" class="field" rows="3" placeholder="'+t("اكتب المشكلة التي تريد من مهندس BAYAN AI تشخيصها وإصلاحها بأمان…","Describe the problem you want BAYAN AI Engineer to diagnose and safely repair…")+'"></textarea><button id="aiRepair" class="primary">'+t("اطلب من BAYAN AI تعديلًا أو إصلاحًا","Ask BAYAN AI to diagnose and repair")+'</button><div id="telegramStatus" class="notice" role="status"></div></div><div id="adminOut"></div></section>';
    const token=()=>sessionStorage.getItem("bayan-admin-token")||"";
    document.querySelector("#adminSave").onclick=()=>{const v=document.querySelector("#adminToken").value.trim();if(v)sessionStorage.setItem("bayan-admin-token",v);load();};document.querySelector("#telegramTest").onclick=async()=>{const status=document.querySelector("#telegramStatus");if(status)status.textContent=t("جارٍ اختبار اتصال تيليجرام…","Testing Telegram delivery…");try{const r=await adminApi("/api/admin/telegram-test",{method:"POST"});if(status){status.textContent=r.ok?t("نجح الإرسال: وصلت رسالة الاختبار إلى تيليجرام.","Delivery succeeded: Telegram accepted the test message."):t("فشل الإرسال. راجع سجل الأعطال وإعدادات البوت.","Delivery failed. Check the incident log and bot settings.");status.className="notice "+(r.ok?"notice-success":"notice-error");}}catch(e){if(status){status.textContent=String(e).includes("unauthorized")?t("رمز المدير غير صحيح.","Invalid manager token."):t("تعذر تأكيد إرسال الرسالة. افحص إعدادات البوت ووجهة الرسائل.","Could not confirm delivery. Check bot settings and destination.");status.className="notice notice-error";}}};
    async function adminApi(url,options={}){const h=new Headers(options.headers||{});h.set("x-bayan-manager-token",token());const r=await fetch(url,{...options,headers:h});if(r.status===401)throw new Error("unauthorized");if(!r.ok)throw new Error("http_"+r.status);return r.json();}
    const opts=()=>sections.filter(x=>x[0]!=="prices").map(x=>'<option value="'+x[0]+'">'+escapeHtml(ar?x[1]:x[2])+'</option>').join("");
    async function load(){const o=document.querySelector("#adminOut");if(!token()){o.innerHTML='<div class="notice">'+t("أدخل رمز المدير لفتح الإدارة.","Enter the manager token to open admin.")+"</div>";return;}o.innerHTML='<div class="notice loading">'+t("جاري تحميل الإدارة…","Loading admin…")+"</div>";
      try{const [health,settings,repairs,runtime,analytics,contributions,articles]=await Promise.all([api("/api/health"),adminApi("/api/admin/settings"),adminApi("/api/admin/repairs"),adminApi("/api/admin/runtime"),adminApi("/api/admin/analytics"),adminApi("/api/admin/contributions"),adminApi("/api/admin/articles")]);const st=Object.fromEntries((settings.items||[]).map(x=>[x.key,x.value])),list=articles.items||[];
      o.innerHTML='<div class="admin-grid"><div class="admin-card"><span class="kicker">'+t("الحالة","Status")+'</span><h2>🟢 '+t("يعمل","Online")+'</h2><p>'+t("إصدار بيان ","BAYAN v")+escapeHtml(health.version||"1.0.0")+'</p></div><div class="admin-card"><span class="kicker">'+t("المقالات","Articles")+'</span><h2>'+list.length+'</h2><p>'+t("كل الحالات","All statuses")+'</p></div><div class="admin-card"><span class="kicker">'+t("الإصلاح الذاتي","Self-healing")+'</span><h2>'+(st.auto_repair==="1"?"🟢":"⏸️")+'</h2></div></div>';
      o.innerHTML+='<nav class="admin-shortcuts" aria-label="'+t("أقسام الإدارة","Admin sections")+'">'+[["#admin-settings",t("الإعدادات","Settings")],["#admin-content",t("المحتوى","Content")],["#admin-analytics",t("المشاهدات","Analytics")],["#admin-contributions",t("المساهمات","Contributions")],["#admin-monitoring",t("الأعطال والتنبيهات","Incidents & alerts")]].map(x=>'<a href="'+x[0]+'">'+x[1]+'</a>').join("")+'</nav>';o.innerHTML+='<div id="admin-settings" class="admin-card admin-panel"><h2>'+t("إعدادات التحكم","Control settings")+'</h2><div class="admin-controls">'+[["min_sources",t("الحد الأدنى للمصادر","Minimum sources")],["max_sources",t("أقصى المصادر","Maximum sources")],["news_items",t("عدد الأخبار","News items")],["search_timeout_ms",t("مهلة البحث","Search timeout")]].map(x=>'<label>'+x[1]+'<input class="field setting" data-key="'+x[0]+'" value="'+escapeHtml(st[x[0]]||"")+'"></label>').join("")+'<label><input type="checkbox" class="setting-check" data-key="image_required" '+(st.image_required==="1"?"checked":"")+'> '+t("إلزام الصورة","Require image")+'</label><label><input type="checkbox" class="setting-check" data-key="auto_repair" '+(st.auto_repair==="1"?"checked":"")+'> '+t("الإصلاح التلقائي الآمن","Safe auto repair")+'</label><button id="saveSettings" class="primary">'+t("حفظ","Save")+'</button></div></div>';
      o.innerHTML+='<div id="admin-content" class="admin-card admin-panel"><h2>'+t("إدارة المحتوى","Content management")+'</h2><input id="contentFilter" class="field admin-filter" placeholder="'+t("ابحث في المقالات بالعنوان أو القسم أو اللغة…","Filter articles by title, section or language…")+'"><div class="admin-list">'+list.slice(0,100).map((x,i)=>'<div class="admin-article-row" '+(i>=15?'hidden':'')+'><b>'+escapeHtml(x.title)+'</b><small>'+escapeHtml(x.language==="en"?t("الإنجليزية","English"):t("العربية","Arabic"))+' · '+escapeHtml(x.section)+' · '+escapeHtml(x.status)+'</small><button class="editArticle navbtn" data-i="'+i+'">'+t("تحرير","Edit")+'</button><button class="statusArticle navbtn" data-slug="'+escapeHtml(x.slug)+'" data-lang="'+x.language+'" data-status="'+(x.status==="PUBLISHED"?"DRAFT":"PUBLISHED")+'">'+(x.status==="PUBLISHED"?t("إخفاء","Unpublish"):t("نشر","Publish"))+'</button><button class="deleteArticle navbtn" data-slug="'+escapeHtml(x.slug)+'" data-lang="'+x.language+'">'+t("حذف","Delete")+'</button></div>').join("")+'</div><button id="contentExpand" class="navbtn">'+t("عرض كل المقالات","Show all articles")+'</button><div id="articleEditor"></div></div>';
      o.innerHTML+='<div id="admin-analytics" class="admin-card admin-panel"><h2>'+t("إحصائيات الموقع","Site statistics")+'</h2><div class="admin-grid"><div><span class="kicker">'+t("إجمالي الزيارات","Total views")+'</span><h2>'+Number(analytics.totalViews||0)+'</h2></div><div><span class="kicker">'+t("الزوار الفريدون","Unique visitors")+'</span><h2>'+Number(analytics.uniqueVisitors||0)+'</h2></div><div><span class="kicker">'+t("زوار اليوم","Unique today")+'</span><h2>'+Number(analytics.periods?.day?.uniqueVisitors||0)+'</h2></div><div><span class="kicker">'+t("زوار 7 أيام","Unique in 7 days")+'</span><h2>'+Number(analytics.periods?.week?.uniqueVisitors||0)+'</h2></div><div><span class="kicker">'+t("زوار 30 يومًا","Unique in 30 days")+'</span><h2>'+Number(analytics.periods?.month?.uniqueVisitors||0)+'</h2></div><div><span class="kicker">'+t("اليوم","Today")+'</span><h2>'+Number(analytics.periods?.day?.views||0)+'</h2></div><div><span class="kicker">'+t("7 أيام","7 days")+'</span><h2>'+Number(analytics.periods?.week?.views||0)+'</h2></div><div><span class="kicker">'+t("30 يومًا","30 days")+'</span><h2>'+Number(analytics.periods?.month?.views||0)+'</h2></div></div><h3>'+t("أكثر الصفحات","Top pages")+'</h3><div class="admin-list">'+(analytics.topPages||[]).slice(0,10).map(x=>'<div><b>'+escapeHtml(x.path)+'</b><small>'+Number(x.visits||0)+'</small></div>').join("")+'</div><h3>'+t("أكثر عمليات البحث","Top searches")+'</h3><div class="admin-list">'+(analytics.topSearches||[]).slice(0,10).map(x=>'<div><b>'+escapeHtml(x.query)+'</b><small>'+Number(x.count||0)+'</small></div>').join("")+'</div></div>';o.innerHTML+='<div id="admin-contributions" class="admin-card admin-panel"><h2>'+t("المساهمات","Contributions")+'</h2><div class="admin-list">'+(contributions.items||[]).filter(x=>x.status==="PENDING").slice(0,30).map(x=>'<div><b>'+escapeHtml(x.title)+'</b> <button class="reviewBtn navbtn" data-id="'+x.id+'" data-action="APPROVE">'+t("نشر","Approve")+'</button><button class="reviewBtn navbtn" data-id="'+x.id+'" data-action="REJECT">'+t("رفض","Reject")+'</button></div>').join("")+'</div></div>';
      o.innerHTML+='<div id="admin-monitoring" class="admin-card admin-panel"><h2>'+t("المراقبة والإصلاحات","Monitoring & repairs")+'</h2><div class="admin-list">'+(runtime.items||[]).filter(x=>["warn","error","critical"].includes(String(x.level||"").toLowerCase())).slice(0,12).map(x=>'<div><b>'+escapeHtml(x.level)+'</b> · '+escapeHtml(x.kind)+' — '+escapeHtml(x.message)+'</div>').join("")+(repairs.items||[]).filter(x=>["WAITING_AI","DETECTED","FAILED","RETRY"].includes(String(x.status||"").toUpperCase())).slice(0,12).map(x=>'<div><b>'+escapeHtml(x.status)+'</b> · '+escapeHtml(x.signature)+'</div>').join("")+'</div></div>';
      let contentExpanded=false;const contentRows=Array.from(document.querySelectorAll("#admin-content .admin-article-row"));const contentExpand=document.querySelector("#contentExpand");if(contentExpand)contentExpand.onclick=()=>{contentExpanded=!contentExpanded;const q=String(document.querySelector("#contentFilter")?.value||"").toLowerCase().trim();contentRows.forEach((row,i)=>{row.hidden=q?!row.textContent.toLowerCase().includes(q):(!contentExpanded&&i>=15);});contentExpand.textContent=contentExpanded?t("عرض أقل","Show fewer"):t("عرض كل المقالات","Show all articles");};document.querySelector("#contentFilter")?.addEventListener("input",event=>{const q=String(event.target.value||"").toLowerCase().trim();contentRows.forEach((row,i)=>{row.hidden=q?!row.textContent.toLowerCase().includes(q):(!contentExpanded&&i>=15);});});document.querySelector("#saveSettings").onclick=async()=>{for(const e of document.querySelectorAll(".setting,.setting-check"))await adminApi("/api/admin/settings",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({key:e.dataset.key,value:e.type==="checkbox"?(e.checked?"1":"0"):e.value})});load();};
      document.querySelectorAll(".statusArticle").forEach(b=>b.onclick=async()=>{await adminApi("/api/admin/article/status",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({slug:b.dataset.slug,language:b.dataset.lang,status:b.dataset.status})});load();});
      document.querySelectorAll(".deleteArticle").forEach(b=>b.onclick=async()=>{if(confirm(t("حذف المقال نهائيًا؟","Delete permanently?")))await adminApi("/api/admin/article/delete",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({slug:b.dataset.slug,language:b.dataset.lang})});load();});
      document.querySelectorAll(".editArticle").forEach(b=>b.onclick=()=>{const x=list[Number(b.dataset.i)],e=document.querySelector("#articleEditor");e.innerHTML='<div class="admin-card"><h3>'+t("تحرير المقال","Edit article")+'</h3><input id="edTitle" class="field" value="'+escapeHtml(x.title)+'"><textarea id="edSummary" class="field" rows="3">'+escapeHtml(x.summary||"")+'</textarea><textarea id="edBody" class="field" rows="10">'+escapeHtml(x.body||"")+'</textarea><select id="edSection" class="field">'+opts()+'</select><select id="edStatus" class="field"><option>PUBLISHED</option><option>DRAFT</option><option>ARCHIVED</option></select><input id="edImage" class="field" value="'+escapeHtml(x.image_url||"")+'" placeholder="https://..."><button id="edSave" class="primary">'+t("حفظ التعديلات","Save changes")+'</button></div>';document.querySelector("#edSection").value=x.section;document.querySelector("#edStatus").value=x.status;document.querySelector("#edSave").onclick=async()=>{await adminApi("/api/admin/article",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({slug:x.slug,language:x.language,title:document.querySelector("#edTitle").value,summary:document.querySelector("#edSummary").value,articleBody:document.querySelector("#edBody").value,section:document.querySelector("#edSection").value,status:document.querySelector("#edStatus").value,imageUrl:document.querySelector("#edImage").value,imageAlt:document.querySelector("#edTitle").value})});load();};});
      document.querySelectorAll(".reviewBtn").forEach(b=>b.onclick=async()=>{await adminApi("/api/admin/contributions/review",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({id:Number(b.dataset.id),action:b.dataset.action})});load();});
      }catch(e){o.innerHTML='<div class="notice">'+(String(e).includes("unauthorized")?t("رمز المدير غير صحيح.","Invalid manager token."):t("تعذر تحميل لوحة الإدارة.","Admin panel failed to load."))+"</div>";}}
    document.querySelector("#aiRepair").onclick=async()=>{const problem=document.querySelector("#aiRepairProblem").value.trim();const o=document.querySelector("#adminOut");if(!problem){o.innerHTML='<div class="notice">'+t("اكتب المشكلة أولًا.","Describe the problem first.")+"</div>";return;}o.innerHTML='<div class="notice loading">'+t("مهندس BAYAN AI يشخّص المشكلة ويجري الإصلاحات الآمنة…","BAYAN AI Engineer is diagnosing and applying safe repairs…")+"</div>";try{const d=await adminApi("/api/admin/ai-repair",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({problem})});o.innerHTML='<div class="admin-card"><h2>'+escapeHtml(d.ok?t("تم التحقق من الحالة بعد الإصلاح.","System verified after repair."):t("المشكلة تحتاج مراجعة إضافية.","Further review is required."))+"</h2><p>"+escapeHtml(d.diagnosis||"")+"</p></div>";}catch{o.innerHTML='<div class="notice">'+t("تعذر تشغيل مهندس BAYAN AI.","BAYAN AI Engineer could not run.")+"</div>";}};document.querySelector("#adminRepair").onclick=async()=>{const o=document.querySelector("#adminOut");o.innerHTML='<div class="notice loading">'+t("جاري التشخيص…","Diagnosing…")+"</div>";try{const d=await adminApi("/api/admin/repair");o.innerHTML='<div class="notice"><h2>'+escapeHtml(d.ok?t("لا توجد مشكلة حتمية.","No deterministic failure."):t("تم تسجيل المشكلة.","Failure recorded."))+'</h2></div>';}catch{o.innerHTML='<div class="notice">'+t("تعذر الإصلاح.","Repair failed.")+"</div>";}};load();
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
    const section = sections.find((item) => item[0] === slug);
    if (!section) return;

    app.innerHTML =
      '<section class="page">' +
      '<div class="page-head"><span class="eyebrow">' + escapeHtml(section[5]) + " " + t("قسم معرفي","Knowledge section") +
      '</span><h1>' + escapeHtml(ar ? section[1] : section[2]) + '</h1><p>' +
      escapeHtml(ar ? section[3] : section[4]) + '</p></div>' +

      '<div class="wisdom-card"><p id="wisdom-text">' + t("المعلومة تصبح أقوى عندما نعرف مصدرها وسياقها.","Information becomes stronger when its source and context are clear.") + '</p></div>' +
      '<div id="section-content" class="article-grid"><div class="notice">' +
      t("جاري تحميل المواد…","Loading content…") + '</div></div></section>';

    const content = document.querySelector("#section-content");
    if (!content) return;

    const refreshWisdom = () => api("/api/wisdom?section=" + encodeURIComponent(slug) + "&lang=" + lang, { timeoutMs: 5000 })
      .then((wd) => {
        const el = document.querySelector("#wisdom-text");
        if (el && wd?.wisdom) el.textContent = wd.wisdom;
      }).catch(() => {});
    refreshWisdom();
    const wisdomTimer = setInterval(() => {
      if (!document.querySelector("#wisdom-text")) {
        clearInterval(wisdomTimer);
        return;
      }
      refreshWisdom();
    }, 30000);

    const loadContent = async () => {
      let data;
      try {
        data = await api("/api/section?section=" + encodeURIComponent(slug) + "&lang=" + lang, { timeoutMs: 8000 });
      } catch {
        try {
          data = await api("/api/section?section=" + encodeURIComponent(slug) + "&lang=" + lang + "&retry=1", { timeoutMs: 8000 });
        } catch {
          throw new Error("section_unavailable");
        }
      }
      const rawItems = Array.isArray(data?.items) ? data.items : [];
      const hasArabicText = (value) => /[\u0600-\u06ff]/.test(String(value || ""));
      const items = rawItems.filter((item) => {
        const title = String(item.title || ""), summary = String(item.summary || ""), body = String(item.body || "");
        return ar ? hasArabicText(title) && (!summary || hasArabicText(summary)) && (!body || hasArabicText(body)) : !hasArabicText(title) && !hasArabicText(summary) && !hasArabicText(body);
      });
      content.innerHTML = items.length
        ? items.map(articleCard).join("")
        : '<div class="notice"><h2>' + t("لا توجد مواد منشورة في هذا القسم بعد.","No published material in this section yet.") +
          '</h2><p>' + t("سيظهر هنا المحتوى بعد مروره بمسار الاسترجاع والتحقق والمراجعة.","Content appears here after retrieval, verification and review.") +
          "</p></div>";
      if (items.length) hydrateSectionImages(items).catch(() => {});
    };

    try {
      await loadContent();
    } catch {
      content.innerHTML =
        '<div class="notice"><h2>' + t("تعذر تحميل مواد القسم.","The section content could not be loaded.") +
        '</h2><p>' + t("حاول مرة أخرى بعد لحظات.","Please try again in a moment.") +
        '</p><button class="primary" id="section-retry">' + t("إعادة المحاولة","Retry") + "</button></div>";
      document.querySelector("#section-retry")?.addEventListener("click", () => renderSection(slug));
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
    if (path === "saved") return renderSaved();
    if (path === "tools") return renderTools();
    if (["about","methodology","privacy","terms"].includes(path)) return renderStatic(path);
    if (path === "admin") return renderAdmin();
    const section = sections.find((item) => item[0] === path);
    if (section) return renderSection(path);
    app.innerHTML = '<section class="page"><div class="notice"><h1>404</h1><p>' +
      t("الصفحة غير موجودة.","Page not found.") + "</p></div></section>";
  }

  Promise.resolve().then(() => render()).catch((error) => {
    try {
      console.error("BAYAN frontend boot failed", error);
      if (app) {
        app.innerHTML =
          '<section class="page"><div class="notice"><h1>' +
          t("تعذر تشغيل واجهة بيان","BAYAN could not start") +
          '</h1><p>' +
          t("حدث خطأ في تشغيل الواجهة. أعد تحميل الصفحة، وإذا استمر الخطأ سيظل البلاغ مسجلًا للمراجعة.",
            "The interface failed to start. Reload the page; if the problem persists, it will be logged for review.") +
          '</p><button class="primary" onclick="location.reload()">' +
          t("إعادة تحميل","Reload") + "</button></div></section>";
      }
    } catch {}
  });
})();