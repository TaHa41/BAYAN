export function json(data:unknown,status=200,headers:HeadersInit={}){
 const h=new Headers({"content-type":"application/json; charset=utf-8","cache-control":"no-store",...headers});
 return new Response(JSON.stringify(data),{status,headers:h});
}
export function auth(req:Request,env:{BAYAN_AI_MANAGER_TOKEN?:string}){
 const expected=env.BAYAN_AI_MANAGER_TOKEN;
 if(!expected) return false;
 const token=req.headers.get("authorization")?.replace(/^Bearer\s+/i,"")||req.headers.get("x-bayan-manager-token");
 return !!token && token===expected;
}
export function headers(){return {"x-content-type-options":"nosniff","x-frame-options":"DENY","referrer-policy":"strict-origin-when-cross-origin","permissions-policy":"camera=(), microphone=(), geolocation=()","content-security-policy":"default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' https:;" };}
