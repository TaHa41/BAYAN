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


## Developer tooling status — 2026-10-20

These tools are developer-side checks, not Worker runtime dependencies. A tool being listed here does not mean it is installed, authenticated, or has passed a diagnostic.

- **Playwright:** merged in PR #470 as a dev dependency with browser smoke tests and a workflow. Verify Chromium installation and the actual E2E run result before treating browser coverage as passing.
- **Context7:** configuration was added in PR #470. Confirm the MCP server is reachable from the developer environment before relying on it.
- **Strix:** manual-only source-code security review was added in PR #470. It requires the Actions secret `STRIX_LLM_API_KEY`, Docker, an explicit authorized scope, and a bounded budget. Do not point it at production by default.
- **ScrapeGraphAI:** not yet confirmed configured or running. Do not add a key to source control. Configure it only in the intended secret store, set a hard spending limit, and run one small, non-sensitive extraction as a cost/quality preflight before any scheduled use.
- **Scrapling MCP:** not yet confirmed installed or connected. Treat it as an external MCP server; verify the package/source, pinned version, launch command, transport, and least-privilege permissions before connecting it to an agent.
- **Agent Reach:** not yet confirmed installed or diagnosed. Verify the exact upstream repository/package and installation instructions before execution; run diagnostics in an isolated developer environment and review any account/network permissions.
- **`bayan-maintenance` skill:** present at `skills/bayan-maintenance/SKILL.md`.
- **`bayan-performance` skill:** recommended companion workflow is to be added in a separate reviewed change; do not assume it exists until it appears in the repository.
- **Lighthouse/PageSpeed:** no verified measurement is implied by this inventory. A Lighthouse CI run should save JSON/HTML artifacts and record the commit and timestamp. PageSpeed Insights field/lab data and Search Console indexing are separate checks.

### Operational gate
Never report a tool as “installed”, “connected”, “working”, or “passed” based only on configuration text. Record the command or workflow run, version, timestamp, exit status, and sanitized output. Missing credentials must be reported as a blocker, not worked around by embedding keys in code.
