import { execFileSync } from "node:child_process";
import { writeFileSync, readFileSync } from "node:fs";

function run(command, args) {
  return execFileSync(command, args, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] }).trim();
}
function parseJsonOutput(text) {
  const startCandidates = [text.indexOf("["), text.indexOf("{")].filter((n) => n >= 0);
  if (!startCandidates.length) throw new Error("wrangler_json_missing");
  const start = Math.min(...startCandidates);
  try { return JSON.parse(text.slice(start)); } catch { throw new Error("wrangler_json_invalid"); }
}
function resultRows(value) {
  if (Array.isArray(value)) {
    for (const item of value) {
      if (item && Array.isArray(item.results)) return item.results;
      const nested = resultRows(item);
      if (nested.length) return nested;
    }
  }
  if (value && typeof value === "object") {
    if (Array.isArray(value.results)) return value.results;
    if (Array.isArray(value.result)) return resultRows(value.result);
  }
  return [];
}
function wranglerQuery(database, sql) {
  const out = run("npx", ["wrangler", "d1", "execute", database, "--remote", "--json", "--command", sql]);
  return resultRows(parseJsonOutput(out));
}
function baseline(dumpPath, outPath) {
  const py = String.raw`
import json, sqlite3, sys
path=sys.argv[1]
db=sqlite3.connect(":memory:")
with open(path,"r",encoding="utf-8") as f:
    db.executescript(f.read())
tables=[r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")]
counts={}
for name in tables:
    quoted='"'+name.replace('"','""')+'"'
    counts[name]=db.execute("SELECT COUNT(*) FROM "+quoted).fetchone()[0]
print(json.dumps(counts,sort_keys=True))
`;
  const counts = JSON.parse(run("python3", ["-c", py, dumpPath]));
  if (!Object.keys(counts).length) throw new Error("backup_contains_no_tables");
  writeFileSync(outPath, JSON.stringify(counts, null, 2) + "\n");
  const size = Number(run("python3", ["-c", "import os,sys; print(os.path.getsize(sys.argv[1]))", dumpPath]));
  if (size < 1_000_000) throw new Error("backup_unexpectedly_small");
  console.log(JSON.stringify({ phase: "baseline", bytes: size, tableCount: Object.keys(counts).length, rowCountTotal: Object.values(counts).reduce((a,b)=>a+b,0) }));
}
function compare(database, baselinePath, outPath) {
  const expected = JSON.parse(readFileSync(baselinePath, "utf8"));
  const rows = wranglerQuery(database, "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
  const tables = rows.map((row) => String(row.name)).sort();
  const expectedTables = Object.keys(expected).sort();
  const missing = expectedTables.filter((name) => !tables.includes(name));
  const extra = tables.filter((name) => !expectedTables.includes(name));
  const actual = {};
  for (const name of tables) {
    const quoted = '"' + name.replace(/"/g, '""') + '"';
    const countRows = wranglerQuery(database, "SELECT COUNT(*) AS n FROM " + quoted);
    if (!countRows.length || !Number.isFinite(Number(countRows[0].n))) throw new Error("row_count_unavailable:" + name);
    actual[name] = Number(countRows[0].n);
  }
  writeFileSync(outPath, JSON.stringify(actual, null, 2) + "\n");
  const mismatches = expectedTables.filter((name) => actual[name] !== expected[name]).map((name) => ({ table: name, expected: expected[name], actual: actual[name] }));
  const report = { phase: "restore_compare", tableCountExpected: expectedTables.length, tableCountActual: tables.length, rowCountTotalExpected: Object.values(expected).reduce((a,b)=>a+b,0), rowCountTotalActual: Object.values(actual).reduce((a,b)=>a+b,0), missingTables: missing, extraTables: extra, mismatches };
  console.log(JSON.stringify(report));
  if (missing.length || extra.length || mismatches.length) process.exitCode = 1;
}
const [mode, ...args] = process.argv.slice(2);
try {
  if (mode === "baseline" && args.length === 2) baseline(args[0], args[1]);
  else if (mode === "compare" && args.length === 3) compare(args[0], args[1], args[2]);
  else throw new Error("usage_invalid");
} catch (error) {
  console.error(JSON.stringify({ phase: mode || "unknown", reason: String(error?.message || error).slice(0, 300) }));
  process.exitCode = 1;
}
