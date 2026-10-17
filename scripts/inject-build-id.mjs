import {readFileSync,writeFileSync} from "node:fs";

const sha=String(process.env.GITHUB_SHA||"").trim().toLowerCase();
if(!/^[a-f0-9]{40}$/.test(sha)){
  throw new Error("GITHUB_SHA must be the full 40-character commit SHA before injecting a deployment build ID.");
}
const path="src/index.ts";
const source=readFileSync(path,"utf8");
const matches=source.match(/const BUILD="[^"]+";/g)||[];
if(matches.length!==1){
  throw new Error("Expected exactly one static BUILD declaration in src/index.ts; found "+matches.length+".");
}
const buildId=sha.slice(0,12);
const commitMatches=source.match(/const COMMIT_SHA="[a-f0-9]{40}";/g)||[];
if(commitMatches.length!==1){
  throw new Error("Expected exactly one COMMIT_SHA declaration; found "+commitMatches.length+".");
}
const withBuild=source.replace(matches[0],'const BUILD="'+buildId+'";');
const next=withBuild.replace(commitMatches[0],'const COMMIT_SHA="'+sha+'";');
if(next===source||!next.includes('const COMMIT_SHA="'+sha+'";')){
  throw new Error("Could not inject the full commit SHA.");
}
writeFileSync(path,next,"utf8");
console.log("Injected full commit SHA and cache-busting build ID: "+sha+" / "+buildId);
