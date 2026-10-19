import {describe,it,expect} from "vitest";
import {mkdtempSync,readFileSync,rmSync,writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {injectBuildId} from "./inject-build-id.mjs";

describe("deployment build identity injection",()=>{
  it("injects the full commit into application and Wrangler binding",()=>{
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
      expect(result.commit).toBe(sha);
      expect(result.buildId).toBe(sha.slice(0,12));
      expect(source).toContain('const COMMIT_SHA="'+sha+'";');
      expect(source).toContain('const BUILD="'+sha.slice(0,12)+'";');
      expect(config.vars.BAYAN_COMMIT_SHA).toBe(sha);
      expect(config.keep_vars).toBe(true);
    }finally{rmSync(dir,{recursive:true,force:true});}
  });

  it("rejects abbreviated or missing commit SHA without changing files",()=>{
    const dir=mkdtempSync(join(tmpdir(),"bayan-build-id-invalid-"));
    try{
      const sourcePath=join(dir,"index.ts");
      const configPath=join(dir,"wrangler.jsonc");
      const originalSource='const BUILD="old-build";\nconst COMMIT_SHA="0000000000000000000000000000000000000000";\n';
      const originalConfig=JSON.stringify({name:"bayan",keep_vars:true});
      writeFileSync(sourcePath,originalSource);
      writeFileSync(configPath,originalConfig);
      expect(()=>injectBuildId({sha:"d5e71b0",sourcePath,configPath})).toThrow(/full 40-character commit SHA/);
      expect(readFileSync(sourcePath,"utf8")).toBe(originalSource);
      expect(readFileSync(configPath,"utf8")).toBe(originalConfig);
    }finally{rmSync(dir,{recursive:true,force:true});}
  });
});
