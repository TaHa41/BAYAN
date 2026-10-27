import { createHandler, type Env } from "./worker";
import { d1Store } from "./store";
import { wikipediaProvider } from "./providers/wikipedia";

// Providers are added here as they are ported from v1 (GDELT, RSS, Workers AI, Gemini): see v2/README.md.
const handler = createHandler({ providers: (lang) => [wikipediaProvider(lang)], store: (env) => d1Store(env.DB) });
export default { fetch: (request: Request, env: Env) => handler(request, env) } satisfies ExportedHandler<Env>;
