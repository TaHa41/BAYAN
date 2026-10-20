# Graphify for BAYAN

Graphify is a **developer-time codebase knowledge graph**, not a public BAYAN feature and not a Cloudflare Worker dependency. It helps coding agents trace relationships across TypeScript/JavaScript modules, SQL migrations, tests, workflows, and architecture docs before making changes.

Official project: https://github.com/Graphify-Labs/graphify  
Official package: `graphifyy` (CLI command: `graphify`).

## Safe local setup

Requirements: Python 3.10+ and `uv` (or `pipx`).

```sh
uv tool install graphifyy
graphify install --project --platform codex
```

Then build a code-only graph first, so source parsing stays local and no documentation/media semantic pass sends files to an external model:

```sh
graphify extract . --code-only
graphify query "Where are article publication eligibility and source-independence checks enforced?"
graphify query "How does the image fallback path work from a missing image_url to the image provider?"
graphify path "news publication" "D1"
graphify explain "findRelatedImage"
```

Check `graphify --help` and the official CLI reference if a command differs in the installed version. Do not run commands blindly in CI before confirming the installed release and its exact CLI interface.

## BAYAN-specific investigation prompts

- Trace a news item from ingestion/archive through evidence validation, drafting, deduplication, image handling, and final publication into D1.
- Trace Arabic and English request routing and verify language/RTL-LTR separation.
- Trace the missing-image flow, including empty `image_url`, placeholders, retry/cache behavior, and the image API.
- Trace search-provider failures and fallback behavior; distinguish logged facts from inferred causes.
- Trace production deployment identity from GitHub Actions commit SHA to `BAYAN_COMMIT_SHA` and the live Worker.
- Identify tests and migrations connected to each affected code path before proposing a fix.

## Privacy and production guardrails

- Start with code-only extraction. Graphify parses source code locally in this mode; do not enable semantic extraction for docs, PDFs, images, or other files without reviewing where the configured backend sends them.
- Never include `.env`, `.dev.vars`, API keys, GitHub tokens, Cloudflare credentials, user data, D1 exports, or production logs in a graph or prompt.
- Do not point Graphify at a live production database or grant it write access.
- Treat graph edges marked `INFERRED` as hypotheses. Confirm conclusions against source code, tests, and runtime evidence.
- The graph is an aid for investigation, not proof that a defect is fixed. Require targeted regression tests, CI, approved main-branch deployment, deployed SHA verification, and non-destructive live smoke tests.
- Do not commit generated graph artifacts unless the repository owner explicitly decides they should be versioned; they can expose internal architecture and create noisy diffs.

## Relationship to the BAYAN runtime

No npm dependency, Worker binding, D1 migration, public endpoint, or visitor-facing UI is needed for Graphify. Keep it isolated to developer workstations or a separately approved CI job. Do not add Supabase or another database for this integration.
