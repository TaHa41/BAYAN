import {spawnSync} from "node:child_process";

const origin=(process.env.BAYAN_ORIGIN||"https://bayan.tahaomar411.workers.dev").replace(/\/$/,"");
const token=String(process.env.BAYAN_AI_MANAGER_TOKEN||"").trim();
const timeout=18*60*1000;

function smoke(label){
  console.log("\n=== "+label+" ===");
  const result=spawnSync(process.execPath,["scripts/production-smoke.mjs"],{
    env:{...process.env,BAYAN_ORIGIN:origin},
    stdio:"inherit",
    timeout,
    maxBuffer:1024*1024
  });
  if(result.error)console.error(label+" could not complete:",String(result.error));
  return result.status===0;
}

if(smoke("Initial production verification")){
  console.log("Production verification passed; no repair was needed.");
  process.exit(0);
}

console.error("Production verification failed.");
if(!token){
  console.error("Automatic runtime repair was not invoked because BAYAN_AI_MANAGER_TOKEN is not configured as a GitHub Actions secret. Configure that secret to enable authenticated repair-and-retest.");
  process.exit(1);
}

try{
  const response=await fetch(origin+"/api/admin/repair",{
    method:"POST",
    headers:{
      "authorization":"Bearer "+token,
      "accept":"application/json",
      "content-type":"application/json"
    },
    body:"{}",
    signal:AbortSignal.timeout(25000)
  });
  const body=await response.text();
  console.log("Authenticated runtime repair endpoint returned HTTP "+response.status+".");
  try{
    const result=JSON.parse(body);
    console.log("Repair verification:",String(result.verification||result.health?.verification||"not reported"));
    console.log("Repair actions:",JSON.stringify(result.actions||result.health?.actions||[]).slice(0,2500));
    console.log("Remaining failures:",JSON.stringify(result.failures||result.health?.failures||[]).slice(0,1000));
  }catch{
    console.log("Repair response was not JSON:",body.slice(0,500));
  }
  if(!response.ok)console.error("The repair endpoint did not report HTTP success; a final smoke test will still run.");
}catch(error){
  console.error("Could not invoke the runtime repair endpoint:",String(error));
}

if(smoke("Post-repair production verification")){
  console.log("Production verification passed after the repair attempt.");
  process.exit(0);
}

console.error("Production verification still fails after the repair attempt. Manual/code-level repair is required; the workflow will remain failed.");
process.exit(1);
