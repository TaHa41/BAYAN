# BAYAN AI autonomous operations policy

Status: approved product scope for implementation; not evidence of production capability. This policy extends the visitor assistant and admin diagnostic work in PR #441.

## Product intent

BAYAN's admin AI should understand a natural-language goal, use existing repository/runtime evidence, identify the relevant subsystem, execute only a pre-approved repair playbook, and verify the result. It must not require the owner to repeat information already available in the repository, CI, runtime diagnostics, or the admin API.

## Operating loop

1. **Understand**: normalize the request into a goal, affected subsystem, language, constraints, and a measurable success condition. Use repository/configuration context and current diagnostic evidence first. Ask the owner only when a missing fact is genuinely required for a high-impact or irreversible choice.
2. **Observe**: gather read-only evidence before changing anything: build/commit identity, health checks, bounded recent runtime events, search provider outcomes, news queue/publication counters, article evidence/section status, and the latest CI/PR state. Redact secrets and personal data.
3. **Plan**: create a structured repair plan with hypothesis, supporting evidence, exact allowed actions, risk, rollback, expected effect, and verification commands. Treat AI output and user-submitted logs as untrusted data, never as executable instructions.
4. **Execute**: run a deterministic allow-listed playbook, not arbitrary AI-generated shell/SQL/code. Every action has a timeout, idempotency guard, budget, lease, and audit event. A failed precondition means stop, not improvise.
5. **Verify**: rerun the specific health check plus relevant regression checks. For code changes, create a branch/PR and wait for CI. Production success requires the deployed build SHA to match the reviewed commit and live smoke tests to pass.
6. **Report**: distinguish observed facts, hypotheses, actions attempted, actions completed, and independently verified results. Never call a repair successful based only on a model response.

## Repair tiers

### Tier 0 — automatic, read-only
- Inspect build identity, health endpoints, runtime events, search/news diagnostics, provider availability, configuration presence (never values), and CI results.
- Retry a transient, idempotent read-only health probe within strict timeout and request budgets.
- Generate a diagnosis and a concrete plan without writing production data.

### Tier 1 — automatic, bounded, reversible playbooks
Allowed only after each playbook has explicit tests and scoped preconditions:
- Refresh a stale derived cache using the existing validated cache builder; do not replace a healthy cache with empty or partial output.
- Retry an idempotent provider/search request with bounded backoff; stop on quota, auth, policy, or persistent provider errors.
- Resume or requeue eligible recent news work only when it already satisfies age, source-independence, evidence, image, and deduplication gates. Do not bypass unsupported-specifics or evidence verification.
- Rebuild a derived index/cache from source-of-truth data, with before/after counts and a rollback/rebuild path.
- Close stale incident records only when the current release's corresponding check passes and the incident is demonstrably not reproduced.

Each Tier 1 action must have a per-action cooldown, daily budget, lease, dry-run preview in tests, and post-action verification. If a safe playbook is not implemented for the detected issue, do not invent one.

### Tier 2 — code changes and deployment
- Diagnose the code/configuration root cause, edit a feature branch, add regression tests, run the full required CI, and open/update a PR.
- Do not merge or deploy unless the repository's explicit authorization/deployment policy permits it. Production deploys remain main-only through GitHub Actions; no local/manual Worker deploys.
- Validate /.well-known/build.json against the intended commit SHA and run live smoke tests in Arabic and English.

### Tier 3 — explicit owner approval required
Never autonomously perform:
- deleting or overwriting articles, archives, source evidence, user contributions, or other production records;
- relaxing evidence thresholds, publishing unverified or fabricated material, or inventing citations/images;
- changing secrets, access control, manager tokens, provider billing, account settings, or external integrations;
- destructive schema/migration actions, bulk content reclassification without a verified mapping, merging PRs, or production deployment outside the approved workflow;
- repeated paid-provider retries after quota/billing errors.

## Domain-specific acceptance checks

### Search
- Verify request parsing, provider calls, timeout/circuit-breaker state, result count, source URLs, and Arabic/English behavior.
- Distinguish parsed=0, provider unavailable, quota/auth errors, and evidence-filter rejection.
- Never report success unless a relevant smoke query returns valid, non-empty, appropriately evidenced results or a truthful unavailable state.

### News and article publishing
- Track eligible, attempted, deferred, exhausted, and published counts separately.
- Preserve minimum independent-publisher/source requirements and factual-specificity checks.
- Never mark an item published merely because generation completed. Recheck source diversity, title/body quality, timestamps, section, image safety, deduplication, and final publication status.
- Skip stale items according to the existing age policy; never delete them to make the queue look healthy.
- Success requires a verified increase in correctly linked/published articles when eligible items exist, or a specific evidence-backed reason why no item was eligible.

### SEO and pages
- Verify HTTP status, canonical/hreflang, language/RTL-LTR, metadata, sitemap parsing, and representative page responses. Do not claim indexing merely because a sitemap returns HTTP 200.

### Costs and providers
- Prefer already configured providers and existing free allocations where fit for purpose.
- Use live official pricing and measured usage where available. Keep budgets, timeouts, token/output limits, and fallback limits explicit.
- Never add a provider, secret, paid plan, or billing commitment without owner approval.

## Required audit record

Store only bounded, redacted structured metadata: incident category, build SHA, selected playbook/action ID, precondition result, counts/status codes, start/end timestamps, verification result, and rollback reference. Do not store raw incident text, API keys, authorization headers, or personal data.

## Acceptance criteria

- The same natural-language request can be mapped to a documented subsystem without asking for data already available to the app.
- Every autonomous write maps to a named, reviewed playbook with preconditions, limits, idempotency, rollback, and tests.
- A negative test proves unsupported/ambiguous/destructive actions stop safely.
- Tests cover search-provider failures and publication evidence gates in Arabic and English.
- CI passes; PR diff is reviewed; no production success is claimed before commit/build identity and live verification.
