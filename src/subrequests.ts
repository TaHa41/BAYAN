import type { Env } from "./types";

/**
 * Counts what one scheduled invocation spends against the platform's per-invocation subrequest limit
 * (50 on the Workers Free plan; fetch, D1 statements and Workers AI calls all count). Used to see, from the pipeline status,
 * whether the limit is what stops article drafting ("Too many subrequests by single Worker invocation").
 */
export interface SubrequestStats { fetch: number; db: number; ai: number }

export function countSubrequests(env: Env): { env: Env; stats: SubrequestStats; restore: () => void } {
  const stats: SubrequestStats = { fetch: 0, db: 0, ai: 0 };
  const realFetch = globalThis.fetch;
  globalThis.fetch = ((...args: Parameters<typeof fetch>) => { stats.fetch++; return realFetch(...args); }) as typeof fetch;
  const wrap = <T extends object>(target: T | undefined, methods: string[], key: keyof SubrequestStats): T | undefined => {
    if (!target) return target;
    return new Proxy(target, {
      get(t, p, r) {
        const v = Reflect.get(t, p, r);
        if (typeof v !== "function") return v;
        if (methods.includes(String(p))) return (...a: unknown[]) => { stats[key]++; return (v as (...x: unknown[]) => unknown).apply(t, a); };
        return v.bind(t);
      },
    });
  };
  const counted = { ...env, DB: wrap(env.DB, ["prepare", "batch", "exec"], "db"), AI: wrap(env.AI as object | undefined, ["run"], "ai") } as unknown as Env;
  return { env: counted, stats, restore: () => { globalThis.fetch = realFetch; } };
}
