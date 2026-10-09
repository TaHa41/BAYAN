const securityHeaders={"x-content-type-options":"nosniff","referrer-policy":"strict-origin-when-cross-origin","x-frame-options":"DENY","permissions-policy":"camera=(), microphone=(), geolocation=()"};
export const json=(data:unknown,status=200,cache="no-store")=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json;charset=utf-8","cache-control":cache,...securityHeaders}});
export const text=(body:string,type="text/plain;charset=utf-8",status=200)=>new Response(body,{status,headers:{"content-type":type,...securityHeaders}});
export async function body<T>(request:Request):Promise<T|null>{
  const declaredLength=Number(request.headers.get("content-length")||0);
  if(Number.isFinite(declaredLength)&&declaredLength>65536)return null;
  try{
    const raw=await request.text();
    if(raw.length>65536)return null;
    return JSON.parse(raw) as T;
  }catch{return null}
}
export function locale(request:Request):"ar"|"en"{const u=new URL(request.url);const requested=u.searchParams.get("lang");if(requested==="en")return"en";if(requested==="ar")return"ar";return request.headers.get("accept-language")?.toLowerCase().startsWith("en")?"en":"ar"}
