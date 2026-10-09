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
    ["prices","أسعار وبيانات مباشرة","Prices & Live Data","العملات والمعادن والطاقة والعملات الرقمية ومؤشرات الأسواق.","Prices, weather, currencies and live data.","◌"],
    ["egypt","حياة ومجتمعات","People & Communities","قضايا الحياة اليومية والمجتمع والخدمات وتجارب الناس، بمعلومات موثقة.","Everyday life, communities, public services and human experiences, grounded in evidence.","⌂"],
    ["arab","أفكار ونقاشات","Ideas & Debate","وجهات نظر وحوارات وقضايا فكرية تُعرض بسياق ومصادر واضحة.","Ideas, viewpoints and public debates presented with context and clear sourcing.","☷"],
    ["world","تحولات كبرى","Global Shifts","التغيرات العابرة للحدود وتأثيراتها في الاقتصاد والتقنية والمجتمعات.","Cross-border changes and their impact on economies, technology and societies.","◎"]
  ];
  const iconSvg = (key) => {
    const paths = {
      science:'<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M8 15h8"/>',
      technology:'<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4"/>',
      economy:'<path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 6-7"/>',
      politics:'<path d="M3 21h18M5 18h14M6 18V9m4 9V9m4 9V9m4 9V9M3 7l9-4 9 4v2H3z"/>',
      health:'<path d="M12 21s-8-4.5-8-11a4.5 4.5 0 0 1 8-2 4.5 4.5 0 0 1 8 2c0 6.5-8 11-8 11z"/><path d="M9 12h6m-3-3v6"/>',
      history:'<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5z"/><path d="M4 6h13M8 10h8m-8 4h8"/>',
      people:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2"/><path d="M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v2"/>',
      sports:'<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
      travel:'<path d="m3 11 18-8-8 18-2-8z"/><path d="m11 13 4-4"/>',
      art:'<path d="M12 3a9 9 0 1 0 0 18h1.2a2 2 0 0 0 1.5-3.3 1.8 1.8 0 0 1 1.4-3h1.2A3.7 3.7 0 0 0 21 11C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="10" r="1"/><circle cx="11" cy="6.5" r="1"/><circle cx="16" cy="8" r="1"/>',
      news:'<path d="M5 4h14v17H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="M8 8h8m-8 4h8m-8 4h5"/>',
      trends:'<path d="M3 17 9 11l4 4 8-9"/><path d="M15 6h6v6"/>',
      prices:'<path d="M3 12h4l3-8 4 16 3-8h4"/>',
      egypt:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2"/><path d="M16 11h5m-2.5-2.5v5"/>',
      arab:'<path d="M4 5h16M4 12h10M4 19h16"/><circle cx="18" cy="12" r="2"/>',
      world:'<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/><path d="m6 6 12 12m0-12L6 18"/>'
    };
    return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+(paths[key]||paths.world)+'</svg>';
  };
  const primarySections = sections; // The three former geographic buckets are now editorial categories and remain visible.
  const params = new URLSearchParams(location.search);
  const lang = params.get("lang") === "en" ? "en" : "ar";
  const ar = lang === "ar";
  const t = (a, e) => ar ? a : e;
  const formatDate = (value) => {
    const date = new Date(value || "");
    if (!value || !Number.isFinite(date.getTime())) return "";
    try { return new Intl.DateTimeFormat(ar ? "ar-EG" : "en-US", {dateStyle:"medium",timeStyle:"short"}).format(date); }
    catch { return date.toISOString().slice(0,16).replace("T"," "); }
  };
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
      const response = await fetch(url + separator + "_b=20261009.27", {
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

  window.BAYAN_IMAGE_RETRY = async (img) => {
    if (!img) return;
    const showFallback = () => {
      img.onerror = null;
      img.style.display = "none";
      const fallback = document.createElement("div");
      fallback.className = "image-placeholder";
      fallback.textContent = "BAYAN";
      img.insertAdjacentElement("afterend", fallback);
    };
    if (img.dataset.retrying === "1") { showFallback(); return; }
    img.dataset.retrying = "1";
    try {
      const query = img.dataset.imageQuery || img.alt || "";
      const data = await api("/api/image?q=" + encodeURIComponent(query), {timeoutMs:18000});
      if (data?.imageUrl && data.imageUrl !== img.src) { img.src = data.imageUrl; return; }
    } catch {}
    showFallback();
  };

  const link = (url, label, cls = "") =>
    '<a class="' + cls + '" href="' + url + '">' + label + "</a>";

  const imageHtml = (item, className = "article-card-image") =>
    item.imageUrl
      ? '<img loading="lazy" class="' + className + '" src="' + escapeHtml(item.imageUrl) + '" alt="' + escapeHtml(item.imageAlt || item.title || "") + '" data-image-query="' + escapeHtml(String(item.title || "") + " " + String(item.summary || "")) + '" onerror="window.BAYAN_IMAGE_RETRY(this)">'
      : '<div class="image-placeholder">BAYAN</div>';

  const heroImageHtml = (url, alt) =>
    '<img class="article-hero-image" src="' + escapeHtml(url) + '" alt="' + escapeHtml(alt || "") +
    '" data-image-query="' + escapeHtml(alt || "") + '" onerror="window.BAYAN_IMAGE_RETRY(this)">';

  const articleCard = (item) => {
    const sectionMeta = sections.find((section) => section[0] === item.section);
    const sectionLabel = sectionMeta ? (ar ? sectionMeta[1] : sectionMeta[2]) : t("مادة معرفية","Knowledge item");
    const href = item.href || (item.slug ? "/article/" + encodeURIComponent(item.slug) + "?lang=" + lang : "/search?q=" + encodeURIComponent(item.title || "") + "&lang=" + lang);
    const body = imageHtml(item) +
      '<div class="article-card-body"><span class="kicker">' + escapeHtml(sectionLabel) + "</span>" +
      "<h3>" + escapeHtml(item.title) + "</h3><p>" + escapeHtml(item.summary || "") + '</p><span class="read">' +
      t(item.slug ? "اقرأ الملف" : "اعرض الموضوع", item.slug ? "Read the file" : "Explore topic") + " →</span></div>";
    return '<article class="article-card' + (item.slug ? "" : " evidence-card") + '"><a class="article-card-link" href="' + href + '">' + body + "</a>" + socialActions(item) + "</article>";
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
        '<span class="drawer-icon">' + iconSvg(s[0]) + "</span><span>" + (ar ? s[1] : s[2]) + "</span>",
        "drawer-link")).join("") +
      '</div><div class="drawer-tools">' +
      link("/ask?lang=" + lang, t("اسأل بيان","Ask BAYAN")) +
      link("/prices?lang=" + lang, t("الأسعار والأسواق","Prices & Markets")) +
      link("/weather?lang=" + lang, t("الطقس","Weather")) +
      link("/prayer?lang=" + lang, t("مواقيت الصلاة","Prayer Times")) +
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
    const closeButton=drawer.querySelector("#closeDrawer");
    if(closeButton){closeButton.type="button";closeButton.setAttribute("aria-label",t("إغلاق القائمة","Close menu"));closeButton.onclick=(event)=>{event.preventDefault();event.stopPropagation();closeDrawer();};closeButton.addEventListener("pointerup",(event)=>{event.preventDefault();event.stopPropagation();closeDrawer();},{passive:false});}
    document.addEventListener("click",(event)=>{const target=event.target instanceof Element?event.target:null;if(target?.closest("#closeDrawer")){event.preventDefault();closeDrawer();return;}if(drawer.classList.contains("open")&&target&&!drawer.contains(target)&&!target.closest("#menu"))closeDrawer();},true);
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
        const data = await api("/api/image?q=" + encodeURIComponent(item.title + " " + (item.summary || "")), {timeoutMs: 18000});
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
        <div class="section-intro"><span class="eyebrow">${t("استكشف الأقسام","Explore sections")}</span><div class="section-grid">${primarySections.map((s) => '<a class="section-card" href="/' + s[0] + '?lang=' + lang + '"><span class="section-icon">' + iconSvg(s[0]) + '</span><div><h2>' + escapeHtml(ar ? s[1] : s[2]) + '</h2><p>' + escapeHtml(ar ? s[3] : s[4]) + '</p></div><b>↗</b></a>').join("")}</div></div>
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
      .filter((item) => {
        const title = String(item.title || ""), summary = String(item.summary || "");
        return ar ? /[\u0600-\u06ff]/.test(title) && (!summary || /[\u0600-\u06ff]/.test(summary)) : !/[\u0600-\u06ff]/.test(title) && !/[\u0600-\u06ff]/.test(summary);
      })
      .slice(0, 6);
    newsOut.innerHTML = newsItems.length
      ? newsItems.map((item) => '<a class="article-card" href="/news?story=' + encodeURIComponent(item.title) + '&lang=' + lang + '">' + imageHtml(item) + '<div class="article-card-body"><span class="kicker">' + escapeHtml(item.publisher || t("الأخبار","News")) + '</span><h3>' + escapeHtml(item.title) + '</h3><p>' + escapeHtml(item.summary || "") + '</p><div class="source-line">' + escapeHtml(formatDate(item.publishedAt)) + '</div><span class="read">' + t("اقرأ داخل بيان","Read inside BAYAN") + " →</span></div></a>").join("")
      : '<div class="notice">' + t("لا توجد أخبار حديثة متاحة الآن؛ لن نعرض خبرًا مختلقًا.","No current news is available right now; BAYAN will not invent a story.") + "</div>";
    if (newsItems.length) hydrateSectionImages(newsItems);

    const featured = sectionData
      .flatMap((x) => x.items || [])
      .filter((item) => {
        const title = String(item.title || ""), summary = String(item.summary || ""), body = String(item.body || "");
        return ar ? /[\u0600-\u06ff]/.test(title) && (!summary || /[\u0600-\u06ff]/.test(summary)) && (!body || /[\u0600-\u06ff]/.test(body)) : !/[\u0600-\u06ff]/.test(title) && !/[\u0600-\u06ff]/.test(summary) && !/[\u0600-\u06ff]/.test(body);
      })
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
    const output = document.querySelector("#out");
    output.innerHTML = '<div class="notice loading">' + t("جاري البحث في مصادر متعددة…","Searching multiple sources…") + "</div>";
    let data = null, fallbackUsed = false;
    try { data = await api("/api/search?q=" + encodeURIComponent(query) + "&lang=" + lang, {timeoutMs:18000}); } catch {}
    if (!data?.results?.length && !((data?.providers||[]).includes("BAYAN content safety"))) {
      fallbackUsed = true;
      try { data = {results: await browserSearchFallback(query), providers:[t("مسار بحث احتياطي","Fallback search")], status:"mixed"}; } catch { data = {results:[]}; }
    }
    const results = Array.isArray(data.results) ? data.results : [];
    output.innerHTML = results.length
      ? ((data.answer ? '<article class="answer search-answer"><span class="eyebrow">' + t("إجابة بيان","BAYAN answer") + '</span><div class="article-body">' + String(data.answer).split(String.fromCharCode(10)).map((line) => "<p>" + escapeHtml(line) + "</p>").join("") + '</div>' + (data.articleSlug ? '<a class="read" href="/article/' + encodeURIComponent(data.articleSlug) + "?lang=" + lang + '">' + t("فتح الملف الكامل داخل بيان","Open the full BAYAN file") + " →</a>" : "") + "</article>" : "") +
      (fallbackUsed ? '<div class="notice">' + t("عرض بيان نتائج من مسار احتياطي؛ يجري توسيع البحث دون اختلاق نتائج.","BAYAN is showing fallback-source results while expanding search without inventing results.") + "</div>" : "") +
      '<div class="result-meta">' + escapeHtml((data.providers || []).join(" · ") || "BAYAN") + "</div>" +
      results.map((item) => {
        const key = item.slug || item.url || item.title;
        const sectionMeta=sections.find(section=>section[0]===item.section); const sectionLabel=sectionMeta?(ar?sectionMeta[1]:sectionMeta[2]):t("نتيجة بحث","Search result"); return '<article class="search-result"><span class="kicker">' + escapeHtml(sectionLabel) + " · " +
          escapeHtml(item.evidence || "mixed") + "</span><h2>" +
          (item.slug ? '<a href="/article/' + encodeURIComponent(item.slug) + '?lang=' + lang + '">' + escapeHtml(item.title) + "</a>" : escapeHtml(item.title)) +
          "</h2><p>" + escapeHtml(item.summary || "") + '</p><div class="source-line">' +
          (item.sources || []).slice(0, 3).map((source) => escapeHtml(source.publisher)).join(" · ") +
          "</div>" + socialActions({...item, _key:key}) + "</article>";
      }).join(""))
      : '<div class="notice"><h2>' + escapeHtml(data?.message || t("لم نعثر على نتيجة مناسبة في المسارات المتاحة الآن.","No suitable result was found in the available search paths.")) +
        '</h2><p>' + t("يمكنك تجربة صياغة أخرى؛ يوسّع بيان البحث عبر المصادر المتاحة دون اختلاق معلومات.","Try another phrasing; BAYAN searches available sources without fabricating information.") + "</p>" +
        '<button class="primary" id="search-retry">' + t("إعادة البحث","Search again") + "</button></div>";
    document.querySelector("#search-retry")?.addEventListener("click", () => renderSearch());
  }

  async function renderArticle() {
    const slug = decodeURIComponent(location.pathname.slice(9));
    app.innerHTML = '<section class="page narrow"><div id="article"><div class="notice loading">' +
      t("جاري تجهيز الملف…","Preparing the knowledge file…") + "</div></div></section>";
    try {
      const data = await api("/api/article?slug=" + encodeURIComponent(slug) + "&lang=" + lang);
      const output = document.querySelector("#article");
      output.innerHTML =
        '<article class="article-full">' + (data.imageUrl ? heroImageHtml(data.imageUrl, data.imageAlt || data.title) : "") +
        '<span class="eyebrow">' + escapeHtml(data.section || "BAYAN") + "</span><h1>" +
        escapeHtml(data.title) + '</h1><p class="lead">' + escapeHtml(data.summary || "") +
        '</p><div class="article-body">' + String(data.body || "").split(String.fromCharCode(10)).map((line) =>
        "<p>" + escapeHtml(line) + "</p>").join("") +
        '</div><div class="sources-box"><h2>' + t("الأدلة والمصادر","Evidence & sources") + "</h2>" +
        (data.sources || []).map((source) =>
          '<div class="source-line">' + escapeHtml(source.publisher || "") + " · " + escapeHtml(source.title || "") +
          "</div>").join("") + "</div>" + socialActions({...data, _key:data.slug || slug, slug}) + "</article>";
      if (!data.imageUrl) {
        try {
          const image = await api("/api/image?q=" + encodeURIComponent(data.title + " " + (data.summary || "")));
          if (image.imageUrl) document.querySelector(".article-full")?.insertAdjacentHTML(
            "afterbegin", heroImageHtml(image.imageUrl, data.title));
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
      const items = (data.items || []).filter((item) => {
        const title = String(item.title || ""), summary = String(item.summary || "");
        return ar ? /[\u0600-\u06ff]/.test(title) && (!summary || /[\u0600-\u06ff]/.test(summary)) : !/[\u0600-\u06ff]/.test(title) && !/[\u0600-\u06ff]/.test(summary);
      });
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
            '<article class="article-full">' + (article.image ? heroImageHtml(article.image, article.title) : "") +
            '<span class="eyebrow">' + escapeHtml(story.publisher || t("الأخبار","News")) + "</span><h1>" +
            escapeHtml(article.title) + '</h1><p class="lead">' + escapeHtml(article.summary || story.summary || "") +
            '</p>' + (article.status === "source_only" ? '<div class="notice">' + t("هذا ملخص المصدر المتاح؛ لم تتوفر أدلة كافية لإعداد عرض تحليلي كامل بعد.","This is the available source summary; there is not enough evidence to prepare a full analysis yet.") + '</div>' : "") +
            '<div class="article-body">' + String(article.body || "").split(String.fromCharCode(10)).map((line) =>
            "<p>" + escapeHtml(line) + "</p>").join("") +
            '</div><div class="sources-box"><h2>' + t("الأدلة والمصادر","Evidence & sources") + "</h2>" +
            (article.sources || []).map((source) =>
              '<div class="source-line">' + escapeHtml(source.publisher || "") + " · " + escapeHtml(source.title || "") +
              "</div>").join("") + "</div>" + socialActions({...article, title:article.title||story.title, summary:article.summary||story.summary, href:"/news?story="+encodeURIComponent(story.title)+"&lang="+lang, _key:"news:"+story.title}) + "</article>";
        } catch {
          output.innerHTML = '<div class="notice">' +
            t("تعذر تجهيز المقال الكامل من الأدلة الآن.","The full evidence-based article could not be prepared right now.") + "</div>";
        }
        return;
      }
      output.innerHTML = items.length
        ? items.map((item) => {
          const href="/news?story="+encodeURIComponent(item.title)+"&lang="+lang;
          return '<article class="article-card"><a class="article-card-link" href="'+href+'">' +
          imageHtml(item) + '<div class="article-card-body"><span class="kicker">' +
          escapeHtml(item.publisher || t("مصدر إخباري","News")) + "</span><h2>" + escapeHtml(item.title) +
          "</h2><p>" + escapeHtml(item.summary) + '</p><div class="source-line">' +
          escapeHtml(formatDate(item.publishedAt)) + '</div><span class="read">' +
          t("اقرأ داخل بيان","Read inside BAYAN") + " →</span></div></a>" + socialActions({...item, href, _key:"news:"+item.title}) + "</article>";
        }).join("")
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

  async function renderPrayer() {
    const requestedCity=new URLSearchParams(location.search).get("city")||"Hurghada";
    const requestedCountry=new URLSearchParams(location.search).get("country")||"Egypt";
    app.innerHTML='<section class="page narrow"><div class="page-head"><span class="eyebrow">'+t("العبادات والتقويم","Prayer & Islamic calendar")+'</span><h1>'+t("مواقيت الصلاة والمناسبات الإسلامية","Prayer times & Islamic occasions")+'</h1><p>'+t("مواقيت الصلاة حسب المدينة، مع التاريخ الهجري وتقديرات المناسبات القادمة. قد تختلف المواعيد حسب الجهة الرسمية والرؤية الشرعية.","Prayer times by city, Hijri date and estimated upcoming occasions. Official announcements and moon sighting may change dates.")+'</p></div><form id="prayerCityForm" class="weather-city-form"><label for="prayerCity">'+t("المدينة أو المحافظة أو الولاية","City, governorate, state or region")+'</label><div class="weather-city-row"><input id="prayerCity" name="city" maxlength="100" value="'+escapeHtml(requestedCity)+'" placeholder="'+t("اكتب المدينة أو المحافظة في أي دولة","Enter a city or region anywhere in the world")+'" required><input id="prayerCountry" name="country" maxlength="100" value="'+escapeHtml(requestedCountry)+'" placeholder="'+t("الدولة","Country")+'" required><button type="submit" class="btn primary">'+t("عرض المواقيت","Show times")+'</button></div><div class="weather-presets">'+[["Hurghada","Egypt","الغردقة"],["Cairo","Egypt","القاهرة"],["Alexandria","Egypt","الإسكندرية"],["Luxor","Egypt","الأقصر"],["Riyadh","Saudi Arabia","الرياض"],["Makkah","Saudi Arabia","مكة"],["Dubai","United Arab Emirates","دبي"]].map(x=>'<button type="button" class="weather-preset" data-prayer-city="'+escapeHtml(x[0])+'" data-prayer-country="'+escapeHtml(x[1])+'">'+escapeHtml(x[2])+'</button>').join("")+'</div></form><div id="prayerPanel"><div class="notice loading">'+t("جاري تحميل مواقيت الصلاة…","Loading prayer times…")+'</div></div><p class="muted">'+t("المصدر: AlAdhan. المواعيد المحسوبة تقديرية وقد تختلف باختلاف طريقة الحساب والجهة المحلية.","Source: AlAdhan. Calculated times are estimates and may vary by calculation method and local authority.")+'</p></section>';
    const cityInput=document.querySelector("#prayerCity"),countryInput=document.querySelector("#prayerCountry");
    async function loadPrayer(city,country){
      const panel=document.querySelector("#prayerPanel");panel.innerHTML='<div class="notice loading">'+t("جاري تحميل مواقيت الصلاة…","Loading prayer times…")+'</div>';
      try{
        const d=await api("/api/live/prayer?city="+encodeURIComponent(city)+"&country="+encodeURIComponent(country));
        if(!d.ok)throw new Error("unavailable");
        const labels=[["Fajr",t("الفجر","Fajr")],["Sunrise",t("الشروق","Sunrise")],["Dhuhr",t("الظهر","Dhuhr")],["Asr",t("العصر","Asr")],["Maghrib",t("المغرب","Maghrib")],["Isha",t("العشاء","Isha")]];
        const events=d.events||{};
        const eventCard=(title,event,notice)=>'<article class="live live-card"><span class="kicker">'+title+'</span><h3>'+escapeHtml(event?.date||t("جارٍ الحساب","Calculating"))+'</h3><p>'+notice+'</p></article>';
        panel.innerHTML='<div class="prayer-date"><span class="kicker">'+t("التاريخ الهجري","Hijri date")+'</span><h2>'+escapeHtml([d.hijri?.day,d.hijri?.monthAr||d.hijri?.month,d.hijri?.year].filter(Boolean).join(" "))+'</h2><p>'+escapeHtml([d.city,d.country,d.gregorian?.date].filter(Boolean).join(" · "))+'</p></div><div class="live-grid prayer-grid">'+labels.map(([key,label])=>'<article class="live live-card"><span class="kicker">'+label+'</span><h2>'+escapeHtml(d.timings?.[key]||"—")+'</h2></article>').join("")+'</div><h2 class="prayer-subtitle">'+t("المناسبات القادمة (تقديرية)","Upcoming occasions (estimated)")+'</h2><div class="live-grid">'+eventCard(t("بداية رمضان","Ramadan begins"),events.ramadan,t("موعد محسوب مبدئيًا؛ ينتظر الإعلان الرسمي.","Calculated estimate; awaiting official announcement."))+eventCard(t("عيد الفطر","Eid al-Fitr"),events.eidFitr,t("موعد العيد يتأكد بالرؤية والإعلان الرسمي.","Confirmed by moon sighting and official announcement."))+eventCard(t("عيد الأضحى","Eid al-Adha"),events.eidAdha,t("موعد العيد يتأكد بالرؤية والإعلان الرسمي.","Confirmed by moon sighting and official announcement."))+'</div><div class="notice">'+t("موعد صلاة العيد يعلنه محليًا المسجد أو الجهة الدينية المختصة؛ لا يعرض بيان ساعة غير مؤكدة.","Eid prayer time is announced locally by the mosque or religious authority; BAYAN does not display an unverified time.")+'</div>';
        const url=new URL(location.href);url.searchParams.set("city",city);url.searchParams.set("country",country);history.replaceState(null,"",url.pathname+url.search);
      }catch{panel.innerHTML='<div class="notice">'+t("تعذر تحميل المواقيت لهذه المدينة الآن. راجع كتابة المدينة والدولة وحاول مرة أخرى.","Could not load times for this city. Check the city and country and try again.")+'</div>'}
    }
    document.querySelector("#prayerCityForm").addEventListener("submit",e=>{e.preventDefault();if(cityInput.value.trim()&&countryInput.value.trim())loadPrayer(cityInput.value.trim(),countryInput.value.trim())});
    document.querySelectorAll("[data-prayer-city]").forEach(button=>button.addEventListener("click",()=>{cityInput.value=button.getAttribute("data-prayer-city")||"";countryInput.value=button.getAttribute("data-prayer-country")||"Egypt";loadPrayer(cityInput.value,countryInput.value)}));
    loadPrayer(requestedCity,requestedCountry);
  }

  async function renderWeather() {
    const requestedCity=new URLSearchParams(location.search).get("city")||"Hurghada";
    app.innerHTML = '<section class="page narrow"><div class="page-head"><span class="eyebrow">'+t("بيانات مناخية مباشرة","Live weather data")+'</span><h1>'+t("الطقس","Weather")+'</h1><p>'+t("اختر أي مدينة لمشاهدة الطقس فيها؛ لا يقتصر بيان على القاهرة.","Choose a city to view its weather. BAYAN is not limited to Cairo.")+'</p></div><form id="weatherCityForm" class="weather-city-form"><label for="weatherCity">'+t("المدينة أو المنطقة","City or region")+'</label><div class="weather-city-row"><input id="weatherCity" name="city" maxlength="100" value="'+escapeHtml(requestedCity)+'" placeholder="'+t("مثال: الغردقة أو القاهرة أو London","e.g. Hurghada, Cairo or London")+'" required><button type="submit" class="btn primary">'+t("عرض الطقس","Show weather")+'</button></div><div class="weather-presets">'+["الغردقة","القاهرة","الإسكندرية","الأقصر","أسوان","الرياض","دبي","London","New York"].map((city)=>'<button type="button" class="weather-preset" data-city="'+escapeHtml(city)+'">'+escapeHtml(city)+'</button>').join("")+'</div></form><div id="weatherPanel" class="live-grid"><div class="notice loading">'+t("جاري تحديث الطقس…","Loading weather…")+'</div></div><p class="muted">'+t("المصدر: Open-Meteo. قد تتأخر البيانات أو تتعذر عند توقف المزود.","Source: Open-Meteo. Data may be delayed or unavailable if the provider is down.")+'</p><a class="navbtn" href="/prices?lang='+lang+'">'+t("العودة إلى الأسعار","Back to prices")+'</a></section>';
    const form=document.querySelector("#weatherCityForm");
    const cityInput=document.querySelector("#weatherCity");
    async function loadWeather(city){
      const panel=document.querySelector("#weatherPanel");
      if(!panel)return;
      panel.innerHTML='<div class="notice loading">'+t("جاري تحديث الطقس…","Loading weather…")+'</div>';
      try {
        const weather=await api("/api/live/weather?city="+encodeURIComponent(city));
        if(!weather.ok)throw new Error(weather.message||"weather_unavailable");
        const c=weather.current||{},place=[weather.city,weather.region,weather.country].filter(Boolean).join("، ");
        panel.innerHTML='<div class="weather-location"><span class="kicker">'+t("الطقس في","Weather in")+'</span><h2>'+escapeHtml(place||city)+'</h2></div>'+
          '<article class="live live-card"><span class="kicker">'+t("درجة الحرارة","Temperature")+'</span><h2>'+escapeHtml(c.temperature_2m??"—")+' °C</h2><p>'+t("الطقس الحالي","Current conditions")+'</p><span class="source-line">'+escapeHtml(weather.provider||"Open-Meteo")+'</span></article>'+
          '<article class="live live-card"><span class="kicker">'+t("الرطوبة","Humidity")+'</span><h2>'+escapeHtml(c.relative_humidity_2m??"—")+'%</h2></article>'+
          '<article class="live live-card"><span class="kicker">'+t("سرعة الرياح","Wind speed")+'</span><h2>'+escapeHtml(c.wind_speed_10m??"—")+' km/h</h2></article>';
        const url=new URL(location.href);url.searchParams.set("city",city);history.replaceState(null,"",url.pathname+url.search);
      } catch {
        panel.innerHTML='<div class="notice">'+t("لم نعثر على المدينة أو تعذر تحديث الطقس. جرّب كتابة اسم المدينة بالإنجليزية أو اختَر مدينة مقترحة.","City not found or weather unavailable. Try the city name in English or choose a suggested city.")+'</div>';
      }
    }
    form.addEventListener("submit",event=>{event.preventDefault();const city=String(cityInput.value||"").trim();if(city)loadWeather(city)});
    document.querySelectorAll("[data-city]").forEach(button=>button.addEventListener("click",()=>{cityInput.value=button.getAttribute("data-city")||"";loadWeather(cityInput.value)}));
    loadWeather(requestedCity);
  }
  async function renderPrices() {
    app.innerHTML =
      '<section class="page"><div class="page-head"><span class="eyebrow">' +
      t("بيانات مباشرة","Live data") + '</span><h1>' + t("الأسعار والبيانات الحية","Prices & Live Data") +
      '</h1><p>' + t("أسعار العملات والمعادن والطاقة والعملات الرقمية ومؤشرات الأسواق، مع المصدر والوحدة ووقت التحديث.","Currencies, metals, energy, crypto and market indices with provider, units and update time.") +
      '</p></div><div class="live-grid market-overview"><article class="live live-card" id="fx">…</article><article class="live live-card" id="gold">…</article></div><h2 class="section-title">'+t("أسواق ومواد إضافية","More markets & commodities")+'</h2><div class="live-grid" id="marketExtras"><div class="notice loading">'+t("جاري تحميل الأسعار من المزودات…","Loading provider quotes…")+'</div></div><p class="muted">'+t("الأسعار إرشادية وقد تتأخر أو تتوقف عند تعطل المزود؛ تحقق من المصدر قبل اتخاذ قرارات مالية.","Quotes are indicative and may be delayed or unavailable; verify with the provider before making financial decisions.")+'</p></section>';
    try {
      const [fx, gold] = await Promise.all([api("/api/live/fx"), api("/api/live/gold")]);
      const currencyNames = {EGP:"الجنيه المصري / Egyptian pound",EUR:"اليورو / Euro",GBP:"الجنيه الإسترليني / British pound",SAR:"الريال السعودي / Saudi riyal",AED:"الدرهم الإماراتي / UAE dirham",KWD:"الدينار الكويتي / Kuwaiti dinar",QAR:"الريال القطري / Qatari riyal",BHD:"الدينار البحريني / Bahraini dinar",OMR:"الريال العماني / Omani rial",JOD:"الدينار الأردني / Jordanian dinar",TRY:"الليرة التركية / Turkish lira",JPY:"الين الياباني / Japanese yen",CNY:"اليوان الصيني / Chinese yuan",CAD:"الدولار الكندي / Canadian dollar",AUD:"الدولار الأسترالي / Australian dollar",CHF:"الفرنك السويسري / Swiss franc",INR:"الروبية الهندية / Indian rupee",ILS:"الشيكل / Israeli shekel",LYD:"الدينار الليبي / Libyan dinar",TND:"الدينار التونسي / Tunisian dinar",MAD:"الدرهم المغربي / Moroccan dirham",ZAR:"الراند الجنوب أفريقي / South African rand"};
      const rates = fx.rates || {};
      const currencyRows = Object.entries(rates).filter(([code,value]) => Number.isFinite(Number(value))).map(([code,value]) =>
        '<div class="market-row"><span>'+escapeHtml(code)+' <small>'+escapeHtml(currencyNames[code]||code)+'</small></span><strong>'+escapeHtml(Number(value).toLocaleString(undefined,{maximumFractionDigits:4}))+'</strong></div>'
      ).join("");
      document.querySelector("#fx").innerHTML =
        '<span class="kicker">' + t("أسعار الصرف","Exchange rates") + '</span><h2>1 USD</h2><p>' +
        t("القيمة مقابل العملات التالية","Value against the following currencies") + '</p><div class="market-list">' +
        (currencyRows || '<div class="notice">'+t("بيانات العملات غير متاحة الآن","Currency data unavailable")+'</div>') +
        '</div><span class="source-line">' + escapeHtml(fx.provider || "Frankfurter v2") + " · " + t("الوحدة: عملة لكل دولار أمريكي","Units: currency per 1 USD") + "</span>";
      document.querySelector("#gold").innerHTML =
        '<span class="kicker">' + t("الذهب عيار 24","Gold 24K") + "</span><h2>" +
        escapeHtml(gold.price == null ? "—" : Number(gold.price).toLocaleString(undefined,{maximumFractionDigits:2})) + '</h2><p>' +
        t("جنيه مصري / جرام (سعر مرجعي)","EGP / gram (reference price)") + '</p><span class="source-line">' +
        escapeHtml(gold.provider || "Gold provider") + "</span>";
      const markets = Array.isArray(gold.markets) ? gold.markets : [];
      const extras = document.querySelector("#marketExtras");
      extras.innerHTML = markets.length ? markets.map(item =>
        '<article class="live live-card market-card"><span class="kicker">'+escapeHtml(ar ? (item.ar||item.symbol) : (item.en||item.symbol))+'</span><h2>'+escapeHtml(item.price == null ? "—" : Number(item.price).toLocaleString(undefined,{maximumFractionDigits:4}))+'</h2><p>'+escapeHtml(item.unit||item.currency||"")+'</p><span class="source-line">'+escapeHtml(item.provider||"Yahoo Finance")+' · '+escapeHtml(item.symbol||"")+'</span></article>'
      ).join("") : '<div class="notice">'+t("لم تتوفر أسعار الأسواق الإضافية من المزودات في الوقت الحالي.","Additional market quotes are currently unavailable from providers.")+'</div>';
    } catch {
      document.querySelector(".live-grid").innerHTML =
        '<div class="notice">' + t("تعذر تحديث البيانات الحية. حاول مرة أخرى لاحقًا.","Live data could not be refreshed. Please try again later.") + "</div>";
    }
  }

  async function renderAdmin() {
    app.innerHTML='<section class="page admin-page"><div class="page-head"><span class="eyebrow">'+t("مركز تحكم بيان","BAYAN Control Center")+'</span><h1>'+t("مركز تحكم بيان","BAYAN Control Center")+'</h1><p>'+t("تحكم كامل في المحتوى والنشر والأقسام والإعدادات والمراقبة.","Full control over content, publishing, sections, settings and monitoring.")+'</p></div><div class="admin-login admin-login-compact"><div class="admin-auth-row"><input id="adminToken" class="field" type="password" autocomplete="current-password" placeholder="'+t("رمز مدير بيان","BAYAN manager token")+'"> <button id="adminSave" class="primary">'+t("دخول","Enter")+'</button></div><details class="admin-maintenance"><summary>'+t("أدوات الصيانة والإصلاح","Maintenance & repair tools")+'</summary><div class="admin-maintenance-body"><div class="admin-action-row"><button id="adminRepair" class="navbtn">'+t("تشخيص وإصلاح","Diagnose & Repair")+'</button><button id="telegramTest" class="navbtn">'+t("اختبار تيليجرام","Test Telegram")+'</button></div><textarea id="aiRepairProblem" class="field" rows="2" placeholder="'+t("اكتب المشكلة التي تريد من مهندس BAYAN AI تشخيصها وإصلاحها بأمان…","Describe the problem you want BAYAN AI Engineer to diagnose and safely repair…")+'"></textarea><button id="aiRepair" class="primary">'+t("اطلب من BAYAN AI تعديلًا أو إصلاحًا","Ask BAYAN AI to diagnose and repair")+'</button><div id="telegramStatus" class="notice" role="status"></div></div></details></div><div id="adminOut"></div></section>';
    const token=()=>sessionStorage.getItem("bayan-admin-token")||"";
    document.querySelector("#adminSave").onclick=()=>{const v=document.querySelector("#adminToken").value.trim();if(v)sessionStorage.setItem("bayan-admin-token",v);load();};document.querySelector("#telegramTest").onclick=async()=>{const status=document.querySelector("#telegramStatus");if(status)status.textContent=t("جارٍ اختبار اتصال تيليجرام…","Testing Telegram delivery…");try{const r=await adminApi("/api/admin/telegram-test",{method:"POST"});if(status){status.textContent=r.ok?t("نجح الإرسال: وصلت رسالة الاختبار إلى تيليجرام.","Delivery succeeded: Telegram accepted the test message."):t("فشل الإرسال. راجع سجل الأعطال وإعدادات البوت.","Delivery failed. Check the incident log and bot settings.");status.className="notice "+(r.ok?"notice-success":"notice-error");}}catch(e){if(status){status.textContent=String(e).includes("unauthorized")?t("رمز المدير غير صحيح.","Invalid manager token."):String(e).includes("telegram_not_configured")?t("تيليجرام غير مضبوط: راجع رمز البوت ومعرّف المحادثة في إعدادات Cloudflare.","Telegram is not configured: check the bot token and chat ID in Cloudflare settings."):t("تعذر تأكيد إرسال الرسالة. افحص سجل الأعطال ووجهة الرسائل.","Could not confirm delivery. Check the incident log and message destination.");status.className="notice notice-error";}}};
    async function adminApi(url,options={}){const h=new Headers(options.headers||{});h.set("x-bayan-manager-token",token());const r=await fetch(url,{...options,headers:h});const data=await r.json().catch(()=>({}));if(r.status===401)throw new Error("unauthorized");if(!r.ok)throw new Error(String(data.error||"http_"+r.status));return data;}
    const opts=()=>sections.filter(x=>x[0]!=="prices").map(x=>'<option value="'+x[0]+'">'+escapeHtml(ar?x[1]:x[2])+'</option>').join("");
    async function load(){const o=document.querySelector("#adminOut");if(!token()){o.innerHTML='<div class="notice">'+t("أدخل رمز المدير لفتح الإدارة.","Enter the manager token to open admin.")+"</div>";return;}o.innerHTML='<div class="notice loading">'+t("جاري تحميل الإدارة…","Loading admin…")+"</div>";
      try{const [health,settings,repairs,runtime,analytics,contributions,articles,searches]=await Promise.all([api("/api/health"),adminApi("/api/admin/settings"),adminApi("/api/admin/repairs"),adminApi("/api/admin/runtime"),adminApi("/api/admin/analytics"),adminApi("/api/admin/contributions"),adminApi("/api/admin/articles"),adminApi("/api/admin/searches")]);const st=Object.fromEntries((settings.items||[]).map(x=>[x.key,x.value])),list=articles.items||[];
      o.innerHTML='<div class="admin-grid"><div class="admin-card"><span class="kicker">'+t("الحالة","Status")+'</span><h2>'+(health.ok?"● ":"○ ")+t(health.ok?"متصل":"يحتاج فحصًا",health.ok?"Connected":"Needs review")+'</h2><p>'+t("فحص واجهة API فقط؛ لا يعني سلامة جميع الخدمات.","API check only; not a full system health check.")+'</p><small>'+t("الإصدار ","Version ")+escapeHtml(health.version||"1.0.0")+'</small></div><div class="admin-card"><span class="kicker">'+t("المقالات","Articles")+'</span><h2>'+list.length+'</h2><p>'+t("كل الحالات","All statuses")+'</p></div><div class="admin-card"><span class="kicker">'+t("الإصلاح الذاتي","Self-healing")+'</span><h2>'+(st.auto_repair==="1"?"● ":"Ⅱ ")+t(st.auto_repair==="1"?"مفعّل":"متوقف",st.auto_repair==="1"?"Enabled":"Paused")+'</h2></div></div>';
      o.innerHTML+='<nav class="admin-shortcuts" aria-label="'+t("أقسام الإدارة","Admin sections")+'">'+[["#admin-settings",t("الإعدادات","Settings")],["#admin-content",t("المحتوى","Content")],["#admin-analytics",t("المشاهدات","Analytics")],["#admin-searches",t("سجل البحث","Search log")],["#admin-contributions",t("المساهمات","Contributions")],["#admin-monitoring",t("الأعطال والتنبيهات","Incidents & alerts")],["#admin-repair-panel",t("الإصلاح الذاتي","Self-healing")]].map(x=>'<a href="'+x[0]+'">'+x[1]+'</a>').join("")+'</nav>';o.innerHTML+='<div id="admin-settings" class="admin-card admin-panel"><h2>'+t("إعدادات التحكم","Control settings")+'</h2><div class="admin-controls">'+[["min_sources",t("الحد الأدنى للمصادر","Minimum sources")],["max_sources",t("أقصى المصادر","Maximum sources")],["news_items",t("عدد الأخبار","News items")],["search_timeout_ms",t("مهلة البحث","Search timeout")]].map(x=>'<label>'+x[1]+'<input class="field setting" data-key="'+x[0]+'" value="'+escapeHtml(st[x[0]]||"")+'"></label>').join("")+'<label><input type="checkbox" class="setting-check" data-key="image_required" '+(st.image_required==="1"?"checked":"")+'> '+t("إلزام الصورة","Require image")+'</label><label><input type="checkbox" class="setting-check" data-key="auto_repair" '+(st.auto_repair==="1"?"checked":"")+'> '+t("الإصلاح التلقائي الآمن","Safe auto repair")+'</label><button id="saveSettings" class="primary">'+t("حفظ","Save")+'</button></div></div>';
      o.innerHTML+='<div id="admin-content" class="admin-card admin-panel"><h2>'+t("إدارة المحتوى","Content management")+'</h2><input id="contentFilter" class="field admin-filter" placeholder="'+t("ابحث في المقالات بالعنوان أو القسم أو اللغة…","Filter articles by title, section or language…")+'"><div class="admin-list">'+list.slice(0,100).map((x,i)=>'<div class="admin-article-row" '+(i>=15?'hidden':'')+'><b>'+escapeHtml(x.title)+'</b><small>'+escapeHtml(x.language==="en"?t("الإنجليزية","English"):t("العربية","Arabic"))+' · '+escapeHtml(x.section)+' · '+escapeHtml(x.status)+'</small><button class="editArticle navbtn" data-i="'+i+'">'+t("تحرير","Edit")+'</button><button class="statusArticle navbtn" data-slug="'+escapeHtml(x.slug)+'" data-lang="'+x.language+'" data-status="'+(x.status==="PUBLISHED"?"DRAFT":"PUBLISHED")+'">'+(x.status==="PUBLISHED"?t("إخفاء","Unpublish"):t("نشر","Publish"))+'</button><button class="deleteArticle navbtn" data-slug="'+escapeHtml(x.slug)+'" data-lang="'+x.language+'">'+t("حذف","Delete")+'</button></div>').join("")+'</div><button id="contentExpand" class="navbtn">'+t("عرض كل المقالات","Show all articles")+'</button><div id="articleEditor"></div></div>';
      o.innerHTML+='<div id="admin-analytics" class="admin-card admin-panel"><h2>'+t("إحصائيات الموقع","Site statistics")+'</h2><p>'+t("لتجاهل زياراتك من هذا المتصفح، فعّل الاستبعاد مرة واحدة: ","To exclude your own visits from this browser, enable exclusion once: ")+'<a href="/?bayan_owner=1">'+t("استبعاد زياراتي","Exclude my visits")+'</a> · <a href="/?bayan_owner=0">'+t("إلغاء استبعاد هذا المتصفح","Stop excluding this browser")+'</a></p><p class="muted">'+t("الزائر الفريد هنا عنوان IP مُشفّر تقريبيًا، وليس تحديدًا مؤكدًا لشخص. الاستبعاد يبدأ من تفعيل الرابط ولا يصحح الأرقام التاريخية تلقائيًا.","Unique visitor currently means a hashed IP address, not a verified individual. Exclusion starts when enabled and does not retroactively correct historical totals.")+'</p><div class="admin-grid"><div><span class="kicker">'+t("إجمالي الزيارات","Total views")+'</span><h2>'+Number(analytics.totalViews||0)+'</h2></div><div><span class="kicker">'+t("عناوين IP الفريدة (تقريبي)","Unique IPs (approx.)")+'</span><h2>'+Number(analytics.uniqueVisitors||0)+'</h2></div><div><span class="kicker">'+t("عناوين IP اليوم","Unique IPs today")+'</span><h2>'+Number(analytics.periods?.day?.uniqueVisitors||0)+'</h2></div><div><span class="kicker">'+t("عناوين IP خلال 7 أيام","Unique IPs in 7 days")+'</span><h2>'+Number(analytics.periods?.week?.uniqueVisitors||0)+'</h2></div><div><span class="kicker">'+t("عناوين IP خلال 30 يومًا","Unique IPs in 30 days")+'</span><h2>'+Number(analytics.periods?.month?.uniqueVisitors||0)+'</h2></div><div><span class="kicker">'+t("اليوم","Today")+'</span><h2>'+Number(analytics.periods?.day?.views||0)+'</h2></div><div><span class="kicker">'+t("7 أيام","7 days")+'</span><h2>'+Number(analytics.periods?.week?.views||0)+'</h2></div><div><span class="kicker">'+t("30 يومًا","30 days")+'</span><h2>'+Number(analytics.periods?.month?.views||0)+'</h2></div></div><div class="admin-grid content-quality-grid"><div><span class="kicker">'+t("مقالات منشورة","Published articles")+'</span><h2>'+Number(analytics.contentQuality?.published||0)+'</h2></div><div><span class="kicker">'+t("مقالات قصيرة تحتاج مراجعة","Short articles to review")+'</span><h2>'+Number(analytics.contentQuality?.short_bodies||0)+'</h2></div><div><span class="kicker">'+t("صور ناقصة","Missing images")+'</span><h2>'+Number(analytics.contentQuality?.missing_images||0)+'</h2></div><div><span class="kicker">'+t("مصادر ناقصة","Missing sources")+'</span><h2>'+Number(analytics.contentQuality?.missing_sources||0)+'</h2></div></div><h3>'+t("أكثر الصفحات","Top pages")+'</h3><div class="admin-list">'+(analytics.topPages||[]).slice(0,10).map(x=>'<div><b>'+escapeHtml(x.path)+'</b><small>'+Number(x.visits||0)+'</small></div>').join("")+'</div><h3>'+t("أكثر عمليات البحث","Top searches")+'</h3><div class="admin-list">'+(analytics.topSearches||[]).slice(0,10).map(x=>'<div><b>'+escapeHtml(x.query)+'</b><small>'+Number(x.count||0)+'</small></div>').join("")+'</div></div>';o.innerHTML+='<div id="admin-contributions" class="admin-card admin-panel"><h2>'+t("المساهمات","Contributions")+'</h2><div class="admin-list">'+(contributions.items||[]).filter(x=>x.status==="PENDING").slice(0,30).map(x=>'<div><b>'+escapeHtml(x.title)+'</b> <button class="reviewBtn navbtn" data-id="'+x.id+'" data-action="APPROVE">'+t("نشر","Approve")+'</button><button class="reviewBtn navbtn" data-id="'+x.id+'" data-action="REJECT">'+t("رفض","Reject")+'</button></div>').join("")+'</div></div>';
      o.innerHTML+='<div id="admin-searches" class="admin-card admin-panel"><h2>'+t("سجل البحث ونتائجه","Search log & result snapshots")+'</h2><p class="muted">'+t("تُحفظ الاستعلامات وملخصات النتائج والقسم المقترح للمراجعة؛ لا تُنشر النتائج غير المتحققة تلقائيًا.","Queries, result summaries and suggested topics are stored for review; unverified results are not auto-published.")+'</p><div class="admin-list">'+(searches.items||[]).map(x=>{let results=[];try{results=JSON.parse(x.results_json||"[]")}catch{}return '<article class="search-log-row"><b>'+escapeHtml(x.query||"")+'</b><small>'+escapeHtml(x.created_at||"")+' · '+escapeHtml(x.language||"")+' · '+escapeHtml(x.topic_section||"world")+' · '+escapeHtml(x.status||"")+' · '+escapeHtml(x.source_count||0)+' '+t("نتيجة","results")+'</small>'+results.slice(0,5).map(item=>'<p><strong>'+escapeHtml(item.title||"")+'</strong><br>'+escapeHtml(item.summary||"")+'</p>').join("")+'</article>'}).join("")+'</div></div>';
      o.innerHTML+='<div id="admin-repair-panel" class="admin-card admin-panel" hidden><h2>'+t("الإصلاح الذاتي","Self-healing")+'</h2><div id="admin-repair-result"><p class="muted">'+t("نتائج التشخيص والإصلاح ستظهر هنا فقط عند فتح هذا القسم وتشغيل الأداة.","Diagnosis and repair results appear here only when you open this section and run a tool.")+'</p></div></div>';
      o.innerHTML+='<div id="admin-monitoring" class="admin-card admin-panel"><h2>'+t("المراقبة والإصلاحات","Monitoring & repairs")+'</h2><div class="admin-list">'+(runtime.items||[]).filter(x=>["warn","error","critical"].includes(String(x.level||"").toLowerCase())).slice(0,12).map(x=>'<div><b>'+escapeHtml(x.level)+'</b> · '+escapeHtml(x.kind)+' — '+escapeHtml(x.message)+'</div>').join("")+(repairs.items||[]).filter(x=>["WAITING_AI","DETECTED","FAILED","RETRY","REVIEW","REPAIRED"].includes(String(x.status||"").toUpperCase())).slice(0,20).map(x=>'<div class="repair-row"><b>'+escapeHtml(x.status)+'</b><span>'+escapeHtml(x.signature)+'</span><small>'+escapeHtml(x.verification||"pending")+' · '+escapeHtml(x.updated_at||"")+'</small><p>'+escapeHtml(x.action||x.diagnosis||"")+'</p></div>').join("")+'</div></div>';
      const adminPanels=["admin-settings","admin-content","admin-analytics","admin-searches","admin-contributions","admin-monitoring","admin-repair-panel"].map(id=>document.getElementById(id)).filter(Boolean);
      const adminLinks=Array.from(o.querySelectorAll(".admin-shortcuts a"));
      const closeAdminPanels=()=>{adminPanels.forEach(panel=>panel.hidden=true);adminLinks.forEach(link=>{link.setAttribute("aria-expanded","false");link.classList.remove("active");});};
      closeAdminPanels();
      adminLinks.forEach(link=>link.addEventListener("click",event=>{event.preventDefault();const id=(link.getAttribute("href")||"").slice(1);const panel=document.getElementById(id);if(!panel)return;if(!panel.hidden){closeAdminPanels();return;}closeAdminPanels();panel.hidden=false;link.setAttribute("aria-expanded","true");link.classList.add("active");panel.scrollIntoView({behavior:"smooth",block:"start"});}));
      let contentExpanded=false;const contentRows=Array.from(document.querySelectorAll("#admin-content .admin-article-row"));const contentExpand=document.querySelector("#contentExpand");if(contentExpand)contentExpand.onclick=()=>{contentExpanded=!contentExpanded;const q=String(document.querySelector("#contentFilter")?.value||"").toLowerCase().trim();contentRows.forEach((row,i)=>{row.hidden=q?!row.textContent.toLowerCase().includes(q):(!contentExpanded&&i>=15);});contentExpand.textContent=contentExpanded?t("عرض أقل","Show fewer"):t("عرض كل المقالات","Show all articles");};document.querySelector("#contentFilter")?.addEventListener("input",event=>{const q=String(event.target.value||"").toLowerCase().trim();contentRows.forEach((row,i)=>{row.hidden=q?!row.textContent.toLowerCase().includes(q):(!contentExpanded&&i>=15);});});document.querySelector("#saveSettings").onclick=async()=>{for(const e of document.querySelectorAll(".setting,.setting-check"))await adminApi("/api/admin/settings",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({key:e.dataset.key,value:e.type==="checkbox"?(e.checked?"1":"0"):e.value})});load();};
      document.querySelectorAll(".statusArticle").forEach(b=>b.onclick=async()=>{await adminApi("/api/admin/article/status",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({slug:b.dataset.slug,language:b.dataset.lang,status:b.dataset.status})});load();});
      document.querySelectorAll(".deleteArticle").forEach(b=>b.onclick=async()=>{if(confirm(t("حذف المقال نهائيًا؟","Delete permanently?")))await adminApi("/api/admin/article/delete",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({slug:b.dataset.slug,language:b.dataset.lang})});load();});
      document.querySelectorAll(".editArticle").forEach(b=>b.onclick=()=>{const x=list[Number(b.dataset.i)],e=document.querySelector("#articleEditor");e.innerHTML='<div class="admin-card"><h3>'+t("تحرير المقال","Edit article")+'</h3><input id="edTitle" class="field" value="'+escapeHtml(x.title)+'"><textarea id="edSummary" class="field" rows="3">'+escapeHtml(x.summary||"")+'</textarea><textarea id="edBody" class="field" rows="10">'+escapeHtml(x.body||"")+'</textarea><select id="edSection" class="field">'+opts()+'</select><select id="edStatus" class="field"><option>PUBLISHED</option><option>DRAFT</option><option>ARCHIVED</option></select><input id="edImage" class="field" value="'+escapeHtml(x.image_url||"")+'" placeholder="https://..."><div id="edExpandStatus" class="notice">'+t("المسودة الموسعة لن تُحفظ تلقائيًا؛ راجعها قبل الحفظ.","Expanded drafts are not saved automatically; review before saving.")+'</div><button id="edExpand" class="navbtn">'+t("وسّع المقال بالأدلة","Expand with evidence")+'</button><button id="edSave" class="primary">'+t("حفظ التعديلات","Save changes")+'</button></div>';document.querySelector("#edSection").value=x.section;document.querySelector("#edStatus").value=x.status;document.querySelector("#edExpand").onclick=async()=>{const status=document.querySelector("#edExpandStatus");if(status)status.textContent=t("يجري جمع الأدلة وصياغة مسودة موثقة…","Gathering evidence and drafting an article…");try{const draft=await adminApi("/api/admin/article/expand",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({slug:x.slug,language:x.language})});document.querySelector("#edBody").value=draft.draft;if(status){status.textContent=t("تم إنشاء مسودة للمراجعة من "+draft.sourceCount+" مصدر. راجع النص ثم احفظه يدويًا.","A review draft was generated from "+draft.sourceCount+" sources. Review it, then save manually.");status.className="notice notice-success";}}catch(e){if(status){const error=String(e);status.textContent=error.includes("insufficient_sources")?t("لا يحتوي المقال على مصدرين مستقلين صالحين. أضف مصادر موثوقة أولًا.","This article needs two independent sources before expansion. Add reliable sources first."):error.includes("insufficient_source_text")?t("تعذر استخراج نص كافٍ من المصادر؛ لم يتغير المقال.","Could not extract enough source text; the article was not changed."):t("تعذر إنشاء مسودة موثقة. لم يتغير المقال.","Could not create a sourced draft. The article was not changed.");status.className="notice notice-error";}}};document.querySelector("#edSave").onclick=async()=>{await adminApi("/api/admin/article",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({slug:x.slug,language:x.language,title:document.querySelector("#edTitle").value,summary:document.querySelector("#edSummary").value,articleBody:document.querySelector("#edBody").value,section:document.querySelector("#edSection").value,status:document.querySelector("#edStatus").value,imageUrl:document.querySelector("#edImage").value,imageAlt:document.querySelector("#edTitle").value})});load();};});
      document.querySelectorAll(".reviewBtn").forEach(b=>b.onclick=async()=>{await adminApi("/api/admin/contributions/review",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({id:Number(b.dataset.id),action:b.dataset.action})});load();});
      }catch(e){o.innerHTML='<div class="notice">'+(String(e).includes("unauthorized")?t("رمز المدير غير صحيح.","Invalid manager token."):t("تعذر تحميل لوحة الإدارة.","Admin panel failed to load."))+"</div>";}}
    const showRepairPanel=()=>{const panel=document.querySelector("#admin-repair-panel");if(panel){document.querySelectorAll(".admin-panel").forEach(p=>p.hidden=p!==panel);document.querySelectorAll(".admin-shortcuts a").forEach(a=>{const active=a.getAttribute("href")==="#admin-repair-panel";a.classList.toggle("active",active);a.setAttribute("aria-expanded",active?"true":"false");});panel.scrollIntoView({behavior:"smooth",block:"start"});}};
    document.querySelector("#aiRepair").onclick=async()=>{const problem=document.querySelector("#aiRepairProblem").value.trim();showRepairPanel();const o=document.querySelector("#admin-repair-result");if(!problem){o.innerHTML='<div class="notice">'+t("اكتب المشكلة أولًا.","Describe the problem first.")+"</div>";return;}o.innerHTML='<div class="notice loading">'+t("مهندس BAYAN AI يشخّص المشكلة ويجري الإصلاحات الآمنة…","BAYAN AI Engineer is diagnosing and applying safe repairs…")+"</div>";try{const d=await adminApi("/api/admin/ai-repair",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({problem})});const h=d.health||{};o.innerHTML='<div class="admin-card"><h2>'+escapeHtml(d.ok?t("تم التحقق من الحالة بعد الإصلاح.","System verified after repair."):t("المشكلة تحتاج مراجعة إضافية.","Further review is required."))+'</h2><p><b>'+t("حالة التحقق: ","Verification: ")+escapeHtml(h.verification||"unknown")+'</b></p><h3>'+t("الأعطال","Failures")+'</h3><p>'+escapeHtml((h.failures||[]).join(", ")||t("لا توجد أعطال مسجلة","No failures recorded"))+'</p><h3>'+t("التشخيص","Diagnosis")+'</h3><p>'+escapeHtml(d.diagnosis||h.diagnosis||"")+'</p><h3>'+t("الإجراءات","Actions")+'</h3><ul>'+((h.actions||[]).map(x=>"<li>"+escapeHtml(x)+"</li>").join("")||"<li>"+t("لم يُنفذ إجراء تلقائي","No automatic action was performed")+"</li>")+'</ul><button id="adminReloadAfterRepair" class="primary">'+t("إعادة تحميل بيانات الإدارة","Refresh admin data")+'</button></div>';document.querySelector("#adminReloadAfterRepair")?.addEventListener("click",load);}catch(e){o.innerHTML='<div class="notice notice-error">'+escapeHtml(String(e).includes("unauthorized")?t("رمز المدير غير صحيح.","Invalid manager token."):t("تعذر تشغيل مهندس BAYAN AI.","BAYAN AI Engineer could not run."))+"</div>";}};document.querySelector("#adminRepair").onclick=async()=>{showRepairPanel();const o=document.querySelector("#admin-repair-result");o.innerHTML='<div class="notice loading">'+t("جاري التشخيص…","Diagnosing…")+"</div>";try{const d=await adminApi("/api/admin/repair");o.innerHTML='<div class="admin-card"><h2>'+escapeHtml(d.ok?t("اجتاز النظام الفحص.","System checks passed."):t("لم يجتز النظام الفحص بعد.","System checks are not passing yet."))+'</h2><p><b>'+t("حالة التحقق: ","Verification: ")+escapeHtml(d.verification||"unknown")+'</b></p><h3>'+t("الأعطال","Failures")+'</h3><p>'+escapeHtml((d.failures||[]).join(", ")||t("لا توجد أعطال","No failures"))+'</p><h3>'+t("التشخيص","Diagnosis")+'</h3><p>'+escapeHtml(d.diagnosis||"")+'</p><h3>'+t("الإجراءات","Actions")+'</h3><ul>'+((d.actions||[]).map(x=>"<li>"+escapeHtml(x)+"</li>").join("")||"<li>"+t("لم يُنفذ إجراء تلقائي","No automatic action was performed")+"</li>")+'</ul><button id="adminReloadAfterRepair" class="primary">'+t("إعادة تحميل بيانات الإدارة","Refresh admin data")+'</button></div>';document.querySelector("#adminReloadAfterRepair")?.addEventListener("click",load);}catch(e){o.innerHTML='<div class="notice notice-error">'+escapeHtml(String(e).includes("unauthorized")?t("رمز المدير غير صحيح.","Invalid manager token."):t("تعذر الإصلاح أو التحقق.","Repair or verification failed."))+"</div>";}};load();
  }

  async function renderSaved() {
    app.innerHTML='<section class="page"><div class="page-head"><span class="eyebrow">'+t("مكتبتك","Your library")+'</span><h1>'+t("المحفوظات","Saved")+'</h1><p>'+t("كل ما حفظته للرجوع إليه لاحقًا، على هذا الجهاز وحساب الزيارة.","Everything saved for later on this device and this visit.")+'</p></div><div id="saved-content" class="article-grid"><div class="notice loading">'+t("جاري التحميل…","Loading…")+'</div></div></section>';
    const localItems=getSavedItems().filter(item=>!item._removed);
    let remoteItems=[];
    try { const data=await api("/api/saved"); for(const row of data.items||[]){try{const a=await api("/api/article?slug="+encodeURIComponent(row.slug)+"&lang="+lang);if(a)remoteItems.push(a)}catch{}} } catch {}
    const seen=new Set(localItems.map(x=>String(x.slug||x._key||x.title)));
    const items=[...localItems,...remoteItems.filter(x=>!seen.has(String(x.slug||x.title)))];
    const out=document.querySelector("#saved-content");
    out.innerHTML=items.length?items.map(articleCard).join(""):'<div class="notice">'+t("لا توجد عناصر محفوظة بعد. اضغط حفظ على أي نتيجة أو مقال.","Nothing saved yet. Tap Save on any result or article.")+"</div>";
    hydrateSectionImages(items);
  }


  const SAVED_KEY = "bayan-saved-items-v1";
  const LIKES_KEY = "bayan-likes-v1";
  function readList(key) { try { const value=JSON.parse(safeStorage.get(key,"[]")); return Array.isArray(value)?value:[]; } catch { return []; } }
  function itemKey(item) { return String(item?._key || item?.slug || item?.url || item?.title || "").trim().slice(0,500); }
  function getSavedItems() { return readList(SAVED_KEY); }
  function socialActions(item) {
    const key=itemKey(item), saved=getSavedItems().some(x=>itemKey(x)===key), likes=readList(LIKES_KEY), liked=likes.some(x=>x.key===key), count=Number((likes.find(x=>x.key===key)||{}).count||0);
    const payload={title:String(item.title||""),summary:String(item.summary||""),section:String(item.section||"world"),slug:String(item.slug||""),sources:Array.isArray(item.sources)?item.sources:[],url:String(item.url||""),href:String(item.href||""),imageUrl:String(item.imageUrl||""),_key:key,_lang:lang};
    const encoded=btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    return '<div class="social-actions" data-item="'+encoded+'"><button type="button" class="social-btn" data-social="save" aria-pressed="'+saved+'">'+(saved?"✓ ":"＋ ")+t("حفظ","Save")+'</button><button type="button" class="social-btn" data-social="share">↗ '+t("مشاركة","Share")+'</button><button type="button" class="social-btn" data-social="like" aria-pressed="'+liked+'">'+(liked?"♥":"♡")+' '+t("إعجاب","Like")+' <span class="like-count">'+count+'</span></button></div>';
  }
  document.addEventListener("click", async (event) => {
    const button=event.target instanceof Element?event.target.closest("[data-social]"):null;
    if(!button)return;
    const wrapper=button.closest(".social-actions");
    let item;
    try{item=JSON.parse(decodeURIComponent(escape(atob(wrapper.dataset.item||""))));}catch{return;}
    const key=itemKey(item),action=button.dataset.social;
    if(action==="save"){
      let items=getSavedItems(),exists=items.some(x=>itemKey(x)===key);
      if(exists)items=items.filter(x=>itemKey(x)!==key);else items.unshift(item);
      safeStorage.set(SAVED_KEY,JSON.stringify(items.slice(0,200)));
      if(item.slug){try{await api("/api/save",{method:exists?"DELETE":"POST",headers:{"content-type":"application/json"},body:JSON.stringify({slug:item.slug})});}catch{}}
      button.setAttribute("aria-pressed",String(!exists));button.innerHTML=(exists?"＋ ":"✓ ")+t("حفظ","Save");
      return;
    }
    if(action==="like"){
      let likes=readList(LIKES_KEY),liked=false,count=0;
      try {
        const result=await api("/api/like",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({key})});
        liked=!!result.liked;count=Number(result.count||0);
      } catch {
        const at=likes.findIndex(x=>x.key===key);liked=at<0;
        if(liked){count=1;likes.unshift({key,count,liked:true});}else{likes=likes.filter(x=>x.key!==key);count=0;}
      }
      likes=likes.filter(x=>x.key!==key);
      if(liked)likes.unshift({key,count,liked:true});
      safeStorage.set(LIKES_KEY,JSON.stringify(likes.slice(0,500)));
      button.setAttribute("aria-pressed",String(liked));button.innerHTML=(liked?"♥":"♡")+' '+t("إعجاب","Like")+' <span class="like-count">'+count+'</span>';
      return;
    }
    if(action==="share"){
      const shareUrl=item.href?new URL(item.href,location.origin).href:(item.slug?new URL("/article/"+encodeURIComponent(item.slug)+"?lang="+lang,location.origin).href:new URL("/search?q="+encodeURIComponent(item.title||params.get("q")||"")+"&lang="+lang,location.origin).href);
      const shareData={title:item.title||"BAYAN | بيان",text:item.summary||item.title||"",url:shareUrl};
      try{if(navigator.share)await navigator.share(shareData);else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(shareUrl);button.textContent=t("تم نسخ الرابط","Link copied");}else{window.prompt(t("انسخ رابط المشاركة","Copy share link"),shareUrl);}}catch{}
    }
  });
  async function browserSearchFallback(query) {
    const jobs=[];
    const wikiHost=ar?"ar.wikipedia.org":"en.wikipedia.org";
    jobs.push((async()=>{const url="https://"+wikiHost+"/w/api.php?action=query&generator=search&gsrsearch="+encodeURIComponent(query)+"&gsrlimit=8&prop=extracts|pageimages&exintro=1&explaintext=1&piprop=thumbnail&pithumbsize=900&format=json&origin=*";const r=await fetch(url,{signal:AbortSignal.timeout(6500),headers:{accept:"application/json"}});if(!r.ok)throw new Error("wiki");const d=await r.json();return Object.values(d.query?.pages||{}).map(x=>({title:String(x.title||""),summary:String(x.extract||"").slice(0,1400),section:"world",kind:"web",evidence:"mixed",sources:[{publisher:t("ويكيبيديا","Wikipedia"),title:String(x.title||""),url:"https://"+wikiHost+"/wiki/"+encodeURIComponent(String(x.title||"").replace(/ /g,"_"))}],url:"https://"+wikiHost+"/wiki/"+encodeURIComponent(String(x.title||"").replace(/ /g,"_"))}));})());
    jobs.push((async()=>{const url="https://www.wikidata.org/w/api.php?action=wbsearchentities&search="+encodeURIComponent(query)+"&language="+lang+"&limit=6&format=json&origin=*";const r=await fetch(url,{signal:AbortSignal.timeout(6000),headers:{accept:"application/json"}});if(!r.ok)throw new Error("wikidata");const d=await r.json();return(d.search||[]).map(x=>({title:String(x.label||""),summary:String(x.description||""),section:"people",kind:"web",evidence:"mixed",sources:[{publisher:t("ويكي بيانات","Wikidata"),title:String(x.label||""),url:"https://www.wikidata.org/wiki/"+x.id}],url:"https://www.wikidata.org/wiki/"+x.id}));})());
    const settled=await Promise.allSettled(jobs),items=settled.flatMap(x=>x.status==="fulfilled"?x.value:[]);
    const seen=new Set();return items.filter(x=>x.title&&(ar?/\u0600-\u06ff/.test(x.title):!/\u0600-\u06ff/.test(x.title))).filter(x=>!/(?:porn(?:ography)?|xxx\b|hentai|onlyfans|sex\s*video|explicit\s+sex|nude\s+leak|leaked\s+nudes|child\s+sexual\s+abuse|child\s+porn|csam|sexual\s+exploitation|اباحي|إباحي|اباحية|إباحية|بورنو|بورن|هنتاي|صور\s+عارية|فيديوهات?\s+جنسية|مقاطع?\s+جنسية|تسريب\s+صور\s+حميمية|استغلال\s+جنسي\s+للأطفال)/i.test(String(x.title||"")+" "+String(x.summary||""))).filter(x=>{const k=x.title.toLowerCase();if(seen.has(k))return false;seen.add(k);return true;}).slice(0,12);
  }

  async function renderTools() {
    app.innerHTML='<section class="page"><div class="page-head"><span class="eyebrow">'+t("أدوات بيان","BAYAN tools")+'</span><h1>'+t("الأدوات","Tools")+'</h1><p>'+t("أدوات مباشرة للبحث والبيانات والتحقق.","Direct tools for search, live data and verification.")+'</p></div><div class="section-grid">'+[
      ["/search?lang="+lang,t("البحث","Search"),t("ابحث في المعرفة والمصادر.","Search knowledge and sources.")],
      ["/ask?lang="+lang,t("اسأل بيان","Ask BAYAN"),t("اسأل سؤالًا واجمع الأدلة.","Ask a question and gather evidence.")],
      ["/prices?lang="+lang,t("البيانات الحية","Live Data"),t("الطقس والعملات والذهب.","Weather, FX and gold.")],
      ["/prayer?lang="+lang,t("مواقيت الصلاة","Prayer Times"),t("مواقيت حسب المدينة والتقويم الهجري والمناسبات الإسلامية.","City-based prayer times, Hijri calendar and Islamic occasions.")],
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
    if (path === "weather") return renderWeather();
    if (path === "prayer") return renderPrayer();
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