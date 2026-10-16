# BAYAN Feature Ledger

Status: baseline ledger created from the requested project brief and a read-only inspection of `main` on 2026-10-16. A ledger entry means the feature is required or found in source; it does **not** certify production health.

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
- `src/types.ts` declares D1/AI/assets bindings and optional OpenAI, GNews, Telegram, gold, and Wikimedia Enterprise environment fields.
- `src/services/news.ts` has an image URL guard rejecting Googleusercontent/Google News/gstatic image hosts.
- `src/services/news-article-publisher.ts` currently performs a bounded single-article attempt per cron tick and catches an admin setting read failure with `.catch(()=>null)`; investigate and replace silent failure with reasoned logging in the relevant phase.
- `src/seo.ts` emits robots and sitemap responses and logs sitemap query errors; inspect live HTTP and rendered HTML before drawing SEO conclusions.
- `docs/FEATURE_LEDGER.md` and `docs/PHASE_REPORTS.md` were absent on the inspected `main` branch.
