import { describe, expect, it } from "vitest";
import { callOmniRoute } from "./omniroute";

describe("OmniRoute OpenAI-compatible client", () => {
  it("uses normalized endpoint, bearer auth and JSON mode", async () => {
    let capturedUrl = "";
    let captured: RequestInit | undefined;
    const result = await callOmniRoute({ OMNIROUTE_BASE_URL: "https://router.example/v1/", OMNIROUTE_API_KEY: "test-secret", OMNIROUTE_MODEL: "auto" }, [{ role: "user", content: "hello" }], { json: true }, async (input, init) => {
      capturedUrl = String(input); captured = init;
      return new Response(JSON.stringify({ choices: [{ message: { content: '{"ok":true}' } }] }), { status: 200 });
    });
    expect(capturedUrl).toBe("https://router.example/v1/chat/completions");
    expect(new Headers(captured?.headers).get("authorization")).toBe("Bearer test-secret");
    expect(JSON.parse(String(captured?.body)).response_format.type).toBe("json_object");
    expect(result).toEqual({ ok: true, text: '{"ok":true}' });
  });
  it("rejects non-HTTPS remote endpoints and missing credentials", async () => {
    expect((await callOmniRoute({ OMNIROUTE_BASE_URL: "http://router.example", OMNIROUTE_API_KEY: "x" }, [])).ok).toBe(false);
    expect((await callOmniRoute({ OMNIROUTE_BASE_URL: "https://router.example", OMNIROUTE_API_KEY: "" }, [])).ok).toBe(false);
  });
  it("does not expose upstream response bodies on errors", async () => {
    const result = await callOmniRoute({ OMNIROUTE_BASE_URL: "https://router.example", OMNIROUTE_API_KEY: "secret" }, [], {}, async () => new Response("secret private prompt", { status: 429 }));
    expect(result).toEqual({ ok: false, detail: "HTTP 429" });
    expect(JSON.stringify(result)).not.toContain("private prompt");
  });
});
