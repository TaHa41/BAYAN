import { describe, expect, it } from "vitest";
import { safePublicImageUrl } from "./image-url";

describe("safePublicImageUrl", () => {
  it("accepts a normal HTTPS publisher image", () => {
    expect(safePublicImageUrl("https://images.example.org/story/photo.jpg")).toBe("https://images.example.org/story/photo.jpg");
  });

  it("normalizes Wikimedia thumbnail aliases to stable upload URLs and removes tracking parameters", () => {
    expect(safePublicImageUrl("https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Example.jpg/640px-Example.jpg?utm_source=ar.wikipedia.org&utm_campaign=api&utm_content=thumbnail"))
      .toBe("https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Example.jpg/640px-Example.jpg");
  });

  it.each([
    "https://googleusercontent.com/photo.jpg",
    "https://lh3.googleusercontent.com/photo.jpg",
    "https://news.google.com/images/photo.jpg",
    "https://www.gstatic.com/images/photo.jpg",
    "http://images.example.org/photo.jpg",
    "data:image/png;base64,AAAA",
    "https://user:password@images.example.org/photo.jpg",
    "not a url"
  ])("rejects unsafe or non-HTTPS image URL %s", (url) => {
    expect(safePublicImageUrl(url)).toBeUndefined();
  });
});
