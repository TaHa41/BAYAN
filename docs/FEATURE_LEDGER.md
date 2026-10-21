# BAYAN Feature Ledger

Status: baseline ledger created 2026-10-16 and updated with production evidence on 2026-10-20. A ledger entry means the feature is required or found in source; it does **not** certify production health.

## Required features — preserve and verify

- [ ] Evidence-first universal search ("اسأل بيان"), not tied to any single example query.
- [ ] Distinguish external search results, internal articles, news, AI summaries, inferences, and unconfirmed claims.
- [ ] Source verification, identity/entity disambiguation, recency checks, and honest insufficient-evidence behavior.
- [ ] Enrich knowledge content when a visitor actually opens/reads a result; do not create an article merely because a query was typed.
- [ ] Verified news with real source, publication date, and relevant/valid image; no fabricated content or duplicate publication.
- [ ] Independent Arabic and English experiences via `?lang=ar` and `?lang=en`, correct RTL/LTR, locale-specific sources and metadata.
- [ ] Actual source-defined sections: science, technology, economy, politics, health, history, people, sports, travel, art, news, trends, prices, egypt (displayed as حياة ومجتمعات), arab (displayed as أفكار ونقاشات), world (displayed as تحولات كبرى). Verify all route mappings before changing slugs.
- [ ] Live tools: prices/markets separate from weather; Open-Meteo weather; AlAdhan prayer times; contributions; saved content; tools; administration.
- [ ] Light/dark/auto themes, working closeable side menu, subtle moving background, mobile-first responsive design.
- [ ] Admin sections: Settings, Content, Analytics, Search log, Contributions, Monitoring, Repair; bounded, reversible self-healing with evidence-backed state transitions.
- [ ] Telegram notifications; audit actual usage before removing any other notification integration.
- [ ] GA4 ID `G-Y16MK39Q6X` to be verified in source/configuration; exclude admin/test traffic and sanitize search logs.
- [ ] Wikimedia and Wikimedia Enterprise integration to be traced through runtime code and bindings; configured secrets are never printed.
- [ ] robots.txt, sitemap.xml, news-sitemap.xml, canonical, hreflang, and valid JSON-LD.
- [ ] Existing article data, route compatibility, D1 production data, and working features must be preserved.

## Explicit exclusions / deletion ledger

- Do not present the legacy labels “مصر”, “العالم العربي”, and “العالم” as prominent main categories. Existing slugs/data and old links must not be deleted or redirected without impact analysis.
- Resend: reduce/remove only after source and runtime dependency inventory; prefer Telegram. Do not remove blindly.
- Do not restore long unstructured panels, demo content, or raw internal error messages in public UI.
- No other feature may be treated as deleted without owner approval.

## Production and safety invariants

- No invented news, articles, sources, images, dates, or live values.
- No secrets/tokens in source, commits, reports, or logs; secrets belong in Cloudflare secret storage.
- Never modify applied migrations. Current brief states production has applied through `0015`; verify this against the actual D1 migration table before planning a new migration.
- Back up production D1 and prove restore to an isolated test database before any production schema/data mutation.
- Every fix must be isolated, tested without weakening tests, committed, deployed, then verified against production. Build/preview/“Resolved”/sitemap submission alone is not proof.
- Failures must be logged with bounded, redacted diagnostics and explicit reason codes; do not swallow exceptions.
- Mark any unverified claim “غير مؤكد — يحتاج فحصًا فعليًا”.

## Baseline source observations (not production certification)

- `src/sections.ts` defines 16 section slugs and localized labels; legacy slugs `egypt`, `arab`, and `world` are currently mapped to the newer display names.
- `src/types.ts` declares D1/AI/assets bindings and optional OpenAI, GNews, Telegram, gold, Wikimedia Enterprise, and `NEWS_AI_MODEL` environment fields.
- `src/services/news.ts` has an image URL guard rejecting Googleusercontent/Google News/gstatic image hosts.
- `src/services/news-article-publisher.ts` currently performs a bounded single-article attempt per cron tick and catches an admin setting read failure with `.catch(()=>null)`; investigate and replace silent failure with reasoned logging in the relevant phase.
- `src/seo.ts` emits robots and sitemap responses and logs sitemap query errors; inspect live HTTP and rendered HTML before drawing SEO conclusions.
- The feature ledger and phase reports were added in Phase 0; keep them current with every production release.


## Production snapshot — 2026-10-20

This is an observed snapshot, not a claim that the acceptance criteria are met.

- Latest production commit whose deployment identity and post-deploy script completed: `3493f97edd9f35c319989b0bade47d9ba30e2cc5`. Main has since advanced to `333d83ec18c89f3ad43f48d28fb1777cb3ce8296`; the newest main deployment was still in progress at the time of this snapshot.
- `NEWS_AI_DAILY_LIMIT=150` is in `wrangler.jsonc` and was merged through PR #410. The configured independent-publisher minimum remains five; no threshold reduction was made.
- PR #432 added bounded RSS parser/provider diagnostics; PR #434 resolves bounded Google News/Bing redirect URLs before evidence-host counting; PR #433 requires both the configured publisher count and distinct HTTPS host count. These changes are merged into main.
- The production monitor for SHA `3493f97` failed with `news_publication_gap`: the news sitemap had zero articles while 200 archive rows were ready for drafting. The latest read-only D1 snapshot is `news_archive total=1530, linked=0, exhausted=126, pending=1404, attempted_24h=64`.
- `articles`: 162 total, 95 with no image, 126 with body length below 2,500 characters, zero at or above 5,000 characters, and five duplicate title/language groups.
- The earlier `news_archive_read_unavailable` 503 did not reproduce in the latest health check; its original root cause is still unconfirmed. The direct D1 probe returned HTTP 200, `rows_read=1`, `sql_duration_ms=0.1592`. PR #436 adds sanitized Worker-log diagnostics if that failure recurs; the public health route still returns 503 on failure.
- PR #431 was closed as superseded, not merged: its migration targets four rows whose production `image_url` values were already non-empty. External HTTP 200/content-type checks for those images remain unverified.
- Search Console indexing, live canonical/hreflang/JSON-LD, all 14 section routes in both locales, mobile navigation, live weather/FX/prayer success, Telegram delivery, and GA4 event delivery are not certified by this snapshot.
- Reproducible read-only inventory queries: `scripts/article-quality-report.sql`.


## 2026-10-21 execution delta

- **Implemented in main:** D1 quota interception across prepared statements and batch operations; persisted block restored before request routes; quota-specific degraded sitemap responses; topic-specific GDELT publisher-page evidence recovery behind the existing five-independent-publisher gate; designed section illustrations when an article has no verified image; explicit `OPENAI_ENABLED=true` opt-in for paid OpenAI.
- **Production verified:** deploy SHA `4c49bc39869794eb514b7ff65eded254de4f8437` matches Cloudflare's deployed binding; production smoke is strict and currently reports the real news-publication gap.
- **Not proven:** any linked archive article, a verified real-image backfill for existing rows, PNG share preview, and D1 daily read usage before/after measurement.


## Manual news pipeline trigger — 2026-10-21 (pending verification)

- [x] Source-level implementation: manager-authenticated `POST /api/internal/trigger-news-pipeline` invokes the existing bounded publisher, checks the feature flag and applies a cooldown.
- [x] Source contract guard checks POST-only, manager authorization, feature flag, cooldown, existing publisher call, runtime event, and evidence-diversity code.
- [ ] CI checks and deployment are not yet confirmed for this change.
- [ ] Production trigger invocation and first published article are not verified. Latest read-only snapshot: 1,697 archive rows, zero linked articles, zero published news articles.
- Evidence thresholds remain unchanged; no direct D1 article insertion or fabricated article is allowed.
