import type {Env} from "../types";import{recordRuntimeEventLimited}from"../runtime-events";
const timeout=async(url:string,ms=5000)=>{const c=new AbortController();const t=setTimeout(()=>c.abort(),ms);try{return await fetch(url,{signal:c.signal,headers:{accept:"application/json"}})}finally{clearTimeout(t)}};
async function mapWithConcurrency<T,R>(items:T[],limit:number,worker:(item:T)=>Promise<R>):Promise<R[]>{
  const results:R[]=new Array(items.length);
  let cursor=0;
  const workerCount=Math.min(items.length,Math.max(1,Math.floor(limit)||1));
  await Promise.all(Array.from({length:workerCount},async()=>{
    while(true){
      const index=cursor++;
      if(index>=items.length)return;
      results[index]=await worker(items[index]);
    }
  }));
  return results;
}
export async function weather(cityInput?:string,env?:Env){
  const city=String(cityInput||"Hurghada").trim().slice(0,100)||"Hurghada";
  try{
    // Geocode in the language the visitor typed (Arabic names such as "القاهرة" do not resolve with language=en),
    // ask for several matches and prefer an exact-name hit before falling back to the top result.
    const geoLanguage=/[\u0600-\u06ff]/.test(city)?"ar":"en";
    let gd:any=null;
    for(let attempt=0;attempt<2&&!gd;attempt++){
      try{const geo=await timeout("https://geocoding-api.open-meteo.com/v1/search?name="+encodeURIComponent(city)+"&count=5&language="+geoLanguage+"&format=json",3500);if(geo.ok)gd=await geo.json<any>()}catch(error){if(env)await recordRuntimeEventLimited(env,"weather_provider","weather_geocoding_attempt_failed",error)}
    }
    if(!gd)throw new Error("weather_geocoding");
    const normName=(v:string)=>String(v||"").normalize("NFKD").toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g," ").trim();
    const rows=Array.isArray(gd.results)?gd.results:[];
    const place=rows.find((x:any)=>normName(x.name)===normName(city))||rows[0];
    if(!place||!Number.isFinite(Number(place.latitude))||!Number.isFinite(Number(place.longitude)))return{ok:false,provider:"Open-Meteo",stale:true,city,message:"City not found"};
    const url="https://api.open-meteo.com/v1/forecast?latitude="+encodeURIComponent(String(place.latitude))+"&longitude="+encodeURIComponent(String(place.longitude))+"&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto";
    const r=await timeout(url,5000);if(!r.ok)throw new Error("weather_forecast");
    const d=await r.json<any>();
    return{ok:true,provider:"Open-Meteo",city:place.name,region:place.admin1||"",country:place.country||"",latitude:place.latitude,longitude:place.longitude,current:d.current,timezone:d.timezone,stale:false,updatedAt:new Date().toISOString()};
  }catch(error){if(env)await recordRuntimeEventLimited(env,"weather_provider","weather_lookup_failed",error);return{ok:false,provider:"Open-Meteo",stale:true,city,message:"Weather provider temporarily unavailable"}}
}
export function parseUsdToEgpRate(data:unknown):number|undefined{
 const value=data as any;
 const raw=Array.isArray(value)
  ?value.find((row:any)=>String(row?.quote||"").toUpperCase()==="EGP"&&(!row?.base||String(row.base).toUpperCase()==="USD"))?.rate
  :value?.rates?.EGP??value?.EGP;
 const rate=Number(raw);
 return Number.isFinite(rate)&&rate>0?rate:undefined;
}
export async function fx(env?:Env){
  try{
    const r=await timeout("https://api.frankfurter.dev/v2/rates?base=USD&quotes=EGP,EUR,GBP,SAR,AED,KWD,QAR,BHD,OMR,JOD,TRY,JPY,CNY,CAD,AUD,CHF,INR,ILS,LYD,TND,MAD,ZAR");
    if(!r.ok)throw new Error("frankfurter_http_"+r.status);
    const d=await r.json<any>();
    const rates=Array.isArray(d)?Object.fromEntries(d.map((x:any)=>[String(x.quote).toUpperCase(),Number(x.rate)])):d.rates;
    if(!Number.isFinite(Number(rates?.EGP))||Number(rates.EGP)<=0)throw new Error("frankfurter_egp_unavailable");
    return{ok:true,provider:"Frankfurter v2",base:"USD",rates,updatedAt:new Date().toISOString(),stale:false};
  }catch(error){
    if(env)await recordRuntimeEventLimited(env,"fx_provider","fx_primary_failed",error);
  }
  try{
    const r=await timeout("https://open.er-api.com/v6/latest/USD",3500);
    if(!r.ok)throw new Error("exchange_rate_api_http_"+r.status);
    const d=await r.json<any>(),rates=d?.rates,egp=Number(rates?.EGP);
    if(d?.result!=="success"||!Number.isFinite(egp)||egp<=0)throw new Error("exchange_rate_api_invalid_data");
    const unix=Number(d?.time_last_update_unix);
    const stamp=Number.isFinite(unix)&&unix>0?unix*1000:Date.parse(String(d?.time_last_update_utc||""));
    if(!Number.isFinite(stamp)||stamp<=0||stamp>Date.now()+5*60*1000)throw new Error("exchange_rate_api_invalid_timestamp");
    const updatedAt=new Date(stamp).toISOString();
    return{ok:true,provider:"ExchangeRate-API Open Access (exchangerate-api.com; daily reference)",base:"USD",rates,updatedAt,stale:Date.now()-stamp>36*60*60*1000};
  }catch(error){
    if(env)await recordRuntimeEventLimited(env,"fx_provider","fx_fallback_failed",error);
    return{ok:false,provider:"Frankfurter / ExchangeRate-API",stale:true,message:"FX providers temporarily unavailable"};
  }
}
let yahooRateLimitedUntil=0;
async function preciousMetalQuote(symbol:string,metal:"XAG",env?:Env){
  try{
    const r=await timeout("https://api.gold-api.com/price/"+metal,3500);
    if(!r.ok)return null;
    const d=await r.json<any>(),price=Number(d?.symbols?.[0]?.price??d?.price);
    if(!Number.isFinite(price)||price<=0)return null;
    const stamp=Date.parse(String(d?.updatedAt||d?.updated_at||d?.timestamp||""));
    return{symbol,price,currency:"USD",provider:"Gold API",updatedAt:Number.isFinite(stamp)?new Date(stamp).toISOString():new Date().toISOString(),stale:!Number.isFinite(stamp)};
  }catch(error){if(env)await recordRuntimeEventLimited(env,"market_precious_metal_provider","precious_metal_quote_failed",error);return null}
}
async function cryptoQuote(symbol:string,id:string,pair:string,env?:Env){
  const [coingecko,binance]=await Promise.all([
    (async()=>{try{
      const r=await timeout("https://api.coingecko.com/api/v3/simple/price?ids="+encodeURIComponent(id)+"&vs_currencies=usd&include_last_updated_at=true",3500);
      if(!r.ok)return null;
      const d=await r.json<any>(),row=d?.[id],price=Number(row?.usd),stamp=Number(row?.last_updated_at);
      if(!Number.isFinite(price)||price<=0)return null;
      return{symbol,price,currency:"USD",provider:"CoinGecko",updatedAt:stamp?new Date(stamp*1000).toISOString():new Date().toISOString(),stale:!stamp};
    }catch(error){if(env)await recordRuntimeEventLimited(env,"market_crypto_provider","coingecko_quote_failed",error);return null}})(),
    (async()=>{try{
      const r=await timeout("https://api.binance.com/api/v3/ticker/price?symbol="+encodeURIComponent(pair),3500);
      if(!r.ok)return null;
      const d=await r.json<any>(),price=Number(d?.price);
      if(!Number.isFinite(price)||price<=0)return null;
      return{symbol,price,currency:"USDT",provider:"Binance",updatedAt:new Date().toISOString(),stale:true};
    }catch(error){if(env)await recordRuntimeEventLimited(env,"market_crypto_provider","binance_quote_failed",error);return null}})()
  ]);
  return coingecko||binance;
}
export async function marketQuote(symbol:string,env?:Env){
  const yahooFailures:string[]=[];
  const yahooQuote=async(host:string)=>{
    try{
      const r=await timeout("https://"+host+"/v8/finance/chart/"+encodeURIComponent(symbol)+"?range=1d&interval=1d",3500);
      if(!r.ok){
        yahooFailures.push(host+":http_"+r.status);
        if(r.status===429)yahooRateLimitedUntil=Math.max(yahooRateLimitedUntil,Date.now()+15*60*1000);
        return null;
      }
      const d=await r.json<any>(),meta=d?.chart?.result?.[0]?.meta,price=Number(meta?.regularMarketPrice);
      if(!Number.isFinite(price)||price<=0){yahooFailures.push(host+":empty_quote");return null;}
      return{symbol,price,currency:String(meta?.currency||"USD"),provider:"Yahoo Finance",updatedAt:meta?.regularMarketTime?new Date(Number(meta.regularMarketTime)*1000).toISOString():new Date().toISOString(),stale:false};
    }catch(error){yahooFailures.push(host+":"+String(error instanceof Error?error.message:error).slice(0,100));return null;}
  };
  const logYahooFailure=async()=>{
    if(env&&yahooFailures.length)await recordRuntimeEventLimited(env,"market_yahoo_provider","yahoo_quote_failed",yahooFailures.join("; "));
  };
  const freeFallback=async()=>{
    if(symbol==="BTC-USD")return await cryptoQuote(symbol,"bitcoin","BTCUSDT",env);
    if(symbol==="ETH-USD")return await cryptoQuote(symbol,"ethereum","ETHUSDT",env);
    if(symbol==="SI=F")return await preciousMetalQuote(symbol,"XAG",env);
     return null;
  };

  if(Date.now()<yahooRateLimitedUntil)return await freeFallback();
  const primary=await yahooQuote("query1.finance.yahoo.com");
  if(primary)return primary;
  if(Date.now()<yahooRateLimitedUntil){
    const fallback=await freeFallback();
    if(fallback)return fallback;
    await logYahooFailure();
    return null;
  }
  const mirror=await yahooQuote("query2.finance.yahoo.com");
  if(mirror)return mirror;
  const fallback=await freeFallback();
  if(fallback)return fallback;
  await logYahooFailure();
  return null;
}
async function extraMarkets(env?:Env){
  const quotes=await mapWithConcurrency(["SI=F","CL=F","GC=F","BTC-USD","ETH-USD","^GSPC","^IXIC"],4,symbol=>marketQuote(symbol,env));
  const names:Record<string,{ar:string;en:string;unit:string;unitAr:string;unitEn:string}>={"SI=F":{ar:"الفضة",en:"Silver",unit:"USD / troy ounce",unitAr:"دولار أمريكي / أونصة تروي",unitEn:"USD / troy ounce"},"CL=F":{ar:"النفط الخام",en:"Crude oil",unit:"USD / barrel",unitAr:"دولار أمريكي / برميل",unitEn:"USD / barrel"},"GC=F":{ar:"العقود الآجلة للذهب",en:"Gold futures",unit:"USD / troy ounce",unitAr:"دولار أمريكي / أونصة تروي",unitEn:"USD / troy ounce"},"BTC-USD":{ar:"بيتكوين",en:"Bitcoin",unit:"USD",unitAr:"دولار أمريكي",unitEn:"USD"},"ETH-USD":{ar:"إيثيريوم",en:"Ethereum",unit:"USD",unitAr:"دولار أمريكي",unitEn:"USD"},"^GSPC":{ar:"مؤشر S&P 500",en:"S&P 500",unit:"index points",unitAr:"نقطة مؤشر",unitEn:"index points"},"^IXIC":{ar:"مؤشر ناسداك المركب",en:"Nasdaq Composite",unit:"index points",unitAr:"نقطة مؤشر",unitEn:"index points"}};
  return quotes.filter(Boolean).map((q:any)=>({...q,...names[q.symbol]}));
}
export async function gold(env:Env){
  const providers:Array<[string,string]>=[
    ["Gold API","https://api.gold-api.com/price/XAU"],
    ["Yahoo Finance","https://query1.finance.yahoo.com/v8/finance/chart/XAUUSD=X?range=1d&interval=1d"],
    ["CoinGecko PAXG","https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=usd"],
    ["GoldPrice.dev","https://api.goldprice.dev/v1/prices?symbol=XAU-USD-SPOT"]
  ];
  let quote:{name:string;price:number}|null=null;
  // Sequential fallbacks prevent losing Promise.any requests from continuing
  // to consume subrequests and CPU after a quote has already succeeded.
  for(const [name,url] of providers){
    try{
      const response=await timeout(url,3200);
      if(!response.ok)continue;
      const data=await response.json<any>();
      const price=name==="Yahoo Finance"
        ?Number(data?.chart?.result?.[0]?.meta?.regularMarketPrice)
        :name==="CoinGecko PAXG"
          ?Number(data?.["pax-gold"]?.usd)
          :Number(data?.symbols?.[0]?.price??data?.price);
      if(Number.isFinite(price)&&price>0){quote={name,price};break;}
    }catch(error){await recordRuntimeEventLimited(env,"gold_quote_provider","gold_provider_failed",error)}
  }
  if(quote){
    try{
      const [fxData,markets]=await Promise.all([fx(env),extraMarkets(env)]);
      if(!fxData.ok)throw new Error("fx");
      const egp=Number(fxData.rates?.EGP);
      if(!Number.isFinite(egp)||egp<=0)throw new Error("fx_data");
      return{ok:true,provider:quote.name+" + "+fxData.provider,price:(quote.price/31.1034768)*egp,unit:"EGP/g (24K reference)",usdPerOunce:quote.price,fx:egp,fxUpdatedAt:fxData.updatedAt,markets,updatedAt:new Date().toISOString(),stale:Boolean(fxData.stale)};
    }catch(error){await recordRuntimeEventLimited(env,"gold_fx_conversion","gold_fx_conversion_failed",error)}
  }
  try{
    const response=await timeout("https://goldpriceo.com/egypt.html",3200);
    if(response.ok){
      const html=await response.text();
      const match=html.match(/(?:عيار 24|24K)[^0-9]{0,120}([0-9][0-9,]*(?:\.[0-9]+)?)/i);
      const price=Number((match?.[1]||"").replace(/,/g,""));
      if(Number.isFinite(price)&&price>=1000&&price<=20000){
        return{ok:true,provider:"GoldPriceO Egypt",price,unit:"EGP/g (24K reference)",markets:await extraMarkets(env),updatedAt:new Date().toISOString(),stale:false};
      }
    }
  }catch(error){await recordRuntimeEventLimited(env,"gold_fallback_provider","goldprice_fallback_failed",error)}
  // Do not start seven additional quote chains when the gold quote itself failed.
  return{ok:false,provider:"gold providers unavailable",stale:true,message:"Gold providers temporarily unavailable",markets:[]};
}

export async function prayerTimes(cityInput?:string,countryInput?:string,env?:Env){
 const city=String(cityInput||"Hurghada").trim().slice(0,100)||"Hurghada",country=String(countryInput||"Egypt").trim().slice(0,100)||"Egypt";
 try{
  let data:any=null,displayCity=city,displayCountry=country;
  try{
   const geoLanguage=/[\u0600-\u06ff]/.test(city+" "+country)?"ar":"en";
   const geo=await timeout("https://geocoding-api.open-meteo.com/v1/search?name="+encodeURIComponent(city)+"&count=10&language="+geoLanguage+"&format=json",4500);
   if(geo.ok){
    const gd=await geo.json<any>(),rows=Array.isArray(gd.results)?gd.results:[],norm=(v:string)=>String(v||"").normalize("NFKD").toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g," ").trim(),target=norm(country);
    const place=rows.find((x:any)=>norm(x.country)===target)||rows.find((x:any)=>norm(x.country_code)===target)||rows.find((x:any)=>norm(x.name)===norm(city))||rows[0];
    if(place&&Number.isFinite(Number(place.latitude))&&Number.isFinite(Number(place.longitude))){
     displayCity=String(place.name||city);displayCountry=String(place.country||country);
     const r=await timeout("https://api.aladhan.com/v1/timings?latitude="+encodeURIComponent(String(place.latitude))+"&longitude="+encodeURIComponent(String(place.longitude))+"&method=5",6000);
     if(r.ok){const payload=await r.json<any>();if(payload?.code===200&&payload?.data?.timings&&payload?.data?.date?.hijri)data=payload.data;}
    }
   }
  }catch(error){if(env)await recordRuntimeEventLimited(env,"prayer_geocoding","prayer_geocoding_failed",error)}
  if(!data){
   const r=await timeout("https://api.aladhan.com/v1/timingsByCity?city="+encodeURIComponent(city)+"&country="+encodeURIComponent(country)+"&method=5",6000);if(!r.ok)throw new Error("prayer_provider");
   const payload=await r.json<any>();if(payload?.code!==200||!payload?.data?.timings||!payload?.data?.date?.hijri)throw new Error("prayer_payload");data=payload.data;
  }
  const hijri=data.date.hijri;let ramadan:any=null,eidFitr:any=null,eidAdha:any=null;
  const hy=Number(hijri.year),hm=Number(hijri.month?.number||0),hd=Number(hijri.day||1),ry=hm>=9?hy+1:hy,fy=hm>=10?hy+1:hy,ay=hm===12&&hd>10?hy+1:hy;
  const convert=async(date:string)=>{try{const r=await timeout("https://api.aladhan.com/v1/hToG/"+date,3500);if(!r.ok)return null;const p=await r.json<any>();return p?.code===200?p.data?.gregorian:null}catch(error){if(env)await recordRuntimeEventLimited(env,"prayer_hijri_conversion","hijri_date_conversion_failed",error);return null}};
  const [rd,fd,ad]=await Promise.all([convert("01-09-"+ry),convert("01-10-"+fy),convert("10-12-"+ay)]);
  if(rd)ramadan={date:rd.date,readable:rd.date,hijriYear:ry,certainty:"calculated_estimate"};
  if(fd)eidFitr={date:fd.date,readable:fd.date,certainty:"calculated_estimate",prayerTime:null};
  if(ad)eidAdha={date:ad.date,readable:ad.date,certainty:"calculated_estimate",prayerTime:null};
  return{ok:true,provider:"AlAdhan",city:displayCity,country:displayCountry,timezone:data.meta?.timezone||"",gregorian:data.date?.gregorian,hijri:{day:hijri.day,month:hijri.month?.en,monthAr:hijri.month?.ar,year:hijri.year,designation:hijri.designation?.abbreviated},timings:{Fajr:data.timings.Fajr,Sunrise:data.timings.Sunrise,Dhuhr:data.timings.Dhuhr,Asr:data.timings.Asr,Maghrib:data.timings.Maghrib,Isha:data.timings.Isha},events:{ramadan,eidFitr,eidAdha},eidPrayerNotice:"Eid prayer time is announced locally by the relevant religious authority; no unverified time is shown.",updatedAt:new Date().toISOString(),stale:false};
 }catch(error){if(env)await recordRuntimeEventLimited(env,"prayer_provider","prayer_times_lookup_failed",error);return{ok:false,provider:"AlAdhan",city,country,stale:true,message:"Prayer times are temporarily unavailable"}}
}
