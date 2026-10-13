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
const next=source.replace(matches[0],'const BUILD="'+buildId+'";');
if(next===source){
  throw new Error("Could not replace the BUILD declaration.");
}
writeFileSync(path,next,"utf8");
console.log("Injected commit-specific cache-busting build ID: "+buildId);
