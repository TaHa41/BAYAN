import { describe, expect, it } from "vitest";
import { safePublicImageUrl } from "./image-url";

describe("safePublicImageUrl", () => {
  it("accepts a normal HTTPS publisher image", () => {
    expect(safePublicImageUrl("https://images.example.org/story/photo.jpg")).toBe("https://images.example.org/story/photo.jpg");
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
