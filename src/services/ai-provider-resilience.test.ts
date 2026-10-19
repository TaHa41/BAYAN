import { describe, expect, it } from "vitest";
import { classifyOpenAIFailure, classifyWorkersAIFailure, exponentialBackoffMs, normalizeDraftJson, parseRetryAfter } from "./ai-provider-resilience";

describe("AI provider resilience", () => {
  it("distinguishes insufficient quota from rate limiting and records retry metadata", () => {
    const headers = new Headers({ "retry-after": "120", "x-ratelimit-remaining-requests": "0", "x-ratelimit-reset-requests": "30s" });
    const failure = classifyOpenAIFailure(429, { error: { code: "insufficient_quota", message: "private prompt must not be included" } }, headers, 1000);
    expect(failure.code).toBe("insufficient_quota");
    expect(failure.retryAfterMs).toBe(120000);
    expect(failure.resetMs).toBe(30000);
    expect(failure.detail).toContain("x-ratelimit-remaining-requests=0");
    expect(failure.detail).not.toContain("private prompt");
  });
  it("parses Retry-After seconds and dates", () => {
    expect(parseRetryAfter("45", 0)).toBe(45000);
    expect(parseRetryAfter(new Date(60000).toUTCString(), 0)).toBe(60000);
  });
  it("uses exponential backoff capped at two hours", () => {
    expect(exponentialBackoffMs(0)).toBe(900000);
    expect(exponentialBackoffMs(1)).toBe(1800000);
    expect(exponentialBackoffMs(2)).toBe(3600000);
    expect(exponentialBackoffMs(3)).toBe(7200000);
    expect(exponentialBackoffMs(10)).toBe(7200000);
  });
  it("classifies Workers AI quota, timeout, unsupported model and invalid JSON failures", () => {
    expect(classifyWorkersAIFailure(new Error("error 4006: quota exceeded")).code).toBe("quota_exceeded");
    expect(classifyWorkersAIFailure(new Error("request timed out")).code).toBe("timeout");
    expect(classifyWorkersAIFailure(new Error("unsupported model")).code).toBe("unsupported_model");
    expect(classifyWorkersAIFailure(new Error("JSON parse error")).code).toBe("invalid_json");
  });
  it("repairs fenced JSON and extracts JSON surrounded by text", () => {
    expect(normalizeDraftJson('```json\n{"sections":[]}\n```')).toBe('{"sections":[]}');
    expect(normalizeDraftJson('Here is JSON: {"sections":[]} thanks')).toBe('{"sections":[]}');
    expect(normalizeDraftJson('{"sections":')).toBe('{"sections":');
  });
});
