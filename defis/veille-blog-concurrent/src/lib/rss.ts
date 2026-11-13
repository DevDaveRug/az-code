import { XMLParser } from "fast-xml-parser";

export type ArticleLu = { titre: string; date: Date | null; lien: string };

// Les entites ne sont pas developpees par le parseur : un vrai flux (lanutrition.fr, 10/11/2026) en porte plus
// de 1000 dans ses resumes et depasse la limite de securite. On ne decode que les champs gardes (titre, lien).
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", processEntities: false });

const ENTITES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  eacute: "é", egrave: "è", ecirc: "ê", euml: "ë", agrave: "à", acirc: "â", ccedil: "ç", icirc: "î", iuml: "ï",
  ocirc: "ô", ucirc: "û", ugrave: "ù", oelig: "œ", Eacute: "É", Agrave: "À", Ccedil: "Ç",
  rsquo: "'", lsquo: "'", ldquo: '"', rdquo: '"', laquo: '"', raquo: '"', hellip: "...", ndash: "-", mdash: "-",
};

function decoder(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITES[n] ?? ENTITES[n.toLowerCase()] ?? m);
}

function texte(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number") return decoder(String(v)).trim();
  if (typeof v === "object" && "#text" in (v as Record<string, unknown>)) return decoder(String((v as Record<string, unknown>)["#text"])).trim();
  return "";
}

function date(v: unknown): Date | null {
  const s = texte(v);
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function liste<T>(v: T | T[] | undefined): T[] {
  return v == null ? [] : Array.isArray(v) ? v : [v];
}

// Lit un flux RSS 2.0 ou Atom et rend une ligne par article (titre, date, lien).
// Les articles sans lien sont ignores : le lien est l'identifiant qui empeche les doublons.
export function lireFlux(xml: string): ArticleLu[] {
  const doc = parser.parse(xml);
  if (doc?.rss?.channel) {
    return liste(doc.rss.channel.item)
      .map((i: Record<string, unknown>) => ({ titre: texte(i.title), date: date(i.pubDate ?? i["dc:date"]), lien: texte(i.link) }))
      .filter((a) => a.lien);
  }
  if (doc?.feed) {
    return liste(doc.feed.entry)
      .map((e: Record<string, unknown>) => {
        const liens = liste(e.link as Record<string, string> | Record<string, string>[]);
        const lien = decoder(liens.find((l) => !l["@_rel"] || l["@_rel"] === "alternate")?.["@_href"] ?? "");
        return { titre: texte(e.title), date: date(e.published ?? e.updated), lien };
      })
      .filter((a) => a.lien);
  }
  throw new Error("Ce n'est ni un flux RSS ni un flux Atom");
}
