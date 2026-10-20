// Read-only audit of sensitive Worker binding types. Never print binding values.
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || "";
const token = process.env.CLOUDFLARE_API_TOKEN || "";
const scriptName = process.env.BAYAN_WORKER_NAME || "bayan";
const expectedCommit = process.env.EXPECTED_COMMIT_SHA || "";

async function request(path) {
  const response = await fetch("https://api.cloudflare.com/client/v4" + path, {
    headers: { authorization: "Bearer " + token, accept: "application/json" },
    signal: AbortSignal.timeout(10000),
  });
  let data;
  try { data = await response.json(); } catch { throw new Error("Cloudflare API returned invalid JSON"); }
  if (!response.ok || data?.success !== true) {
    throw new Error("Cloudflare API request failed with HTTP " + response.status);
  }
  return data.result;
}

async function audit() {
  if (!accountId || !token) {
    console.warn("::warning::Sensitive Worker binding audit skipped: Cloudflare read credentials unavailable.");
    return;
  }
  try {
    const deployments = await request("/accounts/" + encodeURIComponent(accountId) +
      "/workers/scripts/" + encodeURIComponent(scriptName) + "/deployments?per_page=1");
    const deployment = deployments?.deployments?.[0];
    const versionId = deployment?.versions?.[0]?.version_id;
    if (!versionId) throw new Error("active deployment version not found");
    const version = await request("/accounts/" + encodeURIComponent(accountId) +
      "/workers/scripts/" + encodeURIComponent(scriptName) + "/versions/" + encodeURIComponent(versionId));
    const bindings = Array.isArray(version?.resources?.bindings) ? version.resources.bindings : [];
    const expected = ["SEARCH_API_KEY", "GEMINI_API_KEY"];
    const problems = expected.flatMap(name => {
      const binding = bindings.find(item => item?.name === name);
      return !binding || binding.type !== "secret_text" ? [name] : [];
    });
    if (expectedCommit) {
      const commit = bindings.find(item => item?.name === "BAYAN_COMMIT_SHA");
      if (commit?.text !== expectedCommit) {
        console.warn("::warning::Sensitive Worker binding audit observed a deployment SHA different from the expected release.");
      }
    }
    if (problems.length) {
      console.warn("::warning::Worker bindings are not stored as secret_text: " + problems.join(", ") +
        ". Rotate these credentials and store them as Worker Secrets. Values were intentionally not logged.");
    } else {
      console.log("Sensitive Worker binding types verified as secret_text.");
    }
  } catch (error) {
    console.warn("::warning::Sensitive Worker binding audit could not complete: " +
      String(error?.message || "unknown error").slice(0, 180));
  }
}

await audit();
