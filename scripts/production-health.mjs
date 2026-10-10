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
console.log("BAYAN post-deploy health passed; database readiness and security headers confirmed.");
