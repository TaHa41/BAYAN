# Free-first AI integrations for BAYAN

## Cost policy

BAYAN must not make paid API calls unless the owner explicitly enables them. ChatGPT consumer access and OpenAI API billing are separate products. The site must not treat a ChatGPT account or subscription as free API access.

- The existing visitor-facing assistant remains at `/ask` and uses the existing Cloudflare Workers AI binding when available.
- OpenAI API requests are now disabled by default unless `BAYAN_ALLOW_PAID_AI=true` is explicitly configured. Do not set this variable for the free-only deployment.
- OpenAI web search must follow the same guard; an API key alone is not permission to incur charges.
- If the free provider is unavailable or its daily allowance is exhausted, return a truthful unavailable/degraded state. Do not silently switch to a paid API.

## Flova AI

The Tools page links to Flova as an external creative tool. This is not a backend integration or an embedded generator. Flova's official documentation describes CLI/MCP/Agent authorization for working with projects; account authorization and generation/credit limits still follow Flova's own terms. Do not put a Flova API key in the repository or expose it to site visitors.

## Free-tier limits

Cloudflare documents a free Workers AI allocation of 10,000 Neurons per day; requests can fail after the allocation is exhausted on the Free plan. Model eligibility can also differ, so the configured model must be checked against the current catalog. Do not promise unlimited usage.

## User-facing disclosure

The BAYAN Tools page identifies ChatGPT and Flova as external links, says they open outside BAYAN, and warns that some external features may require an account or paid credits. BAYAN's own `/ask` remains the integrated in-site assistant.

## Official references

- OpenAI billing separation: https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform
- Cloudflare Workers AI pricing/allowance: https://developers.cloudflare.com/workers-ai/platform/pricing/
- Flova CLI / external agent docs: https://www.flova.ai/en/docs/features/cli/
- Flova pricing: https://www.flova.ai/en/pricing/

## Validation

- Unit test: `tests/ai-free-mode.test.ts` proves paid API access defaults to disabled and requires an explicit `true` opt-in.
- `npm run check` must pass in CI.
- Production validation must check `/.well-known/build.json`, then test `/ask?lang=ar`, `/ask?lang=en`, and `/tools?lang=ar` after a reviewed main-branch deployment.
- No production success claim is allowed until the deployed SHA and live behavior are verified.
