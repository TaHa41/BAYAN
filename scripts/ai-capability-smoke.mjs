const BASE_URL = process.env.BAYAN_BASE_URL || "https://bayan.tahaomar411.workers.dev";

const tests = [
  { name: "arithmetic", mode: "analyze", live: false, input: "احسب 17 × 19. أجب بالرقم فقط." },
  { name: "logic", mode: "analyze", live: false, input: "كل القطط حيوانات. ميمي قطة. هل ميمي حيوان؟ أجب بنعم أو لا مع سبب قصير." },
  { name: "debugging", mode: "code", live: false, input: "في JavaScript: const user = null; console.log(user.name); ما سبب الخطأ وكيف أصلحه بأمان؟" },
  { name: "algorithm", mode: "code", live: false, input: "اكتب خوارزمية بسيطة لإيجاد أكبر رقم في مصفوفة، ثم اشرح التعقيد الزمني." },
  { name: "arabic-explanation", mode: "knowledge", live: false, input: "اشرح مفهوم التخزين المؤقت Cache ببساطة في 4 نقاط، ولا تخترع مصادر." },
  { name: "evidence-answer", mode: "research", live: true, input: "ما هي عاصمة مصر؟ اذكر الإجابة باختصار، وإذا استخدمت مصادر فسمِّها." }
];
let failed = false;
for (const test of tests) {
  const response = await fetch(BASE_URL + "/api/ai", { method: "POST", headers: { "content-type": "application/json", "x-bayan-test": "1" }, body: JSON.stringify({ input: test.input, mode: test.mode, live: test.live }) });
  let data = null; try { data = await response.json(); } catch {}
  if (!response.ok || !data?.answer || String(data.answer).trim().length < 8) { console.error("[AI BENCHMARK] FAIL " + test.name + ": HTTP " + response.status); failed = true; continue; }
  const answer = String(data.answer).toLowerCase();
  if (test.name === "arithmetic" && !answer.includes("323")) { console.error("[AI BENCHMARK] FAIL arithmetic"); failed = true; }
  if (test.name === "logic" && !/(نعم|yes)/i.test(answer)) { console.error("[AI BENCHMARK] FAIL logic"); failed = true; }
  if (test.name === "debugging" && !/(null|undefined|typeerror|optional|فحص|تحقق)/i.test(answer)) { console.error("[AI BENCHMARK] FAIL debugging"); failed = true; }
  if (test.name === "algorithm" && !/(for|loop|حلقة|o\s*\(\s*n\s*\)|n)/i.test(answer)) { console.error("[AI BENCHMARK] FAIL algorithm"); failed = true; }
  if (test.name === "arabic-explanation" && !/(cache|كاش|تخزين|ذاكرة|مؤقت)/i.test(answer)) { console.error("[AI BENCHMARK] FAIL explanation"); failed = true; }
  if (test.name === "evidence-answer" && !/(القاهرة|cairo)/i.test(answer)) { console.error("[AI BENCHMARK] FAIL evidence"); failed = true; }
  console.log("[AI BENCHMARK] PASS " + test.name);
}
if (failed) throw new Error("BAYAN AI capability benchmark failed");
