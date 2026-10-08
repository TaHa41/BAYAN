import type {Env} from "../types";
const timeout=async(url:string,ms=5000)=>{const c=new AbortController();const t=setTimeout(()=>c.abort(),ms);try{return await fetch(url,{signal:c.signal,headers:{accept:"application/json"}})}finally{clearTimeout(t)}};
export async function weather(cityInput?:string){
  const city=String(cityInput||"Hurghada").trim().slice(0,100)||"Hurghada";
  try{
    const geo=await timeout("https://geocoding-api.open-meteo.com/v1/search?name="+encodeURIComponent(city)+"&count=1&language=en&format=json",3500);
    if(!geo.ok)throw new Error("weather_geocoding");
    const gd=await geo.json<any>(),place=gd.results?.[0];
    if(!place||!Number.isFinite(Number(place.latitude))||!Number.isFinite(Number(place.longitude)))return{ok:false,provider:"Open-Meteo",stale:true,city,message:"City not found"};
    const url="https://api.open-meteo.com/v1/forecast?latitude="+encodeURIComponent(String(place.latitude))+"&longitude="+encodeURIComponent(String(place.longitude))+"&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto";
    const r=await timeout(url,5000);if(!r.ok)throw new Error("weather_forecast");
    const d=await r.json<any>();
    return{ok:true,provider:"Open-Meteo",city:place.name,region:place.admin1||"",country:place.country||"",latitude:place.latitude,longitude:place.longitude,current:d.current,timezone:d.timezone,stale:false,updatedAt:new Date().toISOString()};
  }catch{return{ok:false,provider:"Open-Meteo",stale:true,city,message:"Weather provider temporarily unavailable"}}
}
export async function fx(){try{const r=await timeout("https://api.frankfurter.dev/v2/rates?base=USD&quotes=EGP,EUR,GBP,SAR,AED,KWD,QAR,BHD,OMR,JOD,TRY,JPY,CNY,CAD,AUD,CHF,INR,ILS,LYD,TND,MAD,ZAR");if(!r.ok)throw 0;const d=await r.json<any>();const rates=Array.isArray(d)?Object.fromEntries(d.map((x:any)=>[String(x.quote).toUpperCase(),Number(x.rate)])):d.rates;if(!rates?.EGP)throw new Error("fx_data");return{ok:true,provider:"Frankfurter v2",base:"USD",rates,updatedAt:new Date().toISOString(),stale:false}}catch{return{ok:false,provider:"Frankfurter",stale:true,message:"FX provider temporarily unavailable"}}}
async function marketQuote(symbol:string){try{const r=await timeout("https://query1.finance.yahoo.com/v8/finance/chart/"+encodeURIComponent(symbol)+"?range=1d&interval=5m",4500);if(!r.ok)return null;const d=await r.json<any>();const meta=d?.chart?.result?.[0]?.meta;const price=Number(meta?.regularMarketPrice);if(!Number.isFinite(price)||price<=0)return null;return{symbol,price,currency:String(meta?.currency||"USD"),provider:"Yahoo Finance",updatedAt:meta?.regularMarketTime?new Date(Number(meta.regularMarketTime)*1000).toISOString():new Date().toISOString()}}catch{return null}}
async function extraMarkets(){const quotes=await Promise.all([marketQuote("SI=F"),marketQuote("CL=F"),marketQuote("GC=F"),marketQuote("BTC-USD"),marketQuote("ETH-USD"),marketQuote("^GSPC"),marketQuote("^IXIC")]);const names:Record<string,{ar:string;en:string;unit:string}>={"SI=F":{ar:"الفضة",en:"Silver",unit:"USD / troy ounce"},"CL=F":{ar:"النفط الخام",en:"Crude oil",unit:"USD / barrel"},"GC=F":{ar:"العقود الآجلة للذهب",en:"Gold futures",unit:"USD / troy ounce"},"BTC-USD":{ar:"بيتكوين",en:"Bitcoin",unit:"USD"},"ETH-USD":{ar:"إيثيريوم",en:"Ethereum",unit:"USD"},"^GSPC":{ar:"مؤشر S&P 500",en:"S&P 500",unit:"index points"},"^IXIC":{ar:"مؤشر ناسداك المركب",en:"Nasdaq Composite",unit:"index points"}};return quotes.filter(Boolean).map((q:any)=>({...q,...names[q.symbol]}))}
export async function gold(env:Env){const providers=[["CoinGecko PAXG","https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=usd"],["Yahoo Finance","https://query1.finance.yahoo.com/v8/finance/chart/XAUUSD=X?range=1d&interval=1m"],["GoldPrice.dev","https://api.goldprice.dev/v1/prices?symbol=XAU-USD-SPOT"],["Gold API","https://api.gold-api.com/price/XAU"]];try{const [g,f,markets]=await Promise.all([Promise.any(providers.map(async([name,url])=>{const r=await timeout(url,5000);if(!r.ok)throw new Error(name);const d=await r.json<any>();let p=Number(d?.["pax-gold"]?.usd);if(!p)p=Number(d?.chart?.result?.[0]?.meta?.regularMarketPrice);if(!p)p=Number(d?.symbols?.[0]?.price??d?.price);if(!Number.isFinite(p)||p<=0)throw new Error(name+"_data");return{name,price:p}})),timeout("https://api.frankfurter.dev/v2/rates?base=USD&quotes=EGP",5000),extraMarkets()]);const fd=await f.json<any>();const egp=Number(fd.rates?.EGP);if(!egp)throw new Error("fx");return{ok:true,provider:g.name+" + Frankfurter",price:(g.price/31.1034768)*egp,unit:"EGP/g (24K reference)",usdPerOunce:g.price,fx:egp,markets,updatedAt:new Date().toISOString(),stale:false}}catch{try{const [r,markets]=await Promise.all([timeout("https://goldpriceo.com/egypt.html",5000),extraMarkets()]);if(!r.ok)throw new Error("goldpriceo");const h=await r.text();const m=h.match(/(?:عيار 24|24K)[^0-9]{0,120}([0-9][0-9,]*(?:\.[0-9]+)?)/i);const p=Number((m?.[1]||"").replace(/,/g,""));if(!p||p<1000||p>20000)throw new Error("goldpriceo_data");return{ok:true,provider:"GoldPriceO Egypt",price:p,unit:"EGP/g (24K reference)",markets,updatedAt:new Date().toISOString(),stale:false}}catch{return{ok:false,provider:"gold providers unavailable",stale:true,message:"Gold providers temporarily unavailable",markets:await extraMarkets()}}}}

export async function prayerTimes(cityInput?:string,countryInput?:string){
  const city=String(cityInput||"Hurghada").trim().slice(0,100)||"Hurghada";
  const country=String(countryInput||"Egypt").trim().slice(0,100)||"Egypt";
  try{
    const url="https://api.aladhan.com/v1/timingsByCity?city="+encodeURIComponent(city)+"&country="+encodeURIComponent(country)+"&method=5";
    const r=await timeout(url,6000);if(!r.ok)throw new Error("prayer_provider");
    const d=await r.json<any>();const data=d?.data;
    if(d?.code!==200||!data?.timings||!data?.date?.hijri)throw new Error("prayer_payload");
    const hijri=data.date.hijri;
    let ramadan:any=null,eidFitr:any=null,eidAdha:any=null;
    const hijriYear=Number(hijri.year),hijriMonth=Number(hijri.month?.number||0),nextRamadanYear=hijriMonth>=9?hijriYear+1:hijriYear;
    const convert=async(date:string)=>{try{const response=await timeout("https://api.aladhan.com/v1/hToG/"+date,3500);if(!response.ok)return null;const payload=await response.json<any>();return payload?.code===200?payload.data?.gregorian:null}catch{return null}};
    const [rDate,fDate,aDate]=await Promise.all([
      convert("01-09-"+nextRamadanYear),
      convert("01-10-"+nextRamadanYear),
      convert("10-12-"+(hijriMonth>=12?hijriYear+1:hijriYear))
    ]);
    if(rDate)ramadan={date:rDate.date,readable:rDate.date, hijriYear:nextRamadanYear,certainty:"calculated_estimate"};
    if(fDate)eidFitr={date:fDate.date,readable:fDate.date,certainty:"calculated_estimate",prayerTime:null};
    if(aDate)eidAdha={date:aDate.date,readable:aDate.date,certainty:"calculated_estimate",prayerTime:null};
    return{ok:true,provider:"AlAdhan",city,country,timezone:data.meta?.timezone||"",gregorian:data.date?.gregorian,hijri:{day:hijri.day,month:hijri.month?.en,monthAr:hijri.month?.ar,year:hijri.year,designation:hijri.designation?.abbreviated},timings:{Fajr:data.timings.Fajr,Sunrise:data.timings.Sunrise,Dhuhr:data.timings.Dhuhr,Asr:data.timings.Asr,Maghrib:data.timings.Maghrib,Isha:data.timings.Isha},events:{ramadan,eidFitr,eidAdha},eidPrayerNotice:"Eid prayer time is announced locally by the relevant religious authority; no unverified time is shown.",updatedAt:new Date().toISOString(),stale:false};
  }catch{return{ok:false,provider:"AlAdhan",city,country,stale:true,message:"Prayer times are temporarily unavailable"}}
}
