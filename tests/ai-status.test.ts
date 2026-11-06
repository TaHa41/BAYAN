import { afterEach, describe, expect, it, vi } from "vitest";
import type { Env } from "../src/types";
import { aiStatus, v2Owns } from "../src/v2-bridge";

afterEach(() => vi.unstubAllGlobals());
const spy = () => { const f = vi.fn(async () => { throw new Error("the public status must never call Gemini"); }); vi.stubGlobal("fetch", f); return f; };

describe("public AI status (no secrets, no provider calls)", () => {
  it("is owned by the bridge as a GET route", () => expect(v2Owns(new Request("https://b.test/api/health/ai"))).toBe(true));
  it("reports configuration without a single network call, so the daily Gemini quota is left to the pipeline", async () => {
    const f = spy();
    const v: any = await aiStatus({ GEMINI_API_KEY: "k-secret", GEMINI_MODEL: "gemini-2.5-flash", AI: {}, BAYAN_COMMIT_SHA: "abcdef1234567890" } as unknown as Env);
    expect(f).not.toHaveBeenCalled();
    expect(v.gemini).toMatchObject({ configured: true, keyState: "set", model: "gemini-2.5-flash" }); expect(v.workersAi.configured).toBe(true);
    expect(v.probe).toBe("off"); expect(v.deployedCommit).toBe("abcdef123456"); expect(v.build).toMatch(/^\d{4}-\d{2}-\d{2}\.\d+$/);
    expect(JSON.stringify(v)).not.toContain("k-secret");
  });
  it("tells a missing key from an empty or whitespace one", async () => {
    spy();
    expect(((await aiStatus({} as unknown as Env)) as any).gemini).toMatchObject({ configured: false, keyState: "absent", error: "missing_key" });
    expect(((await aiStatus({ GEMINI_API_KEY: "  " } as unknown as Env)) as any).gemini).toMatchObject({ configured: false, keyState: "empty", error: "missing_key" });
  });
});
