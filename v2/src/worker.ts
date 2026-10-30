// BAYAN v2 request handler: pure routing over injected dependencies, so every route is unit-testable without
// Cloudflare bindings. Failures degrade (a section with no items, an empty sitemap) instead of returning errors.
import { searchAll, type Provider } from "./search";
import { SECTIONS, sectionBySlug, type Lang } from "./sections";
import type { Store } from "./store";
import { generate, geminiGenerate, listGeminiFlashModels, workersAiGenerate, type AiEnv } from "./ai";
import { analyze, type Signals } from "./engineer";
import { classifyStory } from "./classify";
import { topicsFor } from "./topics";
import type { WikiApi } from "./wiki";
import { articleBody, homeBody, layout, newsBody, notFoundBody, plain, searchBody, SITE, sectionBody, wikiEntryBody, esc, type ClassifiedStory, type LiveStory } from "./ui";

export interface Env extends AiEnv { DB: D1Database; ADS_TXT?: string; SITE_ORIGIN?: string; BAYAN_AI_MANAGER_TOKEN?: string }
export interface Deps { providers: (lang: Lang) => Provider[]; store: (env: Env) => Store; liveNews?: (env: Env, lang: Lang) => Promise<LiveStory[]>; wiki?: WikiApi }

const xml = (s: string) => s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c]!));
const text = (body: string, status = 200, cache = "public, max-age=3600") => new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": cache, "x-content-type-options": "nosniff" } });
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const html = (body: string, status = 200, cache = "public, max-age=60, s-maxage=300") => new Response(body, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": status === 200 ? cache : "no-store", "x-content-type-options": "nosniff" } });

// ads.txt is served only from the owner-provided ADS_TXT variable; nothing is invented and junk lines are dropped.
const ADS_LINE = /^(?:#.*|(?:contact|subdomain|ownerdomain|managerdomain|inventorypartnerdomain)\s*=\s*[\w.\-/:@]+|[a-z0-9.\-]+\s*,\s*[\w\-]+\s*,\s*(?:DIRECT|RESELLER)(?:\s*,\s*[\w\-]+)?)\s*(?:#.*)?$/i;
export function adsTxt(env: Pick<Env, "ADS_TXT">): Response {
  const lines = String(env.ADS_TXT || "").replace(/\\n/g, "\n").slice(0, 8000).split(/\r?\n/).map((l) => l.trim()).filter((l) => l && ADS_LINE.test(l));
  return lines.some((l) => !l.startsWith("#")) ? text(lines.join("\n") + "\n") : text("Not found", 404, "no-store");
}

// Constant-time comparison so the manager token cannot be probed by timing.
function sameSecret(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}
/** Admin endpoints fail closed: no configured token means 503, a wrong or missing bearer token means 401. */
function adminGate(request: Request, env: Env): Response | null {
  if (!env.BAYAN_AI_MANAGER_TOKEN) return json({ error: "admin_not_configured" }, 503);
  const given = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  return given && sameSecret(given, env.BAYAN_AI_MANAGER_TOKEN) ? null : json({ error: "unauthorized" }, 401);
}

export function createHandler(deps: Deps) {
  return async (request: Request, env: Env): Promise<Response> => {
    const url = new URL(request.url);
    const origin = (env.SITE_ORIGIN || url.origin).replace(/\/$/, "");
    const lang: Lang = url.searchParams.get("lang") === "en" ? "en" : "ar";
    const path = url.pathname.replace(/(.)\/+$/, "$1");
    const store = deps.store(env);
    // Live headlines first, then the archive the pipeline collected; de-duplicated by title and filed into sections.
    // Either source failing only shrinks the list; the classifier never guesses beyond the title and summary.
    const loadNews = async (): Promise<ClassifiedStory[]> => {
      let live: LiveStory[] = []; let archived: LiveStory[] = [];
      try { live = deps.liveNews ? await deps.liveNews(env, lang) : []; } catch (error) { live = []; }
      try { archived = store.newsArchive ? await store.newsArchive(lang, 24) : []; } catch (error) { archived = []; }
      const seen = new Set<string>(); const out: ClassifiedStory[] = [];
      for (const st of [...live, ...archived]) { const key = plain(st.title).toLowerCase(); if (key && !seen.has(key)) { seen.add(key); out.push({ ...st, section: classifyStory(plain(st.title), plain(st.summary)) }); } }
      return out;
    };
    const page = (o: { title: string; description: string; body: string; path: string; active?: string; image?: string; jsonLd?: unknown; noindex?: boolean }, status = 200) =>
      html(layout({ lang, origin, ...o }), status);

    if (path === "/health") return json({ ok: true, service: "bayan-v2" });
    if (path === "/robots.txt") return text(`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin\nSitemap: ${origin}/sitemap.xml\n`);
    if (path === "/ads.txt") return adsTxt(env);

    if (path === "/api/admin/ai-test") {
      const denied = adminGate(request, env); if (denied) return denied;
      const [gemini, workersAi, flash] = await Promise.all([geminiGenerate(env, "Reply with the single word: ok"), workersAiGenerate(env, "Reply with the single word: ok"), listGeminiFlashModels(env)]);
      return json({ gemini: { configured: !!env.GEMINI_API_KEY, model: gemini.model, result: gemini, availableFlashModels: flash }, workersAi: { configured: !!env.AI, result: workersAi } });
    }

    if (path === "/api/admin/diagnose") {
      const denied = adminGate(request, env); if (denied) return denied;
      const d1: Signals["d1"] = { ok: false };
      try {
        const rows = await env.DB.prepare("SELECT status, COUNT(*) AS n, SUM(CASE WHEN image_url IS NULL OR image_url NOT LIKE 'https://%' THEN 1 ELSE 0 END) AS noimg FROM articles GROUP BY status").all<any>();
        const by = Object.fromEntries((rows.results || []).map((r) => [String(r.status), r]));
        Object.assign(d1, { ok: true, published: Number(by.PUBLISHED?.n || 0), archive: Number(by.ARCHIVE?.n || 0), publishedWithoutImage: Number(by.PUBLISHED?.noimg || 0) });
      } catch (error) { d1.error = String(error instanceof Error ? error.message : error).slice(0, 120); }
      const [gemini, workersAi, flash, probe] = await Promise.all([geminiGenerate(env, "Reply with the single word: ok"), workersAiGenerate(env, "Reply with the single word: ok"), listGeminiFlashModels(env), searchAll("Egypt", deps.providers("en"), { retries: 0 })]);
      const signals: Signals = { d1, gemini, workersAi, availableFlashModels: flash, search: { ok: probe.providers.some((p) => p.ok), hits: probe.hits.length } };
      const findings = analyze(signals);
      let narrative: string | null = null;
      if (url.searchParams.get("narrate") === "1" && findings.length) {
        const { result } = await generate(env, "You are BAYAN's site engineer. In 5 short bullet points, explain these findings to the owner in Arabic and say what to do first. Do not invent facts.\n" + JSON.stringify(findings));
        narrative = result.ok ? result.text || null : null;
      }
      return json({ ok: findings.length === 0, findings, signals, narrative });
    }

    if (path === "/sitemap.xml") {
      let articles: { slug: string; lang: Lang }[] = []; let degraded = false;
      try { articles = await store.sitemap(); } catch (error) { degraded = true; }
      const urls = [`/`, ...SECTIONS.map((s) => `/${s.slug}`)].flatMap((p) => (["ar", "en"] as Lang[]).map((l) => `${origin}${p}?lang=${l}`))
        .concat(articles.map((a) => `${origin}/article/${encodeURIComponent(a.slug)}?lang=${a.lang}`));
      const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${xml(u)}</loc></url>`).join("")}</urlset>`;
      return new Response(body, { status: 200, headers: { "content-type": "application/xml; charset=utf-8", "cache-control": degraded ? "no-store" : "public, max-age=600", ...(degraded ? { "x-bayan-degraded": "storage" } : {}) } });
    }

    if (path === "/api/search") {
      const q = (url.searchParams.get("q") || "").trim();
      if (!q || q.length > 200) return json({ error: "invalid_query" }, 400);
      const outcome = await searchAll(q, deps.providers(lang));
      return json({ ...outcome, message: outcome.hits.length ? undefined : "No sources returned results; nothing is shown rather than guessing." });
    }

    if (path === "/") {
      const [stories, articles, mostRead] = await Promise.all([loadNews(), store.latest(lang, 6).catch(() => []), deps.wiki ? deps.wiki.mostRead(lang).catch(() => []) : Promise.resolve([])]);
      return page({ title: SITE.name + (lang === "ar" ? " — المعلومة أولًا" : " — Information first"), description: lang === "ar" ? "أخبار ومقالات وسير موثقة، وبحث في الإنترنت كله بمصادر حقيقية." : "Verified news, articles and biographies, and search across the web with real sources.", body: homeBody(lang, { stories: stories.slice(0, 24), articles, mostRead }), path: "/" });
    }

    if (path === "/search") {
      const q = (url.searchParams.get("q") || "").trim().slice(0, 200);
      if (!q) return page({ title: (lang === "ar" ? "البحث | " : "Search | ") + SITE.name, description: "BAYAN search", body: searchBody(lang, "", null), path: "/search", noindex: true });
      const outcome = await searchAll(q, deps.providers(lang));
      return html(layout({ lang, origin, path: `/search?q=${encodeURIComponent(q)}`, title: `${q} | ${SITE.name}`, description: outcome.hits[0]?.summary || q, body: searchBody(lang, q, outcome), noindex: true }), 200, "no-store");
    }

    const art = path.match(/^\/article\/([^/]+)$/);
    if (art) {
      let a = null; try { a = await store.get(decodeURIComponent(art[1]), lang); } catch (error) { a = null; }
      if (!a) return page({ title: SITE.name, description: "", body: notFoundBody(lang), path, noindex: true }, 404);
      const ld = { "@context": "https://schema.org", "@type": "Article", headline: a.title, image: [a.imageUrl], dateModified: a.updatedAt, inLanguage: lang, publisher: { "@type": "Organization", name: "BAYAN" } };
      return page({ title: `${a.title} | ${SITE.name}`, description: plain(a.summary), body: articleBody(lang, a), path, active: a.section, image: a.complete ? a.imageUrl : undefined, jsonLd: a.complete ? ld : undefined, noindex: !a.complete });
    }

    const wk = path.match(/^\/wiki\/([^/]+)$/);
    if (wk) {
      let entry = null; try { entry = deps.wiki ? await deps.wiki.entry(lang, decodeURIComponent(wk[1])) : null; } catch (error) { entry = null; }
      if (!entry) return page({ title: SITE.name, description: "", body: notFoundBody(lang), path, noindex: true }, 404);
      const from = sectionBySlug(url.searchParams.get("s") || "")?.slug;
      // Live mirror of Wikipedia text: kept out of the index (duplicate content) but followed; the sitemap does not list it.
      return page({ title: `${entry.title} | ${lang === "ar" ? "موسوعة بيان" : "BAYAN encyclopedia"}`, description: plain(entry.summary), body: wikiEntryBody(lang, entry, from), path: `/wiki/${wk[1]}`, active: from, image: entry.imageUrl, noindex: true });
    }

    if (path === "/news") {
      const stories = await loadNews();
      const s = sectionBySlug("news")!;
      return page({ title: `${lang === "ar" ? s.ar : s.en} | ${SITE.name}`, description: lang === "ar" ? s.descAr : s.descEn, body: newsBody(lang, stories.slice(0, 36)), path, active: "news" });
    }

    const section = sectionBySlug(path.slice(1));
    if (section) {
      // Encyclopedia cards: seed topics for this section, Arabic titles resolved through interlanguage links. Failure just hides the group.
      const wikiCards = async () => { const seeds = topicsFor(section.slug).slice(0, 12); if (!seeds.length || !deps.wiki) return []; try { return await deps.wiki.cards(lang, lang === "ar" ? await deps.wiki.arabicTitles(seeds) : seeds); } catch (error) { return []; } };
      const [stories, items, wiki] = await Promise.all([loadNews(), store.bySection(section.slug, lang, 12).catch(() => []), wikiCards()]);
      const inSection = stories.filter((st) => st.section === section.slug).slice(0, 12);
      return page({ title: `${lang === "ar" ? section.ar : section.en} | ${SITE.name}`, description: lang === "ar" ? section.descAr : section.descEn, body: sectionBody(lang, section, { stories: inSection, articles: items.filter((a) => !a.archived), archive: items.filter((a) => a.archived), wiki }), path, active: section.slug });
    }

    return page({ title: SITE.name, description: "", body: notFoundBody(lang), path, noindex: true }, 404);
  };
}
export { esc };
