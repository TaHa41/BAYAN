import { afterEach, describe, expect, it, vi } from "vitest";
import { resolvePublishedImageUrl, safePublicImageUrl } from "./image-url";

describe("safePublicImageUrl", () => {
  it("accepts a normal HTTPS publisher image", () => {
    expect(safePublicImageUrl("https://images.example.org/story/photo.jpg")).toBe("https://images.example.org/story/photo.jpg");
  });

  it("normalizes Wikimedia thumbnail aliases and strips tracking parameters", () => {
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


describe("resolvePublishedImageUrl", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("keeps stable upload URLs without extra requests", async () => {
    const url = "https://upload.wikimedia.org/wikipedia/commons/a/ab/example.jpg";
    await expect(resolvePublishedImageUrl(url)).resolves.toBe(url);
  });

  it("preserves safe non-Wikimedia HTTPS image URLs", async () => {
    const url = "https://images.example.org/story/photo.jpg";
    await expect(resolvePublishedImageUrl(url)).resolves.toBe(url);
  });

  it("resolves a Commons Special:FilePath redirect to the final upload URL", async () => {
    const original = "https://commons.wikimedia.org/wiki/Special:FilePath/Example.jpg";
    const finalUrl = "https://upload.wikimedia.org/wikipedia/commons/a/ab/Example.jpg";
    const body = { cancel: vi.fn().mockResolvedValue(undefined) };
    const response = (url: string, contentType = "image/jpeg") => ({
      ok: true, status: 200, url, body, headers: { get: (key: string) => key === "content-type" ? contentType : null }
    });
    const fetchMock = vi.fn().mockResolvedValueOnce(response(original)).mockResolvedValueOnce(response(finalUrl));
    vi.stubGlobal("fetch", fetchMock);
    await expect(resolvePublishedImageUrl(original)).resolves.toBe(finalUrl);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "HEAD", redirect: "follow" });
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: "GET", redirect: "follow" });
  });

  it("rejects redirects away from the trusted Wikimedia upload host", async () => {
    const original = "https://commons.wikimedia.org/wiki/Special:FilePath/Example.jpg";
    const body = { cancel: vi.fn().mockResolvedValue(undefined) };
    const response = (url: string) => ({ ok: true, status: 200, url, body, headers: { get: () => "image/jpeg" } });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response("https://images.example.org/redirect.jpg")));
    await expect(resolvePublishedImageUrl(original)).resolves.toBeUndefined();
  });
});
