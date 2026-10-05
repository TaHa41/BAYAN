export interface Env{DB?:any;ASSETS?:any;AI?:any;OPENAI_API_KEY?:string;OPENAI_MODEL?:string;GNEWS_API_KEY?:string;BAYAN_AI_MANAGER_TOKEN?:string;TELEGRAM_BOT_TOKEN?:string;TELEGRAM_CHAT_ID?:string;BAYAN_VERSION?:string;BAYAN_COMMIT_SHA?:string}
export const now=()=>new Date().toISOString();
export const clean=(v:unknown,max=4000)=>String(v??"").replace(new RegExp("[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F]","g")," ").trim().slice(0,max);
export const hash=async(v:string)=>{const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,"0")).join("")};
export const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json;charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff","referrer-policy":"strict-origin-when-cross-origin"}});
export const unauthorized=()=>json({ok:false,error:"unauthorized"},401);
export const security=(h:Headers)=>{h.set("x-content-type-options","nosniff");h.set("referrer-policy","strict-origin-when-cross-origin");h.set("x-frame-options","SAMEORIGIN");h.set("permissions-policy","camera=(),microphone=(),geolocation=()");h.set("strict-transport-security","max-age=31536000");return h};
export const html=(body:string,status=200)=>new Response(body,{status,headers:security(new Headers({"content-type":"text/html;charset=utf-8","cache-control":"no-store"}))});
export const admin=(req:Request,env:Env)=>{const token=env.BAYAN_AI_MANAGER_TOKEN?.trim();if(!token)return false;return req.headers.get("authorization")===`Bearer ${token}`};
