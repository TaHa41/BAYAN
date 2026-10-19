import {describe,it,expect} from "vitest";
import {articlePromptForTopic,sectionForOpenedStory,isContentForSection} from "../src/services/editorial";

describe("topic-aware article editorial",()=>{
  it("classifies biography-led science profiles as People rather than Science",()=>{
    expect(sectionForOpenedStory("ماري كوري: حياتها وأبحاثها وإرثها العلمي","وُلدت في وارسو وحصلت على جائزتي نوبل في الفيزياء والكيمياء.")).toBe("people");
    expect(sectionForOpenedStory("نجيب محفوظ: من هو وما الذي ميّز تجربته؟","روائي مصري ولد في القاهرة وحصل على نوبل في الأدب.")).toBe("people");
  });

  it("classifies public consultation and primary-source guides from their topic",()=>{
    expect(sectionForOpenedStory("كيف تحسّن المشاورات العامة القرارات","دليل عملي لفهم المشاورات العامة والأدلة التي يقدمها الناس.")).toBe("politics");
    expect(sectionForOpenedStory("كيف يستخدم المؤرخون المصادر الأولية؟","طريقة لفحص الوثائق والشهادات والصور بوصفها أدلة تاريخية.")).toBe("history");
    expect(sectionForOpenedStory("How to read public opinion polls","A guide to interpreting survey findings and their limits.")).toBe("trends");
  });

  it("classifies general scientific topics as Science",()=>{
    expect(sectionForOpenedStory("How do black holes form?","Astronomy research explains gravity, stars and the universe.")).toBe("science");
  });

  it("classifies a match report as Sports, not a biography",()=>{
    expect(sectionForOpenedStory("Liverpool wins the match after two goals","The league match ended 2-1 and changed the standings.")).toBe("sports");
  });

  it("uses health-specific evidence and safety instructions",()=>{
    const prompt=articlePromptForTopic("ما الذي نعرفه عن ارتفاع ضغط الدم؟","ar",[
      {title:"Clinical review of hypertension",summary:"Medical evidence describes risk factors and treatment limitations."} as any
    ]);
    expect(sectionForOpenedStory("ما الذي نعرفه عن ارتفاع ضغط الدم؟","Medical evidence describes treatment limitations.")).toBe("health");
    expect(prompt).toContain("بنية صحية مسؤولة");
    expect(prompt).toContain("لا تشخّص القارئ");
    expect(prompt).toContain("لا تخترع أسماء أو تواريخ أو أرقامًا");
  });

  it("keeps English output in English and uses a technology-specific structure",()=>{
    const prompt=articlePromptForTopic("How does artificial intelligence work?","en",[
      {title:"Artificial intelligence overview",summary:"Software models and computing systems."} as any
    ]);
    expect(prompt).toContain("Use a technology structure");
    expect(prompt).toContain("Mandatory rules");
    expect(prompt).not.toMatch(/[\u0600-\u06ff]/);
  });
  it("enforces strict section membership and rejects misfiled archived news",()=>{
    const dipTitle="DIP Holding announces intention to list shares on Dubai Financial Market";
    const dipSummary="The company plans an initial public offering representing 20% of issued capital.";
    expect(sectionForOpenedStory(dipTitle,dipSummary)).toBe("economy");
    expect(isContentForSection("economy",dipTitle,dipSummary)).toBe(true);
    expect(isContentForSection("people",dipTitle,dipSummary)).toBe(false);

    const riceTitle="الأرز الإندونيسي والسكر الهندي يسجلان مستويات غير مسبوقة";
    const riceSummary="من المتوقع أن يتسارع التضخم الغذائي بسبب اضطرابات الشحن والجفاف.";
    expect(sectionForOpenedStory(riceTitle,riceSummary)).toBe("economy");
    expect(isContentForSection("people",riceTitle,riceSummary)).toBe(false);
    expect(isContentForSection("economy",riceTitle,riceSummary)).toBe(true);
  });

  it("does not use the global-shifts section as a catch-all for unknown topics",()=>{
    expect(isContentForSection("world","A local company announces a new product","The announcement describes a single company and product.")).toBe(false);
    expect(isContentForSection("world","Global supply chains face a systemic shift","International trade patterns are changing across several regions.")).toBe(true);
  });

  it("allows verified biographies only in People & Biographies",()=>{
    const title="ماري كوري: حياتها وأبحاثها وإرثها العلمي";
    const summary="سيرة موثقة لماري كوري، من دراستها في باريس إلى جائزتي نوبل وإسهامها في أبحاث النشاط الإشعاعي.";
    expect(isContentForSection("people",title,summary)).toBe(true);
    expect(isContentForSection("science",title,summary)).toBe(false);
  });

});
