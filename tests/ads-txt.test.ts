import { describe, expect, it } from "vitest";
import type { Env } from "../src/types";
import { adsTxt } from "../src/seo";

describe("/ads.txt", () => {
  it("returns 404 when ADS_TXT is not configured (nothing is invented)", async () => {
    const response = adsTxt({} as Env);
    expect(response.status).toBe(404);
  });

  it("serves only well-formed ads.txt lines from ADS_TXT", async () => {
    const env = { ADS_TXT: "google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n<script>alert(1)</script>\n# note" } as unknown as Env;
    const response = adsTxt(env);
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain("google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0");
    expect(body).not.toContain("script");
  });

  it("returns 404 when ADS_TXT holds only junk", () => {
    expect(adsTxt({ ADS_TXT: "hello world" } as unknown as Env).status).toBe(404);
  });
});
