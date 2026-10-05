import type {Env} from "./types";
async function get(url:string,ms=4500){const c=new AbortController();const t=setTimeout(()=>c.abort(),ms);try{const r=await fetch(url,{signal:c.signal});return r.ok?await r.json():null}catch{return null}finally{clearTimeout(t)}}
export async function weather(){const x:any=await get("https://api.open-meteo.com/v1/forecast?latitude=27.2579&longitude=33.8116&current=temperature_2m,relative_humidity_2m,weather_code&timezone=Africa%2FCairo");return x?.current?{temperature:x.current.temperature_2m,humidity:x.current.relative_humidity_2m,code:x.current.weather_code,updatedAt:x.current.timezone}:null}
export async function fx(){const x:any=await get("https://api.frankfurter.app/latest?from=USD&to=EGP,EUR,GBP,SAR,AED");return x?.rates?x:null}
