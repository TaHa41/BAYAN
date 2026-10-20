const origin=(process.env.BAYAN_ORIGIN||"https://bayan.tahaomar411.workers.dev").replace(/\/$/,"");
const queries=[
  {label:"Arabic person",q:"محمد صلاح",lang:"ar",minResults:2},
  {label:"Arabic place",q:"أهرامات الجيزة",lang:"ar",minResults:2},
  {label:"Arabic science",q:"الجاذبية",lang:"ar",minResults:2},
  {label:"English person",q:"Mohamed Salah",lang:"en",minResults:2},
  {label:"English history",q:"World War II",lang:"en",minResults:2},
  {label:"Recent news evidence diversity",q:"At least four dead after flooding in eastern Spain",lang:"en",minResults:2,minHosts:5}
];
const excludedHosts=["news.google.com","bing.com","duckduckgo.com","wikipedia.org","wikidata.org"];
let failures=0;
for(const query of queries){
  try{
    const url=origin+"/api/search?q="+encodeURIComponent(query.q)+"&lang="+query.lang;
    const response=await fetch(url,{headers:{accept:"application/json"},signal:AbortSignal.timeout(20000)});
    const raw=await response.text();
    let data;
    try{data=JSON.parse(raw)}catch{throw new Error("invalid_json status="+response.status+" body="+raw.slice(0,100))}
    if(!response.ok||!data.ok||!Array.isArray(data.results))throw new Error("search_http_or_payload_failure status="+response.status+" message="+String(data.message||data.error||"missing_results"));
    const hosts=new Set(),providers=new Set();
    for(const item of data.results){
      if(item.provider)providers.add(String(item.provider));
      const sources=[...(Array.isArray(item.sources)?item.sources:[]),...(item.url?[{url:item.url,publisher:item.publisher||item.source||""}]:[])];
      for(const source of sources){
        const rawUrl=String(source.url||"");
        try{
          const parsed=new URL(rawUrl);
          const host=parsed.hostname.toLowerCase().replace(/^www\./,"");
          if(parsed.protocol==="https:"&&!excludedHosts.some(domain=>host===domain||host.endsWith("."+domain)))hosts.add(host);
        }catch(error){void error;}
      }
    }
    console.log("SEARCH_SMOKE",JSON.stringify({query:query.label,lang:query.lang,results:data.results.length,hosts:[...hosts].sort(),providers:[...providers].sort()}));
    if(data.results.length<query.minResults)throw new Error("too_few_results actual="+data.results.length+" required="+query.minResults);
    if(query.minHosts&&hosts.size<query.minHosts)throw new Error("independent_host_diversity_below_threshold actual="+hosts.size+" required="+query.minHosts);
  }catch(error){
    failures++;
    console.error("SEARCH_SMOKE_FAILED",query.label,String(error));
  }
}
if(failures){console.error("PRODUCTION_SEARCH_SMOKE_FAILED",failures);process.exit(1)}
console.log("PRODUCTION_SEARCH_SMOKE_PASSED",queries.length);
