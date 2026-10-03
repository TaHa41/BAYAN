const key=process.env.OPENAI_API_KEY;
const report=process.env.DIAGNOSTIC_REPORT||"No diagnostic report was supplied.";
if(!key){
  console.log(JSON.stringify({status:"skipped",reason:"OPENAI_API_KEY is not configured in GitHub Actions; deterministic diagnostics remain active."}));
  process.exit(0);
}
const model=process.env.OPENAI_MODEL||"gpt-5.6-luna";
const prompt=`BAYAN Site Manager. Diagnose this production/CI failure from the supplied report.
Rules: never invent facts; do not expose secrets; do not recommend destructive changes; prefer the smallest reversible fix; identify exact evidence, likely root cause, safe repair, tests, and rollback trigger. Do not write code in the diagnosis.
Report:
${report}`;
const r=await fetch("https://api.openai.com/v1/responses",{
  method:"POST",
  headers:{"content-type":"application/json",authorization:"Bearer "+key},
  body:JSON.stringify({model,instructions:"You are an autonomous reliability engineer for BAYAN. Be evidence-first and conservative.",input:prompt,store:false})
});
if(!r.ok){console.error("OpenAI manager failed with status",r.status);process.exit(1);}
const d=await r.json();
console.log(JSON.stringify({status:"ok",model,diagnosis:d.output_text||"No diagnosis returned."},null,2));
