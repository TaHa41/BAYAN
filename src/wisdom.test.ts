import { describe, expect, it } from "vitest";
import { wisdomFor } from "./wisdom";

describe("wisdom rotation", () => {
  it("changes within a topic across rotation slots", () => {
    const first = wisdomFor("science", "ar", 1_800_000_000_000);
    const second = wisdomFor("science", "ar", 1_800_000_030_000);
    expect(second).not.toBe(first);
  });

  it("uses topic-specific lines", () => {
    expect(wisdomFor("science", "ar", 1_800_000_000_000))
      .not.toBe(wisdomFor("sports", "ar", 1_800_000_000_000));
  });

  it("supports English and falls back safely for unknown sections", () => {
    expect(wisdomFor("science", "en", 1_800_000_000_000)).toMatch(/[A-Za-z]/);
    expect(wisdomFor("unknown-section", "ar", 1_800_000_000_000)).toBeTruthy();
  });

  it("is deterministic for a given time slot", () => {
    expect(wisdomFor("news", "ar", 1_800_000_000_000))
      .toBe(wisdomFor("news", "ar", 1_800_000_000_000));
  });
});
