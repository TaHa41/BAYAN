# BAYAN | بيان

BAYAN is an evidence-first Arabic/English knowledge, research, search, AI and live-data platform running on Cloudflare Workers.

**Current release:** 0.11.1

## Core principles
- Evidence before claims.
- Arabic and English are separate UI/content modes; English pages must not silently fall back to Arabic.
- Search results and source evidence are distinct from a verified editorial article.
- Insufficient evidence is surfaced explicitly; source snippets are never promoted to a fabricated article.
- Secrets and provider credentials remain server-side.

## Runtime
- Cloudflare Workers + D1 + Workers AI + AI Search
- OpenAI with explicit fallback providers
- Multi-provider web/news retrieval
- Knowledge articles, graph, saved content, contributions and private analytics
- Runtime audit, persistent repair state, AI repair branches, CI/deploy/Guardian verification and Telegram owner alerts
- SEO, PWA, sitemap, robots, structured data and AdSense integration

## Development
`npm install`
`npm run check`
`npm run dev`

The release gate runs static guards, TypeScript checks, unit tests, frontend syntax checks and Wrangler build validation.

## Production
Pushes to `main` run CI. A successful CI run triggers the production deployment workflow, which applies D1 migrations, deploys the Worker, runs production smoke tests and then runs the AI capability benchmark.

## Database
Migrations in `migrations/` are append-only. The canonical schema is kept in `schema.sql`. Multilingual article fields are introduced by migration 0009; contribution schema repair is tracked through migration 0010; persistent self-healing repair state is tracked through migration 0012.

## Reliability
See `docs/AI_REPAIR_PLAYBOOK.md` and `docs/BAYAN_SYSTEM_SPEC.md` for the evidence-first autonomous repair process. Application-code fixes may be generated on isolated repair branches and merged only after guards, CI, deployment and production Guardian verification. Secrets, permissions, security-boundary changes and destructive data operations remain human-gated.
