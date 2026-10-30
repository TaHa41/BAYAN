// Quality gate for published articles. A row only counts as a real article when it has a body that adds
// something beyond its summary, at least two independent sources, and an image that belongs to the topic.
// Everything else is a stub: never featured, never listed, never put in the sitemap, and marked noindex.
import { independentPublishers, type Source } from "./evidence";

export const MIN_BODY_CHARS = 1200;
const GENERIC_IMAGE = /(?:^|\/)(?:cover|logo|default|placeholder|og[-_]?image|favicon|banner)[^/]*\.(?:jpe?g|png|webp|svg)(?:\?|$)/i;
export const isGenericImage = (url: string) => !/^https:\/\//i.test(url) || GENERIC_IMAGE.test(url);

export interface QualityInput { summary: string; body: string; imageUrl: string; sources: Source[] }
export function articleQuality(a: QualityInput): { complete: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const extra = a.body.replace(a.summary, "").replace(/\s+/g, " ").trim();
  if (extra.length < MIN_BODY_CHARS) reasons.push("body_too_short");
  if (independentPublishers(a.sources).length < 2) reasons.push("fewer_than_2_independent_sources");
  if (isGenericImage(a.imageUrl)) reasons.push("no_topic_image");
  return { complete: reasons.length === 0, reasons };
}
