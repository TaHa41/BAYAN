export function safePublicImageUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password) return undefined;
    const host = url.hostname.toLowerCase().replace(/\.$/, "");
    if (
      host === "googleusercontent.com" ||
      host.endsWith(".googleusercontent.com") ||
      host === "news.google.com" ||
      host.endsWith(".news.google.com") ||
      host === "gstatic.com" ||
      host.endsWith(".gstatic.com")
    ) return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}


/**
 * Resolve Wikimedia Commons redirect URLs before persisting article images.
 * Non-Wikimedia image URLs are returned unchanged after the normal safety checks.
 * Redirect failures are rejected rather than storing a Special:FilePath URL.
 */
export async function resolvePublishedImageUrl(value: unknown): Promise<string | undefined> {
  const safe = safePublicImageUrl(value);
  if (!safe) return undefined;
  let original: URL;
  try { original = new URL(safe); } catch { return undefined; }
  const host = original.hostname.toLowerCase();
  if (host === "upload.wikimedia.org") return original.href;
  if (host !== "commons.wikimedia.org" ||
      !(/\/wiki\/Special:FilePath\//i.test(original.pathname) ||
        /Special:Redirect\/file/i.test(original.search))) return safe;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(original.href, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { accept: "image/*,*/*;q=0.8" },
    });
    const finalUrl = new URL(response.url || original.href);
    await response.body?.cancel().catch(() => undefined);
    if (!response.ok || finalUrl.protocol !== "https:" ||
        finalUrl.hostname.toLowerCase() !== "upload.wikimedia.org") return undefined;
    return finalUrl.href;
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}
