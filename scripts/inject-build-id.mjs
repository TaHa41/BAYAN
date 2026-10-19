import {readFileSync,writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";

export function injectBuildId({sha,sourcePath="src/index.ts",configPath="wrangler.jsonc"}){
  const commit=String(sha||"").trim().toLowerCase();
  if(!/^[a-f0-9]{40}$/.test(commit)){
    throw new Error("GITHUB_SHA must be the full 40-character commit SHA before injecting a deployment build ID.");
  }
  const source=readFileSync(sourcePath,"utf8");
  const buildMatches=source.match(/const BUILD="[^"]+";/g)||[];
  if(buildMatches.length!==1){
    throw new Error("Expected exactly one static BUILD declaration in src/index.ts; found "+buildMatches.length+".");
  }
  const commitMatches=source.match(/const COMMIT_SHA="[a-f0-9]{40}";/g)||[];
  if(commitMatches.length!==1){
    throw new Error("Expected exactly one COMMIT_SHA declaration; found "+commitMatches.length+".");
  }
  // This is the normalized full-SHA equivalent of sha.slice(0,12), used for cache busting.\n  const buildId=commit.slice(0,12);
  const nextSource=source
    .replace(buildMatches[0],'const BUILD="'+buildId+'";')
    .replace(commitMatches[0],'const COMMIT_SHA="'+commit+'";');
  if(!nextSource.includes('const COMMIT_SHA="'+commit+'";')||!nextSource.includes('const BUILD="'+buildId+'";')){
    throw new Error("Could not inject the full commit SHA and build ID.");
  }

  // keep_vars preserves dashboard-only variables. Explicitly declare this
  // commit marker in Wrangler config so a stale dashboard BAYAN_COMMIT_SHA
  // cannot survive a successful deploy and misidentify repair jobs.
  const configText=readFileSync(configPath,"utf8");
  let wrangler;
  try{wrangler=JSON.parse(configText)}catch(error){throw new Error("wrangler.jsonc must remain JSON-compatible for build identity injection: "+String(error))}
  if(!wrangler||typeof wrangler!=="object"||Array.isArray(wrangler))throw new Error("wrangler.jsonc root must be an object.");
  if(wrangler.vars===undefined)wrangler.vars={};
  if(!wrangler.vars||typeof wrangler.vars!=="object"||Array.isArray(wrangler.vars))throw new Error("wrangler.jsonc vars must be an object.");
  wrangler.vars.BAYAN_COMMIT_SHA=commit;
  const nextConfig=JSON.stringify(wrangler,null,2)+"\n";
  // Validate both outputs before writing either file.
  const verifiedConfig=JSON.parse(nextConfig);
  if(verifiedConfig.vars?.BAYAN_COMMIT_SHA!==commit)throw new Error("BAYAN_COMMIT_SHA injection validation failed.");
  writeFileSync(sourcePath,nextSource,"utf8");
  writeFileSync(configPath,nextConfig,"utf8");
  console.log("Injected full commit SHA into application and Worker binding: "+commit+" / "+buildId);
  return {commit,buildId};
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
  injectBuildId({sha:process.env.GITHUB_SHA});
}
