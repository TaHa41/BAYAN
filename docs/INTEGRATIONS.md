# BAYAN integrations inventory

Status date: 2026-10-20. “Present in source/config” is not the same as a successful live integration.

## Cloudflare runtime

- **Worker:** `bayan`, production origin `https://bayan.tahaomar411.workers.dev`.
- **D1:** `bayan-knowledge`, ID `7f43f467-baec-4770-a5e1-52e65abf348d`; binding `DB`.
- **Workers AI:** binding `AI`; current default model `@cf/meta/llama-3.1-8b-instruct-fp8`. Main now supports optional `NEWS_AI_MODEL`; absent/invalid values fall back to the default. No alternate model was activated by this change.
- **AI Search:** binding `AI_SEARCH` is configured for retrieval. It is not used as a text-generation model.
- **Deployment:** `.github/workflows/deploy-worker.yml` deploys from `main` after CI. Manual `wrangler deploy` is not the release path. Latest verified deployed SHA at the snapshot was `3493f97edd9f35c319989b0bade47d9ba30e2cc5`; main later advanced to `333d83ec18c89f3ad43f48d28fb1777cb3ce8296` and the corresponding deployment was still in progress at snapshot time.
- **Health:** `/api/health` was not returning the earlier archive-read 503 in the latest monitor; the original 503 cause is unconfirmed. Main now logs a sanitized exception if the archive probe fails again.

## News and evidence

- **RSS/direct feeds:** configured in `src/services/news.ts`, including direct publisher feeds plus Google News and Bing fallback feeds. Main records bounded parse/acceptance diagnostics for empty bodies, invalid feed markup, oversized responses, HTTP failures, exceptions, and zero accepted items.
- **Aggregator links:** main resolves a bounded number of Google News redirects and Bing URL parameters to publisher HTTPS URLs. Unresolved aggregator URLs are retained and do not count as independent evidence.
- **Publication threshold:** five independent publisher labels and five distinct HTTPS hosts remain required. This threshold was not lowered.
- **OpenAI:** `OPENAI_API_KEY` / `OPENAI_MODEL` are optional environment fields. Production previously recorded `credit_balance_exhausted` HTTP 429; the owner plans to replenish the balance. No secret values are recorded here.
- **Daily background AI budget:** `NEWS_AI_DAILY_LIMIT=150` is in `wrangler.jsonc`; the code still uses the bounded configured limit. The production pipeline currently has zero news-linked articles; do not consider the publishing integration healthy yet.
- **Wikimedia:** image normalization and Wikimedia URL patterns exist in source. Article image URLs have not all been checked for HTTP 200 and image content type.

## Live data providers

- **Weather:** Open-Meteo geocoding and forecast endpoints are used in `src/services/live.ts`. Live success was not exercised in this audit.
- **FX:** Frankfurter v2 is the primary rate source; stale fallback behavior exists. Live success was not exercised in this audit.
- **Prayer times/Hijri conversion:** AlAdhan endpoints are used in source. Live success was not exercised in this audit.
- **Telegram:** `src/services/telegram.ts` sends through the Telegram Bot API using `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`. Delivery success was not verified during this audit; no token values are included.
- **Resend:** no active delivery was verified in this audit. Do not remove the integration until the full source/runtime dependency check is completed.
- **GA4:** expected ID is `G-Y16MK39Q6X`, but it was not found in the inspected `public/app-20261019-01.js` bundle. This does not prove it is absent from every asset; verify the full served HTML/JS and browser network events before treating analytics as active.

## SEO and indexing

- `src/seo.ts` generates `robots.txt`, `sitemap.xml`, and `news-sitemap.xml`.
- Production sitemap diagnostics returned HTTP 200 with zero news URLs because there are currently no news-linked published articles. This is preferable to inventing or misdating news entries, but the news publication acceptance criterion is still failing.
- Live canonical, hreflang, JSON-LD, all section routes in both locales, and Search Console status were not fully reverified in this audit. Google indexing is not guaranteed by sitemap submission.
- After the news pipeline publishes valid articles, manually resubmit `/sitemap.xml` in Search Console, inspect the sitemap processing result, and request indexing for a small representative set of important URLs. Recheck URL Inspection for canonical selection and crawl status.

## Known operational status

- Read-only production snapshot: `news_archive total=1530, linked=0, exhausted=126, pending=1404, attempted_24h=64`.
- Article quality snapshot: 162 total; 95 without image; 126 shorter than 2,500 characters; zero at least 5,000 characters; five duplicate title/language groups.
- Reproducible read-only inventory: `scripts/article-quality-report.sql`.
- These are snapshots, not proof that the unverified integrations or content-quality targets are complete.


## Integration status — 2026-10-21

- **GDELT DOC 2.0:** deployed as a metadata discovery source. Publication-specific queries are derived from the candidate headline; publisher text is fetched separately under robots, byte, and freshness limits. Production contribution to `linked` is still unverified.
- **Gemini (snapshot 2026-10-21):** the settings audit at that time did not list a `GEMINI_API_KEY` binding. This was a historical observation, not the current state.
- **OpenAI:** paid calls are disabled unless `OPENAI_ENABLED=true`; this variable is absent from the live Worker binding audit. Do not set it without owner approval.
- **SEARCH_API_KEY:** the binding was previously observed as plain text, but repository search found no active code reference. Do not rotate or reclassify it blindly; identify the intended search provider and confirm that its integration is live first.
- **RSS additions awaiting owner approval (not enabled):** BBC World RSS (`https://feeds.bbci.co.uk/news/world/rss.xml`), Al Jazeera English (`https://www.aljazeera.com/xml/rss/all.xml`), DW English (`https://rss.dw.com/xml/rss-en-all`), France 24 English (`https://www.france24.com/en/rss`), and Guardian World (`https://www.theguardian.com/world/rss`). Validate each endpoint, licensing/terms, redirects, robots policy, and publisher independence before activation. Guardian API remains blocked on an approved key.
- **Share preview:** `public/og/bayan-og.png` is still not present in main; do not point metadata at a nonexistent file.


## Manual news pipeline trigger — 2026-10-21 (pending verification)

- Source branch adds `POST /api/internal/trigger-news-pipeline`, protected by the existing `BAYAN_AI_MANAGER_TOKEN` bearer/header authentication. It is not a public unauthenticated trigger and does not accept the token in a URL.
- The route requires `NEWS_PIPELINE_ENABLED=true`, has a five-minute per-isolate cooldown, invokes the same bounded publisher as cron, and logs `news_archive_manual_trigger` without exposing secrets. It preserves independent-publisher/host checks and the normal D1 budget guard.
- PR #521 merged as `a2742156705222230533c1422e5d59d5e081d519`; Cloudflare deployment `cc780839-f5a2-416e-bfac-6ee45f89e78c` at `2026-10-21T04:05:09.751Z` was verified with the same `BAYAN_COMMIT_SHA`. No authenticated production call has been made from this session because the manager token value is not exposed to this caller. Endpoint existence and deployment are not proof of a successful pipeline run.
- AI integration is not currently certified healthy: the latest production events show Gemini timeouts / `all_providers_unavailable`. Scrapling, ScrapeGraphAI, Context7, and Agent Reach are not to be labelled integrated until actual connection/configuration, bounded-cost review, and runtime tests provide evidence. Playwright is present as a project dependency/configuration; production E2E execution still needs an Actions run with saved results.


## Verified execution status — 2026-10-25

- **Production deployment:** Cloudflare reports deployed commit `b31d149da41cf57151d3edb4fa334420e8e2c035` for Worker `bayan`; deployment version `45c6a2fb-f58d-4749-bf63-e96965e97f5c`. This matches the latest merged commit inspected during this session.
- **News AI budget:** deployed Worker binding is `NEWS_AI_DAILY_LIMIT=40`. This is a bounded daily attempt cap, not a promise of 40 successful articles and not permission to use paid APIs.
- **Gemini:** a Worker Secret binding named `GEMINI_API_KEY` exists. The secret value is not exposed, and its current validity/provider quota has not been verified by a successful generation test. The configured default model `gemini-3.8-flash` is listed by Google as a stable Gemini API model; key validity remains a separate check.
- **Evidence policy:** the five-independent-publisher requirement remains unchanged. The budget change does not override source diversity or article quality gates.
- **Sitemap:** PR #538 is merged; it adds reviewed, verified bundled article URLs to the general sitemap even when D1 returns a partial catalog. Production HTTP/content verification still requires the post-deploy smoke result.
- **Robots:** PR #539 is merged; static `public/robots.txt` now matches the Worker-generated rules and no longer advertises the news sitemap unconditionally.
- **Runtime issues:** Cloudflare Observability still lists 20 active historical issue groups / 3,763 active occurrences, including CPU-limit, D1-quota and HTTP 5xx groups. The most recent observed CPU-limit issue was at 2026-10-25T01:21:08Z, before the current deployment. These counts are historical/active issue-group counters, not proof of new errors after the latest deploy.
- **Lighthouse:** a manual-only workflow has been added in this branch. No Lighthouse score is claimed until the workflow is actually run and its private artifacts reviewed.
- **Secrets and privacy:** do not copy secret values into documentation, source code, logs, or issue comments. Configuration presence is not the same as provider authentication success.
