import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const script = readFileSync(new URL("./production-smoke.mjs", import.meta.url), "utf8");
const end = script.slice(script.lastIndexOf("if(degradedSections)"));
assert.ok(end.includes("if(bad>0)"), "production smoke must fail when assertions increment bad");
assert.ok(end.includes("process.exit(1)"), "production smoke must exit non-zero on assertion failures");
assert.ok(end.indexOf("process.exit(1)") < end.indexOf('console.log("BAYAN production smoke passed'), "success banner must follow the failure guard");
console.log("production smoke failure guard test passed");
