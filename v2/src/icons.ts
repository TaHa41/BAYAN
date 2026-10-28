// Line icons (24x24, stroke=currentColor) for the sections, reused from v1 so the set stays consistent.
export const ICONS: Record<string, string> = {
 "science": "<path d=\"M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3\"/><path d=\"M8 15h8\"/>",
 "technology": "<rect x=\"6\" y=\"6\" width=\"12\" height=\"12\" rx=\"2\"/><path d=\"M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4\"/>",
 "economy": "<path d=\"M3 3v18h18\"/><path d=\"m7 14 4-4 3 3 6-7\"/>",
 "politics": "<path d=\"M3 21h18M5 18h14M6 18V9m4 9V9m4 9V9m4 9V9M3 7l9-4 9 4v2H3z\"/>",
 "health": "<path d=\"M12 21s-8-4.5-8-11a4.5 4.5 0 0 1 8-2 4.5 4.5 0 0 1 8 2c0 6.5-8 11-8 11z\"/><path d=\"M9 12h6m-3-3v6\"/>",
 "history": "<path d=\"M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5z\"/><path d=\"M4 6h13M8 10h8m-8 4h8\"/>",
 "people": "<circle cx=\"9\" cy=\"8\" r=\"3\"/><path d=\"M3 20v-2a6 6 0 0 1 12 0v2\"/><path d=\"M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v2\"/>",
 "sports": "<path d=\"m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z\"/>",
 "travel": "<path d=\"m3 11 18-8-8 18-2-8z\"/><path d=\"m11 13 4-4\"/>",
 "art": "<path d=\"M12 3a9 9 0 1 0 0 18h1.2a2 2 0 0 0 1.5-3.3 1.8 1.8 0 0 1 1.4-3h1.2A3.7 3.7 0 0 0 21 11C21 6.6 17 3 12 3z\"/><circle cx=\"7.5\" cy=\"10\" r=\"1\"/><circle cx=\"11\" cy=\"6.5\" r=\"1\"/><circle cx=\"16\" cy=\"8\" r=\"1\"/>",
 "news": "<path d=\"M5 4h14v17H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z\"/><path d=\"M8 8h8m-8 4h8m-8 4h5\"/>",
 "trends": "<path d=\"M3 17 9 11l4 4 8-9\"/><path d=\"M15 6h6v6\"/>",
 "prices": "<path d=\"M3 12h4l3-8 4 16 3-8h4\"/>",
 "egypt": "<circle cx=\"9\" cy=\"8\" r=\"3\"/><path d=\"M3 20v-2a6 6 0 0 1 12 0v2\"/><path d=\"M16 11h5m-2.5-2.5v5\"/>",
 "arab": "<path d=\"M4 5h16M4 12h10M4 19h16\"/><circle cx=\"18\" cy=\"12\" r=\"2\"/>",
 "world": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 3v18M3 12h18\"/><path d=\"m6 6 12 12m0-12L6 18\"/>"
};
export const icon = (slug: string) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[slug] || ICONS.news}</svg>`;
