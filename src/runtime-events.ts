import type { Env } from "./types";

// Per-isolate limiter: repeated failures of one kind cause at most one D1
// write per minute, without an extra D1 read on every suppressed event.
const lastRuntimeEventAt = new Map<string, number>();
const WINDOW_MS = 60_000;
const MAX_TRACKED_KINDS = 256;

const sanitize = (value: unknown) => String(value ?? "")
  .replace(/https?:\/\/[^\s]+/g, "[url]")
  .replace(/\b(?:sk-[A-Za-z0-9_-]{8,}|Bearer\s+\S+)\b/gi, "[redacted]")
  .replace(/[\r\n\t]+/g, " ")
  .replace(/\s+/g, " ")
  .slice(0, 350);

export async function recordRuntimeEventLimited(
  env: Pick<Env, "DB">,
  kind: string,
  reasonCode: string,
  detail?: unknown,
): Promise<boolean> {
  const safeKind = sanitize(kind).slice(0, 80) || "runtime_unknown";
  const now = Date.now();
  const previous = lastRuntimeEventAt.get(safeKind);
  if (previous !== undefined && now - previous < WINDOW_MS) return false;

  lastRuntimeEventAt.set(safeKind, now);
  if (lastRuntimeEventAt.size > MAX_TRACKED_KINDS) {
    for (const [key, stamp] of lastRuntimeEventAt) {
      if (now - stamp >= WINDOW_MS) lastRuntimeEventAt.delete(key);
      if (lastRuntimeEventAt.size <= MAX_TRACKED_KINDS) break;
    }
  }

  const message = sanitize(String(reasonCode || "runtime_failure") + (detail === undefined ? "" : ": " + String(detail)));
  try {
    await env.DB.prepare("INSERT INTO runtime_events(level,kind,message,created_at) VALUES(?,?,?,?)")
      .bind("WARN", safeKind, message, new Date(now).toISOString())
      .run();
    return true;
  } catch (loggingError) {
    // Deliberately best-effort: do not recurse or throw when telemetry itself fails.
    void loggingError;
    return false;
  }
}
