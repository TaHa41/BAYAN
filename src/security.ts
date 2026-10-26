import type {Env} from "./types";

const ANALYTICS_EXCLUDED_UA = /(?:googlebot|bingbot|yandexbot|baiduspider|duckduckbot|slurp|crawler|spider|facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|telegrambot|discordbot|slackbot|lighthouse|pagespeed|headlesschrome|puppeteer|playwright|curl\/|wget\/|python-requests|python-urllib|go-http-client|node(?:\.js)?\b|undici|bayan-production-smoke|uptime(?:robot)?|healthcheck|monitoring|gptbot|chatgpt-user|oai-searchbot|claudebot|claude-user|claude-searchbot|anthropic-ai|perplexitybot|perplexity-user|ccbot|bytespider|amazonbot|applebot|google-extended|googleother|cohere-ai|meta-externalagent|diffbot|youbot|petalbot|ahrefsbot|semrushbot|mj12bot)/i;

export function analyticsExcluded(request: Request) {
  const cookies = (request.headers.get("cookie") || "").split(";").map((part) => part.trim());
  if (cookies.includes("bayan_exclude_analytics=1")) return true;
  // Private control-center routes and their authenticated repair APIs must never
  // be counted as public audience traffic, even before the browser cookie lands.
  const pathname = new URL(request.url).pathname;
  if (/^\/(?:admin|review)(?:\/|$)/.test(pathname) || /^\/api\/admin(?:\/|$)/.test(pathname)) return true;
  const userAgent = request.headers.get("user-agent") || "";
  return userAgent.length > 0 && ANALYTICS_EXCLUDED_UA.test(userAgent);
}
export function manager(request:Request,env:Env){
  const token=request.headers.get("authorization")?.replace(/^Bearer\s+/i,"")||request.headers.get("x-bayan-manager-token");
  return !!env.BAYAN_AI_MANAGER_TOKEN&&token===env.BAYAN_AI_MANAGER_TOKEN;
}
export function clean(value:string,max=12000){return value.replace(/[\u0000-\u001f]/g," ").trim().slice(0,max)}
export async function visitorId(request:Request){
  const raw=request.headers.get("cf-connecting-ip")||"anonymous";
  try{
    const data=new TextEncoder().encode(raw);
    const digest=await crypto.subtle.digest("SHA-256",data);
    return Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,"0")).join("").slice(0,32);
  }catch{return "anonymous"}
}
