export async function resolveImage(url:string):Promise<string|null>{try{const r=await fetch(url,{headers:{"user-agent":"BAYAN/2.0"},signal:AbortSignal.timeout(4500)});if(!r.ok)return null;const t=(await r.text()).slice(0,250000);const m=t.match(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["']/i)||t.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["']/i);return m?m[1]:null}catch{return null}}
export async function enrichImages(items:any[]){return await Promise.all(items.map(async x=>({...x,image:await resolveImage(x.sourceUrl)})))}

export async function resolveLicensedEditorialImage(url:string){return resolveImage(url)}
