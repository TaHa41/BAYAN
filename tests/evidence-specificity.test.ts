import { describe, expect, it } from "vitest";
import { answerHasUnsupportedSpecifics } from "../src/services/ai";

describe("cross-source specificity verification", () => {
  const evidence = [
    { title: "Project history", summary: "The project began in 1990.", sources: [{ title: "Project history", publisher: "History Research Center", url: "https://history.example.org" }] },
    { title: "Project impact", summary: "The project later served 3 regions.", sources: [{ title: "Project impact", publisher: "Regional Data Institute", url: "https://impact.example.org" }] }
  ] as any;

  it("accepts a sentence when each number is supported somewhere in the evidence set", () => {
    expect(answerHasUnsupportedSpecifics("The project began in 1990 and served 3 regions.", evidence, "project history")).toBe(false);
  });

  it("still rejects a number that appears nowhere in the evidence set", () => {
    expect(answerHasUnsupportedSpecifics("The project began in 1990 and served 7 regions.", evidence, "project history")).toBe(true);
  });
});
