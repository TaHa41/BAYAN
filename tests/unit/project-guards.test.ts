import { describe, expect, it } from "vitest";
import worker from "../../src/index";

describe("BAYAN Worker contract", () => {
  it("exposes fetch and scheduled handlers", () => {
    expect(worker.fetch).toBeTypeOf("function");
    expect(worker.scheduled).toBeTypeOf("function");
  });
});
