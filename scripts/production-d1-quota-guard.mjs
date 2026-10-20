/** Detect explicit D1 quota-degradation signals without treating ordinary errors as quota failures. */
export function containsD1QuotaSignal(payload) {
  let value = payload;
  if (typeof value === "string") {
    try { value = JSON.parse(value); } catch { return false; }
  }
  const visit = (node) => {
    if (!node || typeof node !== "object") return false;
    for (const [key, item] of Object.entries(node)) {
      if (/^(?:error|reason|code)$/i.test(key) && typeof item === "string" && item.trim().toLowerCase() === "d1_quota") return true;
      if (item && typeof item === "object" && visit(item)) return true;
    }
    return false;
  };
  return visit(value);
}
