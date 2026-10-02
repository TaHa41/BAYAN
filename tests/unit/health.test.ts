import { describe, expect, it } from "vitest";
import worker from "../../src/index";

describe("BAYAN foundation routes", () => {
  it("serves the root route", async () => {
    const response = await worker.fetch(new Request("https://bayan.test/"), {});
    expect(response.status).toBe(200);
    const body = await response.json() as { name: string; status: string };
    expect(body.name).toBe("BAYAN | بيان");
    expect(body.status).toBe("foundation");
  });

  it("serves health with safe version metadata", async () => {
    const response = await worker.fetch(new Request("https://bayan.test/health"), {
      BAYAN_ENVIRONMENT: "test",
      BAYAN_VERSION: "0.1.0",
      BAYAN_COMMIT_SHA: "test"
    });
    expect(response.status).toBe(200);
    const body = await response.json() as { status: string; environment: string };
    expect(body.status).toBe("ok");
    expect(body.environment).toBe("test");
  });

  it("returns 404 for unknown paths", async () => {
    const response = await worker.fetch(new Request("https://bayan.test/unknown"), {});
    expect(response.status).toBe(404);
  });
});
