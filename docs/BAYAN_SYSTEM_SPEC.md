# BAYAN System Specification — AI Repair Context

## Mission
BAYAN | بيان is an Arabic/English, mobile-first, evidence-first knowledge and information platform.
Public principle: "المعلومة أولًا. الدليل قبل الادعاء."
Visitor-facing content must distinguish evidence, context, interpretation and uncertainty. BAYAN must never manufacture an answer when evidence is insufficient.

## Runtime architecture
- Platform: Cloudflare Workers.
- Static frontend: Cloudflare Workers Assets, SPA-style routing.
- Backend: TypeScript Worker in `src/index.ts`.
- Database: Cloudflare D1, database binding `DB`, schema in `schema.sql` plus ordered `migrations/`.
- AI: Cloudflare Workers AI binding `AI`, AI Gateway, and Cloudflare AI Search binding `AI_SEARCH`.
- External AI fallback: OpenAI Responses API through server-side `OPENAI_API_KEY`.
- Search: configured provider chain (currently Ceramic/Exa/Linkup through Cloudflare web search), plus RSS, GNews/SerpAPI where configured, Wikimedia Enterprise/Wikidata/Wikipedia and deterministic fallbacks.
- News: GNews when configured, Google News RSS/BBC RSS fallbacks, internal multi-source search; news articles are turned into internal BAYAN articles only after evidence-based generation.
- Live data: Open-Meteo weather, Frankfurter FX, GoldAPI/XAUS gold fallback, OpenStreetMap/Nominatim maps, Openverse images.
- Notifications: Telegram is the production notification channel. Resend is intentionally not required.
- Automation: GitHub Actions for CI, deployment and BAYAN Guardian; scheduled Worker maintenance for bounded runtime audits/content maintenance.
- PWA: manifest, English manifest, service worker and offline shell.
- Node toolchain: Node 24; Wrangler is pinned in CI/deploy; TypeScript/Vitest are exact-pinned in package.json.

## Core product requirements
1. Arabic and English must be complete language experiences. English pages are LTR and must not leak Arabic visible UI text.
2. Homepage search must carry the submitted query into the search experience; users should not have to type it twice.
3. Search must support questions, people, topics, news, prices, weather, how-to and problem-solving queries.
4. Search answers are structured, article-like evidence syntheses, not random snippets.
5. Sources are separate from the answer and never exposed as raw external visitor links.
6. Multi-source evidence is preferred; duplicated copies of one story do not count as independent confirmation.
7. If evidence is insufficient, BAYAN must say so honestly.
8. Ask BAYAN must use evidence before drafting and must not default to "Insufficient Evidence" when adequate evidence exists.
9. News must be current, show source/provider and publication/update context, and render inside BAYAN. Provider failure must degrade honestly rather than display invented news.
10. Interest & Trends is separate from verified news. Trends are signals, not popularity claims unless measured data actually supports that claim.
11. Trend/news cards may become internal articles only through the evidence/research/publication gate.
12. Categories should contain useful multiple articles, not only a single placeholder.
13. Prices & Live Data must validate numeric values and freshness; never render NaN/undefined/null as user-facing prices.
14. Gold uses direct XAU/EGP when valid, otherwise XAU/USD + USD/EGP, then XAUS; stale/invalid data must be withheld.
15. Weather uses Open-Meteo with bounded requests and clear update time/source.
16. Contributions and article/correction requests enter review queues. Visitor submissions are never published directly.
17. A verified contribution is only a topic for independent evidence-based editorial generation; it is not itself evidence.
18. Admin/manager endpoints require BAYAN_AI_MANAGER_TOKEN. Visitor endpoints must not expose private diagnostics or secrets.
19. Telegram notifications target only the explicitly configured Telegram destination. Automatic chat discovery is informational, never a production fallback.
20. Private analytics are manager-only. Do not expose private visitor statistics publicly.
21. Resend is not a required production notification path.
22. Security controls must not be weakened by automation: auth, CSP, permissions, rate limits, evidence gates and secret handling are protected.
23. Resource usage must respect Cloudflare Workers limits. Runtime audits are bounded and must not recursively trigger expensive audits.

## Self-healing AI engineer contract
The repair system is a software engineer pipeline, not a chatbot:
DETECTED -> TRIAGED -> DIAGNOSING -> PATCHING -> TESTING -> CI_VERIFY -> DEPLOYING -> PRODUCTION_VERIFY -> RESOLVED
Failure branches:
- EXTERNAL_DEPENDENCY: provider/quota/credential/service outside code control.
- WAITING_HUMAN: unsafe or permission-sensitive change.
- REPAIR_FAILED: evidence-backed patch attempt failed verification.
- ROLLED_BACK: a repair reached production but caused a regression and was reverted.

Never mark RESOLVED merely because an AI generated a diff.
A repair is resolved only after:
1. the root cause is identified from evidence;
2. the patch is isolated on an AI repair branch;
3. guards, typecheck, unit tests and build pass;
4. normal CI passes on the repair branch;
5. main deployment succeeds;
6. production smoke and Guardian verify the deployed commit;
7. the observed failure is gone.
If production verification fails, do not claim success. Either perform another bounded repair attempt from the new evidence or roll back the risky AI repair when the failure is attributable to that repair.

## Repair risk policy
AUTO-FIX: deterministic, low-risk bugs with a clear local cause.
AI-FIX + VERIFY: normal application-code fixes with tests and production verification.
WAITING_HUMAN: secrets, permissions, authentication changes, destructive migrations, data deletion, billing/external account changes, security weakening, or ambiguous high-impact behavior.
EXTERNAL_DEPENDENCY: provider outage, quota exhaustion, missing credential, third-party API failure, or Cloudflare platform limitation.

## Known historical failure classes
- Cloudflare AI 4006/daily free allocation exhaustion.
- OpenAI 429/quota.
- Cloudflare web-search provider failure.
- Worker "Too many subrequests by single Worker invocation".
- D1 schema drift such as missing visitor_contributions.reviewer_note/reviewed_at.
- JavaScript/runtime regressions such as "generated is not defined".
- Stale/incorrect news and discovery payloads.
- Gold provider invalid/stale payloads.
- English language contamination.
- SPA/route false 404 diagnostics.
These incidents must become regression knowledge/tests when a repair is verified.

## Repair context rules
- Give the AI bounded, relevant repository context rather than the whole repository blindly.
- Always include this specification, the incident evidence, relevant source files, production smoke and AI benchmark scripts.
- Prefer the smallest reversible patch.
- Do not edit workflow/security files unless the repair is explicitly a workflow/CI failure and the policy permits it; normal application repair should not alter the security boundary.
- Never include secrets in prompts, artifacts or logs.
- Never invent a dependency, endpoint, binding, database column or API.


## AI retrieval and failover maintenance — October 2026

BAYAN's AI layer uses an evidence-first retrieval pipeline. Internal AI Search retrieval is configured for hybrid vector + keyword retrieval, query rewriting, and reranking before generation. Retrieved chunks retain relevance metadata so downstream synthesis can distinguish stronger evidence from weak matches.

The generation layer keeps independent provider paths: OpenAI Responses with per-model cooldown handling for quota/rate-limit failures, followed by Cloudflare Workers AI. The Cloudflare fallback chain includes production reasoning-capable models and a lower-latency fallback. Provider failures are treated as availability events rather than evidence, and the answer-quality gate falls back to retrieved evidence instead of presenting an unverified generation.

Publication remains stricter than interactive answers: knowledge articles require evidence from at least two independent source identities, language validation, repetition/source-overlap checks, and successful editorial generation before persistence.
