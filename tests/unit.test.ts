import {describe,it,expect} from "vitest";
import {SECTIONS} from "../src/config";
import {answerHasUnsupportedSpecifics} from "../src/services/ai";
import {isolateExactPerson,isolateArticleSubject,isSportsPersonProfile} from "../src/services/search";

describe("BAYAN product foundation",()=>{
  it("has all required sections",()=>expect(SECTIONS.length).toBe(16));
  it("has bilingual labels",()=>expect(SECTIONS.every(x=>x[1]&&x[2])).toBe(true));
});

describe("sports person profile detection",()=>{
  it("recognizes Arabic plural descriptions of footballers returned by encyclopedia sources",()=>{
    expect(isSportsPersonProfile("يُعد أحد أبرز اللاعبين العرب والأفارقة، وحصد جوائز فردية معروفة.")).toBe(true);
    expect(isSportsPersonProfile("Egyptian footballer and athlete.")).toBe(true);
    expect(isSportsPersonProfile("كاتب وأديب سعودي.")).toBe(false);
  });
});
describe("canonical same-name profile selection",()=>{
  it("prefers a rich exact Wikipedia biography over a short conflicting Wikidata label",()=>{
    const items=[
      {title:"محمد صلاح",summary:"ممثل.",url:"https://www.wikidata.org/wiki/Q999",provider:"Wikidata",score:90,sources:[{title:"محمد صلاح",publisher:"ويكي بيانات",url:"https://www.wikidata.org/wiki/Q999"}]},
      {title:"محمد صلاح",summary:"محمد صلاح حامد محروس غالي لاعب كرة قدم مصري محترف يلعب في مركز الجناح، وقائد منتخب مصر، وبدأ مسيرته مع المقاولون العرب ثم احترف في أوروبا.",url:"https://ar.wikipedia.org/wiki/محمد_صلاح",provider:"Wikipedia",score:80,sources:[{title:"محمد صلاح",publisher:"Wikipedia Arabic",url:"https://ar.wikipedia.org/wiki/محمد_صلاح"}]},
      {title:"محمد صلاح دندراوي",summary:"كاتب وأديب سعودي.",url:"https://ar.wikipedia.org/wiki/محمد_صلاح_دندراوي",provider:"Wikipedia",score:70,sources:[{title:"محمد صلاح دندراوي",publisher:"Wikipedia Arabic",url:"https://ar.wikipedia.org/wiki/محمد_صلاح_دندراوي"}]}
    ] as any;
    const result=isolateExactPerson("محمد صلاح",items);
    expect(result).toHaveLength(1);
    expect(result[0].summary).toContain("لاعب كرة قدم");
    expect(result[0].sources.every((source:any)=>source.title==="محمد صلاح")).toBe(true);
  });
});
describe("exact person identity isolation",()=>{
  it("keeps only the exact biography page when multiple people share the same Arabic name",()=>{
    const items=[
      {title:"محمد صلاح",summary:"محمد صلاح لاعب كرة قدم مصري محترف.",url:"https://ar.wikipedia.org/wiki/محمد_صلاح",provider:"Wikipedia",score:90,sources:[{title:"محمد صلاح",publisher:"Wikipedia Arabic",url:"https://ar.wikipedia.org/wiki/محمد_صلاح"}]},
      {title:"محمد صلاح دندراوي",summary:"كاتب وأديب سعودي.",url:"https://ar.wikipedia.org/wiki/محمد_صلاح_دندراوي",provider:"Wikipedia",score:70,sources:[{title:"محمد صلاح دندراوي",publisher:"Wikipedia Arabic",url:"https://ar.wikipedia.org/wiki/محمد_صلاح_دندراوي"}]},
      {title:"محمد صلاح — الإحصائيات",summary:"إحصائيات لاعب كرة القدم محمد صلاح.",url:"https://ar.wikipedia.org/wiki/محمد_صلاح",provider:"Wikipedia",score:69,sources:[{title:"محمد صلاح — الإحصائيات",publisher:"Wikipedia Arabic",url:"https://ar.wikipedia.org/wiki/محمد_صلاح"}]},
      {title:"محمد صلاح (توضيح)",summary:"صفحة توضيح لأشخاص يحملون الاسم.",url:"https://ar.wikipedia.org/wiki/محمد_صلاح_(توضيح)",provider:"Wikipedia",score:60,sources:[{title:"محمد صلاح (توضيح)",publisher:"Wikipedia Arabic",url:"https://ar.wikipedia.org/wiki/محمد_صلاح_(توضيح)"}]},
      {title:"محمد صلاح زكريا",summary:"كاتب قصص وروائي مصري.",url:"https://ar.wikipedia.org/wiki/محمد_صلاح_زكريا",provider:"Wikipedia REST Search",score:55,sources:[{title:"محمد صلاح زكريا",publisher:"Wikipedia Arabic",url:"https://ar.wikipedia.org/wiki/محمد_صلاح_زكريا"}]}
    ] as any;
    const result=isolateExactPerson("محمد صلاح",items);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("محمد صلاح");
  });
  it("keeps several same-subject football results but drops unrelated people with the same name",()=>{
    const items=[
      {title:"محمد صلاح",summary:"لاعب كرة قدم مصري محترف.",url:"https://ar.wikipedia.org/wiki/محمد_صلاح",provider:"Wikidata",score:80,sources:[{title:"محمد صلاح",publisher:"Wikidata",url:"https://www.wikidata.org/wiki/Q"}]},
      {title:"محمد صلاح يسجل هدفًا لليفربول",summary:"سجل لاعب كرة القدم المصري محمد صلاح هدفًا مع ليفربول.",url:"https://www.bbc.com/sport/football/123",provider:"BBC Web Search",score:75,sources:[{title:"محمد صلاح يسجل هدفًا لليفربول",publisher:"BBC Sport",url:"https://www.bbc.com/sport/football/123"}]},
      {title:"محمد صلاح دندراوي",summary:"كاتب وأديب سعودي.",url:"https://ar.wikipedia.org/wiki/محمد_صلاح_دندراوي",provider:"Wikipedia",score:70,sources:[{title:"محمد صلاح دندراوي",publisher:"Wikipedia Arabic",url:"https://ar.wikipedia.org/wiki/محمد_صلاح_دندراوي"}]}
    ] as any;
    const result=isolateExactPerson("محمد صلاح",items);
    expect(result.some((item:any)=>item.title==="محمد صلاح")).toBe(true);
    expect(result.some((item:any)=>item.title==="محمد صلاح يسجل هدفًا لليفربول")).toBe(true);
    expect(result.some((item:any)=>item.title==="محمد صلاح دندراوي")).toBe(false);
    expect(result.some((item:any)=>String(item.title).includes("الإحصائيات"))).toBe(false);
  });
  it("keeps the concise canonical biography and its exact-page image when a provider has a contradictory long summary",()=>{
    const items=[
      {title:"محمد صلاح",summary:"محمد صلاح لاعب كرة قدم مصري محترف، يلعب حاليا مع نادي طرابزون سبور. ناديه الحالي ليفربول.",imageUrl:"https://upload.wikimedia.org/exact-person.jpg",imageAlt:"محمد صلاح",url:"https://ar.wikipedia.org/wiki/محمد_صلاح",provider:"Wikipedia",score:95,sources:[{title:"محمد صلاح",publisher:"Wikipedia Arabic",url:"https://ar.wikipedia.org/wiki/محمد_صلاح"},{title:"محمد صلاح دندراوي",publisher:"Wikipedia Arabic",url:"https://ar.wikipedia.org/wiki/محمد_صلاح_دندراوي"}]},
      {title:"محمد صلاح",summary:"لاعب كرة قدم مصري.",url:"https://www.wikidata.org/wiki/Q",provider:"Wikidata",score:70,sources:[{title:"محمد صلاح",publisher:"Wikidata",url:"https://www.wikidata.org/wiki/Q"}]},
      {title:"محمد صلاح يسجل هدفًا لليفربول",summary:"لاعب كرة القدم المصري سجل هدفا مع ليفربول.",url:"https://www.bbc.com/sport/football/123",provider:"BBC Web Search",score:65,sources:[{title:"خبر رياضي",publisher:"BBC Sport",url:"https://www.bbc.com/sport/football/123"}]}
    ] as any;
    const result=isolateExactPerson("محمد صلاح",items);
    const exact=result.filter((item:any)=>item.title==="محمد صلاح");
    expect(exact).toHaveLength(1);
    expect(exact[0].summary).toBe("لاعب كرة قدم مصري.");
    expect(exact[0].imageUrl).toBe("https://upload.wikimedia.org/exact-person.jpg");
    expect(exact[0].sources.some((source:any)=>source.publisher==="Wikipedia Arabic")).toBe(true);
    expect(exact[0].sources.some((source:any)=>source.publisher==="Wikidata")).toBe(true);
    expect(exact[0].sources.some((source:any)=>source.title==="محمد صلاح دندراوي")).toBe(false);
  });
  it("rejects an exact-name disambiguation page whose summary lists several people",()=>{
    const items=[
      {title:"محمد صلاح",summary:"محمد صلاح لاعب كرة قدم مصري. محمد صلاح دندراوي كاتب سعودي. محمد صلاح (توضيح) يشير إلى عدة أشخاص.",url:"https://ar.wikipedia.org/wiki/محمد_صلاح",provider:"Wikipedia",score:90,sources:[{title:"محمد صلاح",publisher:"Wikipedia Arabic",url:"https://ar.wikipedia.org/wiki/محمد_صلاح"}]},
      {title:"محمد صلاح دندراوي",summary:"كاتب وأديب سعودي.",url:"https://ar.wikipedia.org/wiki/محمد_صلاح_دندراوي",provider:"Wikipedia",score:70,sources:[{title:"محمد صلاح دندراوي",publisher:"Wikipedia Arabic",url:"https://ar.wikipedia.org/wiki/محمد_صلاح_دندراوي"}]}
    ] as any;
    expect(isolateExactPerson("محمد صلاح",items)).toHaveLength(0);
  });
  it("does not discard ordinary topic search results when there is no exact person biography",()=>{
    const items=[{title:"تغير المناخ",summary:"شرح علمي للتغير المناخي.",url:"https://ar.wikipedia.org/wiki/تغير_المناخ",provider:"Wikipedia",score:80,sources:[{title:"تغير المناخ",publisher:"Wikipedia Arabic",url:"https://ar.wikipedia.org/wiki/تغير_المناخ"}]}] as any;
    expect(isolateExactPerson("تغير المناخ",items)).toHaveLength(1);
  });
});
describe("article subject isolation",()=>{
  it("keeps the exact Mohamed Salah football profile and drops namesakes",()=>{
    const items=[
      {title:"محمد صلاح",summary:"محمد صلاح لاعب كرة قدم مصري محترف.",url:"https://ar.wikipedia.org/wiki/محمد_صلاح",provider:"Wikipedia",score:90,sources:[{title:"محمد صلاح",publisher:"Wikipedia Arabic",url:"https://ar.wikipedia.org/wiki/محمد_صلاح"}]},
      {title:"محمد صلاح دندراوي",summary:"كاتب وأديب سعودي.",url:"https://ar.wikipedia.org/wiki/محمد_صلاح_دندراوي",provider:"Wikipedia",score:70,sources:[{title:"محمد صلاح دندراوي",publisher:"Wikipedia Arabic",url:"https://ar.wikipedia.org/wiki/محمد_صلاح_دندراوي"}]},
      {title:"محمد صلاح (توضيح)",summary:"صفحة توضيح لأشخاص يحملون الاسم.",url:"https://ar.wikipedia.org/wiki/محمد_صلاح_(توضيح)",provider:"Wikipedia",score:60,sources:[{title:"محمد صلاح (توضيح)",publisher:"Wikipedia Arabic",url:"https://ar.wikipedia.org/wiki/محمد_صلاح_(توضيح)"}]},
      {title:"محمد صلاح زكريا",summary:"كاتب قصص وروائي مصري.",url:"https://ar.wikipedia.org/wiki/محمد_صلاح_زكريا",provider:"Wikipedia",score:55,sources:[{title:"محمد صلاح زكريا",publisher:"Wikipedia Arabic",url:"https://ar.wikipedia.org/wiki/محمد_صلاح_زكريا"}]}
    ] as any;
    const result=isolateArticleSubject("محمد صلاح",items);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("محمد صلاح");
  });
  it("does not create a biography from a disambiguation page",()=>{
    const items=[
      {title:"محمد صلاح",summary:"صفحة توضيح قد تشير إلى عدة أشخاص يحملون الاسم.",url:"https://ar.wikipedia.org/wiki/محمد_صلاح",provider:"Wikipedia",score:90,sources:[{title:"محمد صلاح",publisher:"Wikipedia Arabic",url:"https://ar.wikipedia.org/wiki/محمد_صلاح"}]},
      {title:"محمد صلاح دندراوي",summary:"كاتب وأديب سعودي.",url:"https://ar.wikipedia.org/wiki/محمد_صلاح_دندراوي",provider:"Wikipedia",score:70,sources:[{title:"محمد صلاح دندراوي",publisher:"Wikipedia Arabic",url:"https://ar.wikipedia.org/wiki/محمد_صلاح_دندراوي"}]}
    ] as any;
    expect(isolateArticleSubject("محمد صلاح",items)).toHaveLength(0);
  });
  it("does not merge different namesakes when no exact biography exists",()=>{
    const items=[
      {title:"محمد صلاح دندراوي",summary:"كاتب وأديب سعودي.",url:"https://ar.wikipedia.org/wiki/محمد_صلاح_دندراوي",provider:"Wikipedia",score:70,sources:[{title:"محمد صلاح دندراوي",publisher:"Wikipedia Arabic",url:"https://ar.wikipedia.org/wiki/محمد_صلاح_دندراوي"}]},
      {title:"محمد صلاح زكريا",summary:"كاتب قصص وروائي مصري.",url:"https://ar.wikipedia.org/wiki/محمد_صلاح_زكريا",provider:"Wikipedia",score:55,sources:[{title:"محمد صلاح زكريا",publisher:"Wikipedia Arabic",url:"https://ar.wikipedia.org/wiki/محمد_صلاح_زكريا"}]}
    ] as any;
    expect(isolateArticleSubject("محمد صلاح",items)).toHaveLength(0);
  });
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
  it("rejects an unsupported Arabic club name when unrelated sources mention it",()=>{
    const arabicEvidence=[
      {title:"محمد صلاح لاعب ليفربول",summary:"محمد صلاح يلعب مع ليفربول.",sources:[{title:"ملف اللاعب",publisher:"مصدر رياضي",url:"https://example.com/player"}]},
      {title:"طرابزون سبور يتعاقد مع لاعب جديد",summary:"أعلن النادي التركي ضم لاعب جديد.",sources:[{title:"أخبار النادي",publisher:"مصدر آخر",url:"https://example.com/club"}]}
    ] as any;
    expect(answerHasUnsupportedSpecifics("محمد صلاح يلعب لنادي طرابزون سبور.",arabicEvidence,"محمد صلاح")).toBe(true);
    expect(answerHasUnsupportedSpecifics("محمد صلاح يلعب لنادي ليفربول.",arabicEvidence,"محمد صلاح")).toBe(false);
  });
  it("does not combine unrelated sources to validate a wrong club name",()=>{
    const mixedEvidence=[...evidence,{title:"Trabzonspor signs a midfielder",summary:"The Turkish club announced a new midfielder.",sources:[{title:"Club news",publisher:"Sports Wire",url:"https://example.com"}]}] as any;
    expect(answerHasUnsupportedSpecifics("Mohamed Salah plays for Trabzonspor.",mixedEvidence)).toBe(true);
  });
  it("accepts named entities and numbers that are present in the evidence",()=>{
    expect(answerHasUnsupportedSpecifics("Mohamed Salah scored 7 goals for Liverpool in 2025.",evidence)).toBe(false);
  });
  it("rejects a number absent from the retrieved evidence",()=>{
    expect(answerHasUnsupportedSpecifics("Mohamed Salah scored 18 goals for Liverpool in 2025.",evidence)).toBe(true);
  });
});
