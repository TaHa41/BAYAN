import { describe, expect, it } from "vitest";
import { pickCandidate } from "../src/services/news-article-publisher-query";

describe("news archive queue duplicate suppression", () => {
 it("suppresses same-language recent low-evidence title duplicates in memory without deleting rows", () => {
  const rows=[{id:1,title:"Same title",publisher:"A",image_url:"https://example.test/a.jpg"},{id:2,title:"same TITLE",publisher:"B",image_url:"https://example.test/b.jpg"}];
  expect(pickCandidate(rows,[{id:2,title:"SAME TITLE"}],null)?.id).toBe(2);
  expect(rows).toHaveLength(2);
 });
 it("prefers publisher rotation, then a candidate with an image", () => {
  const rows=[{id:1,title:"a",publisher:"last",image_url:"https://example.test/a.jpg"},{id:2,title:"b",publisher:"new",image_url:null},{id:3,title:"c",publisher:"newer",image_url:"https://example.test/c.jpg"}];
  expect(pickCandidate(rows,[],"last")?.id).toBe(3);
 });
});
