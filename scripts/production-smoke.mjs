const origin=process.env.BAYAN_ORIGIN||"https://bayan.tahaomar411.workers.dev";
const checks=["/","/saved?lang=ar","/tools?lang=ar","/about?lang=ar","/methodology?lang=ar","/privacy?lang=ar","/terms?lang=ar","/api/health","/api/features","/api/live/weather","/api/live/fx","/api/live/gold","/news?lang=ar","/prices?lang=ar","/art?lang=ar","/trends?lang=ar","/robots.txt","/sitemap.xml","/news-sitemap.xml"];
const sections=["science","technology","economy","politics","health","history","people","sports","travel","art","trends","egypt","arab","world"];
let bad=0;
async function get(path){
  const r=await fetch(origin+path,{redirect:"manual",headers:{accept:"application/json,text/plain,*/*"}});
  const text=await r.text();
  console.log(path,r.status,text.slice(0,220));
  if(!r.ok)throw new Error(path+" status "+r.status);
  return{text,status:r.status,headers:r.headers};
}
for(const path of checks){try{await get(path)}catch(e){console.error(e);bad++}}
try{
  const h=await get("/?lang=en");
  if(!/<html[^>]+lang="en"/.test(h.text))throw new Error("english_lang_missing");
  if(!h.text.includes("app-20261006-16.js"))throw new Error("current_bundle_missing");
  if(!h.text.includes("app-20261006-16.js?v=2026.10.07.20"))throw new Error("current_shell_bundle_version_missing");
}catch(e){console.error("SHELL",e);bad++}
try{
  const js=await get("/app-20261006-16.js");
  if(!js.text.includes("drawer.querySelectorAll"))throw new Error("drawer_close_handler_missing");
  if(js.text.includes("Daily wisdom")||js.text.includes("الحكمة اليومية"))throw new Error("obsolete_wisdom_content_present");
  if(!js.text.includes("home-news")||!js.text.includes("home-featured"))throw new Error("homepage_content_sections_missing");
}catch(e){console.error("BUNDLE",e);bad++}
try{
  const w=await get("/api/wisdom?section=arab&lang=ar"); const wd=JSON.parse(w.text); if(!wd.wisdom||!/[\u0600-\u06ff]/.test(String(wd.wisdom)))throw new Error("wisdom_missing");
  const n=await get("/api/news?lang=ar"); const d=JSON.parse(n.text);
  if(!Array.isArray(d.items)||d.items.length<3)throw new Error("news_too_few");
  if(d.items.filter(x=>x.imageUrl).length<Math.min(3,d.items.length))throw new Error("news_images_missing");
  const dates=d.items.map(x=>Date.parse(x.publishedAt||"")).filter(Number.isFinite);
  if(dates.length&&Math.max(...dates)<Date.now()-72*60*60*1000)throw new Error("news_is_stale");
  const first=d.items[0];
  const a=await get("/api/news/article?title="+encodeURIComponent(first.title)+"&image="+encodeURIComponent(first.imageUrl||"")+"&lang=ar");
  const ad=JSON.parse(a.text); if(!ad.ok||!ad.article?.title||!ad.article?.body)throw new Error("news_article_incomplete");
  if(/[A-Za-z]{5,}/.test(String(first.title))&&!/[\u0600-\u06ff]/.test(String(first.title)))throw new Error("arabic_news_title_missing");
}catch(e){console.error("NEWS",e);bad++}
try{
  const im=await get("/api/image?q=%D9%86%D8%AC%D9%8A%D8%A8%20%D9%85%D8%AD%D9%81%D9%88%D8%B8"); if(!JSON.parse(im.text).imageUrl)throw new Error("content_image_missing");
}catch(e){console.error("IMAGE",e);bad++}
try{
  const a=await get("/api/article?slug=who-is-naguib-mahfouz-ar&lang=ar"); const ad=JSON.parse(a.text);
  if(!ad.title||!ad.body)throw new Error("article_incomplete");
  if(!/[\u0600-\u06ff]/.test(String(ad.title)))throw new Error("arabic_article_missing");
  if(!/[\u0600-\u06ff]/.test(String(ad.body)))throw new Error("arabic_article_body_missing");
}catch(e){console.error("ARTICLE",e);bad++}
try{
  const s=await get("/api/search?q=%D9%86%D8%AC%D9%8A%D8%A8%20%D9%85%D8%AD%D9%81%D9%88%D8%B8&lang=ar"); const d=JSON.parse(s.text);
  if(!Array.isArray(d.results)||d.results.length<1)throw new Error("search_empty");
  if(!Array.isArray(d.providerAttempted)||d.providerAttempted.length<5)throw new Error("provider_coverage_missing");
}catch(e){console.error("SEARCH",e);bad++}
for(const section of sections){
  for(const language of ["ar","en"]){
    try{
      const x=await get("/api/section?section="+section+"&lang="+language); const d=JSON.parse(x.text);
      if(!Array.isArray(d.items)||d.items.length<2)throw new Error(section+"_"+language+"_needs_at_least_two_articles");
      const badLanguage=language==="ar"?d.items.filter(x=>!/[\u0600-\u06ff]/.test(String(x.title))).length:0;
      if(badLanguage>d.items.length/2)throw new Error(section+"_"+language+"_content_language_mismatch");
    }catch(e){console.error("SECTION",section,language,e);bad++}
  }
}
try{const a=await fetch(origin+"/api/admin/analytics",{headers:{accept:"application/json"}});if(a.status!==401)throw new Error("admin_auth_not_enforced")}catch(e){console.error("ADMIN_AUTH",e);bad++}
if(bad)process.exit(1);
console.log("BAYAN production smoke passed");
