import { afterEach, describe, expect, it, vi } from "vitest";
import { resolvePublishedImageUrl, safePublicImageUrl } from "./image-url";

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

describe("resolvePublishedImageUrl", () => {
  it("keeps a final Wikimedia upload URL without following a redirect", async () => {
    const url = "https://upload.wikimedia.org/wikipedia/commons/a/ab/example.jpg";
    await expect(resolvePublishedImageUrl(url)).resolves.toBe(url);
  });

  it("preserves a safe non-Wikimedia HTTPS image URL", async () => {
    const url = "https://images.example.org/story/photo.jpg";
    await expect(resolvePublishedImageUrl(url)).resolves.toBe(url);
  });

  it("rejects unsafe image URLs", async () => {
    await expect(resolvePublishedImageUrl("https://lh3.googleusercontent.com/photo.jpg")).resolves.toBeUndefined();
  });
});

describe("Wikimedia redirect normalization", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("stores the final upload.wikimedia.org URL after a Commons redirect", async () => {
    const original = "https://commons.wikimedia.org/wiki/Special:FilePath/Example.jpg";
    const finalUrl = "https://upload.wikimedia.org/wikipedia/commons/a/ab/Example.jpg";
    const cancel = vi.fn().mockResolvedValue(undefined);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, url: original, body: { cancel } })
      .mockResolvedValueOnce({ ok: true, url: finalUrl, body: { cancel } });
    vi.stubGlobal("fetch", fetchMock);

    await expect(resolvePublishedImageUrl(original)).resolves.toBe(finalUrl);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "HEAD", redirect: "follow" });
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: "GET", redirect: "follow" });
  });
});
