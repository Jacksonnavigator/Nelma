import raw from "./publications.json";

export type Publication = {
  type: "Journal article" | "Conference paper" | "Conference talk" | "Book chapter" | "Thesis";
  year: number;
  text: string;
  doi: string | null;
};

export const publications = (raw as Publication[]).slice().sort((a, b) => b.year - a.year);

// Pull a readable title out of a citation: the text between "YEAR." and the next ", <Journal>"
export function splitCitation(text: string): { authors: string; title: string; rest: string } {
  const m = text.match(/^(.*?\b(?:19|20)\d{2}[a-z]?)[.,]\s*(.+)$/);
  if (!m) return { authors: "", title: text, rest: "" };
  const after = m[2];
  const cut = after.search(/[,.]\s+(?=[A-Z][A-Za-z&:\- ]{2,}[,\d(])/);
  if (cut > 20) return { authors: m[1], title: after.slice(0, cut), rest: after.slice(cut + 1).trim() };
  return { authors: m[1], title: after, rest: "" };
}
