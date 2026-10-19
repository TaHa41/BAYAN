import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,readFileSync,rmSync,writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {injectBuildId} from "./inject-build-id.mjs";

test("injects the full commit into application and Wrangler binding",()=>{
  const dir=mkdtempSync(join(tmpdir(),"bayan-build-id-"));
  try{
    const sourcePath=join(dir,"index.ts");
    const configPath=join(dir,"wrangler.jsonc");
    writeFileSync(sourcePath,'const BUILD="old-build";\nconst COMMIT_SHA="0000000000000000000000000000000000000000";\n');
    writeFileSync(configPath,JSON.stringify({name:"bayan",keep_vars:true}));
    const sha="8a4f9434eebe6bd8b773e4ec81f708aa44007d70";
    const result=injectBuildId({sha,sourcePath,configPath});
    const source=readFileSync(sourcePath,"utf8");
    const config=JSON.parse(readFileSync(configPath,"utf8"));
    assert.equal(result.commit,sha);
    assert.equal(result.buildId,sha.slice(0,12));
    assert.match(source,new RegExp('const COMMIT_SHA="'+sha+'";'));
    assert.match(source,new RegExp('const BUILD="'+sha.slice(0,12)+'";'));
    assert.equal(config.vars.BAYAN_COMMIT_SHA,sha);
    assert.equal(config.keep_vars,true);
  }finally{rmSync(dir,{recursive:true,force:true});}
});

test("rejects abbreviated or missing commit SHA without changing files",()=>{
  const dir=mkdtempSync(join(tmpdir(),"bayan-build-id-invalid-"));
  try{
    const sourcePath=join(dir,"index.ts");
    const configPath=join(dir,"wrangler.jsonc");
    const originalSource='const BUILD="old-build";\nconst COMMIT_SHA="0000000000000000000000000000000000000000";\n';
    const originalConfig=JSON.stringify({name:"bayan",keep_vars:true});
    writeFileSync(sourcePath,originalSource);
    writeFileSync(configPath,originalConfig);
    assert.throws(()=>injectBuildId({sha:"d5e71b0",sourcePath,configPath}),/full 40-character commit SHA/);
    assert.equal(readFileSync(sourcePath,"utf8"),originalSource);
    assert.equal(readFileSync(configPath,"utf8"),originalConfig);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
