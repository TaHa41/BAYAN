import { describe, expect, it } from "vitest";
import { isBlockedAdultContent } from "../src/adult-content";

describe("adult content editorial blocklist", () => {
  it("blocks explicit adult entertainment and known prohibited encyclopedia subjects", () => {
    expect(isBlockedAdultContent("Mia Khalifa")).toBe(true);
    expect(isBlockedAdultContent("Pornographic film industry")).toBe(true);
    expect(isBlockedAdultContent("ممثلة إباحية")).toBe(true);
    expect(isBlockedAdultContent("محتوى إباحي")).toBe(true);
  });
  it("does not block legitimate health and education topics", () => {
    expect(isBlockedAdultContent("Sex education and reproductive health")).toBe(false);
    expect(isBlockedAdultContent("Sexual health awareness")).toBe(false);
    expect(isBlockedAdultContent("Women's health")).toBe(false);
  });
});
