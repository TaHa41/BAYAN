#!/usr/bin/env node
/**
 * Read-only public acceptance audit for BAYAN.
 * Checks public HTTP routes, sitemap/robots responses, localized metadata, and image URLs.
 * Never writes to D1 or calls admin/mutation endpoints.
 */
import { writeFile } from "node:fs/promises";

const base = (process.env.BAYAN_BASE_URL || "https://bayan.tahaomar411.workers.dev").replace(/\/$/, "");
const timeoutMs = Number(process.env.AUDIT_TIMEOUT_MS || 12000);
const routes = [
  "/", "/?lang=ar", "/?lang=en",
  "/science?lang=ar", "/science?lang=en",
  "/tools?lang=ar", "/tools?lang=en",
  "/robots.txt", "/sitemap.xml", "/news-sitemap.xml"
];
const results = [];
const request = async (url) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "BAYAN-ReadOnly-Acceptance-Audit/1.0" }
    });
    const body = await response.text();
    return { status: response.status, contentType: response.headers.get("content-type") || "", body, finalUrl: response.url };
  } finally { clearTimeout(timer); }
};

for (const route of routes) {
  const url = base + route;
  try {
    const response = await request(url);
    const isXml = route.endsWith(".xml");
    const isRobots = route === "/robots.txt";
    const okStatus = response.status >= 200 && response.status < 400;
    const contentOk = isXml ? /xml/i.test(response.contentType) || /<\?xml|<urlset|<sitemapindex/i.test(response.body)
      : isRobots ? /text/i.test(response.contentType) || response.body.length > 0
      : /text\/html/i.test(response.contentType) || /<!doctype html|<html/i.test(response.body);
    const entry = { kind: "route", route, url, status: response.status, contentType: response.contentType, ok: okStatus && contentOk };
    if (route.includes("lang=ar") || route.includes("lang=en")) {
      entry.hasTitle = /<title[^>]*>[^<]+<\/title>/i.test(response.body);
      entry.hasCanonical = /rel=["']canonical["']/i.test(response.body);
      entry.hasOgImage = /property=["']og:image["']/i.test(response.body);
      entry.ok = entry.ok && entry.hasTitle;
    }
    if (route.endsWith("sitemap.xml") || route.endsWith("news-sitemap.xml")) {
      entry.urlCount = (response.body.match(/<url>/gi) || []).length;
      entry.containsErrorPage = /internal server error|<!doctype html/i.test(response.body);
      entry.ok = entry.ok && !entry.containsErrorPage;
      if (route === "/news-sitemap.xml" && entry.urlCount === 0) entry.warning = "News sitemap has zero <url> entries";
    }
    results.push(entry);
    if (response.status >= 200 && response.status < 400 && route.startsWith("/") && route.includes("lang=")) {
      const seen = new Set();
      const imageUrls = [...response.body.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi)]
        .map(match => { try { return new URL(match[1], base).href; } catch { return null; } })
        .filter(url => url && /^https?:/.test(url) && !seen.has(url) && seen.add(url))
        .slice(0, 12);
      for (const imageUrl of imageUrls) {
        try {
          const imageResponse = await request(imageUrl);
          const imageOk = imageResponse.status >= 200 && imageResponse.status < 300 && /^image\//i.test(imageResponse.contentType);
          results.push({ kind: "image", sourceRoute: route, url: imageUrl, status: imageResponse.status, contentType: imageResponse.contentType, ok: imageOk });
        } catch (error) {
          results.push({ kind: "image", sourceRoute: route, url: imageUrl, ok: false, error: String(error?.message || error) });
        }
      }
    }
  } catch (error) {
    results.push({ kind: "route", route, url, ok: false, error: String(error?.message || error) });
  }
}

const failures = results.filter(item => item.ok === false);
const warnings = results.filter(item => item.warning);
const report = {
  audit: "BAYAN public read-only acceptance audit",
  base,
  generatedAt: new Date().toISOString(),
  safety: "GET requests only; no database writes or admin actions",
  totalChecks: results.length,
  passed: results.filter(item => item.ok === true).length,
  failed: failures.length,
  warnings: warnings.length,
  results
};
await writeFile("bayan-acceptance-audit.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ ...report, results: undefined }, null, 2));
for (const item of failures) console.error("FAIL", JSON.stringify(item));
for (const item of warnings) console.warn("WARN", JSON.stringify(item));
if (failures.length) process.exitCode = 1;
