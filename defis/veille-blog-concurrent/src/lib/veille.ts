import { prisma } from "./prisma";
import { lireFlux } from "./rss";

export async function telechargerFlux(url: string): Promise<string> {
  const r = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (veille RSS)", Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml" },
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Le flux repond ${r.status}`);
  return r.text();
}

// Releve toutes les sources actives. Une source en erreur n'arrete pas les autres.
export async function releverSources() {
  const sources = await prisma.source.findMany({ where: { actif: true } });
  const bilan: { source: string; lus: number; ajoutes: number; erreur?: string }[] = [];
  for (const s of sources) {
    try {
      const articles = lireFlux(await telechargerFlux(s.fluxRss));
      const r = await prisma.article.createMany({
        data: articles.map((a) => ({ titre: a.titre || a.lien, datePublication: a.date, lien: a.lien, sourceId: s.id })),
        skipDuplicates: true,
      });
      await prisma.source.update({ where: { id: s.id }, data: { releveLe: new Date(), erreur: null } });
      bilan.push({ source: s.nom, lus: articles.length, ajoutes: r.count });
    } catch (e) {
      const erreur = e instanceof Error ? e.message : String(e);
      await prisma.source.update({ where: { id: s.id }, data: { releveLe: new Date(), erreur } });
      bilan.push({ source: s.nom, lus: 0, ajoutes: 0, erreur });
    }
  }
  return bilan;
}
