---
name: bayan-performance
description: Diagnose and improve BAYAN Core Web Vitals, article-image delivery, public route reliability, accessibility, and production regressions using evidence and bounded checks. Use for performance, broken/missing images, slow pages, SEO technical checks, and browser QA.
---

# BAYAN Performance & Reliability Skill

## Guardrails
- Read `skills/bayan-maintenance/SKILL.md` first and follow all its production/data safety rules.
- Inspect current main, open PRs, workflow state, and the deployed build identity before editing.
- Never run load tests, crawlers, or aggressive retries against production. Use a local/staging target for stress tests; production checks must be low-rate and read-only.
- Never publish synthetic articles, substitute fabricated images, or treat a successful HTTP response as proof that an image is relevant.
- Do not introduce a paid API, secret, new runtime dependency, D1 migration, or production deployment without a clear need and verification plan.
- Preserve Arabic RTL and English LTR. Check both `?lang=ar` and `?lang=en`.

## Investigation order
1. Establish a reproducible failing route and record timestamp, language, status, response type, build SHA, and sanitized console/network errors.
2. Check existing project scripts and browser tests before adding dependencies. Prefer the existing Playwright setup and production health scripts.
3. For slow rendering, collect Lighthouse/PageSpeed evidence and separate lab results from field data. Inspect LCP, CLS, INP/TBT, image dimensions, font loading, blocking JS/CSS, cache headers, and third-party calls.
4. For missing images, distinguish absent metadata, invalid URL, blocked host, wrong content type, 404/403, timeout, decode failure, and irrelevant image. Test image URLs with bounded concurrency and timeouts; don't rewrite every URL blindly.
5. For search/news reliability, trace one request through provider selection, timeout/retry, evidence validation, cache, deduplication, and publication gates. Record reason codes rather than swallowing errors.
6. For accessibility, run automated axe checks where configured and manually verify keyboard navigation, visible focus, landmarks, contrast, alt text, and RTL/LTR behavior.
7. Make one focused change with a regression test. Avoid broad refactors while production incidents remain unresolved.
8. Run `npm run check` and the relevant E2E checks. If the target is production, use only the existing low-rate smoke checks.
9. Report the exact commit, workflow run/check results, deployment SHA, and observed live behavior. If any evidence is missing, state that it remains unverified.

## Tool-specific checks
- **Playwright:** run `npm run test:e2e`; confirm browser installation and save the Actions run URL.
- **Context7:** verify the MCP endpoint connects from the intended developer environment; configuration alone is not a pass.
- **Strix:** run only against an authorized, isolated source snapshot with an explicit scope, bounded runtime, and required secret in the secret store.
- **ScrapeGraphAI:** keep disabled until a valid secret and spending ceiling are set; test one small non-sensitive input and inspect usage before scaling.
- **Scrapling MCP / Agent Reach:** verify upstream source, package version, server transport, and permissions; run a bounded diagnostic without exposing credentials.
- **Lighthouse/PageSpeed:** collect Lighthouse artifacts from a repeatable CI run. Treat PageSpeed field data and Search Console indexing as separate evidence sources.

## Completion criteria
- The original failure is reproduced or its absence is demonstrated with a repeatable check.
- A regression test covers the failure mode.
- No secret, production data, old migration, or release guard was weakened.
- Arabic and English routes remain functional.
- A live fix is called complete only after a main-branch Actions deployment and post-deploy verification.
