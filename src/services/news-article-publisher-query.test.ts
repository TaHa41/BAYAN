import { describe, expect, it } from "vitest";
import { NEWS_ARCHIVE_CANDIDATES_SQL, RECENT_LOW_EVIDENCE_SQL, pickCandidate } from "./news-article-publisher-query";

describe("bounded news archive queue", () => {
 it("does not use a correlated title scan against news_archive", () => { expect(NEWS_ARCHIVE_CANDIDATES_SQL).not.toContain("NOT EXISTS"); expect(NEWS_ARCHIVE_CANDIDATES_SQL).not.toContain("lower(trim("); expect(NEWS_ARCHIVE_CANDIDATES_SQL).toContain("LIMIT 40"); expect(RECENT_LOW_EVIDENCE_SQL).toContain("LIMIT 300"); });
 it("filters recently rejected title duplicates but keeps the same row eligible", () => { const rows=[{id:1,title:"Story",publisher:"A",image_url:"x"},{id:2,title:" story ",publisher:"B",image_url:"x"},{id:3,title:"Other",publisher:"C",image_url:null}]; expect(pickCandidate(rows,[{id:2,title:"STORY"}],null)?.id).toBe(1); });
 it("prefers a different publisher and then an item with an image", () => { const rows=[{id:1,title:"a",publisher:"last",image_url:"img"},{id:2,title:"b",publisher:"new",image_url:null},{id:3,title:"c",publisher:"newer",image_url:"img"}]; expect(pickCandidate(rows,[], "last")?.id).toBe(3); });
});
