let blockedUntil = 0;
let lastQuotaLogAt = 0;
export const isD1QuotaError = (e: unknown): boolean => /7500|free tier daily row (read|write) limit|exceeded D1'?s free tier/i.test(String((e as { message?: unknown } | null)?.message ?? e));
export const nextUtcMidnight = (now = Date.now()): number => { const d = new Date(now); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1); };
export const markD1Blocked = (now = Date.now()): void => { blockedUntil = nextUtcMidnight(now); };
export const d1Blocked = (now = Date.now()): boolean => now < blockedUntil;
export const logD1QuotaOncePerHour = (error: unknown, now = Date.now()): void => { if (now - lastQuotaLogAt < 3_600_000) return; lastQuotaLogAt = now; console.error("BAYAN_D1_QUOTA_BLOCKED", String(error).slice(0, 300)); };
export const resetD1GuardForTests = (): void => { blockedUntil = 0; lastQuotaLogAt = 0; };

type D1BlockCache = { match(request: Request): Promise<Response | null | undefined>; put(request: Request, response: Response): Promise<void> };
const D1_BLOCK_CACHE_KEY = new Request("https://bayan.tahaomar411.workers.dev/__bayan_internal_cache/d1-quota-blocked");
const defaultD1BlockCache = (): D1BlockCache | undefined => {
  try { return (globalThis as any).caches?.default as D1BlockCache | undefined; } catch { return undefined; }
};

/** Persist the quota block outside the isolate so a cold start does not immediately retry D1. */
export const persistD1Block = async (now = Date.now(), cache: D1BlockCache | undefined = defaultD1BlockCache()): Promise<void> => {
  markD1Blocked(now);
  if (!cache) return;
  const seconds = Math.max(1, Math.ceil((blockedUntil - now) / 1000));
  try {
    await cache.put(D1_BLOCK_CACHE_KEY, new Response(JSON.stringify({ blockedUntil }), {
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=" + seconds },
    }));
  } catch { /* cache persistence is best-effort; the isolate guard still protects this instance */ }
};

/** Check the local guard and then the same-zone cache without touching D1. */
export const d1BlockedPersisted = async (now = Date.now(), cache: D1BlockCache | undefined = defaultD1BlockCache()): Promise<boolean> => {
  if (d1Blocked(now)) return true;
  if (!cache) return false;
  try {
    const response = await cache.match(D1_BLOCK_CACHE_KEY);
    if (!response) return false;
    const data = await response.json() as { blockedUntil?: unknown };
    const until = Number(data?.blockedUntil);
    if (!Number.isFinite(until) || now >= until) return false;
    blockedUntil = Math.max(blockedUntil, until);
    return true;
  } catch { return d1Blocked(now); }
};


const guardedDatabases = new WeakMap<object, any>();
const guardedStatements = new WeakMap<object, any>();
const rawD1Objects = new WeakMap<object, object>();
const noteQuotaWithoutD1 = (error: unknown): void => {
  if (!isD1QuotaError(error)) return;
  if (!d1Blocked()) void persistD1Block();
  logD1QuotaOncePerHour(error);
};
const guardD1Promise = <T>(value: Promise<T>): Promise<T> => Promise.resolve(value).catch(async (error: unknown) => {
  if (isD1QuotaError(error)) {
    if (!d1Blocked()) await persistD1Block();
    logD1QuotaOncePerHour(error);
  }
  throw error;
});
const guardD1Statement = <T extends object>(statement: T): T => {
  const cached = guardedStatements.get(statement);
  if (cached) return cached as T;
  const proxy = new Proxy(statement as any, {
    get(target, property) {
      const member = Reflect.get(target, property, target);
      if (typeof member !== "function") return member;
      return (...args: unknown[]) => {
        try {
          if (d1Blocked()) throw new Error("D1 free tier daily row read limit guard active (7500)");
          const result = member.apply(target, args);
          if (property === "bind" && result && typeof result === "object") return guardD1Statement(result);
          return result && typeof result.then === "function" ? guardD1Promise(result) : result;
        } catch (error) {
          noteQuotaWithoutD1(error);
          throw error;
        }
      };
    },
  });
  guardedStatements.set(statement, proxy);
  rawD1Objects.set(proxy, statement);
  return proxy as T;
};
const guardD1Binding = <T extends object>(database: T): T => {
  const cached = guardedDatabases.get(database);
  if (cached) return cached as T;
  const proxy = new Proxy(database as any, {
    get(target, property) {
      const member = Reflect.get(target, property, target);
      if (typeof member !== "function") return member;
      return (...args: unknown[]) => {
        try {
          if (d1Blocked()) throw new Error("D1 free tier daily row read limit guard active (7500)");
          const callArgs = property === "batch" && Array.isArray(args[0]) ? [[...(args[0] as object[]).map(item => rawD1Objects.get(item) || item)], ...args.slice(1)] : args;
          const result = member.apply(target, callArgs);
          if (property === "prepare" && result && typeof result === "object") return guardD1Statement(result);
          if (property === "withSession" && result && typeof result === "object") return guardD1Binding(result);
          return result && typeof result.then === "function" ? guardD1Promise(result) : result;
        } catch (error) {
          noteQuotaWithoutD1(error);
          throw error;
        }
      };
    },
  });
  guardedDatabases.set(database, proxy);
  return proxy as T;
};
/** Wrap all D1 entry points so even route-local catches cannot hide a quota failure from the isolate guard. */
export const withD1QuotaGuard = <T extends { DB?: unknown }>(env: T): T => {
  const db = env.DB;
  if (!db || typeof db !== "object") return env;
  return { ...env, DB: guardD1Binding(db as object) } as T;
};
