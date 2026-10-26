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
    archiveReadyForArticleDraftingCount:response.headers.get("x-bayan-news-sitemap-archive-ready-for-drafting-count"),
    eligibleCount:response.headers.get("x-bayan-news-sitemap-eligible-count"),
    rejectedCount:response.headers.get("x-bayan-news-sitemap-rejected-count"),
    rejectionReasons:response.headers.get("x-bayan-news-sitemap-rejection-reasons"),
    xmlBytes:new TextEncoder().encode(xml).length
  };
  console.log("NEWS_SITEMAP_DIAGNOSTICS "+JSON.stringify(diagnostics));
  // Also expose the counts as a run annotation so they are readable without downloading logs (non-blocking).
  console.log("::notice title=NEWS_SITEMAP_DIAGNOSTICS::"+JSON.stringify(diagnostics).slice(0,900));
}catch(error){
  console.log("NEWS_SITEMAP_DIAGNOSTICS "+JSON.stringify({url,error:error instanceof Error?error.message:String(error)}));
}
