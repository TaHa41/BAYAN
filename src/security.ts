import type {Env} from "./types";
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
