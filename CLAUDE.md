# Claude project instructions — BAYAN

Read `README.md` and `AGENTS.md` before making changes. Follow both files; when instructions conflict, preserve the stricter safety rule.

## Project purpose
BAYAN (بيان) is an Arabic/English, evidence-first knowledge and verified-news site running on Cloudflare Workers with D1. The core principle is: **information first; evidence before claims**.

## Non-negotiable safety rules
- Do not deploy to production, trigger production jobs, modify Cloudflare settings, or change secrets unless the user explicitly approves that exact action.
- Do not delete user data, reset/replace the D1 database, or alter migrations that may already have been applied. Add a new versioned migration only when a schema change is necessary.
- Never weaken admin/manager authentication or authorization, and never expose tokens, API keys, passwords, cookies, or other secrets in code, logs, client responses, examples, or pull requests.
- Do not add real credentials to `.mcp.json`, workflow files, or committed files. Use environment variables or secret stores. Treat existing placeholder values as placeholders.
- Never fabricate sources, citations, article content, images, evidence, test results, deployment status, or production verification.
- Preserve the independent-evidence publication threshold of **5 independent publishers**. Do not lower it to make articles publish.
- Do not bypass image requirements for verified articles. If a relevant image cannot be safely obtained, report the precise blocker; do not silently remove the requirement.
- Preserve the existing D1-first architecture. Do not migrate to Supabase or add paid services without explicit approval and a demonstrated need.
- Keep Arabic and English behavior separate and correct; do not silently fall back from English to Arabic. Preserve RTL for Arabic and LTR for English.
- Prefer focused, reversible changes on a feature branch and open a pull request. Do not commit directly to `main` unless explicitly requested.

## Workflow for every task
1. Inspect the relevant implementation, tests, workflows, and recent git history before editing.
2. Identify the root cause and make the smallest complete fix; do not merely add a workaround that hides the failure.
3. Add or update regression tests for changed behavior.
4. Run the relevant tests. For broad changes, run `npm run check`; use `npm run test:e2e` when browser behavior is affected.
5. Before claiming deployment readiness, run the repository's checks, including the Wrangler dry-run included in `npm run check`, when the environment supports it.
6. Report exactly what changed, files touched, commands actually run, test outcomes, and any blocker. Clearly distinguish local checks from live production verification.
7. If a check cannot run because dependencies, credentials, or network access are unavailable, say so explicitly; never claim it passed.

## Useful commands
- `npm run typecheck`
- `npm test`
- `npm run test:e2e`
- `npm run check` (includes project smoke checks and Wrangler dry-run)

## BAYAN-specific behavior
- Retrieval and source verification must precede AI generation.
- Make evidence status and uncertainty explicit; do not turn a search query alone into a published article.
- Provider outages and quota exhaustion must degrade gracefully and must not cause avoidable request storms or unbounded D1 reads.
- Protect Cloudflare Workers and D1 Free-tier budgets; investigate query counts and execution cost before adding polling, cron frequency, or repeated database operations.
- Keep existing routes and public contracts backward compatible unless the user explicitly approves a breaking change.
- Never claim a fix is live merely because a commit or pull request exists. Verify the deployed commit and the actual production behavior separately.
