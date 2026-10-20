# BAYAN AI assistants and provider cost review

Reviewed: 2026-10-20. This is a cost/architecture decision record, not a claim of production verification.

## Current implementation found on `main`

- **Visitor assistant:** `POST /api/ask?lang=ar|en`, linked from the public “اسأل بيان / Ask BAYAN” page. It runs BAYAN search/retrieval first, returns evidence/search status/providers, then uses the existing answer engine. Evidence retrieval can fail with an explicit unavailable response; it must not invent sources.
- **Admin assistant:** `POST /api/admin/ai-repair`, protected by `BAYAN_AI_MANAGER_TOKEN`. Previously it called `selfHeal()` after diagnosis, so a text-only “diagnose” request could also trigger mutations. This PR separates diagnosis from repair: the AI endpoint becomes read-only; the existing explicit repair control remains separate.
- **Runtime providers:** Cloudflare Workers AI is already bound as `env.AI`; OpenAI Responses API is an optional existing integration controlled by `OPENAI_API_KEY` and `OPENAI_MODEL`. This PR adds no new provider credentials.

## Cost comparison

Public list prices checked 2026-10-20. Prices vary by model, region, caching, and account terms; estimates below exclude retrieval/search providers, retries, and non-token tools.

| Option | Published token price (USD per 1M) | Practical trade-off for BAYAN |
| --- | ---: | --- |
| Cloudflare Workers AI, `@cf/meta/llama-3.1-8b-instruct-fp8` | $0.045 input / $0.384 output; 10,000 neurons/day free allocation, then $0.011 per 1,000 neurons on Workers Paid | Already bound to this Worker; lowest integration overhead and good default for bounded admin triage. Quality may be lower on complex reasoning; keep uncertainty explicit. |
| OpenAI GPT-6 Luna | $0.10 input / $0.50 output (standard short-context price) | Stronger optional fallback without adding a new vendor integration; usage is paid and requires an already-configured OpenAI key. |
| OpenAI GPT-5 mini | $0.25 input / $2.00 output | Existing code previously used this as an admin diagnostic fallback; the current official model page marks it deprecated. Avoid selecting it for new work. |
| Anthropic Claude Haiku 5.5 | $0.10 input / $0.50 output for prompts up to 100K tokens | Similar token pricing to GPT-6 Luna, but requires a new provider integration, secret, failure handling, and monitoring; not justified for this minimal change. |

Official pricing references:
- Cloudflare Workers AI: https://developers.cloudflare.com/workers-ai/platform/pricing/
- OpenAI API pricing: https://developers.openai.com/api/docs/pricing
- GPT-5 mini model status/pricing: https://developers.openai.com/api/docs/models/gpt-5-mini
- Anthropic pricing: https://platform.claude.com/docs/en/about-claude/pricing

### Illustrative cost per 1,000 assistant turns

Assumption: 1,500 input tokens and 500 output tokens per turn, with no tools/retries/cache.

- Workers AI list-token estimate: about **$0.26 / 1,000 turns**; actual bill follows Neurons and the daily free allocation.
- GPT-6 Luna: about **$0.40 / 1,000 turns**.
- GPT-5 mini: about **$1.38 / 1,000 turns**.
- Claude Haiku 5.5: about **$0.40 / 1,000 turns**.

These are token arithmetic estimates, not measured BAYAN bills. Actual visitor turns include search and retrieval costs, and prompt lengths can be much larger.

## Decision in this PR

1. Keep the visitor assistant's current retrieval/evidence behavior and current provider configuration; do not silently switch the public answer model or weaken evidence thresholds.
2. For admin diagnosis, prefer the already-bound Cloudflare Workers AI first; use configured OpenAI only as fallback, defaulting to GPT-6 Luna. This is a cost-aware fallback order, not a claim that one model is always more accurate.
3. The admin AI endpoint is **read-only** and does not call the repair executor. It may store a generic audit event, but it must not store the raw incident text. The separate explicit repair control remains separate and still needs its own safety/production verification.
4. No Anthropic account/key or other paid service is introduced.
5. Do not claim production success until CI, deployment identity, and live Arabic/English smoke tests have been checked.

## Security and acceptance

- Admin API remains protected by the existing manager-token gate.
- User-supplied incident text is untrusted input, not an instruction to execute operations.
- AI output is a diagnosis/hypothesis, not proof. UI states that no repair was performed and production was not verified.
- Regression test proves the diagnostic function does not issue UPDATE/DELETE and does not persist the raw report.
- Existing `npm run check` remains the required CI gate; no database migration is needed.
