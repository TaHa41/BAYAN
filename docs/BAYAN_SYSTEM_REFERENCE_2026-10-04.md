# BAYAN — Full System Reference & Audit
Date: 2026-10-04
Repository: TaHa41/BAYAN
Production Worker: https://bayan.tahaomar411.workers.dev
Default branch: main
Current release marker: 0.9.0

## 1. Verified audit scope

The GitHub-connected workspace exposes the repository with admin/write access. The repository tree has now been independently enumerated through the GitHub contents API and the current tracked project surface is known. The Worker source is 3,221 lines / ~188.4k characters; the frontend app is 348 lines / ~86.7k characters. All currently enumerated files in the repository are listed below and the text-bearing files were inspected for behavior or configuration.

Exact current inventory: root files `.env.example`, `.gitignore`, `AGENTS.md`, `DEPLOY_TRIGGER.md`, `README.md`, `package.json`, `schema.sql`, `tsconfig.json`, `wrangler.jsonc`; `.github/workflows/{ci.yml,deploy.yml,guardian.yml}`; `docs/{AI_REPAIR_PLAYBOOK.md,BAYAN_SYSTEM_REFERENCE_2026-10-04.md}`; `migrations/0001_knowledge_articles.sql` through `0010_contribution_reviewer_note.sql`; `src/index.ts`, `src/app/content.ts`; `public/{ad-manager.js,app.js,content-data.js,google159baf09db9cb3cf.html,index.html,logo.svg,manifest.en.json,manifest.json,styles.css,sw.js}`; `scripts/{ai-capability-smoke.mjs,ai-guardian.mjs,production-smoke.mjs,static-guards.mjs}`; `tests/unit/{health.test.ts,project-guards.test.ts}`. No additional directory entries are currently exposed by the repository tree.

This is a verified inventory of the current GitHub `main` tree, not a claim that generated build artifacts or ignored local files exist.

## 2. Runtime architecture

- Cloudflare Worker Module Worker: src/index.ts
- Static assets: public/
- D1: binding DB, database bayan-knowledge
- Workers AI: binding AI, remote
- Cloudflare AI Search: binding AI_SEARCH
- Browser Rendering: binding BROWSER, remote
- Scheduled Worker cron: every 5 minutes
- Production observability: Cloudflare observability/issues/traces
- SPA frontend: public/index.html + app.js + styles.css
- PWA: service worker + Arabic/English manifests
- CI: .github/workflows/ci.yml
- Production deployment: .github/workflows/deploy.yml
- Guardian: .github/workflows/guardian.yml
- Operational smoke tests: scripts/production-smoke.mjs
- AI capability benchmark: scripts/ai-capability-smoke.mjs
- AI diagnostic Guardian: scripts/ai-guardian.mjs
- Static release guards: scripts/static-guards.mjs
- Repair policy: docs/AI_REPAIR_PLAYBOOK.md
- Canonical D1 schema: schema.sql

## 3. Dependency/toolchain reference

package.json currently declares:
- TypeScript ^7.0.2
- Wrangler ^4.146.0
- Vitest ^5.0.3
- @cloudflare/workers-types ^5.20261003.1
- @types/node ^26.4.0

Assessment on 2026-10-04:
- TypeScript 7.0.2: current stable.
- Vitest 5.0.3: current stable.
- Wrangler 4.147.0: current stable verified and now pinned in package/CI/deploy.
- @cloudflare/workers-types 5.20261003.1: current stable verified.
- Node 24 in CI: Active/Maintenance LTS line and appropriate production choice; Node 26 is Current, so it should not replace Node 24 merely to chase a newer major.
- package-lock.json is absent from the verified repository tree. CI currently uses `npm install` rather than `npm ci`; this remains the main reproducibility/performance gap. A lockfile should be generated from a real dependency installation and committed only after CI validates it; it should not be fabricated from incomplete metadata.

No blind dependency major upgrade was performed because the verified dependency set is already current enough and forced upgrades can introduce breaking changes without a lockfile-backed test run.

## 4. Backend capabilities and services

### AI
- OpenAI Responses API with configured model plus fallback models.
- Cloudflare Workers AI with model cooldowns and fallback models.
- AI Gateway configuration.
- Evidence-first synthesis prompts.
- Language-aware Arabic/English output rules.
- Explicit insufficient-evidence handling.

### Search/retrieval
- Cloudflare Web Search provider chain: ceramic -> exa -> linkup, subject to configured provider.
- Cloudflare AI Search.
- Google News RSS.
- GNews when configured.
- Wikimedia Enterprise when configured.
- Wikidata.
- Wikipedia search fallback.
- Internal knowledge/D1 retrieval.
- Multi-query parallel retrieval and reranking.
- Provider/source diversity measurements.

### News
- GNews API when configured.
- Google News RSS.
- Al Jazeera RSS.
- BBC Arabic/English RSS.
- Source-page image extraction through og:image/twitter:image.
- Evidence-backed BAYAN article generation rather than copying source articles.

### Live data
- Open-Meteo weather/geocoding.
- Frankfurter FX.
- GoldAPI when configured.
- XAUS gold fallback.
- OpenStreetMap/Nominatim place search.
- Openverse image search with license gate.
- Google Maps configuration endpoint when configured.

### Owner/operations
- D1 runtime audit history.
- D1 repair queue.
- Telegram explicit destination notifications.
- Protected manager/diagnostic APIs using BAYAN_AI_MANAGER_TOKEN.
- Cloudflare Browser representative route checks.
- Scheduled runtime maintenance.
- AI diagnosis of incidents.
- Provider cooldowns and retry/fallback actions.

## 5. Public/API route inventory verified from src/index.ts

Health:
- /api/health
- /health

AI/search:
- /api/ai/cloudflare
- /api/search/web
- /api/knowledge/search
- /api/search
- /api/search/compare
- /api/search/article
- /api/ai
- /api/trending/article

Knowledge/content:
- /api/knowledge/searches
- /api/knowledge/graph
- /api/knowledge/maintenance
- /api/knowledge
- /api/article/history
- /api/contributions
- /api/requests
- /api/saved
- /api/notifications
- /api/interest
- /api/recommendations

Owner/admin:
- /api/diagnostics
- /api/analytics/event
- /api/analytics
- /api/requests/review
- /api/contributions/review
- /api/ai/manager
- /api/ai/manager/repairs
- /api/ai/manager/repairs/retry
- /api/ai/manager/telegram/setup
- /api/ai/manager/telegram/test
- /api/ai/manager/test-report
- /api/ai/manager/status
- /api/ai/manager/test-telegram

News/discovery/live:
- /api/news
- /api/news/article
- /api/trending
- /api/gold
- /api/weather
- /api/markets
- /api/maps/config
- /api/maps/search
- /api/images
- /api/tools
- /api/ads/config
- /api/features

Web metadata:
- /ads.txt
- /robots.txt
- /sitemap.xml

## 6. Frontend route inventory verified in the SPA router

Core:
- /
- /search
- /ai
- /prices
- /saved
- /tools
- /contribute
- /review
- /admin

Knowledge:
- /article/:slug
- /person/:slug
- /event/:slug
- /topic/:slug

Sections:
- /egypt
- /arab
- /world
- /science
- /economy
- /politics
- /technology
- /health
- /history-culture
- /people
- /sports
- /travel
- /arts
- /news
- /trending

Informational pages are driven through the info map and include:
- /about
- /methodology
- /privacy
- /terms
- /contact

## 7. Canonical D1 tables

1. knowledge_articles
2. knowledge_entities
3. knowledge_edges
4. content_queue
5. visitor_profiles
6. visitor_interest_events
7. visitor_contributions
8. runtime_audits
9. repair_jobs
10. bayan_analytics_events
11. knowledge_searches
12. saved_articles
13. article_revisions
14. user_requests
15. notification_preferences

Important fields/relationships:
- knowledge_articles stores Arabic and English article fields plus evidence/source JSON, status, freshness and review timing.
- visitor_interest_events references visitor_profiles with ON DELETE CASCADE.
- visitor_contributions is review-gated and includes reviewer_note/reviewed_at.
- repair_jobs is signature-deduplicated and stateful, including phase, root cause, risk, branch, verification and rollback metadata.
- analytics stores hashed visitor keys rather than raw visitor identifiers.
- saved_articles is keyed by visitor_id + article_slug.
- knowledge graph uses entities and edges with SUPPORTED_BY relationships.

## 8. Autonomous repair model

The current system is intentionally bounded rather than unrestricted.

Automatic actions allowed:
- bounded retries and provider fallback;
- provider/model cooldown;
- queueing and deduplicating repair jobs;
- AI diagnosis from captured evidence;
- isolated application-code repair patches;
- guards, typecheck, tests and Wrangler build verification;
- explicit CI verification on the repair branch;
- production deployment and Guardian verification through the normal pipeline;
- Telegram owner notification.

Secrets, permissions, authentication, security boundaries, destructive database operations, billing/external accounts and visitor-content publication remain human-gated.

A repair is RESOLVED only after the deployed production commit passes the affected smoke/Guardian checks. Generated code alone is never success.

Scheduled loop currently:
1. runtime audit;
2. report degraded runtime;
3. persist audit;
4. refresh knowledge freshness;
5. enqueue proactive topics;
6. process a small content queue;
7. process repair jobs.

## 9. Evidence and publication gates

Verified controls include:
- independent-source counting;
- provider diversity;
- source identity normalization;
- evidence-aware article generation;
- insufficient-evidence responses;
- language contamination checks;
- visitor contribution review queue;
- no direct visitor-contribution publication bypass;
- source URLs removed from visitor-facing evidence summaries where policy requires names/context instead.

## 10. Security controls

Verified:
- manager token authorization for private diagnostic/admin endpoints;
- server-side secrets only;
- sensitive error-message redaction;
- no automatic Telegram chat discovery fallback for production notifications;
- no destructive self-healing;
- X-Content-Type-Options;
- Referrer-Policy;
- X-Frame-Options;
- Permissions-Policy;
- newly added CSP baseline: base-uri/form-action/frame-ancestors;
- newly added HSTS baseline;
- API no-store caching;
- rate limits on public API operations;
- image license gate;
- visitor analytics uses hashed visitor keys.

## 11. CI/CD and release safety

CI performs:
- static guards;
- TypeScript typecheck;
- unit tests;
- frontend JS syntax validation;
- runtime-script syntax validation;
- Wrangler dry-run build validation.

Deployment:
- runs from successful CI workflow_run;
- checks whether tested commit is still current main;
- safely skips stale CI results;
- checks Cloudflare credentials before privileged operations;
- applies D1 migrations remotely;
- deploys Worker with strict Wrangler deployment;
- runs production smoke;
- runs AI benchmark as non-blocking external-capability validation.

Guardian:
- runs on schedule and after deployment;
- runs production smoke;
- runs AI benchmark;
- distinguishes AI-provider quota failures from application regressions;
- runs conservative AI diagnosis;
- creates incidents only when appropriate.

## 12. Production smoke coverage

The smoke suite verifies:
- root/health/features;
- all major public sections;
- tools/search/AI/saved/contribute/review;
- PWA manifests/service worker;
- SEO metadata;
- English shell/language integrity;
- public API contracts;
- protected endpoint authorization;
- English search depth;
- weather routing;
- article search;
- source comparison;
- news/trending;
- live FX/gold/weather;
- maps/images;
- frontend router contract.

## 13. Findings from this pass

### Fixed
A. Homepage runtime regression:
- renderRoute() called home() while home() was missing.
- This produced the exact recovery screen “تعذر عرض هذه الصفحة”.
- home() was restored from the known-good repository history.

B. Release guard contradiction:
- static guards expected obsolete deployment messages after the stale-CI workflow was intentionally changed to skip safely.
- Guard now validates the current deployment decision model.

C. SPA review listener accumulation:
- reviewPage() registered a document-level click listener every time the route was rendered.
- The listener is now installed once and reads current DOM state.

D. Baseline HTTP security headers:
- CSP baseline and HSTS were added to the common response-header path.

### Confirmed, not blindly changed
- TypeScript 7.0.2, Vitest 5.0.3 and Workers Types 5.20261003.1 are current stable versions verified during this audit. Wrangler was upgraded from 4.146.0 to 4.147.0 because the latest release added the needed observability configuration support. 

- Node 24 remains the appropriate CI runtime because it is LTS.
- AI source-code self-editing remains disabled intentionally.
- Search provider outage is treated as an external dependency rather than fabricated success.

## 14. Remaining high-priority audit passes

1. Full repository tree enumeration once the GitHub connector exposes directory/tree listing.
2. Verify every migration filename/order and reconcile canonical schema versus migration history.
3. Add/restore a package lock and move CI from npm install to npm ci after a controlled dependency installation.
4. Complete English UI parity inspection for every dynamic SPA render, not only the server shell.
5. Optimize live/news calls with bounded caching and provider-level time budgets.
6. Review all API methods/auth/rate limits endpoint-by-endpoint.
7. Review D1 query indexes, retention and transaction/race behavior.
8. Review Telegram notification retry/idempotency and incident deduplication.
9. Review self-healing predictive signals and add regression tests for every deterministic incident.
10. Run final CI -> deployment -> production smoke -> Guardian verification on the final main commit.

## 15. Current verification state

Latest verified audit commit: `03e5f028843beb94a5070d5ce438a81fe75c388e2`.

The latest CI run passed all quality stages. The corresponding production deployment applied D1 migrations, deployed Worker version `69b8728f-bb0f-4882-b4dc-f2abe5395c03`, production smoke passed, and the AI capability benchmark passed. This is the first full end-to-end verification of the newest audit changes.

The smoke run also exposed and resolved two important issues during the audit: unbounded smoke-test requests and excessive second-round search retrieval. Search article/English search checks are now bounded independently, while runtime search expansion waits for fewer than three initial results instead of six.

Latest main sequence after this audit:
- homepage restoration: 3a72a304b1b41bc529355e3cb0783fdeaac64801
- security headers: 3c2c2972bab6adae6e898f4703308aba4fb13e92
- release guards: 1d55cbfccc5985ba746823e63f46f9418ea43ef1
- review listener: b4167ea26525835bfe9d0cb131d10a8c83920810

The latest audit changes are committed to `main`, but the connector has not yet exposed a successful CI/deployment result for the newest commit. Therefore production deployment of these newest changes is NOT claimed as verified. The repository is ready for CI validation, followed by deployment and affected-route smoke verification.

## 16. Current migration inventory

The actual migration sequence is:
1. `0001_knowledge_articles.sql`
2. `0002_knowledge_graph_freshness.sql`
3. `0003_content_interest_engine.sql`
4. `0004_reliability_self_healing.sql`
5. `0005_private_analytics.sql`
6. `0006_contribution_schema_repair.sql`
7. `0007_search_and_notification_upgrade.sql`
8. `0008_persistent_reader_features.sql`
9. `0009_multilingual_article_integrity.sql`
10. `0010_contribution_reviewer_note.sql`

The canonical `schema.sql` intentionally represents the final consolidated schema. Migration history is append-only and must not be renamed to match old documentation.

## 17. Reference principle

BAYAN should never convert an unavailable dependency into a fake success. Every future upgrade should follow:

inspect -> reproduce -> classify -> smallest safe change -> automated test -> deployment verification -> affected-route verification -> record evidence -> only then declare success.
