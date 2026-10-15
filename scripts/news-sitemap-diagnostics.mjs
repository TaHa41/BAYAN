const origin=String(process.env.BAYAN_PRODUCTION_URL||"https://bayan.tahaomar411.workers.dev").replace(/\/+$/,"");
const url=origin+"/news-sitemap.xml";
try{
  const response=await fetch(url,{headers:{accept:"application/xml"},signal:AbortSignal.timeout(12000)});
  const xml=await response.text();
  const urls=[...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match=>match[1]);
  const diagnostics={
    status:response.status,
    contentType:response.headers.get("content-type"),
    urlCount:urls.length,
    candidateCount:response.headers.get("x-bayan-news-sitemap-candidate-count"),
    archiveCandidateCount:response.headers.get("x-bayan-news-sitemap-archive-candidate-count"),
    archiveEligibleCount:response.headers.get("x-bayan-news-sitemap-archive-eligible-count"),
    eligibleCount:response.headers.get("x-bayan-news-sitemap-eligible-count"),
    rejectedCount:response.headers.get("x-bayan-news-sitemap-rejected-count"),
    rejectionReasons:response.headers.get("x-bayan-news-sitemap-rejection-reasons"),
    xmlBytes:new TextEncoder().encode(xml).length
  };
  console.log("NEWS_SITEMAP_DIAGNOSTICS "+JSON.stringify(diagnostics));
}catch(error){
  console.log("NEWS_SITEMAP_DIAGNOSTICS "+JSON.stringify({url,error:error instanceof Error?error.message:String(error)}));
}
