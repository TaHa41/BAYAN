import { describe, it, expect } from "vitest";
import worker from "../../src/index";

const env = (extra:any = {}) => ({ ...extra, BAYAN_AI_MANAGER_TOKEN: "manager-secret" });

describe("BAYAN V3 runtime", () => {
  it("serves API health", async () => {
    const r = await worker.fetch(new Request("https://bayan.test/api/health"), env(), {} as any);
    expect(r.status).toBe(200);
    expect((await r.json()).service).toBe("bayan-v3");
  });
  it("keeps /health compatibility", async () => {
    const r = await worker.fetch(new Request("https://bayan.test/health"), env(), {} as any);
    expect(r.status).toBe(200);
  });
  it("protects manager routes", async () => {
    const denied = await worker.fetch(new Request("https://bayan.test/api/ai/manager/status"), env(), {} as any);
    expect(denied.status).toBe(401);
    const allowed = await worker.fetch(new Request("https://bayan.test/api/ai/manager/status", {headers:{authorization:"Bearer manager-secret"}}), env(), {} as any);
    expect(allowed.status).toBe(200);
  });
  it("never returns the manager token from public features", async () => {
    const r = await worker.fetch(new Request("https://bayan.test/api/features"), env(), {} as any);
    expect(await r.text()).not.toContain("manager-secret");
  });
});
