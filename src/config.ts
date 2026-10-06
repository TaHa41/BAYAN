import type {Locale} from "./types";
import {sections} from "./sections";
export const ORIGIN="https://bayan.tahaomar411.workers.dev";
export const SECTIONS=sections.map(s=>[s.slug,s.ar,s.en] as const);
export const sectionNames=(locale:Locale)=>Object.fromEntries(sections.map(s=>[s.slug,locale==="ar"?s.ar:s.en]));
export const now=()=>new Date().toISOString();
