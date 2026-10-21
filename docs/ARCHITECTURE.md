# BAYAN Architecture Map

Inspection date: 2026-10-20. Source-derived map; this document does not certify production health.

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
- `src/services/ai.ts`: AI answer/drafting integration; `NEWS_AI_MODEL` may override the default Workers AI model, with the existing Llama model as fallback.
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

## Integrations inventory
See `docs/INTEGRATIONS.md` for source-level configuration, observed production status, and explicit unverified items. RSS parser diagnostics and bounded Google News/Bing URL resolution were merged 2026-10-20; the production news publication acceptance check still fails.

## Required operational invariants
1. Preserve production data and URL behavior.
2. Back up D1 and test restore before production schema mutation.
3. One fix per commit, with regression tests; never weaken tests.
4. Deploy only after CI passes, then verify live behavior.
5. Never expose secret values; report names/status only.
6. Log bounded, redacted failure reasons rather than swallowing exceptions.
7. Build/preview success is not production verification.


## Production evidence snapshot — 2026-10-20

- Main contains the RSS diagnostics, aggregator URL resolution, and five-distinct-host publication gate. The latest deployment verified at this snapshot is SHA `3493f97edd9f35c319989b0bade47d9ba30e2cc5`; main subsequently advanced to `333d83ec18c89f3ad43f48d28fb1777cb3ce8296` while its deployment was in progress.
- The scheduled production monitor failed `news_publication_gap`: zero news sitemap URLs, zero news-linked articles, and 200 archive candidates ready for drafting.
- The previous `news_archive_read_unavailable` 503 was not reproduced by the latest health probe; its cause remains unknown. The health route now logs a sanitized exception on future failures without changing the 503 response.
- Current article quality counts and the read-only report command are recorded in `docs/PHASE_REPORTS.md` and `scripts/article-quality-report.sql`.


## Runtime reliability updates — 2026-10-21

- Every Worker request wraps the D1 binding so rejected `first/all/raw/run/batch/exec` operations can set the quota block even if downstream code catches the rejection.
- Once the isolate is blocked, subsequent D1 calls are rejected before reaching the binding. The block is persisted via Cache API, not D1, and quota logging is rate-limited.
- On cold isolates, the persisted block is loaded before route handling. API routes return explicit degraded responses; health remains explicit; a sitemap cache is served if available, otherwise quota-specific empty XML is marked with `X-BAYAN-Degraded: d1_quota`.
- Publication evidence recovery calls GDELT only in the publication flow and only while the current five-publisher evidence gate remains unmet. Metadata alone is not accepted as proof; source-page text must be fetched under robots and size/date limits.
- Article API image behavior is presentation-only: valid remote images are retained; otherwise the existing section illustration is returned with `imageFallback=true`. This does not change D1 records.
