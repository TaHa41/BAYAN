const base=(process.env.BAYAN_URL||"https://bayan.tahaomar411.workers.dev").replace(/\/$/,"");
const checks=[
  ["/","text/html"],
  ["/health","application/json"],
  ["/api/features","application/json"],
  ["/api/search?q=ما%20هو%20بيان&lang=ar","application/json"],
  ["/api/markets?base=USD&quote=EGP","application/json"],
  ["/api/weather?city=Cairo","application/json"],
  ["/sitemap.xml","application/xml"],
  ["/robots.txt","text/plain"]
];
const failures=[];
const results=[];
for(const [path,type] of checks){
  try{
    const r=await fetch(base+path,{redirect:"follow",cache:"no-store"});
    const contentType=r.headers.get("content-type")||"";
    const text=await r.text();
    const ok=r.ok && contentType.includes(type);
    results.push({path,status:r.status,contentType,ok});
    if(!ok) failures.push({path,status:r.status,contentType,body:text.slice(0,300)});
  }catch(error){
    failures.push({path,error:String(error)});
    results.push({path,status:0,ok:false});
  }
}
const html=results.find(x=>x.path==="/");
console.log(JSON.stringify({base,checkedAt:new Date().toISOString(),ok:failures.length===0,results,failures},null,2));
if(failures.length) process.exit(1);
