# BAYAN — AI Agent Handoff: Architecture, Requirements, Incidents, and Open Work
Updated: 2026-10-20
Repository: https://github.com/TaHa41/BAYAN
Production: https://bayan.tahaomar411.workers.dev
Branch for this handoff: feat/dev-tools-playwright-context7-strix-skillui-20261020

> This is an evidence-based handoff, not a claim that outstanding issues are fixed. Separate source-code facts, recorded historical incidents, and live verification. If you cannot reproduce a fact, label it "unconfirmed — needs a real check". Never report success from a green build alone.

## 1. What BAYAN is supposed to be

BAYAN (بيان) is a bilingual Arabic/English, evidence-first knowledge and current-information website. Its core principle is: "المعلومة أولًا. الدليل قبل الادعاء." It must serve arbitrary user topics, not only one demo question. It should distinguish sourced external results, internal articles, verified news, AI summaries, inference, and unconfirmed claims. Never fabricate a story, source, date, image, quote, market value, or verification result.

Required user-visible capabilities:
- Universal search / "اسأل بيان" across topics, with source attribution, entity/person disambiguation, recency and evidence-quality checks, useful fallbacks, and honest insufficient-evidence responses.
- Arabic at ?lang=ar with RTL and independent Arabic sources/content; English at ?lang=en with LTR and independent English sources/content.
- Sections: علوم وفهم، تقنية وذكاء اصطناعي، اقتصاد ومال، سياسة وشأن عام، صحة وطب، تاريخ وثقافة، أشخاص وسير، رياضة وبيانات، سفر وأماكن، فن وترفيه، أخبار موثقة، اهتمام واتجاهات، أسعار وبيانات مباشرة، حياة ومجتمعات، أفكار ونقاشات، تحولات كبرى. Existing route slugs may be legacy; do not delete or rename without compatibility analysis. Do not re-promote the old top-level labels مصر / العالم العربي / العالم.
- News should be real, recent enough, independently corroborated, useful, language-correct, nonduplicate, and have a relevant valid image. A query alone must not publish an article; enrich/store content only after the visitor actually opens/reads the result, as specified in the product ledger.
- Existing tools: markets/prices separate from weather; Open-Meteo weather; AlAdhan prayer times; contribute information; saved items; tools page; protected administration.
- Mobile-first, responsive UI; correct RTL/LTR; light/dark/auto themes; closeable side menu; readable cards and section-specific imagery; no long unstructured panels, fake demo content, or raw technical errors in public UI.
- Administration: Settings, Content, Analytics, Search log, Contributions, Monitoring, Repair; bounded and reversible self-healing with auditable state transitions; Telegram notifications preferred after dependency audit.
- SEO: valid robots.txt, sitemap.xml, news-sitemap.xml, canonical, hreflang, JSON-LD, crawlable localized routes, real social-share metadata/images, Search Console discovery and eventual indexing.
- Analytics must exclude admin/test traffic and sanitize search terms/identifiers as required.

## 2. Runtime architecture and boundaries

- Repository: TaHa41/BAYAN, main branch.
- Runtime: Cloudflare Worker named `bayan`; entry point `src/index.ts`; static assets under `public/`; Worker configuration `wrangler.jsonc`.
- Production URL: https://bayan.tahaomar411.workers.dev
- Data: existing Cloudflare D1 database `bayan-knowledge`, binding `DB`. Preserve production data.
- AI bindings include `AI` and `AI_SEARCH`; inspect their actual binding/runtime use before assuming a provider is functional.
- Scheduled jobs: Worker cron is configured every five minutes; the news refresh/publisher has its own bounded cadence.
- Main source areas: `src/routes/api.ts` (API composition), `src/services/search.ts` and `search-recovery.ts` (search), `src/services/news.ts` and `news-article-publisher.ts` (news aggregation/publication), `src/services/ai.ts` (AI drafting), `src/services/live.ts` (weather/FX/gold/prayer), `src/services/repair.ts` (self-healing), `src/services/editorial.ts` (classification), `src/image-url.ts` (image URL guards), `src/security.ts` (manager auth/visitor identity/analytics exclusion), `src/db.ts` (D1 queries), `src/schema.ts` (runtime schema compatibility), `src/seo.ts` (robots/sitemap), `src/sections.ts` (localized sections), `public/` (browser UI).
- D1 migrations are versioned in `migrations_v1/`; production history in the Phase Reports was recorded through 0034 at one point and newer changes have since been applied. ALWAYS query the actual production migration table and compare with current main before writing migrations. Never edit an applied migration.
- Existing repo includes GitHub Actions CI/deploy/monitoring and tests. Deployment must be main-only after required checks; no local/manual wrangler deploy as a shortcut. Verify exact commit SHA in the deployed Worker and deployment workflow run.
- Do not introduce Supabase as a second runtime database unless a concrete, documented feature cannot reasonably be served by Workers + D1. No data migration is authorized.
- Never expose secret values. Put credentials in Cloudflare/GitHub secret stores. Historical audit found `SEARCH_API_KEY` apparently configured as plain_text; verify current state securely and rotate/store as a secret if still applicable, without printing it.

## 3. Prior problems and fixes already recorded — verify before reopening

### Search / D1 query failure
- A real production error was recorded: `D1_ERROR: LIKE or GLOB pattern too complex` for long Arabic/English queries.
- A fix was recorded as deployed: bound keyword pattern size (40-byte keyword cap; max 42 bytes with wildcards), split long tokens, escape `%`, `_`, and `!`, and let the provider fail into the existing per-provider fallback rather than silently swallowing it.
- Regression coverage was added for long Arabic/English search terms. Do not remove the guard or weaken evidence gates.

### Article route HTTP 503 / D1 reads
- An article route had returned HTTP 503 for Arabic/English and section routes. A prior production incident attributed admin/API HTTP 500 to D1 daily row-read quota exhaustion; direct causality for every article 503 was not proven.
- PR #417 was recorded as removing duplicate D1 reads, reducing cross-language candidate scans from 200 to 12, preserving fallback/503 retry semantics, and adding tests.
- PR #418 was recorded as merged/deployed with an article fallback fix; a later probe reported 43 article requests returning 200 and zero 503. Treat this as a historical snapshot, not a guarantee of current health.
- Later docs snapshot says `news_archive_read_unavailable` 503 did not reproduce in the latest health probe; direct D1 probe returned HTTP 200, one row read. Original root cause remains unconfirmed. PR #436 added sanitized Worker-log diagnostics for recurrence; public health endpoint still returns 503 on failure.
- Continue checking current live routes, D1 row-read budget, fallback behavior, and logs; never turn an unconfirmed cause into a fact.

### News publishing evidence / diagnostics
- Prior recurring failure: archive items attempted every 15 minutes but no publishable articles; dominant reasons included `unsupported_specifics`, `draft_not_verified`, `publish_rejected`, `skipped_low_evidence`, and AI provider failures (including OpenAI HTTP 429 and Workers AI 4006 in older incidents).
- Reason logging already exists: `article_last_reason`, `article_last_detail` (migration 0035), publisher reason codes, and rate-limited runtime-event work. Do NOT rebuild reason logging or reset attempts before treating the dominant cause. Read actual latest schema and code first.
- Publisher protections added in prior work: bounded excerpts rather than full source records/URLs; sentence-level source IDs; validate each sentence against cited evidence; one correction attempt then remove unsupported sentences; maintain source diversity, usefulness, language, image, and publication gates. Five independent HTTPS hosts remain required in latest ledger snapshot. Never lower the threshold just to make publishing pass.
- Google News/Bing redirect resolution and bounded RSS/provider diagnostics were recorded as merged in PRs #432–#434. Verify these remain in main and are effective in production.
- Latest recorded production acceptance monitor (snapshot 2026-10-20) FAILED `news_publication_gap`: zero news sitemap URLs, zero news-linked articles, 200 archive candidates ready for drafting.
- Recorded D1 snapshot: `news_archive total=1530, linked=0, exhausted=126, pending=1404, attempted_24h=64`. `articles=162`; 95 lacked image_url; 126 had body length below 2,500 characters; zero at or above 5,000 characters; five duplicate title/language groups. These counts are snapshot-specific and must be refreshed.
- This remains a major unresolved issue: get a representative archive row through each exact gate, record a bounded reason for every rejection, distinguish provider outage from weak evidence or validator bugs, fix the dominant real cause, then prove new articles are published and news-sitemap entries appear. Do not bulk-reset attempts or delete old data. Queue selection should favor recent, independently corroborated, image-valid, nonduplicate items and explicitly handle stale (>48h) candidates without destructive deletion.
- Scheduled publication cadence was documented as up to six single-row attempts per hour with two maintenance slots reserved; reconcile this with current code and real throughput before changing it.

### Images
- Image gaps are real: latest recorded snapshot had 95 of 162 articles without images.
- Source code contains image URL filtering that blocks Googleusercontent/Google News/gstatic image hosts. Wikimedia image propagation/deduplication changes were attempted in earlier PRs; inspect merged main and verify URLs return HTTP 200 with image content-type and are relevant to the article.
- PR #431 was closed as superseded, not merged; it targeted rows whose image_url fields were already nonempty, which did not prove the actual image assets worked.
- Fix at the correct ingestion/rendering layer, test real image URLs, validate content type, preserve licensing/source metadata when applicable, add safe fallbacks, and verify OG/social preview separately. A nonempty URL does not mean the image works. Do not invent or use irrelevant logos as article images.

### SEO / indexing / sharing
- Prior Search Console snapshots reported sitemap with 204 URLs and zero indexed, plus news-sitemap errors/zero discovered items at different times. Later direct result was URL unknown/no prior crawl. These are different snapshots, not necessarily current status.
- Need live checks for HTTP robots/sitemaps, localized canonical/hreflang, rendered HTML metadata, JSON-LD validity, internal linking, and share preview. Sitemap submission does not equal indexing. Google indexing can take time and must be verified in Search Console.
- User reported the homepage URL preview showing the same logo instead of the intended page image, from the initial share action, not only WhatsApp. Inspect actual server-rendered `og:image`, `twitter:image`, image absolute URL/status, cache headers and crawler response; use a valid relevant branded/site image and test with social debugger/crawler. Never introduce unrelated imagery or false entities.
- PageSpeed had SEO score 2/4 in an earlier snapshot despite strong performance/accessibility scores; remeasure current deployed site rather than assuming unchanged.

### Admin, repair and telemetry
- Historical admin dashboard had external search provider failures and JS runtime errors such as `generated is not defined`, `resolveWikimediaEditorialImage is not defined`, and `/search` failures. Verify if any remain in current source/runtime; do not assume historical bug still exists.
- A schema/code mismatch was found: repair job resolution code used nonexistent `action` / `verification`, while schema fields are `last_action` / `verification_json`. Corrected task closure must mean verified repair, not log-only cleanup.
- Existing `repair_jobs` fields include phase/root_cause/risk_level/base_sha/branch/pr_number/verification_json/rollback_count; `runtime_events` is used for diagnostics. Ensure self-heal is bounded, auditable, reversible, and never writes unverified fixes into production.
- A D1 read-quota incident led to adding indexes in PR #416; verify whether migration 0037 is applied and whether query budgets improved. Do not repeat expensive unbounded admin queries.
- Telegram bot notifications previously worked; Resend failed in earlier setup. Audit live configuration before removing any integration. Prefer Telegram when appropriate; never print bot tokens.
- GA4 ID `G-Y16MK39Q6X` was recorded for verification; ensure admin/test traffic is excluded and events are genuinely delivered.

### AI / search provider fallbacks
- Older failures included external search providers unavailable, OpenAI 429, Workers AI error 4006, and an AI Search binding whose actual operational integration was not proven by config alone.
- Test provider-by-provider outcomes and fallback behavior. A provider error must not crash unrelated site features or show raw stack traces. For no evidence, clearly say that results could not be verified; do not fabricate answers or cite sources that were not actually used.
- Keep AI daily budgets bounded (NEWS_AI_DAILY_LIMIT was recorded as 150 in wrangler config at one snapshot); verify current config and actual usage. Do not spend credits on unbounded retries.

## 4. New developer tools PR #470 — honest current state

PR: https://github.com/TaHa41/BAYAN/pull/470
Head SHA at inspection: 28eb581cc5606fc354a30b02752ace28fb712801
Open, not merged at handoff inspection. Do not say deployed.
- Playwright: dev dependency and initial browser smoke tests for Arabic/English home + tools route; workflow can run manually or after a successful main deploy. This is only a starter smoke suite, not full cross-device/accessibility/visual regression coverage.
- Context7: root `.mcp.json` config for documentation MCP. It helps developers; it does not add a public site feature.
- Strix: manual-only bounded source-code security review, requires GitHub Actions secret `STRIX_LLM_API_KEY`; not yet evidence of a completed scan.
- Skill UI: `skills/bayan-maintenance/SKILL.md` is a Skill UI-compatible skill file for agents; it is not a visitor-facing UI component library.
- Supabase intentionally not added. Keep Workers + D1.
- Required before merge: inspect PR checks and workflow syntax/permissions, ensure E2E checks run against the intended revision (workflow_run head SHA vs deployed main SHA must be handled correctly), ensure production E2E doesn't mutate state, ensure PRs from forks cannot access secrets, and confirm tests actually execute. Then run Playwright, run Strix only after authorized secret/scope, and record artifacts/results. Never claim any workflow passed without the run URL and conclusion.

## 5. Current highest-priority unresolved work

P0 — News article publication:
1. Query current read-only production counts and reason distribution; refresh snapshot.
2. Trace one recent eligible archive item through drafting, JSON/source-ID parsing, sentence-level support, source diversity, language, image, duplicate, and final DB insert gates.
3. Add regression tests for each demonstrated failure (Arabic and English, unsupported names/numbers/dates, malformed JSON/source indexes, valid article, missing/broken image, provider outage, duplicate article).
4. Fix the dominant proven cause with bounded retry/cost. Do not lower evidence/publisher thresholds or reset attempts.
5. Prove new article links exist in production and news-sitemap contains them; verify cron logs and rate/budget.

P0 — Article images and share metadata:
1. Produce a fresh inventory of null/broken images and check HTTP status/content-type.
2. Fix image sourcing/propagation and safe fallback at ingestion/rendering.
3. Verify every affected article image and homepage OG/Twitter preview with crawler-style fetch of deployed HTML. No irrelevant images.
4. Verify section-specific imagery and blocked-domain constraints.

P0 — Production reliability:
1. Re-test article/search/API routes in ar/en and all section slugs.
2. Inspect D1 quota/read usage and slow/unbounded queries; confirm migration state before schema change.
3. Validate AI/search fallback under simulated provider failure without exposing raw errors.
4. Check deployed commit SHA matches successful main-branch GitHub Actions deploy and post-deploy smoke result.

P1 — SEO:
1. Fetch production robots/sitemap/news-sitemap and validate XML status/counts.
2. Inspect server HTML for canonical, hreflang, OG/Twitter, JSON-LD; validate each locale/section.
3. Fix actual discovered defects, then monitor Google Search Console discovery/indexing over time. Never promise instant indexing.

P1 — Security and admin:
1. Run Strix only with authorized configured secret and bounded scope; review report, triage findings, fix real issues and add tests.
2. Audit manager authorization on every admin endpoint, secret storage, search log sanitization, and GA4 admin/test exclusion.
3. Verify self-heal/repair actions, rollback evidence, and Telegram delivery.

P1 — Tooling quality:
1. Extend Playwright to real critical journeys: search, open article, language switch, menu close, tools routes, article image loading, share metadata, and failure/fallback behavior.
2. Assert no console errors/uncaught page errors and no broken same-origin links/images; don't make tests flaky or overly dependent on external providers.
3. Keep Context7 and Skill UI in development only unless a safe, useful visitor feature is separately designed.
4. Add a status/coverage table to `docs/PHASE_REPORTS.md`, each item tagged PASS / FAIL / UNCONFIRMED with exact evidence, run IDs, commit SHA, and timestamp.

## 6. Mandatory workflow and constraints

- Start with repository/main/PR status and read the relevant code; do not duplicate a fix already merged.
- One root cause per fix/commit; regression tests required. Never weaken tests, evidence thresholds, security guards, or production verification to get green.
- Before any production D1 schema/data mutation: create/confirm a recovery checkpoint, export backup, and prove restore into an isolated database with row-count comparison. A Time Travel bookmark alone is not a proven backup/restore.
- Never edit applied migrations; create a new migration only after inspecting live migration history and schema.
- Do not delete/archive/reset production records or attempt counters without explicit approval and evidence.
- Deploy only via successful main-branch GitHub Actions. Verify workflow run ID, head SHA, event, actor, conclusion, deployment ID, Worker commit SHA, and post-deploy checks.
- After deploy, verify real production URLs/APIs and D1 metrics. If no access or evidence, state precisely what remains unverified.
- Keep Arabic reports concise and actionable for the owner; never claim "fixed" solely because a PR was created, CI passed, or a deployment started.

## 7. Definition of done

A problem is done only when all are true:
1. Root cause supported by logs/reproduction, not guessed.
2. Minimal code/config change committed and regression tests added.
3. Relevant CI and browser/security tests pass, with run evidence.
4. Main-only production deploy succeeds and deployed SHA matches expected commit.
5. Production behavior is re-tested for Arabic and English and affected routes.
6. Related D1/news/image/SEO/telemetry acceptance metrics improve as expected.
7. Docs/ledger/phase report updated with exact evidence and explicit remaining gaps.

If a result is not verifiable, label it: "غير مؤكد — يحتاج فحصًا فعليًا".
