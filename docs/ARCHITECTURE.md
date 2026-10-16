# BAYAN Architecture Map

Inspection date: 2026-10-16. Source-derived map; this document does not certify production health.

## Runtime
- Cloudflare Worker configured in `wrangler.jsonc`; entry point `src/index.ts`; static assets in `public/` through `ASSETS`.
- Worker name `bayan`; cron `*/5 * * * *`; D1 binding `DB` points to `bayan-knowledge`; AI bindings `AI` and `AI_SEARCH`.
- Configured origin in `src/config.ts`: `https://bayan.tahaomar411.workers.dev`.
- `package.json` defines typecheck, Vitest, smoke/contract scripts and Wrangler dry-run build. Actual CI/deploy status must be checked independently.

## Source map
- `src/index.ts`: request entry, HTML shell, static assets, request routing, scheduled work.
- `src/routes/api.ts`: public API composition: search/recovery, live data, news, AI, contributions, articles, saved content, analytics, editorial enrichment and repair/admin operations. Exact paths and authorization checks still require a full route inventory.
- `src/services/search.ts`, `search-recovery.ts`: search providers, ranking and fallback.
- `src/services/news.ts`, `news-article-publisher.ts`: RSS/news aggregation, image validation, archived-news article publishing.
- `src/services/ai.ts`: AI answer/drafting integration.
- `src/services/live.ts`: weather, FX/gold and prayer times.
- `src/services/repair.ts`: self-healing and repair workflow.
- `src/services/telegram.ts`: Telegram notifications.
- `src/services/editorial.ts`: topic classification and editorial prompts.
- `src/image-url.ts`: public image URL checks.
- `src/security.ts`: manager auth, visitor identity, cleaning and analytics exclusion.
- `src/db.ts`: D1 queries and tracking.
- `src/schema.ts`: runtime schema creation; must be reconciled with versioned migrations and production D1.
- `src/seo.ts`: robots.txt and sitemap generation.
- `src/sections.ts`: 16 localized section definitions, including legacy slugs `egypt`, `arab`, `world` mapped to newer display names.
- `src/config.ts`, `src/types.ts`, `src/http.ts`, `src/wisdom.ts`: configuration, shared types, HTTP helpers, rotating wisdom.
- `public/`: browser UI and static assets. Verify asset references and cache versions against actual files.
- `migrations_v1/`: configured D1 migrations; inventory exact files and applied migration history before schema changes. Brief reports `0015` applied; independently verify this.
- `tests/`, `scripts/`, `.github/workflows/`: tests, smoke/health/self-healing scripts, CI and deployment workflows; inspect workflow wiring and production targets.

## Known tables in runtime schema source
`src/schema.ts` contains `CREATE TABLE IF NOT EXISTS` statements for at least `articles`, `contributions`, `searches`, `saved_articles`, `article_likes`, `analytics`, `runtime_events`, `repair_jobs`, and `repair_attempts`. This is not a complete schema inventory; `news_archive`, admin settings and other tables must be reconciled with migrations and actual D1.

## Integrations to inventory
Cloudflare Workers/D1/Workers AI/AI Search; OpenAI; GNews; RSS feeds; Wikimedia/Wikimedia Enterprise; Open-Meteo; FX and gold providers; AlAdhan; Telegram; Resend; GA4 `G-Y16MK39Q6X`; Search Console; search providers/GDELT if present; sitemap/indexing endpoints.

## Required operational invariants
1. Preserve production data and URL behavior.
2. Back up D1 and test restore before production schema mutation.
3. One fix per commit, with regression tests; never weaken tests.
4. Deploy only after CI passes, then verify live behavior.
5. Never expose secret values; report names/status only.
6. Log bounded, redacted failure reasons rather than swallowing exceptions.
7. Build/preview success is not production verification.
