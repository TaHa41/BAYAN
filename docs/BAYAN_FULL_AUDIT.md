# BAYAN v1 Full Audit Reference

The legacy main tree was inventoried before refactoring. It contains legacy Workers, public assets, scripts, 15 historical migrations, CI/deploy/Guardian/AI-repair workflows, tests and documentation. Those files are reference evidence only; v1 does not inherit their implementation.

## v1 layers
Worker routing, domain types/config/http/security, D1 persistence, retrieval/generation, news/live providers, Telegram notifications, scheduled reliability, browser/PWA assets, tests and CI.

## Safety boundary
Autonomous repair may detect, diagnose, record, notify and retry deterministic operations. It must not delete data, weaken authentication, expose secrets, alter security boundaries, or invent database schema. AI-generated source edits remain bounded and must pass CI before deployment.

## Verification
TypeScript, unit/integration tests, Wrangler dry-run, route smoke tests, production smoke tests, database migration validation, bilingual UI checks and provider failure isolation.