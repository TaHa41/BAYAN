/**
 * These endpoints are deliberately independent of D1 and must remain available
 * when the database read quota is exhausted. Keep this allowlist small: every
 * other API route continues through the normal schema and quota guards.
 */
const D1_INDEPENDENT_API_PATHS = new Set([
  "/api/features",
  "/api/image",
  "/api/wisdom",
]);

export function isD1IndependentApiPath(pathname: string): boolean {
  return D1_INDEPENDENT_API_PATHS.has(pathname);
}
