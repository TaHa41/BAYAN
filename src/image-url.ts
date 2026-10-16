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
    if (host === "thumb.wikimedia.org" && url.pathname.startsWith("/wikipedia/commons/thumb/")) {
      // Normalize Wikimedia's thumbnail alias to the stable upload host and remove tracking-only parameters.
      url.hostname = "upload.wikimedia.org";
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
