# BAYAN performance and reliability tooling

Updated: 2026-10-20

This guide defines a low-cost, evidence-first toolkit for diagnosing the current site's real failures. Tool configuration is not proof that a tool ran or that a production issue was fixed.

## Recommended toolkit

| Tool | Primary use | Cost / safety |
|---|---|---|
| Existing Playwright + `npm run test:e2e` | Arabic/English route smoke tests, broken-image detection, browser console/network failures | Uses the existing project dependency; browser install may be needed |
| Existing `npm run check` and production health/smoke scripts | Type checks, unit tests, build and bounded production checks | Prefer these before adding dependencies |
| Google Lighthouse / PageSpeed Insights | LCP, CLS, accessibility, SEO, blocking resources and performance opportunities | Use a small number of audits; lab scores are not field-user metrics |
| axe-core (optional, add only when approved) | Automated accessibility regressions | Prefer local/CI; automated checks do not replace manual review |
| Context7 | Version-specific official library documentation | Developer-side only |
| ScrapeGraphAI / Scrapling / Agent Reach | Permitted external-source discovery and extraction | Keep credentials local; respect quotas, terms and rate limits |
| Strix (manual-only) | Bounded source-code security review | Never auto-run active scans against production |

## First checks for current BAYAN issues

### Missing article images
1. Query existing article/image fields read-only; group failures by missing URL, invalid URL, host, HTTP status, content type, timeout, and decode error.
2. Use a small sample across multiple sections and both languages. Verify image URL and image relevance independently.
3. Add a regression test for empty, malformed, blocked, 404, non-image, and valid image cases.
4. Fix the underlying ingestion/rendering stage rather than filling gaps with the logo or random stock images.
5. Measure before/after counts and retain a sample of URLs/statuses without logging credentials or private payloads.

### Slow or unstable pages
1. Run a single Lighthouse/PageSpeed audit per representative Arabic and English route.
2. Record LCP, CLS, INP when field data exists (otherwise say unavailable), transfer size, failed requests and console errors.
3. Fix the highest-impact proven cause first; avoid speculative preloading and unbounded caching.
4. Re-run the same route and compare the same metrics under similar conditions.

### News and external search failures
1. Identify the exact provider and sanitized failure reason; separate timeout, rate limit, auth/configuration, malformed response, and no independent sources.
2. Apply bounded timeout/retry/backoff and provider fallback only where the existing architecture supports it.
3. Keep evidence validation and publication gates intact. Never treat a scraped page or AI output alone as verified news.
4. Test malformed payloads, empty provider results, rate limits, duplicate sources, unsupported claims, and Arabic/English outputs.

## Local commands

```bash
npm run check
npx playwright install chromium
npm run test:e2e
```

For an authorized non-production target, set `BAYAN_E2E_BASE_URL` to that target. Do not add load testing to the public production URL. Lighthouse can be run locally or through PageSpeed Insights for one URL at a time; save the report as evidence before changing code.

## Agent skill

Use [`skills/bayan-performance/SKILL.md`](../skills/bayan-performance/SKILL.md) for the repeatable investigation protocol. It complements `skills/bayan-maintenance/SKILL.md`; it does not replace the mandatory release and data-safety rules.

## Status boundary

This commit adds operating guidance for agents, not a claim that production images, search providers, news publishing, Core Web Vitals, or accessibility have been fixed. Any new runtime integration needs its own scoped implementation, tests, and approval.
