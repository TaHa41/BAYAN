import {parseNewsSitemap} from "./news-sitemap-contract.mjs";
// Surface the exact failure reason as a GitHub annotation so it is readable without downloading job logs.
process.on("unhandledRejection",(error)=>{
  const message=String(error&&error.message||error).replace(/[\r\n]+/g," ").slice(0,900);
  console.log("::error title=BAYAN health check failed::"+message);
  process.exit(1);
});
const origin=(process.env.BAYAN_ORIGIN||"https://bayan.tahaomar411.workers.dev").replace(/\/$/,"");
const response=await fetch(origin+"/api/health",{headers:{accept:"application/json"},signal:AbortSignal.timeout(10000)});
const raw=await response.text();
if(!response.ok)throw new Error("health endpoint returned HTTP "+response.status+": "+raw.slice(0,250));
let data;
try{data=JSON.parse(raw)}catch{throw new Error("health endpoint returned invalid JSON")}
if(data.ok!==true||data.database!==true||!data.checkedAt)throw new Error("health endpoint did not confirm database readiness: "+JSON.stringify(data).slice(0,500));
for(const [name,value] of [["x-content-type-options","nosniff"],["x-frame-options","DENY"],["referrer-policy","strict-origin-when-cross-origin"]]){
  if(response.headers.get(name)!==value)throw new Error("health endpoint missing security header "+name);
}
const sitemapResponse=await fetch(origin+"/news-sitemap.xml",{headers:{accept:"application/xml"},signal:AbortSignal.timeout(12000)});
const archiveReady=Number(sitemapResponse.headers.get("x-bayan-news-sitemap-archive-ready-for-drafting-count")||0);
const eligible=Number(sitemapResponse.headers.get("x-bayan-news-sitemap-eligible-count")||0);
if(sitemapResponse.status===503&&eligible===0){
  console.log("BAYAN news sitemap unavailable because no eligible recent full articles are published "+JSON.stringify({archiveReady,eligible}));
  if(archiveReady>0)throw new Error("news_publication_gap: archive has "+archiveReady+" candidates ready for article drafting but the news sitemap contains no published articles");
}else{
  if(!sitemapResponse.ok)throw new Error("news sitemap returned HTTP "+sitemapResponse.status);
  const sitemapXml=await sitemapResponse.text();
  const sitemap=parseNewsSitemap(sitemapXml,origin);
  console.log("BAYAN news publication health "+JSON.stringify({urlCount:sitemap.urlCount,newsArticleCount:sitemap.newsArticleCount,articleUrlCount:sitemap.articleUrlCount,archiveReady,eligible}));
  if(sitemap.newsArticleCount===0&&archiveReady>0)throw new Error("news_publication_gap: archive has "+archiveReady+" candidates ready for article drafting but the news sitemap contains no published articles");
}
console.log("BAYAN post-deploy health passed; database readiness, security headers and news publication coverage confirmed.");
