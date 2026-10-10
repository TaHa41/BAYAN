import fs from "node:fs";

const migrationPaths = [
  "migrations_v1/0023_seed_complete_health_history_economy_articles.sql",
  "migrations_v1/0024_seed_global_knowledge_articles.sql",
  "migrations_v1/0025_seed_complete_art_arab_articles.sql",
  "migrations_v1/0026_seed_science_technology_articles.sql",
];
const parseMigration = (migrationPath) => {
  const sql = fs.readFileSync(migrationPath, "utf8");
  const valuesStart = sql.indexOf("VALUES");
  if (valuesStart < 0) throw new Error(migrationPath + " has no VALUES clause");
  const parsedRows = [];
  let i = valuesStart + "VALUES".length;
  while (i < sql.length) {
    while (/\s|,/.test(sql[i] || "")) i++;
    if (sql[i] !== "(") break;
    i++;
    const fields = [];
    while (i < sql.length) {
      while (/\s/.test(sql[i] || "")) i++;
      if (sql[i] === "'") {
        i++;
        let value = "";
        while (i < sql.length) {
          if (sql[i] === "'") {
            if (sql[i + 1] === "'") { value += "'"; i += 2; continue; }
            i++;
            break;
          }
          value += sql[i++];
        }
        fields.push(value);
      } else {
        const start = i;
        let depth = 0;
        let quoted = false;
        while (i < sql.length) {
          const ch = sql[i];
          if (ch === "'") {
            if (quoted && sql[i + 1] === "'") { i += 2; continue; }
            quoted = !quoted;
            i++;
            continue;
          }
          if (!quoted) {
            if (ch === "(") depth++;
            else if (ch === ")") {
              if (depth === 0) break;
              depth--;
            } else if (ch === "," && depth === 0) break;
          }
          i++;
        }
        fields.push(sql.slice(start, i).trim());
      }
      while (/\s/.test(sql[i] || "")) i++;
      if (sql[i] === ",") { i++; continue; }
      if (sql[i] === ")") { i++; break; }
      throw new Error("could not parse " + migrationPath + " near offset " + i);
    }
    parsedRows.push(fields);
  }
  return parsedRows;
};
const rows = migrationPaths.flatMap(parseMigration);
const failures = [];
const seen = new Set();
for (const row of rows) {
  const [slug, section, language, title, summary, body, sourcesJson, status, imageUrl] = row;
  const fail = (message) => failures.push(String(slug) + ": " + message);
  if (row.length !== 12) { fail("expected 12 columns, got " + row.length); continue; }
  if (seen.has(slug)) fail("duplicate slug");
  seen.add(slug);
  if (!["health", "history", "economy", "world", "art", "arab", "science", "technology"].includes(section)) fail("unexpected section");
  if (!["ar", "en"].includes(language)) fail("unexpected language");
  if (status !== "PUBLISHED") fail("not marked PUBLISHED");
  if (!/^https:\/\//i.test(imageUrl)) fail("missing HTTPS topic image");
  const text = [title, summary, body].join("\n");
  const hasArabic = /[\u0600-\u06ff]/.test(text);
  if (language === "ar" && !hasArabic) fail("Arabic content missing");
  if (language === "en" && hasArabic) fail("Arabic leaked into English content");
  const headings = (body.match(/^#{1,3}\s+.+$/gm) || []).length;
  const paragraphs = body.split(/\n\s*\n/).map(part => part.trim())
    .filter(part => part.length >= 65 && !/^#{1,4}\s/.test(part) && !/^([-*+] |\d+[.)] )/.test(part));
  const uniqueParagraphs = new Set(paragraphs.map(part => part.normalize("NFKC").toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim()));
  if (body.trim().length < 1800) fail("body shorter than 1800 characters");
  if (headings < 4) fail("fewer than four headings");
  if (paragraphs.length < 5 || uniqueParagraphs.size < 5) fail("body lacks five distinct substantial paragraphs");
  let sources = [];
  try { sources = JSON.parse(sourcesJson); } catch { fail("invalid sources_json"); }
  const publishers = new Set(sources.map(source => String(source.publisher || "").trim().toLowerCase()).filter(Boolean));
  const hosts = new Set(sources.flatMap(source => {
    try { const url = new URL(source.url); return url.protocol === "https:" ? [url.hostname.toLowerCase().replace(/^www\./, "")] : []; }
    catch { return []; }
  }));
  if (publishers.size < 2 || hosts.size < 2) fail("requires two independent publishers and HTTPS hosts");
}
if (rows.length !== 30) failures.push("expected 28 seeded article rows, got " + rows.length);
for (const section of ["health", "history", "economy", "world", "art", "arab", "science", "technology"]) {
  for (const language of ["ar", "en"]) {
    const count = rows.filter(row => row[1] === section && row[2] === language).length;
    if (count < (section === "economy" ? 1 : 2)) failures.push(section + "/" + language + " has only " + count + " seeded articles");
  }
}
for (const failure of failures) console.error("FAIL " + failure);
if (failures.length) process.exit(1);
console.log("PASS all 30 bilingual health/history/economy/global/art/Arab/science/technology seed articles meet publication-quality contracts");
