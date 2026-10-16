import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveWikimediaImageUrl, searchWikimediaEnterprise } from "./wikimedia-enterprise";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Wikimedia Enterprise image URLs", () => {
  it("resolves a Wikimedia file redirect to its final upload URL", async () => {
    const response = new Response(null, {
      status: 200,
      headers: { "content-type": "image/jpeg" }
    });
    Object.defineProperty(response, "url", {
      value: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Example.jpg"
    });
    const fetchMock = vi.fn(async () => response);
    vi.stubGlobal("fetch", fetchMock);

    await expect(resolveWikimediaImageUrl(
      "https://commons.wikimedia.org/wiki/Special:FilePath/Example.jpg"
    )).resolves.toBe("https://upload.wikimedia.org/wikipedia/commons/a/ab/Example.jpg");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://commons.wikimedia.org/wiki/Special:FilePath/Example.jpg",
      expect.objectContaining({ method: "HEAD", redirect: "follow" })
    );
  });

  it("rejects a redirect that leaves Wikimedia domains", async () => {
    const response = new Response(null, {
      status: 200,
      headers: { "content-type": "image/jpeg" }
    });
    Object.defineProperty(response, "url", { value: "https://images.example.org/photo.jpg" });
    vi.stubGlobal("fetch", vi.fn(async () => response));

    await expect(resolveWikimediaImageUrl(
      "https://commons.wikimedia.org/wiki/Special:FilePath/Example.jpg"
    )).resolves.toBeUndefined();
  });

  it("uses Wikimedia-provided image alt text when available", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("auth.enterprise.wikimedia.com")) {
        return new Response(JSON.stringify({ access_token: "test-token", expires_in: 3600 }), {
          status: 200, headers: { "content-type": "application/json" }
        });
      }
      if (url.includes("api.enterprise.wikimedia.com")) {
        return new Response(JSON.stringify([{
          name: "Climate change",
          abstract: "A long-term change in temperatures and weather patterns.",
          url: "https://en.wikipedia.org/wiki/Climate_change",
          image: {
            content_url: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Climate.jpg",
            alt_text: "A glacier retreating in a mountain valley"
          }
        }]), { status: 200, headers: { "content-type": "application/json" } });
      }
      throw new Error("Unexpected fetch: " + url);
    });
    vi.stubGlobal("fetch", fetchMock);

    const results = await searchWikimediaEnterprise({
      WIKIMEDIA_ENTERPRISE_USERNAME: "test-user",
      WIKIMEDIA_ENTERPRISE_REFRESH_TOKEN: "test-refresh"
    } as any, ["Climate change"], "en");

    expect(results).toHaveLength(1);
    expect(results[0].imageUrl).toBe("https://upload.wikimedia.org/wikipedia/commons/a/ab/Climate.jpg");
    expect(results[0].imageAlt).toBe("A glacier retreating in a mountain valley");
    expect(results[0].sources[0].url).toBe("https://en.wikipedia.org/wiki/Climate_change");
  });
});
