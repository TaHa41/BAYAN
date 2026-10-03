import { describe, expect, it } from "vitest";
import worker from "../../src/index";

describe("BAYAN Worker contract", () => {
  it("keeps Telegram-only owner notifications", async () => {    const source = await (await import("../../src/index")).default.fetch(new Request("https://bayan.test/api/features"), {});    const text = await source.text();    expect(text).not.toContain("RESEND");  });  it("exposes fetch and scheduled handlers", () => {
    expect(worker.fetch).toBeTypeOf("function");
    expect(worker.scheduled).toBeTypeOf("function");
  });
});
