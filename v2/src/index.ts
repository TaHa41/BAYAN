import { createHandler, type Env } from "./worker";

// Providers and storage are wired here as they are ported from v1 (see v2/README.md parity checklist).
const handler = createHandler({ providers: [], listArticles: async () => [] });
export default { fetch: (request: Request, env: Env) => handler(request, env) } satisfies ExportedHandler<Env>;
