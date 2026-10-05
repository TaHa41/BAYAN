export type Lang = "ar" | "en";
export type Evidence = { title:string; host:string; url?:string; publishedAt?:string; snippet?:string; independent?:boolean };
export type Article = { slug:string; title:string; summary:string; body:string; section:string; lang:Lang; imageUrl?:string; publishedAt?:string; updatedAt?:string; sourceCount:number; verified:boolean; evidence:Evidence[] };
export type Env = { DB?:D1Database; ASSETS?:Fetcher; AI?:Ai; OPENAI_API_KEY?:string; BAYAN_AI_MANAGER_TOKEN?:string; TELEGRAM_BOT_TOKEN?:string; TELEGRAM_CHAT_ID?:string };
export type Runtime = { request:Request; env:Env; ctx:ExecutionContext };
