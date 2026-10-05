import type { FeatureConfig, Locale } from "./types";
export const SITE_ORIGIN="https://bayan.tahaomar411.workers.dev";
export const DEFAULT_LOCALE:Locale="ar";
export const FEATURES:FeatureConfig={version:"1.0.0",locales:["ar","en"],evidenceFirst:true,capabilities:["search","articles","news","live-data","ask-bayan","contribute","admin","saved"]};
export function localeFrom(request:Request):Locale { const u=new URL(request.url); return u.searchParams.get("lang")==="en"||request.headers.get("accept-language")?.toLowerCase().startsWith("en")?"en":"ar"; }
