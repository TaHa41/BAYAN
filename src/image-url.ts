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
    if ((host === "thumb.wikimedia.org" || host === "upload.wikimedia.org") && url.pathname.startsWith("/wikipedia/commons/thumb/")) {
      if (host === "thumb.wikimedia.org") url.hostname = "upload.wikimedia.org";
      for (const key of [...url.searchParams.keys()]) {
        if (key.toLowerCase().startsWith("utm_")) url.searchParams.delete(key);
      }
      url.hash = "";
    }
    return url.href;
  } catch {
    return undefined;
  }
}


/** Reject missing and generic UI artwork; article images must be topic-specific candidates. */
export function isTopicImageUrl(value: unknown): boolean {
  const safe = safePublicImageUrl(value);
  if (!safe) return false;
  try {
    const path = new URL(safe).pathname.toLowerCase();
    return !(/\/sections\/[a-z0-9-]+\.svg$/.test(path) ||
      /\/(?:og-bayan|og-article|favicon|logo|placeholder|default-image)(?:[-.]|$)/i.test(path));
  } catch {
    return false;
  }
}

/** Resolve Wikimedia Commons file redirects before persisting an article image. */
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
    let response = await fetch(original.href, {
      method: "HEAD", redirect: "follow", signal: controller.signal,
      headers: { accept: "image/*,*/*;q=0.8" }
    });
    let finalUrl = new URL(response.url || original.href);
    await response.body?.cancel().catch(error => { void error; return undefined; });
    if (!response.ok || finalUrl.protocol !== "https:" || finalUrl.hostname.toLowerCase() !== "upload.wikimedia.org") {
      response = await fetch(original.href, {
        method: "GET", redirect: "follow", signal: controller.signal,
        headers: { accept: "image/*,*/*;q=0.8", range: "bytes=0-0" }
      });
      finalUrl = new URL(response.url || original.href);
      await response.body?.cancel().catch(error => { void error; return undefined; });
    }
    if (!response.ok || finalUrl.protocol !== "https:" || finalUrl.hostname.toLowerCase() !== "upload.wikimedia.org") return undefined;
    const type = response.headers.get("content-type") || "";
    if (type && !type.toLowerCase().startsWith("image/")) return undefined;
    return finalUrl.href;
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}
