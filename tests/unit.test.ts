import {describe,it,expect} from "vitest";
import {SECTIONS} from "../src/config";
import {answerHasUnsupportedSpecifics} from "../src/services/ai";

describe("BAYAN product foundation",()=>{
  it("has all required sections",()=>expect(SECTIONS.length).toBe(16));
  it("has bilingual labels",()=>expect(SECTIONS.every(x=>x[1]&&x[2])).toBe(true));
});

describe("evidence-backed AI answer validation",()=>{
  const evidence=[{
    title:"Mohamed Salah scored 7 goals for Liverpool in 2025",
    summary:"The profile reports that Mohamed Salah scored 7 goals for Liverpool during 2025.",
    sources:[{title:"Player profile",publisher:"BBC Sport",url:"https://www.bbc.com/sport"}]
  }] as any;
  it("rejects a club name absent from the retrieved evidence",()=>{
    expect(answerHasUnsupportedSpecifics("Mohamed Salah plays for Trabzonspor.",evidence)).toBe(true);
  });
  it("accepts named entities and numbers that are present in the evidence",()=>{
    expect(answerHasUnsupportedSpecifics("Mohamed Salah scored 7 goals for Liverpool in 2025.",evidence)).toBe(false);
  });
  it("rejects a number absent from the retrieved evidence",()=>{
    expect(answerHasUnsupportedSpecifics("Mohamed Salah scored 18 goals for Liverpool in 2025.",evidence)).toBe(true);
  });
});
