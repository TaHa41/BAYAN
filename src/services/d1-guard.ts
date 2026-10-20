let blockedUntil = 0;
let lastQuotaLogAt = 0;
export const isD1QuotaError = (e: unknown): boolean => /7500|free tier daily row (read|write) limit|exceeded D1'?s free tier/i.test(String((e as { message?: unknown } | null)?.message ?? e));
export const nextUtcMidnight = (now = Date.now()): number => { const d = new Date(now); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1); };
export const markD1Blocked = (now = Date.now()): void => { blockedUntil = nextUtcMidnight(now); };
export const d1Blocked = (now = Date.now()): boolean => now < blockedUntil;
export const logD1QuotaOncePerHour = (error: unknown, now = Date.now()): void => { if (now - lastQuotaLogAt < 3_600_000) return; lastQuotaLogAt = now; console.error("BAYAN_D1_QUOTA_BLOCKED", String(error).slice(0, 300)); };
export const resetD1GuardForTests = (): void => { blockedUntil = 0; lastQuotaLogAt = 0; };
