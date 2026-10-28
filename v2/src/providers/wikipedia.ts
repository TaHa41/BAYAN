// Wikipedia search provider: one MediaWiki call returns matches with intro extracts and canonical URLs.
// Every hit is an HTTPS link to a real page; nothing is generated.
import type { Hit, Provider } from "../search";
import type { Lang } from "../sections";

export function wikipediaProvider(lang: Lang, fetcher: typeof fetch = fetch): Provider {
  return {
    name: "wikipedia-" + lang,
    async run(query, signal) {
      const url = `https://${lang}.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=6&prop=extracts|info&exintro=1&explaintext=1&exchars=600&inprop=url&format=json&formatversion=2&origin=*`;
      const res = await fetcher(url, { signal, headers: { "user-agent": "BAYAN/2 (https://bayan.tahaomar411.workers.dev)" } });
      if (!res.ok) throw new Error("wikipedia_http_" + res.status);
      const data: any = await res.json();
      const pages: any[] = Array.isArray(data?.query?.pages) ? data.query.pages : [];
      return pages.filter((p) => p?.title && p?.fullurl && String(p.extract || "").trim().length >= 40)
        .sort((a, b) => Number(a.index || 99) - Number(b.index || 99))
        .map((p, i): Hit => ({ title: String(p.title), summary: String(p.extract).replace(/\s+/g, " ").trim(), url: String(p.fullurl), publisher: lang === "ar" ? "ويكيبيديا" : "Wikipedia", score: 100 - i }));
    },
  };
}
