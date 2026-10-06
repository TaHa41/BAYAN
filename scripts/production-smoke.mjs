const origin=process.env.BAYAN_ORIGIN||"https://bayan.tahaomar411.workers.dev";
const checks=["/","/api/health","/api/features","/api/live/weather","/api/live/fx","/api/live/gold","/robots.txt","/sitemap.xml","/news-sitemap.xml"];
const sections=["egypt","arab","world","science","economy","politics","technology","health","history","people","sports","travel","trends"];
let bad=0;
async function get(path){
  const r=await fetch(origin+path,{redirect:"manual",headers:{accept:"application/json,text/plain,*/*"}});
  const text=await r.text();
  console.log(path,r.status,text.slice(0,220));
  if(!r.ok)throw new Error(path+" status "+r.status);
  return{text,status:r.status,headers:r.headers};
}
for(const path of checks){try{await get(path)}catch(e){console.error(e);bad++}}
try{const rb=await get("/robots.txt");if(/Disallow:\s*\/api\/\s*$/.test(rb.text))throw new Error("robots_blocks_public_api");if(!rb.text.includes("/news-sitemap.xml"))throw new Error("news_sitemap_missing")}catch(e){console.error("SEO",e);bad++}
try{
  const js=await get("/app.js");
  const immutable=await get("/app-20261006.js");
  for(const [name,bundle] of [["app.js",js],["app-20261006.js",immutable]]){
    if(!bundle.text.includes("Daily wisdom")||!bundle.text.includes("الحكمة اليومية"))throw new Error(name+"_daily_wisdom_missing");
    if(!bundle.text.includes("home-news")||!bundle.text.includes("home-featured"))throw new Error(name+"_homepage_content_sections_missing");
    if(bundle.text.includes('section:"topics"'))throw new Error(name+"_stale_topics_taxonomy");
  }
}catch(e){console.error("WISDOM",e);bad++}
try{
  const h=await get("/?lang=en");
  if(!/<html[^>]+lang="en"/.test(h.text))throw new Error("english_lang_missing");
  if(!h.text.includes("/app-20261006.js?v=2026.10.06.6"))throw new Error("current_shell_bundle_missing");
  if(!h.text.includes("BAYAN | Knowledge, Evidence & Context"))throw new Error("current_shell_marker_missing");
  if(h.headers.get("x-bayan-build")!=="2026.10.06.6")throw new Error("current_build_header_missing");
}catch(e){console.error("EN",e);bad++}
try{
  const n=await get("/api/news?lang=ar"); const d=JSON.parse(n.text);
  if(!Array.isArray(d.items)||d.items.length<3)throw new Error("news_too_few");
  if(d.items.filter(x=>x.imageUrl).length<Math.min(3,d.items.length))throw new Error("news_images_missing");
  const dates=d.items.map(x=>Date.parse(x.publishedAt||"")).filter(Number.isFinite);
  if(dates.length&&Math.max(...dates)<Date.now()-72*60*60*1000)throw new Error("news_is_stale");
  const first=d.items[0]; if(!first?.title)throw new Error("news_article_seed_missing");
  const a=await get("/api/news/article?title="+encodeURIComponent(first.title)+"&image="+encodeURIComponent(first.imageUrl||"")+"&lang=ar");
  const ad=JSON.parse(a.text); if(!ad.ok||!ad.article?.title||!ad.article?.body)throw new Error("news_article_incomplete");
}catch(e){console.error("NEWS",e);bad++}
try{
  const im=await get("/api/image?q=%D9%86%D8%AC%D9%8A%D8%A8%20%D9%85%D8%AD%D9%81%D9%88%D8%B8"); const id=JSON.parse(im.text);
  if(!id.imageUrl)throw new Error("content_image_missing");
}catch(e){console.error("IMAGE",e);bad++}
try{
  const a=await get("/api/article?slug=who-is-naguib-mahfouz-ar&lang=ar"); const ad=JSON.parse(a.text);
  if(!ad.title||!ad.body)throw new Error("article_incomplete");
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
    }catch(e){console.error("SECTION",section,language,e);bad++}
  }
}
try{const a=await fetch(origin+"/api/admin/analytics",{headers:{accept:"application/json"}});if(a.status!==401)throw new Error("admin_auth_not_enforced");}catch(e){console.error("ADMIN_AUTH",e);bad++}
if(bad)process.exit(1);
console.log("BAYAN production smoke passed");
