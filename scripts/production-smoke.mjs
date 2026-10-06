const origin=process.env.BAYAN_ORIGIN||"https://bayan.tahaomar411.workers.dev";
const checks=["/","/api/health","/api/features","/api/live/weather","/api/live/fx","/api/live/gold","/robots.txt","/sitemap.xml","/news-sitemap.xml"];
const sections=["egypt","arab","world","science","economy","politics","technology","health","history","people","sports","travel","trends"];
let bad=0;
async function get(path){
  const r=await fetch(origin+path,{redirect:"manual",headers:{accept:"application/json,text/plain,*/*"}});
  const text=await r.text();
  console.log(path,r.status,text.slice(0,220));
  if(!r.ok)throw new Error(path+" status "+r.status);
  return{text,status:r.status};
}
for(const path of checks){try{await get(path)}catch(e){console.error(e);bad++}}
try{const rb=await get("/robots.txt");if(/Disallow:\s*\/api\/\s*$/.test(rb.text))throw new Error("robots_blocks_public_api");if(!rb.text.includes("/news-sitemap.xml"))throw new Error("news_sitemap_missing")}catch(e){console.error("SEO",e);bad++}
try{
  const js=await get("/app.js");
  if(!js.text.includes("Daily wisdom")||!js.text.includes("الحكمة اليومية"))throw new Error("daily_wisdom_missing_from_home_bundle");
  if(!js.text.includes("home-news")||!js.text.includes("home-featured"))throw new Error("homepage_content_sections_missing");
  if(js.text.includes('section:"topics"'))throw new Error("stale_topics_taxonomy_in_frontend");
}catch(e){console.error("WISDOM",e);bad++}
try{
  const h=await get("/?lang=en");
  if(/<html[^>]+lang="ar"|بيان|بحث|الأخبار|القائمة/.test(h.text))throw new Error("english_shell_contains_arabic");
  if(!/<html[^>]+lang="en"/.test(h.text))throw new Error("english_lang_missing");
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
  try{
    const x=await get("/api/section?section="+section+"&lang=ar"); const d=JSON.parse(x.text);
    if(!Array.isArray(d.items)||d.items.length<2)throw new Error(section+"_needs_at_least_two_articles");
  }catch(e){console.error("SECTION",section,e);bad++}
}
if(bad)process.exit(1);
console.log("BAYAN production smoke passed");
