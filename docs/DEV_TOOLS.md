# BAYAN developer tools

Status: integration scaffolding added on 2026-10-20. A tool being configured is not proof that it has run successfully.

## Runtime boundary

BAYAN remains on Cloudflare Workers and the existing D1 database `bayan-knowledge`. Supabase is not added as a runtime dependency and no data is migrated. There is no demonstrated requirement that justifies a second database. Revisit Supabase only if a concrete feature requires a capability that Workers + D1 cannot reasonably provide.

## Playwright

- Installed as a development dependency: `@playwright/test`.
- Config: `playwright.config.ts`.
- Smoke tests: `tests/e2e/public-routes.spec.ts` covers the Arabic/English home and existing tools route.
- Local run: `npx playwright install chromium`, then `npm run test:e2e`.
- Optional custom target: set `BAYAN_E2E_BASE_URL`; only test systems you own or are authorized to test.
- GitHub Actions workflow: `.github/workflows/e2e-playwright.yml`; runs manually or after a successful production deploy.

These are initial browser smoke tests, not a complete accessibility, visual regression, or cross-device suite.

## Context7

The project-root `.mcp.json` configures the Context7 MCP server for developer tooling. Set `CONTEXT7_API_KEY` in the local MCP host environment if required by your Context7 account/rate limits. Never commit API keys. Context7 is a development-time documentation helper and does not add a public BAYAN endpoint.

## ScrapeGraphAI, Scrapling MCP, and Agent Reach

See [WEB_RESEARCH_TOOLS.md](WEB_RESEARCH_TOOLS.md) for the exact setup, credentials boundary, usage guidance, and verification status. `.mcp.json` now includes ScrapeGraphAI MCP and Scrapling MCP entries; Agent Reach is documented as a separate local CLI/skill because it is not itself an MCP server. The ScrapeGraph API key entry is a placeholder and must be configured locally. These integrations have not been run from this GitHub repository or verified in a developer MCP host.

## Strix security testing

Strix is an agentic security testing tool, not a visitor-facing feature. It is not run automatically against production because active security testing can affect live services and requires explicit scope and model/API credentials. Install it using the official instructions at https://github.com/usestrix/strix and first run it against a local/staging copy with synthetic data. Do not put API keys in repository files or send D1 production credentials to the scanner. Add a dedicated CI job only after its CLI invocation, authentication, scope and output format have been verified.

## Skill UI

The intended project is https://github.com/gishamer/skill-ui, a desktop/CLI manager for agent skills. It is not a frontend component library and does not belong in the Worker runtime bundle. Use it in a developer workstation to manage reusable agent skills; don't install its desktop/Electron dependencies in BAYAN's production package.

## Visitor-facing tools

The existing public tools route is `/tools?lang=ar` or `/tools?lang=en`. Playwright checks that route is served, but this change does not claim to add new public capabilities. Developer utilities, MCP servers, and security scanners must remain private and must not be exposed to anonymous visitors.
