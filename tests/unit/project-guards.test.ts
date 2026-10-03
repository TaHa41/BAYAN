import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("BAYAN production guards", () => {
  it("keeps Telegram as the notification channel", () => {
    const source = read("src/index.ts");
    const app = read("public/app.js");
    expect(source).toContain("sendBayanTelegram");
    expect(source).not.toContain("api/ai/manager/test-email");
    expect(source).not.toContain("RESEND_API_KEY");
    expect(app).not.toContain("RESEND_API_KEY");
    expect(app).not.toContain("Resend");
  });

  it("keeps durable repair and audit storage defined", () => {
    const schema = read("schema.sql");
    expect(schema).toContain("CREATE TABLE IF NOT EXISTS repair_jobs");
    expect(schema).toContain("CREATE TABLE IF NOT EXISTS runtime_audits");
    expect(schema).toContain("next_attempt_at TEXT");
    expect(read("src/index.ts")).toContain("processBayanRepairQueue");
  });

  it("keeps the scheduled maintenance trigger configured", () => {
    const wrangler = read("wrangler.jsonc");
    expect(wrangler).toContain('"crons": ["*/5 * * * *"]');
  });
});
