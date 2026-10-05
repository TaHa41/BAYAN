export type Locale = "ar" | "en";
export type EvidenceStatus = "verified" | "mixed" | "insufficient";
export interface Evidence { id:string; title:string; publisher:string; url:string; publishedAt?:string; reliability:number; }
export interface SearchItem { id:string; title:string; summary:string; kind:"article"|"topic"|"person"|"place"|"event"; category:string; evidence:EvidenceStatus; updatedAt:string; }
export interface SearchResponse { query:string; locale:Locale; items:SearchItem[]; status:"ready"|"insufficient"; message?:string; }
export interface FeatureConfig { version:"1.0.0"; locales:Locale[]; evidenceFirst:true; capabilities:string[]; }
