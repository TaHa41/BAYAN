import type { Env } from "./types";
import { d1Blocked, isD1QuotaError, logD1QuotaOncePerHour, markD1Blocked } from "./services/d1-guard";

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
  // Do not issue a telemetry write after D1 has rejected work for quota exhaustion.
  if (d1Blocked()) return false;
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
    const result = await env.DB.prepare(
      "INSERT INTO runtime_events(level,kind,message,created_at) " +
      "SELECT ?,?,?,? WHERE NOT EXISTS (" +
      "SELECT 1 FROM runtime_events WHERE kind=? AND created_at>=?)"
    ).bind("WARN", safeKind, message, new Date(now).toISOString(), safeKind, new Date(now - WINDOW_MS).toISOString()).run();
    return Number(result?.meta?.changes || 0) > 0;
  } catch (loggingError) {
    // A quota error blocks all further telemetry writes for this isolate until UTC midnight.
    if (isD1QuotaError(loggingError)) {
      markD1Blocked();
      logD1QuotaOncePerHour(loggingError);
    }
    // Deliberately best-effort: do not recurse or throw when telemetry itself fails.
    return false;
  }
}
