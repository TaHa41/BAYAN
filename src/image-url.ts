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
