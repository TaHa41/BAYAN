import {spawnSync} from "node:child_process";

const origin=(process.env.BAYAN_ORIGIN||"https://bayan.tahaomar411.workers.dev").replace(/\/$/,"");
const token=String(process.env.BAYAN_AI_MANAGER_TOKEN||"").trim();
const timeout=8*60*1000;

function smoke(label){
  console.log("\n=== "+label+" ===");
  const result=spawnSync(process.execPath,["scripts/production-smoke.mjs"],{
    env:{...process.env,BAYAN_ORIGIN:origin},
    stdio:"pipe",
    encoding:"utf8",
    timeout,
    maxBuffer:8*1024*1024
  });
  const stdout=String(result.stdout||""),stderr=String(result.stderr||"");
  if(stdout)process.stdout.write(stdout);
  if(stderr)process.stderr.write(stderr);
  if(result.error)console.error(label+" could not complete:",String(result.error));
  const output=stdout+"\n"+stderr;
  const infrastructureFailure=Boolean(result.error)||result.status===null||/(?:status 50[023]|HTTP 50[023]|temporarily unavailable|database_unavailable|internal_error|D1_ERROR|daily row read limit)/i.test(output);
  return {passed:result.status===0,infrastructureFailure};
}

const initial=smoke("Initial production verification");
if(initial.passed){
  console.log("Production verification passed; no repair was needed.");
  process.exit(0);
}

console.error("Production verification failed.");
if(initial.infrastructureFailure){
  console.error("Infrastructure/database failure detected. Skipping blind runtime repair retries; the underlying service condition must recover before verification can pass.");
  process.exit(1);
}
if(!token){
  console.error("Automatic runtime repair was not invoked because BAYAN_AI_MANAGER_TOKEN is not configured as a GitHub Actions secret. Configure that secret to enable authenticated repair-and-retest.");
  process.exit(1);
}

// Each repair pass is intentionally bounded. Persistent failures should make
// progress across passes without allowing an unbounded deploy job.
const maxRepairPasses=4;
for(let attempt=1;attempt<=maxRepairPasses;attempt++){
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
    console.log("Authenticated runtime repair pass "+attempt+"/"+maxRepairPasses+" returned HTTP "+response.status+".");
    let result;
    try{result=JSON.parse(body)}catch{
      console.log("Repair response was not JSON:",body.slice(0,500));
      break;
    }
    const verification=String(result.verification||result.health?.verification||"not reported");
    const actions=result.actions||result.health?.actions||[];
    const failures=result.failures||result.health?.failures||[];
    console.log("Repair verification:",verification);
    console.log("Repair actions:",JSON.stringify(actions).slice(0,2500));
    console.log("Remaining failures:",JSON.stringify(failures).slice(0,1000));
    if(!response.ok){
      console.error("The repair endpoint did not report HTTP success; stopping repair retries.");
      break;
    }
    if(verification==="verified_runtime"||(result.ok===true&&Array.isArray(failures)&&failures.length===0)){
      console.log("Runtime health verified; no additional repair pass is needed.");
      break;
    }
    if(!Array.isArray(failures)||failures.length===0){
      console.log("The repair endpoint did not provide remaining failures; stopping instead of guessing.");
      break;
    }
  }catch(error){
    console.error("Could not complete authenticated runtime repair pass "+attempt+":",String(error));
    break;
  }
}

if(smoke("Post-repair production verification")){
  console.log("Production verification passed after the repair attempt.");
  process.exit(0);
}

console.error("Production verification still fails after the repair attempt. Manual/code-level repair is required; the workflow will remain failed.");
process.exit(1);
