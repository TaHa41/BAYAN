export function json(data:unknown,status=200,headers:Record<string,string>={}){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store",...headers}})}
export function text(data:string,type="text/plain; charset=utf-8",status=200){return new Response(data,{status,headers:{"content-type":type}})}
export function html(request:Request,body:string){return new Response(body,{headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store"}})}
