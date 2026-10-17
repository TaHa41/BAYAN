# BAYAN Phase Reports

## Phase 0 — Intake and protection (2026-10-16)

- **Changes:** Added `docs/FEATURE_LEDGER.md` and `docs/ARCHITECTURE.md` on branch `repair/phase-0-ledger-architecture`. The ledger records required features, explicit exclusions, and safety invariants. The architecture map records source-level modules, configured runtime components, and known schema tables while marking unverified items as pending.
- **Behavior/data impact:** Documentation-only. No application source, migration, secret, or production data was changed.
- **Commits:** `4fd177c93025f19c99901ef3d7b6ad4717cc7c1a` (feature ledger); `fe82e1e3412d7fa9f1591894bb173313398a1440` (architecture map); merged through PR #341.
- **Tests:** CI passed for PR #341 before merge.
- **Deployment/live verification:** Documentation-only; no Worker deployment was required.
- **Acceptance:** The Phase 0 documentation is merged into `main`.
- **Remaining:** Full code/runtime audit continues in subsequent phases.

## Phase 1 — Production D1 inventory, Time Travel checkpoint, and first fixes (2026-10-16)

- **Production inventory confirmed by owner review:** `articles=162`, `knowledge_articles=24`, `news_archive=524` with no `article_slug`, `article_attempts>=2` count `66`, `repair_jobs=167`; legacy migration history ends at `0015` and application migration history at `0034`. The schema has `repair_jobs.last_action` and `verification_json`, not `action` / `verification`.
- **D1 Time Travel checkpoint:** Read directly from Cloudflare D1 API for database `bayan-knowledge` (database ID `7f43f467-baec-4770-a5e1-52e65abf348d`) at **2026-10-16T06:13:22.524Z**. Bookmark: `00000de0-00000054-00005106-18b7520670d0c8639fbf264a08f49e78`.
- **Backup caveat:** The bookmark is a temporary recovery checkpoint, not proof of a successful SQL export/restore. Export restore to a separate database and row-count comparison remain open. The bookmark was recorded before the production schema change. No bulk attempt counters were reset.
- **LIKE/GLOB fix deployed:** Bounded internal archive and knowledge-base search patterns by UTF-8 byte length (40-byte keyword cap, max 42 bytes including wildcards), split long tokens, and escaped `%`, `_`, and `!`. The internal Knowledge Base query failure was confirmed in production logs as `D1_ERROR: LIKE or GLOB pattern too complex`. Regression tests cover long Arabic and English queries and ensure the internal provider failure is surfaced to the per-provider fallback rather than swallowed.
- **Publication reason details deployed:** Added `news_archive.article_last_detail` through new migration `0035_news_archive_article_reason_detail.sql` plus schema compatibility logic. The existing `article_last_reason` / `publishReason` instrumentation was retained, not rebuilt. The publisher now distinguishes empty/AI-unavailable drafts, unsupported specifics, verification status, image rejection, and precise publication-quality rejection. Low-evidence items are marked `skipped_low_evidence`, release the claim attempt, and are deferred for six hours; evidence thresholds were not weakened.
- **CI and deployment:** CI passed for commit `8ff8ce7463d735766feaf0a28dc6f328c778a1c7`; Cloudflare Worker deployment succeeded and the deployment workflow's production verification passed. The separate lightweight health monitor still reported the known news-publication gap (`sitemapCount=0`, 200 archive candidates, 0 eligible published news articles) before two post-deploy publication cycles had elapsed. This is not a success claim for news publication.
- **Targeted production baseline:** News archive item `11686` (English) had two `draft_not_verified` attempts; runtime logs show OpenAI `http_429` during both attempts, but the exact final fallback verification rejection was not recorded historically. Item `11759` (Arabic) had `publish_rejected` with 7 sources and 5 publishers. Their new detail fields remain null because retry counters were not reset and those rows have not been retried.
- **Rate-limited catch logging:** A follow-up branch `repair/phase-1-rate-limited-runtime-events` adds `recordRuntimeEventLimited`, which caps each event kind to one D1 log write per minute per Worker isolate, sanitizes secrets/URLs, and never throws if telemetry itself fails. It has not yet been merged or deployed; CI is pending.
- **Remaining:** Observe two scheduled publication cycles after the latest deployment and inspect their reasons/results; complete the catch-logging branch and its CI/deployment; finish the isolated D1 export/restore row-count comparison; then address any dominant rejection reason without relaxing validation.

## Phase A — evidence-attributed news drafting (2026-10-17, in progress)

- **Changes committed on branch `fix/evidence-attributed-news-drafts`:** `src/services/ai.ts` now sends bounded title/summary/source-title/publisher excerpts rather than full provider records or URLs; requires JSON sentences with source IDs; validates each sentence against only its cited evidence; retries generation once after unsupported specifics and drops any remaining rejected sentences. Existing source-diversity, language, usefulness, image, and publication gates remain in place.
- **Regression guard:** `scripts/source-contract-smoke.mjs` checks for excerpt-only drafting, sentence-level source IDs, unsupported-sentence validation, and the single correction path.
- **Commits:** `f87c9eb9b70a930102963f612d6f4c078bf5db94` (drafting change); `4417daf0ca5a68cf440a86865a0d20a50965fa48` (prompt escaping correction); `f6fa9c30a3ab8a1b15deead28637b65c60e0efa7` (regression guard). Pull request: #347.
- **Data/schema impact:** No D1 writes, no migrations changed, no retry counters reset, and no feature-ledger entries changed.
- **Tests:** CI status not yet returned for the PR head; do not treat source-contract addition as a passing test run.
- **Deployment/live verification:** Not deployed. No new Arabic/English article publication has been confirmed from production for this change.
- **Acceptance:** **Not met yet.** Require passing `npm run check`, deployment, and verified new Arabic and English articles with valid sources, dates, and relevant resolvable images while `news_publication_rate` passes at its existing threshold.
- **Remaining:** Await CI evidence; correct any failures before merging/deploying. Then inspect the production rejection details, monitor two scheduled cycles, and only then consider the approved last-48-hour retry reset.

